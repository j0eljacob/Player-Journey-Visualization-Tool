export default function StatsBar({ matchData, matchesIndex, selectedMap }) {
  const GLOBAL = {
    total_matches: 796,
    total_events: 89104,
    unique_players: 339,
    bot_kill_pct: '99.9%',
    avg_bots_per_match: '8.87',
  }

  const mapMatches = matchesIndex.filter(m => m.map === selectedMap)
  const totalKills = mapMatches.reduce((s, m) => s + m.kills, 0)
  const totalLoot = mapMatches.reduce((s, m) => s + m.loot, 0)
  const totalStorm = mapMatches.reduce((s, m) => s + m.storm, 0)

  const stats = matchData ? [
    { label: 'Match', value: matchData.match_id.slice(0, 8) + '...', color: '#00f5ff' },
    { label: 'Map', value: matchData.map_id, color: '#a8ff3e' },
    { label: 'Humans', value: Object.values(matchData.players).filter(p => !p.is_bot).length, color: '#00f5ff' },
    { label: 'Bots', value: Object.values(matchData.players).filter(p => p.is_bot).length, color: '#9696c8' },
    { label: 'Total Events', value: Object.values(matchData.players).reduce((s, p) => s + p.events.length, 0).toLocaleString(), color: '#94a3b8' },
    { label: 'Map Matches', value: mapMatches.length, color: '#f59e0b' },
    { label: 'Map Kills', value: totalKills.toLocaleString(), color: '#ff9500' },
    { label: 'Map Loot', value: totalLoot.toLocaleString(), color: '#22c55e' },
    { label: 'Storm Deaths', value: totalStorm, color: '#a855f7' },
  ] : [
    { label: 'Total Matches', value: GLOBAL.total_matches.toLocaleString(), color: '#00f5ff' },
    { label: 'Total Events', value: GLOBAL.total_events.toLocaleString(), color: '#94a3b8' },
    { label: 'Unique Players', value: GLOBAL.unique_players, color: '#a8ff3e' },
    { label: 'Bot Kill %', value: GLOBAL.bot_kill_pct, color: '#ff9500' },
    { label: 'Avg Bots/Match', value: GLOBAL.avg_bots_per_match, color: '#9696c8' },
    { label: 'Map Matches', value: mapMatches.length, color: '#f59e0b' },
    { label: 'Map Kills', value: totalKills.toLocaleString(), color: '#ff6b35' },
    { label: 'Map Loot', value: totalLoot.toLocaleString(), color: '#22c55e' },
    { label: 'Storm Deaths', value: totalStorm, color: '#a855f7' },
  ]

  return (
    <div style={{
      background: '#0a0c10',
      borderBottom: '1px solid #1a1d2e',
      padding: '8px 20px',
      display: 'flex', alignItems: 'center', gap: 0,
      overflowX: 'auto',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ padding: '0 16px', textAlign: 'center', minWidth: 80 }}>
            <div style={{ color: s.color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</div>
            <div style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
          </div>
          {i < stats.length - 1 && (
            <div style={{ width: 1, height: 28, background: '#1a1d2e' }} />
          )}
        </div>
      ))}
    </div>
  )
}
