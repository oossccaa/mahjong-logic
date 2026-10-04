import { useMemo, useState } from 'react'
import { AnalysisPanel } from './components/AnalysisPanel'
import { HandBar } from './components/HandBar'
import { TilePicker } from './components/TilePicker'
import { MAX_HAND, analyzeHand } from './core/analysis'
import { type Counts, MAX_PER_TILE, emptyCounts, totalTiles } from './core/tiles'

export default function App() {
  const [counts, setCounts] = useState<Counts>(emptyCounts)
  const result = useMemo(() => analyzeHand(counts), [counts])

  const add = (id: number) =>
    setCounts((prev) => {
      if (prev[id] >= MAX_PER_TILE || totalTiles(prev) >= MAX_HAND) return prev
      const next = prev.slice()
      next[id]++
      return next
    })

  const remove = (id: number) =>
    setCounts((prev) => {
      if (prev[id] === 0) return prev
      const next = prev.slice()
      next[id]--
      return next
    })

  return (
    <div className="app">
      <HandBar counts={counts} onRemove={remove} onClear={() => setCounts(emptyCounts())} />
      <AnalysisPanel result={result} />
      <TilePicker counts={counts} onAdd={add} />
    </div>
  )
}
