#!/usr/bin/env python3
"""
LILA BLACK — Data Processing Pipeline
Converts .nakama-0 parquet files to JSON for the browser visualizer.

Usage:
    python scripts/process_data.py

Output:
    public/data/matches_index.json   - Summary index of all matches
    public/data/heatmaps.json        - Pre-computed heatmaps per map
    public/data/matches/{id}.json    - Per-match event data
"""

import os
import json
import numpy as np
import pyarrow.parquet as pq
import pandas as pd
from pathlib import Path

# ─── Config ───────────────────────────────────────────────────────────────────

DATA_DIR = Path("player_data")
OUTPUT_DIR = Path("public/data")

DAYS = ["February_10", "February_11", "February_12", "February_13", "February_14"]

MAP_CONFIGS = {
    "AmbroseValley": {"scale": 900,  "origin_x": -370, "origin_z": -473},
    "GrandRift":     {"scale": 581,  "origin_x": -290, "origin_z": -290},
    "Lockdown":      {"scale": 1000, "origin_x": -500, "origin_z": -500},
}

MINIMAP_SIZE = 1024
HEATMAP_SIZE = 128


# ─── Helpers ──────────────────────────────────────────────────────────────────

def world_to_pixel(x: float, z: float, map_id: str, size: int = MINIMAP_SIZE):
    """Convert world (x, z) to pixel coordinates on the minimap image."""
    cfg = MAP_CONFIGS[map_id]
    u = (x - cfg["origin_x"]) / cfg["scale"]
    v = (z - cfg["origin_z"]) / cfg["scale"]
    px = round(u * size, 1)
    py = round((1 - v) * size, 1)  # Y flipped: image origin is top-left
    return px, py


def is_bot(user_id: str) -> bool:
    """Bots have numeric user IDs; humans have UUID user IDs."""
    return str(user_id).isdigit()


def decode_event(ev) -> str:
    """Event column is stored as bytes in parquet."""
    if isinstance(ev, bytes):
        return ev.decode("utf-8")
    return str(ev)


def load_all_data() -> pd.DataFrame:
    """Load all parquet files into a single DataFrame."""
    frames = []
    total = 0
    for day in DAYS:
        day_path = DATA_DIR / day
        if not day_path.exists():
            print(f"  ⚠ Skipping {day} (not found)")
            continue
        files = list(day_path.iterdir())
        print(f"  Loading {day}: {len(files)} files")
        for f in files:
            if f.name.startswith("."):
                continue
            try:
                df = pq.read_table(str(f)).to_pandas()
                df["event"] = df["event"].apply(decode_event)
                df["date"] = day
                df["is_bot"] = df["user_id"].apply(is_bot)
                df["match_id_clean"] = df["match_id"].str.replace(".nakama-0", "", regex=False)
                df["ts_ms"] = df["ts"].astype("int64") // 1_000_000
                frames.append(df)
                total += len(df)
            except Exception as e:
                print(f"    ⚠ Could not read {f.name}: {e}")
    print(f"  Loaded {total:,} events total")
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


# ─── Processors ───────────────────────────────────────────────────────────────

def build_matches_index(df: pd.DataFrame) -> list:
    """Build a lightweight summary index of all matches."""
    index = []
    for match_id, group in df.groupby("match_id_clean"):
        map_id = str(group["map_id"].iloc[0])
        ev_counts = group["event"].value_counts().to_dict()
        index.append({
            "id": match_id,
            "map": map_id,
            "date": group["date"].iloc[0],
            "humans": int(group[~group["is_bot"]]["user_id"].nunique()),
            "bots": int(group[group["is_bot"]]["user_id"].nunique()),
            "kills": int(ev_counts.get("Kill", 0) + ev_counts.get("BotKill", 0)),
            "deaths": int(ev_counts.get("Killed", 0) + ev_counts.get("BotKilled", 0) + ev_counts.get("KilledByStorm", 0)),
            "loot": int(ev_counts.get("Loot", 0)),
            "storm": int(ev_counts.get("KilledByStorm", 0)),
            "ts_min": int(group["ts_ms"].min()),
            "ts_max": int(group["ts_ms"].max()),
        })
    return sorted(index, key=lambda x: x["ts_min"])


def build_match_files(df: pd.DataFrame, out_dir: Path):
    """Generate one JSON file per match with per-player event streams."""
    out_dir.mkdir(parents=True, exist_ok=True)
    count = 0
    for match_id, group in df.groupby("match_id_clean"):
        map_id = str(group["map_id"].iloc[0])
        players = {}
        for user_id, pgroup in group.groupby("user_id"):
            uid = str(user_id)
            events = []
            for _, row in pgroup.sort_values("ts_ms").iterrows():
                px, py = world_to_pixel(float(row["x"]), float(row["z"]), map_id)
                events.append({
                    "px": px, "py": py,
                    "x": round(float(row["x"]), 2),
                    "z": round(float(row["z"]), 2),
                    "ts": int(row["ts_ms"]),
                    "ev": row["event"],
                })
            players[uid] = {"is_bot": bool(row["is_bot"]), "events": events}

        match_data = {
            "match_id": match_id,
            "map_id": map_id,
            "date": group["date"].iloc[0],
            "players": players,
        }
        with open(out_dir / f"{match_id}.json", "w") as f:
            json.dump(match_data, f, separators=(",", ":"))
        count += 1
        if count % 100 == 0:
            print(f"    {count} match files written...")
    return count


def build_heatmaps(df: pd.DataFrame) -> dict:
    """Build 128×128 point clouds for 5 heatmap types per map."""
    EVENT_GROUPS = {
        "kill":    ["Kill", "Killed", "BotKill", "BotKilled"],
        "death":   ["Killed", "BotKilled", "KilledByStorm"],
        "traffic": ["Position", "BotPosition"],
        "loot":    ["Loot"],
        "storm":   ["KilledByStorm"],
    }
    heatmaps = {}
    for map_id in MAP_CONFIGS:
        sub = df[df["map_id"] == map_id]
        heatmaps[map_id] = {}
        for htype, events in EVENT_GROUPS.items():
            hdf = sub[sub["event"].isin(events)]
            if len(hdf) == 0:
                heatmaps[map_id][htype] = []
                continue
            grid = np.zeros((HEATMAP_SIZE, HEATMAP_SIZE), dtype=np.float32)
            for _, row in hdf.iterrows():
                px, py = world_to_pixel(float(row["x"]), float(row["z"]), map_id, HEATMAP_SIZE)
                ix = int(np.clip(px, 0, HEATMAP_SIZE - 1))
                iy = int(np.clip(py, 0, HEATMAP_SIZE - 1))
                grid[iy, ix] += 1
            mx = grid.max()
            if mx > 0:
                grid /= mx
            points = [
                [int(ix), int(iy), round(float(grid[iy, ix]), 3)]
                for iy in range(HEATMAP_SIZE)
                for ix in range(HEATMAP_SIZE)
                if grid[iy, ix] > 0.01
            ]
            heatmaps[map_id][htype] = points
    return heatmaps


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("🎮 LILA BLACK — Data Processing Pipeline")
    print("=" * 50)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "matches").mkdir(exist_ok=True)

    print("\n📂 Loading parquet files...")
    df = load_all_data()
    if df.empty:
        print("❌ No data loaded. Check that player_data/ directory exists.")
        return

    df["map_id"] = df["map_id"].astype(str)

    print("\n📋 Building matches index...")
    index = build_matches_index(df)
    with open(OUTPUT_DIR / "matches_index.json", "w") as f:
        json.dump(index, f, separators=(",", ":"))
    print(f"  ✓ {len(index)} matches → matches_index.json")

    print("\n🔥 Building heatmaps...")
    heatmaps = build_heatmaps(df)
    with open(OUTPUT_DIR / "heatmaps.json", "w") as f:
        json.dump(heatmaps, f, separators=(",", ":"))
    total_pts = sum(len(v) for m in heatmaps.values() for v in m.values())
    print(f"  ✓ {total_pts:,} heatmap points → heatmaps.json")

    print("\n🗂  Writing per-match JSON files...")
    count = build_match_files(df, OUTPUT_DIR / "matches")
    print(f"  ✓ {count} match files → data/matches/")

    print("\n✅ Done! Data ready in public/data/")


if __name__ == "__main__":
    main()
