// 34 種牌：0–8 萬、9–17 筒、18–26 條、27–33 東南西北中發白
export const TILE_KINDS = 34
export const MAX_PER_TILE = 4

export type Suit = 'man' | 'pin' | 'sou' | 'honor'

export type Counts = number[]

const NUM_CHARS = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
const SUIT_CHARS = ['萬', '筒', '條']
const HONOR_NAMES = ['東', '南', '西', '北', '中', '發', '白']

export function suitOf(id: number): Suit {
  if (id < 9) return 'man'
  if (id < 18) return 'pin'
  if (id < 27) return 'sou'
  return 'honor'
}

export function isHonor(id: number): boolean {
  return id >= 27
}

/** 數牌的點數 1–9；字牌回傳 0 */
export function rankOf(id: number): number {
  return isHonor(id) ? 0 : (id % 9) + 1
}

/** 完整名稱，例如「三萬」「東」 */
export function tileName(id: number): string {
  if (isHonor(id)) return HONOR_NAMES[id - 27]
  return NUM_CHARS[id % 9] + SUIT_CHARS[Math.floor(id / 9)]
}

/** 牌面顯示用：主字與花色字 */
export function tileFace(id: number): { main: string; sub: string } {
  if (isHonor(id)) return { main: HONOR_NAMES[id - 27], sub: '' }
  return { main: NUM_CHARS[id % 9], sub: SUIT_CHARS[Math.floor(id / 9)] }
}

export function emptyCounts(): Counts {
  return new Array(TILE_KINDS).fill(0)
}

export function totalTiles(counts: Counts): number {
  return counts.reduce((a, b) => a + b, 0)
}

/** 由 counts 展開成排序後的牌 id 陣列 */
export function countsToTiles(counts: Counts): number[] {
  const tiles: number[] = []
  counts.forEach((c, id) => {
    for (let i = 0; i < c; i++) tiles.push(id)
  })
  return tiles
}

/**
 * 解析簡寫字串，方便測試：例如 "123m456p789s1122z"
 * m=萬 p=筒 s=條 z=字（1–7 = 東南西北中發白）
 */
export function parseHand(text: string): Counts {
  const counts = emptyCounts()
  let pending: number[] = []
  for (const ch of text.replace(/\s/g, '')) {
    if (/[1-9]/.test(ch)) {
      pending.push(Number(ch))
      continue
    }
    const base = { m: 0, p: 9, s: 18, z: 27 }[ch]
    if (base === undefined) throw new Error(`無法解析的字元：${ch}`)
    for (const n of pending) {
      if (ch === 'z' && n > 7) throw new Error(`字牌只有 1–7：${n}`)
      counts[base + n - 1]++
    }
    pending = []
  }
  if (pending.length) throw new Error('結尾缺少花色字母')
  return counts
}
