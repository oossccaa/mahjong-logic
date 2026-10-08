import { type AdviceLine, type HandAnalysis, type TileCount, buildAdvice, formatWait, shantenLabel } from '../core/analysis'
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
          {t.wait !== undefined && (
            <span className="remain wait" title="摸進後聽牌的張數">
              聽{t.wait}
            </span>
          )}
        </span>
      ))}
    </span>
  )
}

/** 一進聽：每張進張摸進後該打什麼、聽哪些牌 */
function DrawList({ tiles }: { tiles: TileCount[] }) {
  const rows = [...tiles].sort((a, b) => (b.wait ?? 0) - (a.wait ?? 0) || a.tile - b.tile)
  const top = rows[0]?.wait ?? 0
  return (
    <ul className="discard-list">
      {rows.map((t) => (
        <li key={t.tile} className={t.wait === top && top > 0 ? 'best' : ''}>
          <div className="discard-head">
            <span className="label">進</span>
            <Tile id={t.tile} size="sm" />
            <span className="muted">剩 {t.remaining}</span>
            {t.tenpai && (
              <>
                <span className="label">打</span>
                <Tile id={t.tenpai.discard} size="sm" />
              </>
            )}
            <span className="sum">聽 {t.wait ?? 0} 張</span>
          </div>
          <div className="discard-body">
            <span className="label">聽</span>
            <TileList tiles={t.tenpai?.waits ?? []} />
          </div>
        </li>
      ))}
    </ul>
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
            <span className="sum">
              共 {result.total} 張
              {result.avgWait !== undefined && `・平均聽 ${formatWait(result.avgWait)} 張`}
            </span>
          </h2>
          {result.shanten === 1 ? <DrawList tiles={result.tiles} /> : <TileList tiles={result.tiles} />}
        </section>
      )}

      {result.kind === 'discard' && (
        <section className="card">
          <h2>打牌分析</h2>
          <ul className="discard-list">
            {result.kongs.map((k) => (
              <li key={`kong-${k.tile}`} className={k.shanten <= result.options[0].shanten ? 'best' : ''}>
                <div className="discard-head">
                  <span className="label">槓</span>
                  <Tile id={k.tile} size="sm" />
                  <span className={`shanten s${Math.max(0, Math.min(k.shanten, 3))}`}>{shantenLabel(k.shanten)}</span>
                  <span className="sum">
                    {k.tiles.length} 種 {k.total} 張
                    {k.avgWait !== undefined && `・平均聽 ${formatWait(k.avgWait)}`}
                  </span>
                </div>
                <div className="discard-body">
                  <span className="label">補</span>
                  <TileList tiles={k.tiles} />
                </div>
              </li>
            ))}
            {result.options.map((o, i) => (
              <li key={o.tile} className={i === 0 && !result.kongs.some((k) => k.shanten <= o.shanten) ? 'best' : ''}>
                <div className="discard-head">
                  <span className="label">打</span>
                  <Tile id={o.tile} size="sm" />
                  <span className={`shanten s${Math.min(o.shanten, 3)}`}>{shantenLabel(o.shanten)}</span>
                  <span className="sum">
                    {o.tiles.length} 種 {o.total} 張
                    {o.avgWait !== undefined && `・平均聽 ${formatWait(o.avgWait)}`}
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
