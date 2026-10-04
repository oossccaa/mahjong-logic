import { MAX_HAND } from '../core/analysis'
import { type Counts, MAX_PER_TILE, tileName, totalTiles } from '../core/tiles'
import { Tile } from './Tile'

const ROWS = [
  Array.from({ length: 9 }, (_, i) => i),
  Array.from({ length: 9 }, (_, i) => i + 9),
  Array.from({ length: 9 }, (_, i) => i + 18),
  Array.from({ length: 7 }, (_, i) => i + 27),
]

interface Props {
  counts: Counts
  onAdd: (id: number) => void
}

export function TilePicker({ counts, onAdd }: Props) {
  const full = totalTiles(counts) >= MAX_HAND
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
        </div>
      ))}
    </footer>
  )
}
