const HEATMAP_OPTIONS = [
  { key: 'kill', label: 'Kill Zones', icon: '⚔️', color: '#ff3b3b', desc: 'Where kills happen most' },
  { key: 'death', label: 'Death Zones', icon: '💀', color: '#ff6b35', desc: 'Where players die most' },
  { key: 'traffic', label: 'High Traffic', icon: '🗺️', color: '#00f5ff', desc: 'Most traveled areas' },
  { key: 'loot', label: 'Loot Zones', icon: '📦', color: '#22c55e', desc: 'Where items are picked up' },
  { key: 'storm', label: 'Storm Deaths', icon: '⚡', color: '#a855f7', desc: 'Storm casualty zones' },
]

export default function HeatmapPanel({ heatmapType, setHeatmapType, selectedMap, heatmapData }) {
  const mapData = heatmapData[selectedMap] || {}

  return (
    <div style={{
      width: 160, minWidth: 160,
      background: '#0d1017',
      borderLeft: '1px solid #1a1d2e',
      padding: '14px 12px',
      display: 'flex', flexDirection: 'column', gap: 6,
      overflowY: 'auto',
    }}>
      <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 6px' }}>HEATMAPS</p>

      {/* None option */}
      <button onClick={() => setHeatmapType(null)}
        style={{
          ...heatBtnBase,
          background: heatmapType === null ? '#ffffff12' : 'transparent',
          border: `1px solid ${heatmapType === null ? '#ffffff33' : '#1a1d2e'}`,
          color: heatmapType === null ? '#fff' : '#475569',
        }}>
        <span style={{ fontSize: 14 }}>🚫</span>
        <span style={{ fontSize: 11 }}>None</span>
      </button>

      {HEATMAP_OPTIONS.map(opt => {
        const pts = mapData[opt.key]?.length || 0
        const active = heatmapType === opt.key
        return (
          <button key={opt.key} onClick={() => setHeatmapType(active ? null : opt.key)}
            title={opt.desc}
            style={{
              ...heatBtnBase,
              background: active ? `${opt.color}18` : 'transparent',
              border: `1px solid ${active ? opt.color : '#1a1d2e'}`,
              color: active ? opt.color : '#64748b',
            }}>
            <span style={{ fontSize: 14 }}>{opt.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{opt.label}</div>
              <div style={{ fontSize: 9, opacity: 0.6 }}>{pts} pts</div>
            </div>
          </button>
        )
      })}

      <div style={{ borderTop: '1px solid #1a1d2e', marginTop: 8, paddingTop: 10 }}>
        <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 8px' }}>MAP STATS</p>
        <MapStats selectedMap={selectedMap} heatmapData={heatmapData} />
      </div>
    </div>
  )
}

function MapStats({ selectedMap, heatmapData }) {
  const MAP_STATS = {
    AmbroseValley: { matches: 566, lootPerMatch: '17.6', killsPerMatch: '3.2', color: '#00f5ff' },
    GrandRift:     { matches: 59,  lootPerMatch: '14.9', killsPerMatch: '3.3', color: '#a8ff3e' },
    Lockdown:      { matches: 171, lootPerMatch: '12.0', killsPerMatch: '2.5', color: '#ff6b35' },
  }
  const s = MAP_STATS[selectedMap] || {}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <StatRow label="Matches" value={s.matches} color={s.color} />
      <StatRow label="Loot/match" value={s.lootPerMatch} color="#22c55e" />
      <StatRow label="Kills/match" value={s.killsPerMatch} color="#ff9500" />
    </div>
  )
}

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#475569', fontSize: 11 }}>{label}</span>
      <span style={{ color, fontSize: 12, fontWeight: 700 }}>{value}</span>
    </div>
  )
}

const heatBtnBase = {
  width: '100%', borderRadius: 7, padding: '8px 10px',
  cursor: 'pointer', textAlign: 'left',
  display: 'flex', alignItems: 'center', gap: 8,
  transition: 'all 0.15s',
}
