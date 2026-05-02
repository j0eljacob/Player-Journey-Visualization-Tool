# 🎮 LILA BLACK — Player Journey Visualizer

A browser-based visualization tool for exploring 5 days of production gameplay telemetry from **LILA BLACK**, an extraction shooter by LILA Games.

> **Live Demo → [https://lila-player-journey.vercel.app](https://lila-player-journey.vercel.app)**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Minimap rendering** | Player paths and events drawn on real map images with correct world→pixel coordinate mapping |
| 👤 **Human vs Bot distinction** | Humans get unique colored paths; bots are dimmed/grey |
| 📍 **Event markers** | Kills, deaths, bot kills, storm deaths, and loot pickups — distinct shape per type |
| 🔥 **Heatmaps** | 5 overlay types: Kill Zones, Death Zones, Traffic, Loot Zones, Storm Deaths |
| ⏱️ **Timeline playback** | Scrub through a match with Play/Pause and a sparkline activity graph |
| 🔍 **Filters** | Filter by map, date, individual match; toggle humans/bots/paths and event types |
| 🔎 **Zoom & Pan** | Scroll to zoom, drag to pan on any map |
| 📊 **Stats bar** | Live stats across full dataset and selected match |

---

## 🛠️ Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React 18 + Vite | Fast DX, small bundle, no magic |
| Rendering | HTML Canvas API | Full control over paths, markers, heatmap blending |
| Styling | Inline CSS | No runtime CSS overhead, predictable dark theme |
| Data pipeline | Python + PyArrow + Pandas | Standard parquet tooling |
| Data format | Pre-processed JSON | Parquet → JSON at build time; served as static assets |
| Hosting | Vercel | Zero-config static deployment |

---

## 🚀 Setup

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10 (only if re-processing parquet data)

### Run locally

```bash
npm install
npm run dev
# Open http://localhost:5173
```

### Build for production

```bash
npm run build
# Deployable output in dist/
```

### Re-process data from parquet (optional)

```bash
pip install pyarrow pandas numpy
python scripts/process_data.py
```

---

## 📁 Project Structure

```
lila-player-journey/
├── public/
│   ├── minimaps/              ← 3 map images
│   └── data/
│       ├── matches_index.json ← Index of all 796 matches
│       ├── heatmaps.json      ← Pre-computed heatmap grids
│       └── matches/           ← Per-match JSON (796 files)
├── src/
│   ├── App.jsx
│   └── components/
│       ├── MapCanvas.jsx      ← Canvas renderer
│       ├── Sidebar.jsx        ← Filters + match list
│       ├── Timeline.jsx       ← Playback scrubber
│       ├── HeatmapPanel.jsx   ← Heatmap controls
│       └── StatsBar.jsx       ← Global stats strip
├── scripts/
│   └── process_data.py        ← Parquet → JSON pipeline
├── ARCHITECTURE.md
├── INSIGHTS.md
└── README.md
```

---

## 🌐 Environment Variables

None required. All data is served as static files alongside the app.

---

## 📦 Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deploys on push.

---

## 📊 Dataset Summary

| Metric | Value |
|---|---|
| Date range | Feb 10–14, 2026 |
| Total events | 89,104 |
| Unique matches | 796 |
| Unique players | 339 |
| Maps | AmbroseValley (71%), Lockdown (21%), GrandRift (7%) |
| Avg bots/match | 8.87 |
| Bot kill % | 99.9% |
