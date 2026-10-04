import { type Counts, TILE_KINDS, totalTiles } from './tiles'

/** 一種花色拆解後的結果：面子數、搭子數、是否有雀頭 */
interface Partial {
  mentsu: number
  taatsu: number
  pair: number
}

const suitCache = new Map<string, Partial[]>()

/** 只保留不被其他拆法支配的結果（面子、搭子都不比別人少；雀頭分開比較） */
function paretoFilter(list: Partial[]): Partial[] {
  return list.filter(
    (a, i) =>
      !list.some(
        (b, j) =>
          j !== i &&
          b.pair === a.pair &&
          b.mentsu >= a.mentsu &&
          b.taatsu >= a.taatsu &&
          (b.mentsu > a.mentsu || b.taatsu > a.taatsu || j < i),
      ),
  )
}

/**
 * 列舉單一花色（9 格，字牌 7 格）所有有意義的拆法。
 * 以剩餘牌型做記憶化，避免同一牌型被不同拆牌順序重複展開。
 * 字牌不能組順子與兩面/嵌張搭子。
 */
function decomposeSuit(c: number[], allowSeq: boolean): Partial[] {
  const key = (allowSeq ? 's' : 'h') + c.join('')
  const cached = suitCache.get(key)
  if (cached) return cached

  let i = 0
  while (i < c.length && c[i] === 0) i++
  if (i >= c.length) {
    const base = [{ mentsu: 0, taatsu: 0, pair: 0 }]
    suitCache.set(key, base)
    return base
  }

  const results: Partial[] = []
  /** 拿掉 removed 位置各一張（可重複），把子問題結果加上 delta */
  const branch = (removed: number[], dm: number, dt: number, dp: number) => {
    const next = c.slice()
    for (const k of removed) next[k]--
    for (const r of decomposeSuit(next, allowSeq)) {
      if (r.pair + dp > 1) continue
      results.push({ mentsu: r.mentsu + dm, taatsu: r.taatsu + dt, pair: r.pair + dp })
    }
  }

  // 刻子
  if (c[i] >= 3) branch([i, i, i], 1, 0, 0)
  // 順子
  if (allowSeq && i + 2 < c.length && c[i + 1] > 0 && c[i + 2] > 0) branch([i, i + 1, i + 2], 1, 0, 0)
  if (c[i] >= 2) {
    branch([i, i], 0, 0, 1) // 對子當雀頭
    branch([i, i], 0, 1, 0) // 對子當搭子
  }
  if (allowSeq) {
    if (i + 1 < c.length && c[i + 1] > 0) branch([i, i + 1], 0, 1, 0) // 兩面 / 邊張
    if (i + 2 < c.length && c[i + 2] > 0) branch([i, i + 2], 0, 1, 0) // 嵌張
  }
  // 當孤張捨去
  branch([i], 0, 0, 0)

  const list = paretoFilter(results)
  suitCache.set(key, list)
  return list
}

/**
 * 一般型進聽數（N 組面子 + 1 雀頭）。
 * 需要的面子數 m = floor(張數 / 3)，台灣 16 張即 m = 5。
 * 回傳 -1 = 胡牌、0 = 聽牌、1 = 一進聽 …
 * 3n+2 張時，結果等同「打出最佳一張後」的進聽數。
 */
export function calcShanten(counts: Counts): number {
  if (counts.length !== TILE_KINDS) throw new Error('counts 長度必須為 34')
  const m = Math.floor(totalTiles(counts) / 3)

  const groups = [
    decomposeSuit(counts.slice(0, 9), true),
    decomposeSuit(counts.slice(9, 18), true),
    decomposeSuit(counts.slice(18, 27), true),
    decomposeSuit(counts.slice(27, 34), false),
  ]

  let best = Infinity
  const combine = (g: number, mentsu: number, taatsu: number, pair: number) => {
    if (g === groups.length) {
      const effTaatsu = Math.min(taatsu, Math.max(0, m - mentsu))
      const s = 2 * (m - mentsu) - effTaatsu - pair
      if (s < best) best = s
      return
    }
    for (const p of groups[g]) {
      if (pair + p.pair > 1) continue
      combine(g + 1, mentsu + p.mentsu, taatsu + p.taatsu, pair + p.pair)
    }
  }
  combine(0, 0, 0, 0)
  return best
}

/** 3n+2 張是否已胡牌 */
export function isWin(counts: Counts): boolean {
  return totalTiles(counts) % 3 === 2 && calcShanten(counts) === -1
}
