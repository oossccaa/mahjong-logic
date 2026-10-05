import { useMemo, useState } from 'react'
import { AnalysisPanel } from './components/AnalysisPanel'
import { HandBar } from './components/HandBar'
import { TilePicker } from './components/TilePicker'
import { MAX_HAND, analyzeHand } from './core/analysis'
import { MAX_PER_TILE, emptyCounts } from './core/tiles'

const SORT_KEY = 'mahjong:sorted'

function loadSorted(): boolean {
  try {
    return localStorage.getItem(SORT_KEY) !== '0'
  } catch {
    return true
  }
}

export default function App() {
  // 依點選順序保存手牌，顯示時再決定是否排序
  const [hand, setHand] = useState<number[]>([])
  const [sorted, setSorted] = useState(loadSorted)
  const counts = useMemo(() => {
    const c = emptyCounts()
    for (const id of hand) c[id]++
    return c
  }, [hand])
  const result = useMemo(() => analyzeHand(counts), [counts])

  const add = (id: number) =>
    setHand((prev) => {
      if (prev.length >= MAX_HAND || prev.filter((t) => t === id).length >= MAX_PER_TILE) return prev
      return [...prev, id]
    })

  const remove = (index: number) => setHand((prev) => prev.filter((_, i) => i !== index))

  const toggleSorted = () =>
    setSorted((prev) => {
      try {
        localStorage.setItem(SORT_KEY, prev ? '0' : '1')
      } catch {
        // 無法存取時僅本次有效
      }
      return !prev
    })

  return (
    <div className="app">
      <HandBar
        hand={hand}
        sorted={sorted}
        onToggleSorted={toggleSorted}
        onRemove={remove}
        onClear={() => setHand([])}
      />
      <AnalysisPanel result={result} />
      <TilePicker counts={counts} onAdd={add} />
    </div>
  )
}
