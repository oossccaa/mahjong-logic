# CLAUDE.md

台灣麻將（16 張）手牌分析工具：輸入手牌，算出進聽數、有效進張、聽牌與打牌建議。純前端，部署於 Vercel。

## 用詞與語言

- 一律使用繁體中文（程式註解、UI 文字、文件）。
- 使用台灣用語：「進聽」而非「向聽」；0 進聽 = 聽牌，-1 = 胡牌。
- 牌名：萬、筒、條；字牌為東南西北中發白。

## 指令

```bash
npm run dev      # 開發伺服器
npm test         # vitest 單元測試
npm run build    # tsc 型別檢查 + vite build，輸出至 dist/
npm run preview  # 預覽 build 結果
```

修改 `src/core/` 後務必跑 `npm test`；送出前跑 `npm run build` 確認型別檢查通過（Vercel 也是跑這個）。

## 技術棧

React 19 + TypeScript + Vite，測試用 Vitest。無後端、無路由、無狀態管理套件。流量統計用 `@vercel/analytics`（`main.tsx` 的 `<Analytics />`，需在 Vercel 專案啟用 Web Analytics）。

## 架構

```
src/
  core/          純邏輯，不依賴 React，皆可單元測試
    tiles.ts       牌的編碼、名稱、parseHand 簡寫解析
    shanten.ts     進聽數計算（calcShanten / isWin）
    analysis.ts    手牌分析（analyzeHand）與建議文字（buildAdvice）
    analysis.test.ts
  components/    UI 元件
    HandBar        目前手牌，點擊移除
    TilePicker     選牌面板，點擊加入
    AnalysisPanel  顯示分析結果與建議
    Tile / TileArt 牌面繪製
  App.tsx        持有手牌（依點選順序的 id 陣列）與「理牌」開關，useMemo 轉 counts 呼叫 analyzeHand
```

### 核心資料模型

- 牌以 0–33 的 id 表示：0–8 萬、9–17 筒、18–26 條、27–33 東南西北中發白。
- 手牌以 `Counts`（長度 34 的陣列，每格為該牌張數）表示，每種最多 4 張，手牌最多 17 張（`MAX_HAND`）。
- 測試用簡寫：`parseHand('123m456p789s1122z')`，m=萬 p=筒 s=條 z=字（1–7 = 東南西北中發白）。

### 分析邏輯

- `calcShanten`：一般型（m 組面子 + 1 雀頭，m = floor(張數/3)）。逐花色列舉拆法並以剩餘牌型記憶化，再做 Pareto 篩選後組合。字牌不能組順子或兩面/嵌張搭子。不處理七對子、十三么等特殊牌型。
- `analyzeHand` 依張數分流：
  - 3n 張 → `incomplete`（需再補牌）
  - 3n+1 張 → `wait`：進聽數與有效進張（聽牌時即聽的牌）
  - 3n+2 張 → `discard`：每張可打的牌各自的進聽數與進張，依進聽數、剩餘張數排序；手上有 4 張的牌另列 `kongs`（暗槓後剩餘牌的進聽數與補牌進張），槓後不退進聽時建議先槓
- 一進聽時另算聽牌品質：每張有效進張摸進後，找出聽最多張的打法，記在 `TileCount.wait`；依進張剩餘張數加權平均為 `avgWait`。排序時在進張張數之後比較，進張較少但平均多聽 1 張以上的打法另列一行建議。
- 剩餘張數只扣除自己手上的牌（未考慮牌河、副露）。
- `buildAdvice` 回傳 `AdviceLine[]`，片段可為字串、`{ tile }`（UI 以花色顏色顯示）或 `{ strong }`；`adviceToText` 可轉純文字供測試。

## 慣例

- 邏輯放在 `src/core/`，元件只負責顯示與互動。
- 新增或修改分析邏輯時，在 `analysis.test.ts` 用 `parseHand` 簡寫補測試。
- TypeScript strict，開啟 `noUnusedLocals` / `noUnusedParameters`。

## 部署（Vercel）

- Framework Preset：Vite（自動偵測）
- Build Command：`npm run build`
- Output Directory：`dist`
- 推到 `main` 會自動部署 production，其他分支產生 preview。
