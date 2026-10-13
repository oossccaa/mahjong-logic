import { useState } from 'react'
import { MAX_HAND } from '../core/analysis'
import { type Counts, MAX_PER_TILE, tileName, totalTiles } from '../core/tiles'
import { Tile } from './Tile'

const ROWS = [
  Array.from({ length: 9 }, (_, i) => i),
  Array.from({ length: 9 }, (_, i) => i + 9),
  Array.from({ length: 9 }, (_, i) => i + 18),
  Array.from({ length: 7 }, (_, i) => i + 27),
]

const COLLAPSE_KEY = 'mahjong:pickerCollapsed'

function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

interface Props {
  counts: Counts
  onAdd: (id: number) => void
}

export function TilePicker({ counts, onAdd }: Props) {
  const full = totalTiles(counts) >= MAX_HAND
  const [collapsed, setCollapsed] = useState(loadCollapsed)

  const toggle = () =>
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, prev ? '0' : '1')
      } catch {
        // 無法存取時僅本次有效
      }
      return !prev
    })

  if (collapsed) {
    return (
      <footer className="picker collapsed">
        <button type="button" className="picker-toggle" aria-expanded={false} onClick={toggle}>
          展開選牌 ▲
        </button>
      </footer>
    )
  }

  return (
    <footer className="picker">
      {ROWS.map((row, r) => (
        <div className="picker-row" key={r}>
          {row.map((id) => (
            <Tile
              key={id}
              id={id}
              badge={counts[id]}
              disabled={full || counts[id] >= MAX_PER_TILE}
              onClick={() => onAdd(id)}
              label={`加入${tileName(id)}`}
            />
          ))}
          {/* 字牌只有 7 張，剩下兩格放收起鈕 */}
          {r === ROWS.length - 1 && (
            <button type="button" className="picker-toggle" aria-expanded onClick={toggle}>
              收起 ▼
            </button>
          )}
        </div>
      ))}
    </footer>
  )
}
