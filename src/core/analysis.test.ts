import { describe, expect, it } from 'vitest'
import { adviceToText, analyzeHand, buildAdvice } from './analysis'
import { calcShanten, isWin } from './shanten'
import { parseHand, tileName } from './tiles'

const names = (tiles: { tile: number }[]) => tiles.map((t) => tileName(t.tile))

describe('calcShanten / isWin', () => {
  it('17 張 5 面子 + 1 對 為胡牌', () => {
    const h = parseHand('123m456m789m123p456p11z')
    expect(isWin(h)).toBe(true)
    expect(calcShanten(h)).toBe(-1)
  })

  it('字牌不能組順子', () => {
    const h = parseHand('123m456m789m123p11p123z')
    expect(isWin(h)).toBe(false)
  })

  it('16 張聽牌為 0 進聽', () => {
    expect(calcShanten(parseHand('123m456m789m123p456p1z'))).toBe(0)
  })

  it('一進聽與二進聽', () => {
    expect(calcShanten(parseHand('123m456m789m123p45p1z9s'))).toBe(1)
    expect(calcShanten(parseHand('123m456m789m13p5p11z9s'))).toBe(2)
  })
})

describe('聽牌分析（16 張）', () => {
  it('單吊', () => {
    const r = analyzeHand(parseHand('123m456m789m123p456p1z'))
    expect(r.kind).toBe('wait')
    if (r.kind !== 'wait') return
    expect(names(r.tiles)).toEqual(['東'])
    expect(r.total).toBe(3)
  })

  it('兩面', () => {
    const r = analyzeHand(parseHand('123m456m789m123p11z45s'))
    if (r.kind !== 'wait') throw new Error()
    expect(names(r.tiles)).toEqual(['三條', '六條'])
    expect(r.total).toBe(8)
  })

  it('嵌張 / 邊張 / 對碰', () => {
    const kan = analyzeHand(parseHand('123m456m789m123p11z46s'))
    if (kan.kind !== 'wait') throw new Error()
    expect(names(kan.tiles)).toEqual(['五條'])

    const pen = analyzeHand(parseHand('123m456m789m123p11z12s'))
    if (pen.kind !== 'wait') throw new Error()
    expect(names(pen.tiles)).toEqual(['三條'])

    const shanpon = analyzeHand(parseHand('123m456m789m123p11z55s'))
    if (shanpon.kind !== 'wait') throw new Error()
    expect(names(shanpon.tiles)).toEqual(['五條', '東'])
    expect(shanpon.total).toBe(4)
  })

  it('九蓮寶燈型聽九面', () => {
    const r = analyzeHand(parseHand('1112345678999m123p'))
    if (r.kind !== 'wait') throw new Error()
    expect(r.tiles.map((t) => t.tile)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('手上已有 4 張的牌不會算進聽牌', () => {
    // 1111m 234m … 聽 1m 不可能
    const r = analyzeHand(parseHand('1111m234m456p789p11z5s'))
    if (r.kind !== 'wait') throw new Error()
    expect(r.tiles.map((t) => t.tile)).not.toContain(0)
  })
})

describe('打牌建議（17 張）', () => {
  it('打孤張字牌最好', () => {
    const r = analyzeHand(parseHand('123m456m789m123p45s11z7z'))
    if (r.kind !== 'discard') throw new Error()
    expect(r.win).toBe(false)
    const best = r.options[0]
    expect(tileName(best.tile)).toBe('白')
    expect(best.shanten).toBe(0)
    expect(names(best.tiles)).toEqual(['三條', '六條'])
  })

  it('兩面優於嵌張', () => {
    // 打 9s 留 45s 兩面（8 張） vs 打 4s/5s 剩單騎
    const r = analyzeHand(parseHand('123m456m789m123p11z459s'))
    if (r.kind !== 'discard') throw new Error()
    expect(tileName(r.options[0].tile)).toBe('九條')
    expect(r.options[0].total).toBe(8)
  })

  it('胡牌時標示 win', () => {
    const r = analyzeHand(parseHand('123m456m789m123p456p11z'))
    if (r.kind !== 'discard') throw new Error()
    expect(r.win).toBe(true)
    expect(adviceToText(buildAdvice(r)[0])).toContain('胡牌')
  })

  it('張數不足 17 時牌型完整不說胡牌', () => {
    for (const h of ['11m', '123m11z']) {
      const r = analyzeHand(parseHand(h))
      if (r.kind !== 'discard') throw new Error()
      expect(r.win).toBe(true)
      const text = adviceToText(buildAdvice(r)[0])
      expect(text).not.toContain('胡牌')
      expect(text).toContain('牌型已完整')
    }
  })

  it('建議文字含牌名片段', () => {
    const r = analyzeHand(parseHand('123m456m789m123p45s11z7z'))
    const [first] = buildAdvice(r)
    expect(first).toContainEqual({ tile: 33 })
    expect(adviceToText(first)).toBe('建議打 白：打後聽 三條、六條，共 8 張。')
  })

  it('15 張提示再補牌', () => {
    const r = analyzeHand(parseHand('123m456m789m123p456p'))
    expect(r.kind).toBe('incomplete')
  })
})
