import { calcShanten } from './shanten'
import { type Counts, MAX_PER_TILE, TILE_KINDS, tileName, totalTiles } from './tiles'

export const MAX_HAND = 17

export interface TileCount {
  tile: number
  /** 尚未現身（不在自己手上）的張數 */
  remaining: number
  /** 一進聽時：摸進這張後，打出最佳一張所能聽的張數 */
  wait?: number
  /** 一進聽時：摸進這張後聽最多的打法，及其聽的牌 */
  tenpai?: { discard: number; waits: TileCount[] }
}

export interface DiscardOption {
  tile: number
  /** 打出後的進聽數，0 = 聽牌 */
  shanten: number
  /** 聽牌時為聽的牌，否則為有效進張 */
  tiles: TileCount[]
  total: number
  /** 一進聽時：摸到有效進張聽牌後，平均聽幾張（依進張剩餘張數加權） */
  avgWait?: number
}

export type HandAnalysis =
  | { kind: 'empty' }
  /** 張數為 3n，無法分析，需再補牌 */
  | { kind: 'incomplete'; count: number }
  /** 3n+1 張：等牌 */
  | { kind: 'wait'; shanten: number; tiles: TileCount[]; total: number; avgWait?: number }
  /** 3n+2 張：該打牌 */
  | {
      kind: 'discard'
      count: number
      win: boolean
      options: DiscardOption[]
      /** 手上有 4 張可暗槓的牌：槓後（不含槓子）的進聽數，tiles 為補牌的有效進張 */
      kongs: DiscardOption[]
    }

/**
 * 3n+1 張時，找出摸進後能降低進聽數的牌（聽牌時即為聽的牌）。
 * visible 為已知在自己手上的牌，用來算剩餘張數。
 */
function effectiveTiles(counts: Counts, shanten: number, visible: Counts): TileCount[] {
  const result: TileCount[] = []
  for (let t = 0; t < TILE_KINDS; t++) {
    const remaining = MAX_PER_TILE - visible[t]
    if (counts[t] >= MAX_PER_TILE) continue
    counts[t]++
    const s = calcShanten(counts)
    counts[t]--
    if (s < shanten) result.push({ tile: t, remaining: Math.max(0, remaining) })
  }
  return result
}

const sumRemaining = (tiles: TileCount[]) => tiles.reduce((a, b) => a + b.remaining, 0)

/**
 * 一進聽時評估聽牌品質：對每張有效進張，摸進後找出聽最多張的打法，
 * 把聽牌張數記在 tile.wait、打法與聽的牌記在 tile.tenpai，並回傳依進張剩餘張數加權的平均聽牌張數。
 */
function rateTenpai(counts: Counts, tiles: TileCount[], visible: Counts): number {
  let weighted = 0
  let weight = 0
  for (const eff of tiles) {
    counts[eff.tile]++
    const seen = visible.slice()
    seen[eff.tile]++
    let best = -1
    for (let d = 0; d < TILE_KINDS; d++) {
      if (counts[d] === 0 || d === eff.tile) continue
      counts[d]--
      if (calcShanten(counts) === 0) {
        const waits = effectiveTiles(counts, 0, seen)
        const total = sumRemaining(waits)
        if (total > best) {
          best = total
          eff.tenpai = { discard: d, waits }
        }
      }
      counts[d]++
    }
    counts[eff.tile]--
    best = Math.max(best, 0)
    eff.wait = best
    weighted += best * eff.remaining
    weight += eff.remaining
  }
  return weight === 0 ? 0 : weighted / weight
}

/** 3n+1 張的進聽與進張，一進聽時附上聽牌品質 */
function evaluate(counts: Counts, visible: Counts) {
  const shanten = calcShanten(counts)
  const tiles = effectiveTiles(counts, shanten, visible)
  const avgWait = shanten === 1 ? rateTenpai(counts, tiles, visible) : undefined
  return { shanten, tiles, total: sumRemaining(tiles), avgWait }
}

export function analyzeHand(input: Counts): HandAnalysis {
  const counts = input.slice()
  const n = totalTiles(counts)
  if (n === 0) return { kind: 'empty' }

  if (n % 3 === 0) return { kind: 'incomplete', count: n }

  if (n % 3 === 1) return { kind: 'wait', ...evaluate(counts, input) }

  const win = calcShanten(counts) === -1
  const options: DiscardOption[] = []
  for (let t = 0; t < TILE_KINDS; t++) {
    if (counts[t] === 0) continue
    counts[t]--
    options.push({ tile: t, ...evaluate(counts, input) })
    counts[t]++
  }
  options.sort(
    (a, b) =>
      a.shanten - b.shanten ||
      b.total - a.total ||
      (b.avgWait ?? 0) - (a.avgWait ?? 0) ||
      b.tiles.length - a.tiles.length ||
      a.tile - b.tile,
  )

  // 暗槓：4 張固定成一組，剩下 3n+1 張等補牌
  const kongs: DiscardOption[] = []
  for (let t = 0; t < TILE_KINDS; t++) {
    if (counts[t] < MAX_PER_TILE) continue
    counts[t] = 0
    kongs.push({ tile: t, ...evaluate(counts, input) })
    counts[t] = MAX_PER_TILE
  }
  return { kind: 'discard', count: n, win, options, kongs }
}

const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

export function shantenLabel(s: number): string {
  if (s < 0) return '胡牌'
  if (s === 0) return '聽牌'
  return `${CN_NUM[s] ?? s}進聽`
}

/** 建議文字的片段：一般文字、牌名（以花色顏色強調）、粗體重點 */
export type AdvicePart = string | { tile: number } | { strong: string }
export type AdviceLine = AdvicePart[]

const strong = (text: string | number): AdvicePart => ({ strong: String(text) })

/** 以 tagged template 組出一行建議，插入值可為文字、數字或片段 */
function line(strs: TemplateStringsArray, ...values: (AdvicePart | AdvicePart[] | number)[]): AdviceLine {
  const parts: AdviceLine = []
  strs.forEach((str, i) => {
    if (str) parts.push(str)
    if (i >= values.length) return
    const v = values[i]
    if (Array.isArray(v)) parts.push(...v)
    else parts.push(typeof v === 'number' ? String(v) : v)
  })
  return parts
}

/** 牌名串列，例如「三條、六條」 */
function tileParts(tiles: number[], sep = '、'): AdvicePart[] {
  return tiles.flatMap((tile, i) => (i === 0 ? [{ tile }] : [sep, { tile }]))
}

const waitTiles = (tiles: TileCount[]) => tileParts(tiles.map((t) => t.tile))

/** 轉成純文字（測試或無障礙用） */
export function adviceToText(l: AdviceLine): string {
  return l
    .map((p) => (typeof p === 'string' ? p : 'tile' in p ? tileName(p.tile) : p.strong))
    .join('')
}

/** 平均聽牌張數取一位小數 */
export const formatWait = (n: number) => String(Math.round(n * 10) / 10)

const avgWaitPart = (avgWait: number | undefined) =>
  avgWait === undefined ? [] : line`，聽牌後平均聽 ${strong(formatWait(avgWait))} 張`

function describeOption(o: DiscardOption): AdviceLine {
  if (o.shanten === 0) return line`打後聽 ${waitTiles(o.tiles)}，共 ${strong(o.total)} 張`
  return line`打後${strong(shantenLabel(o.shanten))}，有效進張 ${o.tiles.length} 種 ${strong(o.total)} 張${avgWaitPart(o.avgWait)}`
}

function describeKong(k: DiscardOption): AdviceLine {
  if (k.shanten < 0) return ['槓後牌型已完整']
  if (k.shanten === 0) return line`槓後聽牌，補牌摸到 ${waitTiles(k.tiles)} 即槓上開花（共 ${strong(k.total)} 張）`
  return line`槓後${strong(shantenLabel(k.shanten))}並立即補牌，補牌有效進張 ${k.tiles.length} 種 ${strong(k.total)} 張`
}

/** 依分析結果產生給玩家看的建議 */
export function buildAdvice(result: HandAnalysis): AdviceLine[] {
  switch (result.kind) {
    case 'empty':
      return [['點選下方的牌來輸入手牌，台灣麻將 16 張可看聽牌、17 張可看打牌建議。']]
    case 'incomplete':
      return [line`目前 ${result.count} 張，再選 ${strong(1)} 張即可分析聽牌。`]
    case 'wait': {
      if (result.shanten === 0) {
        const lines = [line`${strong('已聽牌！')}聽 ${waitTiles(result.tiles)}，共剩 ${strong(result.total)} 張。`]
        if (result.total === 0) lines.push(['注意：聽的牌都在你手上，已經聽絕張，無法胡牌。'])
        else if (result.total <= 2) lines.push(['剩餘張數很少，摸到其他牌時可考慮換聽。'])
        return lines
      }
      return [
        line`目前${strong(shantenLabel(result.shanten))}，有效進張 ${result.tiles.length} 種 ${strong(result.total)} 張${avgWaitPart(result.avgWait)}。`,
      ]
    }
    case 'discard': {
      const lines: AdviceLine[] = []
      // 張數不足 17 時只是牌型湊齊，不算真的胡牌
      if (result.win && result.count === MAX_HAND) {
        lines.push([strong('🎉 已經胡牌了！'), '以下為若不胡、繼續打的分析。'])
      } else if (result.win) {
        lines.push([strong('牌型已完整'), '（全部組成面子與雀頭），以下為繼續打的分析。'])
      }
      const [best, ...rest] = result.options
      // 槓後不退進聽就該槓：多摸一張補牌，等於白賺一手
      const kong = result.kongs.find((k) => k.shanten <= best.shanten)
      if (kong && !result.win) {
        lines.push(line`建議先暗槓 ${{ tile: kong.tile }}：${describeKong(kong)}。`)
        lines.push(line`若不槓，則打 ${{ tile: best.tile }}：${describeOption(best)}。`)
        return lines
      }
      for (const k of result.kongs.filter((k) => k.shanten > best.shanten)) {
        lines.push(line`手上有 4 張 ${{ tile: k.tile }} 可暗槓，但槓後為${strong(shantenLabel(k.shanten))}，拆開使用較好。`)
      }
      const sameWait = (o: DiscardOption) => formatWait(o.avgWait ?? 0) === formatWait(best.avgWait ?? 0)
      const isTie = (o: DiscardOption) => o.shanten === best.shanten && o.total === best.total && sameWait(o)
      const ties = rest.filter(isTie)
      const names = tileParts([best, ...ties].map((o) => o.tile), ' 或 ')
      lines.push(line`建議打 ${names}：${describeOption(best)}。`)

      const next = rest.find((o) => !isTie(o))
      if (next) {
        if (next.shanten > best.shanten) {
          lines.push(line`若打 ${{ tile: next.tile }} 會退成${strong(shantenLabel(next.shanten))}。`)
        } else if (next.total < best.total) {
          lines.push(line`比次佳的打 ${{ tile: next.tile }} 多 ${strong(best.total - next.total)} 張有效牌。`)
        } else {
          const diff = formatWait((best.avgWait ?? 0) - (next.avgWait ?? 0))
          lines.push(line`與打 ${{ tile: next.tile }} 進張相同，但聽牌後平均多聽 ${strong(diff)} 張。`)
        }
      }

      // 一進聽時，進張最多不一定聽得最好：聽牌品質明顯較好的打法另外提出
      const pretty = result.options
        .filter((o) => o.shanten === best.shanten && o.avgWait !== undefined)
        .reduce<DiscardOption | undefined>((a, o) => (!a || o.avgWait! > a.avgWait! ? o : a), undefined)
      if (pretty && pretty !== best && pretty.avgWait! - best.avgWait! >= 1) {
        lines.push(
          line`若重視聽牌品質，可打 ${{ tile: pretty.tile }}：進張 ${strong(pretty.total)} 張（少 ${best.total - pretty.total} 張），但聽牌後平均聽 ${strong(formatWait(pretty.avgWait!))} 張。`,
        )
      }
      if (best.shanten === 0 && best.total <= 2) {
        lines.push(['不過聽牌張數偏少，若不急著聽牌，可考慮保留更好的聽口。'])
      }
      return lines
    }
  }
}
