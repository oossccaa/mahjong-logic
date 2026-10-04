// 筒、條的 SVG 牌面，座標系 30 × 40

const BLUE = '#1f5fa8'
const RED = '#c0392b'
const GREEN = '#1e7a3f'

type Dot = [x: number, y: number, r: number, color: string]

const B = BLUE
const R = RED
const G = GREEN

/** 一筒～九筒的圓圈位置 */
const PIN_LAYOUTS: Dot[][] = [
  [[15, 20, 11, R]],
  [[15, 11, 6, G], [15, 29, 6, B]],
  [[8, 9, 5, B], [15, 20, 5, R], [22, 31, 5, G]],
  [[9, 12, 5.5, B], [21, 12, 5.5, G], [9, 28, 5.5, G], [21, 28, 5.5, B]],
  [[8, 10, 5, B], [22, 10, 5, G], [15, 20, 5, R], [8, 30, 5, G], [22, 30, 5, B]],
  [[9, 8, 4.6, G], [21, 8, 4.6, G], [9, 21, 4.6, R], [21, 21, 4.6, R], [9, 32, 4.6, R], [21, 32, 4.6, R]],
  [[6, 6, 3.6, G], [15, 10, 3.6, G], [24, 14, 3.6, G], [9, 24, 4.2, R], [21, 24, 4.2, R], [9, 33, 4.2, R], [21, 33, 4.2, R]],
  [[9, 6.5, 4, B], [21, 6.5, 4, B], [9, 15.5, 4, B], [21, 15.5, 4, B], [9, 24.5, 4, B], [21, 24.5, 4, B], [9, 33.5, 4, B], [21, 33.5, 4, B]],
  [[7, 8, 3.9, B], [15, 8, 3.9, B], [23, 8, 3.9, B], [7, 20, 3.9, R], [15, 20, 3.9, R], [23, 20, 3.9, R], [7, 32, 3.9, G], [15, 32, 3.9, G], [23, 32, 3.9, G]],
]

function Circle({ dot: [x, y, r, color] }: { dot: Dot }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={r * 0.28} />
      <circle cx={x} cy={y} r={r * 0.42} fill={color} />
      {r > 8 && <circle cx={x} cy={y} r={r * 0.7} fill="none" stroke={GREEN} strokeWidth={0.8} />}
    </g>
  )
}

/** 竹子：中心點、高度、顏色、旋轉角度（順時針，度） */
type Stick = [x: number, y: number, h: number, color: string, angle?: number]

/** 二條～九條的竹子位置（中心點、高度） */
const SOU_LAYOUTS: Record<number, Stick[]> = {
  2: [[15, 11, 14, G], [15, 29, 14, G]],
  3: [[15, 11, 14, G], [9, 29, 14, G], [21, 29, 14, G]],
  4: [[9, 11, 14, G], [21, 11, 14, G], [9, 29, 14, G], [21, 29, 14, G]],
  5: [[7, 11, 14, G], [23, 11, 14, G], [15, 20, 14, R], [7, 29, 14, G], [23, 29, 14, G]],
  6: [[7, 11, 14, G], [15, 11, 14, G], [23, 11, 14, G], [7, 29, 14, R], [15, 29, 14, R], [23, 29, 14, R]],
  7: [[15, 7, 10, R], [7, 20, 10, G], [15, 20, 10, G], [23, 20, 10, G], [7, 32, 10, G], [15, 32, 10, G], [23, 32, 10, G]],
  // 八條：上半部倒過來的 M（中間兩根在上方靠攏），下半部 M（中間兩根在下方靠攏）
  8: [
    [4.5, 11, 16, G], [10.8, 11, 16, G, 25], [19.2, 11, 16, G, -25], [25.5, 11, 16, G],
    [4.5, 29, 16, G], [10.8, 29, 16, G, -25], [19.2, 29, 16, G, 25], [25.5, 29, 16, G],
  ],
  9: [[7, 8, 10, G], [15, 8, 10, R], [23, 8, 10, G], [7, 20, 10, G], [15, 20, 10, R], [23, 20, 10, G], [7, 32, 10, G], [15, 32, 10, R], [23, 32, 10, G]],
}

function Bamboo({ stick: [x, y, h, color, angle = 0], width = 4 }: { stick: Stick; width?: number }) {
  const top = y - h / 2
  return (
    <g transform={angle ? `rotate(${angle} ${x} ${y})` : undefined}>
      <rect x={x - width / 2} y={top} width={width} height={h} rx={width / 2} fill={color} />
      <line x1={x - width / 2} x2={x + width / 2} y1={y} y2={y} stroke="#fff" strokeWidth={0.8} />
      <line x1={x} x2={x} y1={top + 1.5} y2={top + h - 1.5} stroke="#fff" strokeOpacity={0.35} strokeWidth={0.6} />
    </g>
  )
}

/** 一條：簡化的小鳥 */
function Bird() {
  return (
    <g>
      <path d="M8 30 Q4 36 3 38 Q9 35 12 31 Z" fill={GREEN} />
      <path d="M10 33 Q9 38 10 39 Q13 35 14 31 Z" fill={RED} />
      <ellipse cx={15} cy={24} rx={8} ry={10} fill={GREEN} />
      <path d="M11 22 Q15 30 20 22 Q16 27 11 22 Z" fill="#7fc79a" />
      <circle cx={19} cy={11} r={5} fill={GREEN} />
      <circle cx={20.5} cy={10} r={1.3} fill="#fff" />
      <circle cx={20.8} cy={10} r={0.6} fill="#111" />
      <path d="M23.5 11 L28 12.5 L23.5 13.5 Z" fill={RED} />
      <path d="M17 6 Q18 2 21 3 Q19 4 19 7 Z" fill={RED} />
    </g>
  )
}

export function TileArt({ id }: { id: number }) {
  const rank = (id % 9) + 1
  const isPin = id >= 9 && id < 18
  return (
    <svg className="tile-art" viewBox="0 0 30 40" aria-hidden="true">
      {isPin
        ? PIN_LAYOUTS[rank - 1].map((d, i) => <Circle key={i} dot={d} />)
        : rank === 1
          ? <Bird />
          : SOU_LAYOUTS[rank].map((s, i) => <Bamboo key={i} stick={s} width={rank === 8 ? 3.6 : 4} />)}
    </svg>
  )
}
