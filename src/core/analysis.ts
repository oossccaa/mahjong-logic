import { calcShanten } from './shanten'
import { type Counts, MAX_PER_TILE, TILE_KINDS, tileName, totalTiles } from './tiles'

export const MAX_HAND = 17

export interface TileCount {
  tile: number
  /** 尚未現身（不在自己手上）的張數 */
  remaining: number
}

export interface DiscardOption {
  tile: number
  /** 打出後的進聽數，0 = 聽牌 */
  shanten: number
  /** 聽牌時為聽的牌，否則為有效進張 */
  tiles: TileCount[]
  total: number
}

export type HandAnalysis =
  | { kind: 'empty' }
  /** 張數為 3n，無法分析，需再補牌 */
  | { kind: 'incomplete'; count: number }
  /** 3n+1 張：等牌 */
  | { kind: 'wait'; shanten: number; tiles: TileCount[]; total: number }
  /** 3n+2 張：該打牌 */
  | { kind: 'discard'; count: number; win: boolean; options: DiscardOption[] }

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

export function analyzeHand(input: Counts): HandAnalysis {
  const counts = input.slice()
  const n = totalTiles(counts)
  if (n === 0) return { kind: 'empty' }

  if (n % 3 === 0) return { kind: 'incomplete', count: n }

  if (n % 3 === 1) {
    const shanten = calcShanten(counts)
    const tiles = effectiveTiles(counts, shanten, input)
    return { kind: 'wait', shanten, tiles, total: sumRemaining(tiles) }
  }

  const win = calcShanten(counts) === -1
  const options: DiscardOption[] = []
  for (let t = 0; t < TILE_KINDS; t++) {
    if (counts[t] === 0) continue
    counts[t]--
    const shanten = calcShanten(counts)
    const tiles = effectiveTiles(counts, shanten, input)
    counts[t]++
    options.push({ tile: t, shanten, tiles, total: sumRemaining(tiles) })
  }
  options.sort(
    (a, b) =>
      a.shanten - b.shanten ||
      b.total - a.total ||
      b.tiles.length - a.tiles.length ||
      a.tile - b.tile,
  )
  return { kind: 'discard', count: n, win, options }
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

function describeOption(o: DiscardOption): AdviceLine {
  if (o.shanten === 0) return line`打後聽 ${waitTiles(o.tiles)}，共 ${strong(o.total)} 張`
  return line`打後${strong(shantenLabel(o.shanten))}，有效進張 ${o.tiles.length} 種 ${strong(o.total)} 張`
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
        line`目前${strong(shantenLabel(result.shanten))}，有效進張 ${result.tiles.length} 種 ${strong(result.total)} 張。`,
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
      const ties = rest.filter((o) => o.shanten === best.shanten && o.total === best.total)
      const names = tileParts([best, ...ties].map((o) => o.tile), ' 或 ')
      lines.push(line`建議打 ${names}：${describeOption(best)}。`)

      const next = rest.find((o) => o.shanten !== best.shanten || o.total !== best.total)
      if (next) {
        if (next.shanten > best.shanten) {
          lines.push(line`若打 ${{ tile: next.tile }} 會退成${strong(shantenLabel(next.shanten))}。`)
        } else {
          lines.push(line`比次佳的打 ${{ tile: next.tile }} 多 ${strong(best.total - next.total)} 張有效牌。`)
        }
      }
      if (best.shanten === 0 && best.total <= 2) {
        lines.push(['不過聽牌張數偏少，若不急著聽牌，可考慮保留更好的聽口。'])
      }
      return lines
    }
  }
}
