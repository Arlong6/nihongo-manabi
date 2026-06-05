# Apple Search Ads NT$1000 一個月試水 SOP

**目標**：用 NT$30/天 試水「日語學習」這個 niche，預期月底拿到 50-200 個下載，CPI 大概 NT$15-30。

**選哪種**：**Search Ads Advanced**（不是 Basic）。Basic 只能跑「我給你預算 Apple 幫你跑」黑箱，學不到任何 insight。Advanced 才能挑關鍵字、調出價、看數據。

---

## Step 1 — 開帳號（10 分鐘）

1. 開 https://searchads.apple.com
2. 用你的 **App Store Connect 同一個 Apple ID** 登入
3. 選 **Advanced** 版本
4. 國家/地區帳號選 **Taiwan**（這次只投台灣，CPI 最低）
5. 信用卡資訊填一張 — Apple Search Ads 是後付，月底結算

## Step 2 — 建 Campaign（10 分鐘）

1. **Create Campaign** → 選 Nihongo Manabi App
2. **Campaign Group** name: `Nihongo Manabi - TW Test`
3. **Campaign** name: `JP Learning - High Intent Keywords`
4. **Storefronts** 勾 **Taiwan**
5. **Daily Cap**: **NT$50** （留 buffer，月底大概燒 NT$1000-1500）
6. **Negative Keywords**：先空著

## Step 3 — Ad Group（最重要的一步）

1. **Ad Group name**: `Core Japanese Learning - Exact Match`
2. **Default Max CPT Bid**: **NT$10**（先低一點，跑兩天看 CPI 再調）
3. **Audience**：
   - All Users（先不分新舊）
4. **Search Match**: **OFF**（Search Match = Apple 自動配對，先關掉自己挑）

## Step 4 — Keywords（最關鍵）

**Exact Match** 模式加這幾個（按優先順序）：

```
學日文
日語學習
日本語学習
JLPT
N5
N4
N3
日文 app
學日語
日文家教
AI 學日文
日文對話
動漫日文
旅遊日文
五十音
平假名
片假名
```

**Broad Match** 加這幾個（流量大但雜，跑一週再決定要不要關）：

```
日文
日語
日本語
日文學習
```

跳過：`日文翻譯` / `中翻日`（這是工具型，搜的人不會買學習 app）

## Step 5 — Creative Set

如果你有 3 種以上不同視覺風格的截圖組，可以 A/B 測。沒有就用 ASC 上預設那組就行，跳過此步。

## Step 6 — Submit + 監控

按 **Save**，廣告 24 小時內開始跑。

**每天看**：
- Total spend（不超預算）
- Impressions（曝光）
- Taps（點擊）
- Conversions（下載）
- CPI（總花費 ÷ 下載數）

---

## 觀察期 (前 7 天) — 你要看的數字

| 指標 | 健康範圍 | 不健康時的動作 |
|---|---|---|
| 整體 CPI | < NT$30 | 砍掉 CPI > NT$50 的關鍵字 |
| TTR (tap-through rate) | > 3% | 截圖不夠抓人，或關鍵字相關度低 |
| CR (conversion rate) | > 30% | 截圖跟文案沒講清楚產品 |
| 每天花費 | 接近 NT$30 | 沒花完表示 bid 太低或關鍵字流量小 |

---

## 7 天後優化

1. **CPI > NT$50 的關鍵字** → 砍掉
2. **CPI < NT$15 但點擊量大的關鍵字** → 調高 bid（搶量）
3. **Broad Match 跑了一週還是亂打** → 改成 Exact + 加 negative keywords
4. **整體 CPI 健康** → 月底拉預算到 NT$50/天再撐一個月，建 LTV 數據

---

## 一個月底我們要看的關鍵問題

- 真實 CPI 多少？（決定能不能擴大規模）
- 哪個關鍵字 ROAS 最好？（重壓那個）
- 下載後幾天內 conversion to Pro？（決定 LTV 跟 CPI 上限）

第 28 天我幫你做一份 ASA 績效分析（從 Search Ads Dashboard export CSV 給我即可）。
