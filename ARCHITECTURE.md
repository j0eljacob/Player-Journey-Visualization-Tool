# ARCHITECTURE.md — LILA BLACK Player Journey Visualizer

---

## What Was Built & Why

### Tech Stack Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | React 18 + Vite | Vite's HMR speed made iteration fast. React's component model maps cleanly to the sidebar/canvas/timeline separation. No need for SSR or routing. |
| Rendering engine | HTML Canvas API | The map is a raster image; events are thousands of circles, paths, and glyphs drawn on top. Canvas outperforms SVG/DOM for this volume. D3's overhead wasn't justified. |
| Data pipeline | Python + PyArrow | PyArrow is the canonical parquet reader. Pandas made groupby/filter operations concise. Runs once at build time. |
| Data serving | Static JSON | With 89K events across 796 matches, serving raw parquet from a server adds runtime latency. Pre-processing to JSON and serving as static assets means zero server cost and instant Vercel CDN delivery. |
| Hosting | Vercel | Zero-config for Vite. No server to manage. Free tier handles the data volume. |
| Heatmap renderer | Custom radial gradient | `heatmap.js` is a common choice but adds 40KB and limited control over color. A 128×128 point cloud with per-point radial gradients on canvas gives smooth, controllable results. |

---

## Data Flow

```
player_data/*.nakama-0 (Parquet)
        │
        ▼
scripts/process_data.py
        │
        ├─ Decode event bytes → string
        ├─ Parse user_id → is_bot flag (UUID vs numeric)
        ├─ Apply world→pixel transform per map
        ├─ Compute ts_ms (ms elapsed in match)
        │
        ├──► public/data/matches_index.json   (summary of all 796 matches)
        ├──► public/data/heatmaps.json        (128×128 point clouds, 5 types × 3 maps)
        └──► public/data/matches/{id}.json    (per-player event stream per match)
                │
                ▼
         Vite build → dist/
                │
                ▼
         Vercel CDN → Browser
                │
         App.jsx loads matches_index + heatmaps on mount
         Fetch matches/{id}.json on match select
                │
         MapCanvas.jsx draws on <canvas> via requestAnimationFrame
```

---

## Coordinate Mapping — The Tricky Part

Game world coordinates `(x, y, z)` are 3D. The minimap is 2D. Key insight from README: **`y` is elevation, not a map axis.** Only `x` and `z` are needed for 2D placement.

The README provides per-map calibration constants:

| Map | Scale | Origin X | Origin Z |
|---|---|---|---|
| AmbroseValley | 900 | −370 | −473 |
| GrandRift | 581 | −290 | −290 |
| Lockdown | 1000 | −500 | −500 |

**Formula:**

```
u = (world_x − origin_x) / scale       # 0..1
v = (world_z − origin_z) / scale       # 0..1

pixel_x = u × image_width
pixel_y = (1 − v) × image_height       # Y flipped: image origin is top-left
```

This is applied **at processing time** (Python) so the browser receives `px`/`py` ready to draw — no per-frame math. Pre-computed pixel coords also allow the canvas to scale the image to any display resolution by multiplying `(px / 1024) × canvas_width`.

**Validation method:** I plotted the known sample coordinate from the README (`x=-301.45, z=-355.55` on AmbroseValley → expected pixel `(78, 890)`) and confirmed it falls near the top-left corner of the map, consistent with the map geometry.

---

## Assumptions Made

| Ambiguity | Assumption | Reasoning |
|---|---|---|
| `ts` column stores ms since epoch `1970-01-21` | Treat as elapsed match time by subtracting min ts per match | All files share the same epoch offset; relative ordering is what matters for playback |
| Bot detection | `user_id` is numeric string → bot; UUID → human | Directly stated in README filename convention |
| Match ID de-duplication | Strip `.nakama-0` suffix from `match_id` to get canonical ID | The suffix is a server instance tag, not part of the match identity |
| Heatmap resolution | 128×128 grid | High enough resolution to show zones, low enough for fast rendering. Upscaled with radial gradients. |
| February 14 partial day | Included as-is, labeled "(partial)" in UI | No events are invalid; just fewer matches |
| GrandRift's low sample count (59 matches) | Included but noted in insights | Valid data, just less popular map |

---

## Major Tradeoffs

| Option A | Option B | Decision | Reason |
|---|---|---|---|
| Serve parquet via Python API | Pre-process to static JSON | **Static JSON** | No server cost, CDN-cacheable, instant load |
| WebGL/Three.js rendering | Canvas 2D | **Canvas 2D** | Sufficient for this data volume; much simpler code |
| Real-time parquet parsing in WASM | Offline preprocessing | **Offline** | 89K events don't need real-time parsing; build-time is fine |
| Per-pixel heatmap texture | Radial gradient point cloud | **Radial gradient** | Smoother visuals, no ImageData manipulation |
| D3.js for vis | Raw Canvas | **Raw Canvas** | D3 adds complexity for what is essentially draw-circles-and-lines |
| Load all matches at once | Lazy-load per match | **Lazy per match** | Avoids loading 796 × ~5KB = 4MB on startup |

---

## Three Things I Learned Using the Tool

1. **LILA BLACK is effectively a PvP-free experience right now.** Only 3 human-vs-human kills appear across 5 days and 796 matches — 99.9% of kills are against bots. The player population is so thin (avg 1 human/match) that players rarely encounter each other. This is a critical early-access signal.

2. **AmbroseValley is massively dominant.** It accounts for 71% of all matches despite being 1 of 3 maps. GrandRift sees only 59 matches total — likely due to queue sizes or player preference. Investment in GrandRift level design may not pay off until the player base grows.

3. **Loot is spatially clustered in predictable hotspots.** The top 5 loot grid cells (50×50 world unit bins) on AmbroseValley each see 450–550 pickups, suggesting players converge on the same named locations each run. This creates design opportunities (and risks) around those zones.
