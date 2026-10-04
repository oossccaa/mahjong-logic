# 麻將分析

台灣麻將（16 張）手牌分析工具。點選牌輸入手牌，即時算出進聽數、有效進張與打牌建議。

## 功能

- **16 張（等牌）**：顯示目前是幾進聽；聽牌時列出聽哪些牌、還剩幾張。
- **17 張（摸牌後）**：分析每一張可打的牌，建議打哪張最有利，並和次佳選擇比較。
- 剩餘張數會扣掉自己手上的牌，聽絕張時會提醒。
- 支援手機操作。

> 目前只計算一般牌型（5 組面子 + 1 對），不含七對子等特殊牌型；剩餘張數不計入牌河與副露。

## 開發

需要 Node.js 20 以上。

```bash
npm install
npm run dev      # 啟動開發伺服器
npm test         # 執行單元測試
npm run build    # 型別檢查並打包到 dist/
npm run preview  # 預覽打包結果
```

## 技術

React 19、TypeScript、Vite、Vitest。純前端，無後端。

```
src/
  core/        分析邏輯（牌的編碼、進聽數計算、打牌建議）
  components/  UI 元件
  App.tsx
```

## 部署

部署於 [Vercel](https://vercel.com)：

1. 在 Vercel 匯入此 GitHub repo。
2. Framework Preset 選 **Vite**（通常會自動偵測）。
3. Build Command：`npm run build`，Output Directory：`dist`。
4. 之後推送到 `main` 即自動部署。
