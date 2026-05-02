import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import MapCanvas from './components/MapCanvas'
import Timeline from './components/Timeline'
import HeatmapPanel from './components/HeatmapPanel'
import StatsBar from './components/StatsBar'
import './index.css'

export default function App() {
  const [matchesIndex, setMatchesIndex] = useState([])
  const [heatmapData, setHeatmapData] = useState({})
  const [loading, setLoading] = useState(true)

  const [selectedMap, setSelectedMap] = useState('AmbroseValley')
  const [selectedDate, setSelectedDate] = useState('all')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [matchData, setMatchData] = useState(null)
  const [matchLoading, setMatchLoading] = useState(false)

  const [heatmapType, setHeatmapType] = useState(null)
  const [showBots, setShowBots] = useState(true)
  const [showHumans, setShowHumans] = useState(true)
  const [showPaths, setShowPaths] = useState(true)
  const [filterEvents, setFilterEvents] = useState(['Kill','Killed','BotKill','BotKilled','KilledByStorm','Loot'])

  const [timelineProgress, setTimelineProgress] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/data/matches_index.json').then(r => r.json()),
      fetch('/data/heatmaps.json').then(r => r.json()),
    ]).then(([matches, heatmaps]) => {
      setMatchesIndex(matches)
      setHeatmapData(heatmaps)
      setLoading(false)
      const first = matches.find(m => m.map === 'AmbroseValley')
      if (first) setSelectedMatch(first.id)
    })
  }, [])

  useEffect(() => {
    if (!selectedMatch) return
    setMatchLoading(true)
    setTimelineProgress(1)
    setIsPlaying(false)
    fetch(`/data/matches/${selectedMatch}.json`)
      .then(r => r.json())
      .then(data => {
        setMatchData(data)
        setSelectedMap(data.map_id)
        setMatchLoading(false)
      })
      .catch(() => setMatchLoading(false))
  }, [selectedMatch])

  const filteredMatches = matchesIndex.filter(m => {
    if (m.map !== selectedMap) return false
    if (selectedDate !== 'all' && m.date !== selectedDate) return false
    return true
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0c10' }}>
      <Sidebar
        matchesIndex={matchesIndex}
        filteredMatches={filteredMatches}
        selectedMap={selectedMap}
        setSelectedMap={setSelectedMap}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedMatch={selectedMatch}
        setSelectedMatch={setSelectedMatch}
        matchData={matchData}
        showBots={showBots}
        setShowBots={setShowBots}
        showHumans={showHumans}
        setShowHumans={setShowHumans}
        showPaths={showPaths}
        setShowPaths={setShowPaths}
        filterEvents={filterEvents}
        setFilterEvents={setFilterEvents}
      />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <StatsBar matchData={matchData} matchesIndex={matchesIndex} selectedMap={selectedMap} />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 56, height: 56, border: '4px solid #00f5ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#00f5ff', fontSize: 18, fontWeight: 600 }}>Loading LILA BLACK data...</p>
                <p style={{ color: '#64748b', fontSize: 14 }}>Parsing 89,000+ player events</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <MapCanvas
                selectedMap={selectedMap}
                matchData={matchData}
                matchLoading={matchLoading}
                heatmapData={heatmapData}
                heatmapType={heatmapType}
                showBots={showBots}
                showHumans={showHumans}
                showPaths={showPaths}
                filterEvents={filterEvents}
                timelineProgress={timelineProgress}
              />
            )}
          </div>
          <HeatmapPanel
            heatmapType={heatmapType}
            setHeatmapType={setHeatmapType}
            selectedMap={selectedMap}
            heatmapData={heatmapData}
          />
        </div>

        {matchData && (
          <Timeline
            matchData={matchData}
            timelineProgress={timelineProgress}
            setTimelineProgress={setTimelineProgress}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        )}
      </div>
    </div>
  )
}
