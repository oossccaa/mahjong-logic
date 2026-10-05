import { MAX_HAND } from '../core/analysis'
import { tileName } from '../core/tiles'
import { Tile } from './Tile'

interface Props {
  /** 依點選順序的手牌 */
  hand: number[]
  /** true 依大小理牌，false 照點選順序 */
  sorted: boolean
  onToggleSorted: () => void
  /** 以 hand 中的索引移除 */
  onRemove: (index: number) => void
  onClear: () => void
}

export function HandBar({ hand, sorted, onToggleSorted, onRemove, onClear }: Props) {
  const items = hand.map((id, index) => ({ id, index }))
  if (sorted) items.sort((a, b) => a.id - b.id || a.index - b.index)
  return (
    <header className="hand-bar">
      <div className="hand-head">
        <h1>我的手牌</h1>
        <span className="hand-count">
          {hand.length} / {MAX_HAND} 張
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={sorted}
          className={`sort-switch ${sorted ? 'on' : ''}`}
          onClick={onToggleSorted}
        >
          <span className="track">
            <span className="thumb" />
          </span>
          理牌
        </button>
        <button type="button" className="clear-btn" onClick={onClear} disabled={hand.length === 0}>
          清空
        </button>
      </div>
      <div className="hand-tiles">
        {hand.length === 0 ? (
          <p className="hint">尚未選牌，點下方的牌加入</p>
        ) : (
          items.map(({ id, index }) => (
            <Tile key={index} id={id} size="sm" onClick={() => onRemove(index)} label={`移除${tileName(id)}`} />
          ))
        )}
      </div>
      {hand.length > 0 && <p className="hint small">點手牌可移除{sorted ? '' : '・目前依點選順序排列'}</p>}
    </header>
  )
}
