import { useState } from 'react'

const MAPS = ['AmbroseValley', 'GrandRift', 'Lockdown']
const DATES = ['all', 'February_10', 'February_11', 'February_12', 'February_13', 'February_14']
const DATE_LABELS = { all: 'All Days', February_10: 'Feb 10', February_11: 'Feb 11', February_12: 'Feb 12', February_13: 'Feb 13', February_14: 'Feb 14 (partial)' }
const MAP_COLORS = { AmbroseValley: '#00f5ff', GrandRift: '#a8ff3e', Lockdown: '#ff6b35' }

const EVENT_TYPES = [
  { key: 'Kill', label: 'PvP Kills', color: '#ff3b3b' },
  { key: 'Killed', label: 'PvP Deaths', color: '#ff6b6b' },
  { key: 'BotKill', label: 'Bot Kills', color: '#ff9500' },
  { key: 'BotKilled', label: 'Killed by Bot', color: '#ff6b00' },
  { key: 'KilledByStorm', label: 'Storm Deaths', color: '#a855f7' },
  { key: 'Loot', label: 'Loot Pickups', color: '#22c55e' },
]

export default function Sidebar({
  matchesIndex, filteredMatches,
  selectedMap, setSelectedMap,
  selectedDate, setSelectedDate,
  selectedMatch, setSelectedMatch,
  matchData, showBots, setShowBots,
  showHumans, setShowHumans,
  showPaths, setShowPaths,
  filterEvents, setFilterEvents
}) {
  const [search, setSearch] = useState('')

  const displayMatches = filteredMatches.filter(m =>
    search === '' || m.id.toLowerCase().includes(search.toLowerCase())
  )

  const toggleEvent = (ev) => {
    setFilterEvents(prev =>
      prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
    )
  }

  const matchInfo = matchData ? matchesIndex.find(m => m.id === matchData.match_id) : null

  return (
    <div style={{
      width: 280, minWidth: 280,
      background: '#0d1017',
      borderRight: '1px solid #1a1d2e',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1a1d2e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 8px #00f5ff', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#00f5ff', fontWeight: 800, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>LILA BLACK</span>
        </div>
        <p style={{ color: '#475569', fontSize: 11, margin: 0, letterSpacing: 1 }}>PLAYER JOURNEY VISUALIZER</p>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>

      {/* Map selector */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1d2e' }}>
        <label style={labelStyle}>MAP</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {MAPS.map(map => (
            <button key={map} onClick={() => { setSelectedMap(map); setSelectedMatch(null) }}
              style={{
                ...mapBtnStyle,
                background: selectedMap === map ? `${MAP_COLORS[map]}18` : 'transparent',
                border: `1px solid ${selectedMap === map ? MAP_COLORS[map] : '#1a1d2e'}`,
                color: selectedMap === map ? MAP_COLORS[map] : '#64748b',
              }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: MAP_COLORS[map], display: 'inline-block', marginRight: 8, boxShadow: selectedMap === map ? `0 0 6px ${MAP_COLORS[map]}` : 'none' }} />
              {map.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Date filter */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1d2e' }}>
        <label style={labelStyle}>DATE</label>
        <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          style={{ width: '100%', background: '#131620', border: '1px solid #1a1d2e', color: '#94a3b8', borderRadius: 6, padding: '6px 10px', fontSize: 13, cursor: 'pointer' }}>
          {DATES.map(d => (
            <option key={d} value={d}>{DATE_LABELS[d]}</option>
          ))}
        </select>
        <p style={{ color: '#475569', fontSize: 11, margin: '4px 0 0' }}>{filteredMatches.length} matches found</p>
      </div>

      {/* Layer toggles */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1d2e' }}>
        <label style={labelStyle}>LAYERS</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Toggle label="Human players" value={showHumans} onChange={setShowHumans} color="#00f5ff" />
          <Toggle label="Bots" value={showBots} onChange={setShowBots} color="#9696c8" />
          <Toggle label="Movement paths" value={showPaths} onChange={setShowPaths} color="#64748b" />
        </div>
      </div>

      {/* Event filters */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1d2e' }}>
        <label style={labelStyle}>EVENTS</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {EVENT_TYPES.map(({ key, label, color }) => (
            <div key={key} onClick={() => toggleEvent(key)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: filterEvents.includes(key) ? 1 : 0.35, transition: 'opacity 0.2s' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: filterEvents.includes(key) ? `0 0 6px ${color}` : 'none', flexShrink: 0 }} />
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Match list */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '12px 16px 0' }}>
        <label style={labelStyle}>MATCHES ({filteredMatches.length})</label>
        <input
          placeholder="Search match ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', background: '#131620', border: '1px solid #1a1d2e', color: '#94a3b8', borderRadius: 6, padding: '6px 10px', fontSize: 12, marginBottom: 8, outline: 'none' }}
        />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {displayMatches.slice(0, 200).map(m => (
            <button key={m.id} onClick={() => setSelectedMatch(m.id)}
              style={{
                background: selectedMatch === m.id ? '#00f5ff12' : 'transparent',
                border: `1px solid ${selectedMatch === m.id ? '#00f5ff44' : '#1a1d2e'}`,
                borderRadius: 6, padding: '7px 10px', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ color: selectedMatch === m.id ? '#00f5ff' : '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}>
                  {m.id.slice(0, 12)}...
                </span>
                <span style={{ color: '#475569', fontSize: 10 }}>{m.date.replace('February_', 'Feb ')}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#00f5ff', fontSize: 10 }}>👤 {m.humans}</span>
                <span style={{ color: '#9696c8', fontSize: 10 }}>🤖 {m.bots}</span>
                <span style={{ color: '#ff9500', fontSize: 10 }}>⚔ {m.kills}</span>
                <span style={{ color: '#22c55e', fontSize: 10 }}>📦 {m.loot}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Toggle({ label, value, onChange, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => onChange(!value)}>
      <span style={{ color: '#94a3b8', fontSize: 12 }}>{label}</span>
      <div style={{
        width: 36, height: 20, borderRadius: 10,
        background: value ? color : '#1a1d2e',
        position: 'relative', transition: 'background 0.2s',
        border: `1px solid ${value ? color : '#2a2d3e'}`,
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 17 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: value ? '#fff' : '#475569',
          transition: 'left 0.2s',
        }} />
      </div>
    </div>
  )
}

const labelStyle = { color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }
const mapBtnStyle = { borderRadius: 6, padding: '7px 12px', cursor: 'pointer', textAlign: 'left', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', width: '100%' }
