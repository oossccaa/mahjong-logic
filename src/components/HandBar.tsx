import { MAX_HAND } from '../core/analysis'
import { type Counts, countsToTiles, tileName } from '../core/tiles'
import { Tile } from './Tile'

interface Props {
  counts: Counts
  onRemove: (id: number) => void
  onClear: () => void
}

export function HandBar({ counts, onRemove, onClear }: Props) {
  const tiles = countsToTiles(counts)
  return (
    <header className="hand-bar">
      <div className="hand-head">
        <h1>我的手牌</h1>
        <span className="hand-count">
          {tiles.length} / {MAX_HAND} 張
        </span>
        <button type="button" className="clear-btn" onClick={onClear} disabled={tiles.length === 0}>
          清空
        </button>
      </div>
      <div className="hand-tiles">
        {tiles.length === 0 ? (
          <p className="hint">尚未選牌，點下方的牌加入</p>
        ) : (
          tiles.map((id, i) => (
            <Tile key={`${id}-${i}`} id={id} size="sm" onClick={() => onRemove(id)} label={`移除${tileName(id)}`} />
          ))
        )}
      </div>
      {tiles.length > 0 && <p className="hint small">點手牌可移除</p>}
    </header>
  )
}
