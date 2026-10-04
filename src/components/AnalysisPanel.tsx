import { type AdviceLine, type HandAnalysis, type TileCount, buildAdvice, shantenLabel } from '../core/analysis'
import { suitOf, tileName } from '../core/tiles'
import { Tile } from './Tile'

function TileList({ tiles }: { tiles: TileCount[] }) {
  if (tiles.length === 0) return <span className="muted">無</span>
  return (
    <span className="tile-list">
      {tiles.map((t) => (
        <span className="tile-with-count" key={t.tile}>
          <Tile id={t.tile} size="sm" />
          <span className="remain">{t.remaining}</span>
        </span>
      ))}
    </span>
  )
}

function AdviceText({ line }: { line: AdviceLine }) {
  return (
    <p>
      {line.map((part, i) => {
        if (typeof part === 'string') return part
        if ('strong' in part) return <strong key={i}>{part.strong}</strong>
        const honor = part.tile === 31 ? 'red' : part.tile === 32 ? 'green' : ''
        return (
          <strong key={i} className={`tile-name suit-${suitOf(part.tile)} ${honor}`}>
            {tileName(part.tile)}
          </strong>
        )
      })}
    </p>
  )
}

export function AnalysisPanel({ result }: { result: HandAnalysis }) {
  const advice = buildAdvice(result)
  return (
    <main className="panel">
      <section className="card advice">
        <h2>建議</h2>
        {advice.map((line, i) => (
          <AdviceText key={i} line={line} />
        ))}
      </section>

      {result.kind === 'wait' && (
        <section className="card">
          <h2>
            {result.shanten === 0 ? '聽牌' : `${shantenLabel(result.shanten)}・有效進張`}
            <span className="sum">共 {result.total} 張</span>
          </h2>
          <TileList tiles={result.tiles} />
        </section>
      )}

      {result.kind === 'discard' && (
        <section className="card">
          <h2>打牌分析</h2>
          <ul className="discard-list">
            {result.options.map((o, i) => (
              <li key={o.tile} className={i === 0 ? 'best' : ''}>
                <div className="discard-head">
                  <span className="label">打</span>
                  <Tile id={o.tile} size="sm" />
                  <span className={`shanten s${Math.min(o.shanten, 3)}`}>{shantenLabel(o.shanten)}</span>
                  <span className="sum">
                    {o.tiles.length} 種 {o.total} 張
                  </span>
                </div>
                <div className="discard-body">
                  <span className="label">{o.shanten === 0 ? '聽' : '進'}</span>
                  <TileList tiles={o.tiles} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
