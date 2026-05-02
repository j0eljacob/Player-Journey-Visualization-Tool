import { useRef, useEffect, useCallback, useState } from 'react'

const MAP_CONFIGS = {
  AmbroseValley: { scale: 900, origin_x: -370, origin_z: -473, img: '/minimaps/AmbroseValley_Minimap.png' },
  GrandRift:     { scale: 581, origin_x: -290, origin_z: -290, img: '/minimaps/GrandRift_Minimap.png' },
  Lockdown:      { scale: 1000, origin_x: -500, origin_z: -500, img: '/minimaps/Lockdown_Minimap.jpg' },
}

const EVENT_COLORS = {
  Kill:          { color: '#ff3b3b', label: 'PvP Kill', size: 8 },
  Killed:        { color: '#ff6b6b', label: 'PvP Death', size: 8 },
  BotKill:       { color: '#ff9500', label: 'Bot Kill', size: 5 },
  BotKilled:     { color: '#ff6b00', label: 'Killed by Bot', size: 7 },
  KilledByStorm: { color: '#a855f7', label: 'Storm Death', size: 9 },
  Loot:          { color: '#22c55e', label: 'Loot', size: 4 },
}

const HEATMAP_COLORS = {
  kill:    [[0,50,0,0], [255,0,0,200]],
  death:   [[50,0,0,0], [255,100,0,200]],
  traffic: [[0,0,50,0], [0,200,255,180]],
  loot:    [[0,50,0,0], [50,255,50,200]],
  storm:   [[50,0,50,0], [180,0,255,220]],
}

function interpolateColor(t, from, to) {
  return [
    Math.round(from[0] + (to[0]-from[0])*t),
    Math.round(from[1] + (to[1]-from[1])*t),
    Math.round(from[2] + (to[2]-from[2])*t),
    Math.round(from[3] + (to[3]-from[3])*t),
  ]
}

const PLAYER_COLORS = [
  '#00f5ff','#ff6b35','#a8ff3e','#ff3ef5','#ffe03e',
  '#3e7fff','#ff3e3e','#3effbe','#ff993e','#be3eff',
]

export default function MapCanvas({
  selectedMap, matchData, matchLoading,
  heatmapData, heatmapType,
  showBots, showHumans, showPaths,
  filterEvents, timelineProgress
}) {
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const imgCache = useRef({})
  const [tooltip, setTooltip] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const getImage = useCallback((url) => {
    return new Promise((resolve) => {
      if (imgCache.current[url]) { resolve(imgCache.current[url]); return }
      const img = new Image()
      img.onload = () => { imgCache.current[url] = img; resolve(img) }
      img.onerror = () => resolve(null)
      img.src = url
    })
  }, [])

  const draw = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0f1117'
    ctx.fillRect(0, 0, W, H)

    // Apply zoom/pan transform
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    const cfg = MAP_CONFIGS[selectedMap]
    if (!cfg) { ctx.restore(); return }

    // Draw minimap
    const img = await getImage(cfg.img)
    if (img) {
      ctx.drawImage(img, 0, 0, W, H)
    } else {
      ctx.fillStyle = '#1a1d27'
      ctx.fillRect(0, 0, W, H)
    }

    // Heatmap overlay
    if (heatmapType && heatmapData[selectedMap]?.[heatmapType]) {
      const points = heatmapData[selectedMap][heatmapType]
      const HMSIZE = 128
      const cellW = W / HMSIZE
      const cellH = H / HMSIZE
      const colors = HEATMAP_COLORS[heatmapType]
      
      // Use gaussian blur for smooth heatmap
      points.forEach(([ix, iy, val]) => {
        const x = ix * cellW
        const y = iy * cellH
        const r = Math.max(cellW, cellH) * 2.5
        const gradient = ctx.createRadialGradient(x + cellW/2, y + cellH/2, 0, x + cellW/2, y + cellH/2, r)
        const c = interpolateColor(val, colors[0], colors[1])
        gradient.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${Math.min(val * 0.7, 0.85)})`)
        gradient.addColorStop(1, `rgba(${colors[0][0]},${colors[0][1]},${colors[0][2]},0)`)
        ctx.fillStyle = gradient
        ctx.fillRect(x - r, y - r, r*2 + cellW, r*2 + cellH)
      })
    }

    // Draw match data
    if (matchData && matchData.map_id === selectedMap) {
      const players = matchData.players
      const playerIds = Object.keys(players)
      let colorIdx = 0
      const humanColors = {}

      // First pass: assign colors to humans
      playerIds.forEach(uid => {
        if (!players[uid].is_bot) {
          humanColors[uid] = PLAYER_COLORS[colorIdx % PLAYER_COLORS.length]
          colorIdx++
        }
      })

      playerIds.forEach((uid) => {
        const p = players[uid]
        if (p.is_bot && !showBots) return
        if (!p.is_bot && !showHumans) return

        const color = p.is_bot ? 'rgba(150,150,200,0.7)' : humanColors[uid]
        const events = p.events

        // Filter by timeline
        const tsVals = events.map(e => e.ts)
        const tsMin = Math.min(...tsVals)
        const tsMax = Math.max(...tsVals)
        const tsCut = tsMin + (tsMax - tsMin) * timelineProgress

        const visibleEvents = events.filter(e => e.ts <= tsCut)
        if (visibleEvents.length === 0) return

        // Draw path
        if (showPaths) {
          const pathEvents = visibleEvents.filter(e => e.ev === 'Position' || e.ev === 'BotPosition')
          if (pathEvents.length > 1) {
            ctx.beginPath()
            ctx.strokeStyle = p.is_bot ? 'rgba(120,120,170,0.35)' : color + 'aa'
            ctx.lineWidth = p.is_bot ? 1 : 2
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            pathEvents.forEach((e, i) => {
              const px = (e.px / 1024) * W
              const py = (e.py / 1024) * H
              if (i === 0) ctx.moveTo(px, py)
              else ctx.lineTo(px, py)
            })
            ctx.stroke()
          }
        }

        // Draw current position dot
        const lastPos = visibleEvents[visibleEvents.length - 1]
        if (lastPos) {
          const px = (lastPos.px / 1024) * W
          const py = (lastPos.py / 1024) * H
          ctx.beginPath()
          ctx.arc(px, py, p.is_bot ? 3 : 5, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.fill()
          if (!p.is_bot) {
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 1.5
            ctx.stroke()
          }
        }

        // Draw events markers
        const nonPosEvents = visibleEvents.filter(e =>
          e.ev !== 'Position' && e.ev !== 'BotPosition' && filterEvents.includes(e.ev)
        )
        nonPosEvents.forEach(e => {
          const evCfg = EVENT_COLORS[e.ev]
          if (!evCfg) return
          const px = (e.px / 1024) * W
          const py = (e.py / 1024) * H
          const s = evCfg.size

          ctx.save()
          ctx.shadowColor = evCfg.color
          ctx.shadowBlur = 8

          if (e.ev === 'Kill' || e.ev === 'Killed') {
            // Star/cross for PvP
            ctx.strokeStyle = evCfg.color
            ctx.lineWidth = 2.5
            ctx.beginPath()
            ctx.moveTo(px - s, py - s); ctx.lineTo(px + s, py + s)
            ctx.moveTo(px + s, py - s); ctx.lineTo(px - s, py + s)
            ctx.stroke()
          } else if (e.ev === 'KilledByStorm') {
            // Diamond for storm
            ctx.fillStyle = evCfg.color
            ctx.beginPath()
            ctx.moveTo(px, py - s)
            ctx.lineTo(px + s, py)
            ctx.lineTo(px, py + s)
            ctx.lineTo(px - s, py)
            ctx.closePath()
            ctx.fill()
          } else if (e.ev === 'Loot') {
            // Small square for loot
            ctx.fillStyle = evCfg.color
            ctx.fillRect(px - s/2, py - s/2, s, s)
          } else {
            // Circle for kills/deaths
            ctx.beginPath()
            ctx.arc(px, py, s, 0, Math.PI * 2)
            ctx.fillStyle = evCfg.color + 'cc'
            ctx.fill()
            ctx.strokeStyle = evCfg.color
            ctx.lineWidth = 1.5
            ctx.stroke()
          }
          ctx.restore()
        })
      })
    }

    ctx.restore()
  }, [selectedMap, matchData, heatmapData, heatmapType, showBots, showHumans, showPaths, filterEvents, timelineProgress, zoom, pan, getImage])

  useEffect(() => { draw() }, [draw])

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      draw()
    })
    ro.observe(canvas)
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    return () => ro.disconnect()
  }, [draw])

  // Zoom/pan handlers
  const onWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.min(Math.max(z * delta, 0.5), 5))
  }, [])

  const onMouseDown = useCallback((e) => {
    dragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setPan(p => ({ x: p.x + dx, y: p.y + dy }))
  }, [])

  const onMouseUp = useCallback(() => { dragging.current = false }, [])

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', cursor: dragging.current ? 'grabbing' : 'grab', display: 'block' }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />

      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={() => setZoom(z => Math.min(z * 1.2, 5))} style={btnStyle}>+</button>
        <button onClick={resetView} style={{ ...btnStyle, fontSize: 10 }}>RESET</button>
        <button onClick={() => setZoom(z => Math.max(z * 0.8, 0.5))} style={btnStyle}>−</button>
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(10,12,16,0.85)', border: '1px solid #1e2230', borderRadius: 8, padding: '10px 14px', backdropFilter: 'blur(8px)' }}>
        <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>Legend</p>
        {Object.entries(EVENT_COLORS).map(([ev, cfg]) => (
          <div key={ev} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
            <span style={{ color: '#cbd5e1', fontSize: 11 }}>{cfg.label}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #1e2230', marginTop: 6, paddingTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 6px #00f5ff' }} />
            <span style={{ color: '#cbd5e1', fontSize: 11 }}>Human player</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(150,150,200,0.7)' }} />
            <span style={{ color: '#cbd5e1', fontSize: 11 }}>Bot</span>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {matchLoading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,12,16,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #00f5ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#00f5ff', fontSize: 14 }}>Loading match data...</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Map name badge */}
      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(10,12,16,0.8)', border: '1px solid #00f5ff44', borderRadius: 6, padding: '4px 10px', backdropFilter: 'blur(6px)' }}>
        <span style={{ color: '#00f5ff', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>{selectedMap.replace(/([A-Z])/g, ' $1').trim()}</span>
      </div>
    </div>
  )
}

const btnStyle = {
  background: 'rgba(10,12,16,0.85)',
  border: '1px solid #1e2230',
  color: '#94a3b8',
  width: 32,
  height: 32,
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(6px)',
}
