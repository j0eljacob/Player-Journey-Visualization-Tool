# INSIGHTS.md — Three Things I Learned About LILA BLACK

---

## Insight 1: LILA BLACK Has Almost No PvP — And That's a Design Problem

### What Caught My Eye

When I looked at the event distribution, I noticed something striking: there are only **3 human-vs-human kills** (`Kill` event) across **5 days and 796 matches**. In contrast, there are **2,415 BotKill** events. That's a **99.9% bot-kill rate**.

### The Evidence

```
Kill (PvP):         3 events   (0.1% of all kills)
BotKill:        2,415 events   (99.9% of all kills)
Avg humans/match:    1.00
Max humans/match:    2
```

The average match contains exactly **1 human player** surrounded by ~9 bots. This isn't an extraction shooter — it's a solo bot-farming loop. Players almost never encounter another human.

Looking at the timeline playback for any match on AmbroseValley, you can see a single colored path (human) weaving through many grey bot paths — and never intersecting with another colored path.

### What a Level Designer Should Care About

This is the most critical insight in the dataset. Every spatial design decision — choke points, cover placement, ambush angles, sight lines — is being made for **human-vs-bot** encounters, not human-vs-human. Your level geometry may be optimized for the wrong interaction.

**Metrics affected:**
- `PvP engagement rate` (currently near 0%)
- `Session length` — players may be churning faster because solo bot-farming feels hollow
- `Return rate` — extraction shooters derive tension from PvP; without it, the loop may not hold

**Actionable items:**
1. **Audit spawn clustering** — are human players spawning too far apart to ever meet?
2. **Add forced convergence zones** — design mandatory waypoints (extraction points, key loot nodes) that funnel humans toward each other regardless of spawn
3. **Test match fill thresholds** — consider holding lobby starts until 3+ humans are present, even if bots pad the count to full

---

## Insight 2: One Map Carries Everything — GrandRift Is Underutilized

### What Caught My Eye

When I toggled the map selector and compared the match counts per map, the disparity was immediately visible — GrandRift's heatmaps are sparse compared to AmbroseValley's dense overlays.

### The Evidence

| Map | Matches | % of Total | Loot/Match | Kills/Match |
|---|---|---|---|---|
| AmbroseValley | 566 | **71%** | 17.6 | 3.2 |
| Lockdown | 171 | 21% | 12.0 | 2.5 |
| GrandRift | 59 | **7%** | 14.9 | 3.3 |

GrandRift sees only **59 matches in 5 days** — less than 12 per day. Its heatmaps show thin, scattered event clusters rather than the dense hotspots visible on AmbroseValley. The traffic heatmap on GrandRift shows large blank areas that players never visit.

Despite this, GrandRift actually has a **slightly higher kills-per-match** (3.3 vs 3.2 on AmbroseValley) and competitive loot density — meaning when players do play it, the experience isn't worse. They're just not choosing it.

### What a Level Designer Should Care About

Underplayed maps waste design investment and can signal discoverability, rotation, or perception problems. If GrandRift plays well but isn't being played, the issue may be extrinsic — queue routing, UI prominence, or map reputation.

**Metrics affected:**
- `Map play distribution` (currently 71/21/7%)
- `Time in queue` — thin maps may have longer queues, creating a feedback loop
- `Content freshness` — players stuck on one map churn faster

**Actionable items:**
1. **Instrument map selection** — are players choosing AmbroseValley, or is it assigned? If assigned, is the rotation weight misconfigured?
2. **Audit GrandRift's first-impression areas** — the entry zones where players spawn may feel less interesting than AmbroseValley's equivalents
3. **Introduce a "featured map" rotation** with bonus XP to drive traffic and generate feedback on underplayed maps

---

## Insight 3: Loot Is Clustered in 5 Hotspots — Most of the Map Stays Empty

### What Caught My Eye

Enabling the **Loot Zones heatmap** on AmbroseValley revealed an immediate pattern: dense green clusters in 5-6 discrete areas, with large blank zones between them. Players are converging on the same loot nodes run after run.

### The Evidence

The top 5 loot grid cells (50×50 world unit zones) on AmbroseValley:

| Zone (world coords) | Loot Events | % of Map's Loot |
|---|---|---|
| x≈150–200, z≈−100 to −50 | 547 | 5.5% |
| x≈−300 to −250, z≈50–100 | 499 | 5.0% |
| x≈0–50, z≈200–250 | 462 | 4.6% |
| x≈50–100, z≈−100 to −50 | 460 | 4.6% |
| x≈−50–0, z≈−300 to −250 | 445 | 4.5% |

These 5 zones account for ~24% of all loot on a map that spans hundreds of world units. Meanwhile, large sections of the minimap show zero loot activity in the traffic heatmap — players aren't exploring them at all.

Cross-referencing with the traffic heatmap confirms this: high-loot zones align exactly with high-traffic corridors. Players are learning the "route" and running it on autopilot.

### What a Level Designer Should Care About

Predictable loot routes eliminate exploration tension and make the map feel smaller than it is. In an extraction shooter, uncertainty about where to find loot is a core engagement driver — if players know the route, there's no discovery.

**Metrics affected:**
- `Map explored area %` — currently likely <40% of tiles visited per average run
- `Match variety score` — similar routes → similar outcomes → churn
- `Loot encounter rate in undervisited zones` — currently near zero

**Actionable items:**
1. **Redistribute loot nodes** — thin out the top 5 hotspots and seed the blank zones to incentivize exploration
2. **Introduce dynamic loot spawns** — randomize 30-40% of node locations per match to break route memorization
3. **Add environmental storytelling** to currently-empty zones to make exploration feel rewarding beyond loot (XP, collectibles, narrative)
4. **Track "area coverage" per session** — a Level Designer KPI: the % of the map a player visits in a match. Currently likely low.
