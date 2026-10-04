import { suitOf, tileFace } from '../core/tiles'
import { TileArt } from './TileArt'

interface Props {
  id: number
  size?: 'sm' | 'md'
  badge?: number
  disabled?: boolean
  onClick?: () => void
  label?: string
}

export function Tile({ id, size = 'md', badge, disabled, onClick, label }: Props) {
  const { main, sub } = tileFace(id)
  const suit = suitOf(id)
  const drawn = suit === 'pin' || suit === 'sou'
  const honorClass = id === 31 ? 'red' : id === 32 ? 'green' : ''
  const className = `tile tile-${size} suit-${suit} ${honorClass}`
  const content = (
    <>
      {drawn ? (
        <TileArt id={id} />
      ) : (
        <>
          <span className="tile-main">{main}</span>
          {sub && <span className="tile-sub">{sub}</span>}
        </>
      )}
      {badge ? <span className="tile-badge">{badge}</span> : null}
    </>
  )
  if (!onClick) return <span className={className}>{content}</span>
  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick} aria-label={label}>
      {content}
    </button>
  )
}
