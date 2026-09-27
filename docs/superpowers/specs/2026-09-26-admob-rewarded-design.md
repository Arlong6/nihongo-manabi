# Nihongo Manabi 激勵影片廣告（AdMob）— 設計

日期：2026-09-26　版本：1.6.0 / build 15

## 目標
免費用戶在 AI 對話、拍照翻譯的每日 3 次額度用完時，可自行選擇看一支激勵影片多換 1 次（每功能每天最多 3 次）。
目的是 Pro 漏斗，不是廣告收入；不做橫幅、不做插頁。Pro 用戶不會看到任何廣告，也不會初始化 SDK、不會被問 ATT。

## 元件
| 檔案 | 責任 |
|---|---|
| `lib/ads.ts` | `require` 防呆載入 react-native-google-mobile-ads；`initAds()`（isPro 略過 → ATT → UMP → initialize，內容分級 PG）；`showRewarded()` 回傳是否拿到獎勵，任何失敗回 false。 |
| `lib/storage.ts` | 每日用量結構 `{date, count, bonus}`；`grantAIChatBonus / grantCameraBonus`（上限 `DAILY_BONUS_CAP = 3`）；`isUsageExhausted / usageRemaining / canGrantBonus`；日期改本地時區 `toLocalDateString`；`updateStreak` 對舊 UTC 資料做一次性寬鬆比對（`dateSchema`）。 |
| `screens/AIConversationScreen.tsx` | 額度橫幅加「看廣告多 1 次」按鈕（額度用完的 Alert 原本點不到，卡片是 disabled）。 |
| `screens/CameraScreen.tsx` | 額度用完 Alert 加第三顆「看廣告多 1 次」，成功後重跑 OCR；Alert 字串改走 i18n。 |
| `App.tsx` | onboarding 完成後 `initAds()`。 |
| `app.json` | plugin `react-native-google-mobile-ads`（iosAppId、userTrackingUsageDescription、50 筆 skAdNetworkItems）；`expo-tracking-transparency`。 |
| `server/api/app-ads.ts` + `vercel.json` | `/app-ads.txt`。`api/privacy.ts` 加廣告段落。 |
| `locales/*.json` | 新增 `ads.*`、`camera.*`。 |

## 決策
- 套件鎖 `17.0.0`（17.1+ 要 RN 0.86）；正式 unit ID 走 `EXPO_PUBLIC_ADMOB_REWARDED_ID`，未設用官方測試 ID；App ID 寫死在 app.json（build 時決定）。
- `NSUserTrackingUsageDescription` 只由 google-mobile-ads plugin 寫入，expo-tracking-transparency 的 plugin 不重複設。
- 原生依賴變動：必須 EAS build + 送審，不能 OTA；runtimeVersion 走 appVersion，所以 bump 到 1.6.0 後舊 binary 不會收到這版 JS。
- 「今天」改本地時間是順便修的既有問題（原本 UTC，台灣早上 8 點才換日）。

## 驗證
- `npm test`：`__tests__/storage-quota.test.ts`（額度、bonus 上限、跨日、舊格式、連勝遷移）與 i18n 三語 key 一致。
- 模擬器 Release build：啟動不 crash、ATT 對話框出現、額度用完時出現「看廣告多 1 次」、看完測試影片後額度 +1。
