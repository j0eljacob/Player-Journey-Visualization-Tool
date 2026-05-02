import { useEffect, useRef } from 'react'

export default function Timeline({ matchData, timelineProgress, setTimelineProgress, isPlaying, setIsPlaying }) {
  const intervalRef = useRef(null)

  // Get all timestamps
  const allTs = []
  if (matchData) {
    Object.values(matchData.players).forEach(p => {
      p.events.forEach(e => allTs.push(e.ts))
    })
  }
  allTs.sort((a, b) => a - b)
  const tsMin = allTs[0] || 0
  const tsMax = allTs[allTs.length - 1] || 1
  const durationMs = tsMax - tsMin || 1

  // Count events at each 5% bucket for sparkline
  const buckets = new Array(20).fill(0)
  allTs.forEach(ts => {
    const idx = Math.min(Math.floor(((ts - tsMin) / durationMs) * 20), 19)
    buckets[idx]++
  })
  const maxBucket = Math.max(...buckets, 1)

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setTimelineProgress(p => {
          if (p >= 1) { setIsPlaying(false); return 1 }
          return Math.min(p + 0.005, 1)
        })
      }, 50)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, setIsPlaying, setTimelineProgress])

  const currentTs = tsMin + (tsMax - tsMin) * timelineProgress
  const formatMs = (ms) => {
    if (!ms) return '0:00'
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
  }

  // Count events before current time
  const humanEvents = []
  let totalVisible = 0
  let killsVisible = 0
  let lootVisible = 0
  if (matchData) {
    Object.values(matchData.players).forEach(p => {
      p.events.forEach(e => {
        if (e.ts <= currentTs) {
          totalVisible++
          if (e.ev === 'Kill' || e.ev === 'BotKill') killsVisible++
          if (e.ev === 'Loot') lootVisible++
        }
      })
    })
  }

  return (
    <div style={{
      background: '#0d1017',
      borderTop: '1px solid #1a1d2e',
      padding: '10px 20px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 28 }}>
        {buckets.map((v, i) => {
          const h = Math.max((v / maxBucket) * 28, 2)
          const active = (i / 20) <= timelineProgress
          return (
            <div key={i} style={{
              flex: 1, height: h,
              background: active ? '#00f5ff' : '#1a2030',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'background 0.1s',
            }} onClick={() => setTimelineProgress((i + 0.5) / 20)} />
          )
        })}
      </div>

      {/* Scrubber row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Play/pause */}
        <button onClick={() => {
          if (timelineProgress >= 1) setTimelineProgress(0)
          setIsPlaying(!isPlaying)
        }} style={{
          background: '#00f5ff18',
          border: '1px solid #00f5ff44',
          color: '#00f5ff',
          borderRadius: 6,
          width: 32, height: 32,
          cursor: 'pointer', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Time display */}
        <span style={{ color: '#00f5ff', fontSize: 12, fontFamily: 'monospace', minWidth: 40 }}>
          {formatMs(currentTs - tsMin)}
        </span>

        {/* Scrubber */}
        <input
          type="range" min={0} max={1000} step={1}
          value={Math.round(timelineProgress * 1000)}
          onChange={e => { setTimelineProgress(e.target.value / 1000); setIsPlaying(false) }}
          style={{ flex: 1, accentColor: '#00f5ff', cursor: 'pointer' }}
        />

        <span style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace', minWidth: 40 }}>
          {formatMs(durationMs)}
        </span>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16 }}>
          <StatChip label="Events" value={totalVisible} color="#94a3b8" />
          <StatChip label="Kills" value={killsVisible} color="#ff9500" />
          <StatChip label="Loot" value={lootVisible} color="#22c55e" />
        </div>

        {/* Speed / reset */}
        <button onClick={() => { setTimelineProgress(1); setIsPlaying(false) }}
          style={{ background: 'transparent', border: '1px solid #1a1d2e', color: '#64748b', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>
          FULL
        </button>
        <button onClick={() => { setTimelineProgress(0); setIsPlaying(false) }}
          style={{ background: 'transparent', border: '1px solid #1a1d2e', color: '#64748b', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>
          RESET
        </button>
      </div>
    </div>
  )
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color, fontSize: 14, fontWeight: 700 }}>{value}</div>
      <div style={{ color: '#475569', fontSize: 10 }}>{label}</div>
    </div>
  )
}
