# Nihongo Manabi 每日學習系統設計（系統大進化）

日期：2026-10-12
狀態：待 arlong 審閱
範圍：App（Expo 55 / RN 0.83）＋ server/（Vercel + Upstash）

## 1. 目標與現況

### 目標（依優先序）
1. **留存**：用戶每天回來。成功指標是 PostHog 的 D7、D30 留存，上線前先量基準。
2. 新用戶：本 spec 不做成長功能，只讓留存的地基先立起來。
3. 營收：不動付費牆，只靠 Pro 審過後自然轉換。連勝凍結是唯一新增的 Pro 權益。

### 現況（2026-10-12）
- 近 28 天活躍用戶 30、新用戶 23、營收 0。Pro 訂閱仍在審核。
- App 有 14 個畫面、6 個 Tab，功能彼此獨立，沒有「今天該學什麼」的主線。
- 內容全靜態：約 900 單字（主題 235 ＋ JLPT 660）、177 條文法、18 句短句。
- 沒有帳號、沒有雲端同步、App 內沒有 analytics。
- 每日提醒預設關且藏在「進度」頁；21:30 連勝提醒每天固定發；沒有流失召回；通知文案寫死中文。

### 不做（YAGNI）
- 帳號與雲端同步。
- 落地頁、推薦分享、ASO 迭代。
- JLPT 模考流程重寫（只改 Pro 判斷寫法）。
- 文章往期歸檔（之後可當 Pro 賣點）。
- Server 端額度驗證（與留存無關，另案）。

## 2. 分期

| 階段 | 內容 | 發布方式 |
|---|---|---|
| 一 | 每日主線、提醒與連勝凍結、analytics、測驗引擎共用化 | 原生 build，1.7.0 (build 17)，等 1.6.1 過審後送 |
| 二 | 每日文章（server 產線＋App 文章頁） | server 直接部署；App 端純 JS 走 EAS Update |

兩階段獨立量測：階段一上線後先看 D7 是否移動，階段二再疊上去。

## 3. 階段一：每日主線

### 3.1 「今天」頁（取代 HomeScreen 內容，Tab 位置不變）
- 大按鈕「開始今日課程」。已完成時改成「今天完成了」＋成績摘要，下方「再練一組」入口。
- 連勝數＋凍結張數。
- 到期複習數，大於 0 時以紅字顯示並標示「快忘了」。
- 階段二的文章卡（階段一先不渲染）。
- 保留現有每日推薦單字與 TourGuide。

### 3.2 課程組題 `lib/lesson.ts`
純函式 `composeLesson(progress, level, pool): LessonItem[]`，可單元測試。

- 題數 10，順序固定：
  1. SRS 到期複習，最多 5 題（`getDueCards` 依到期日排序，取最早的）。
  2. 當前級別新單字 3 題（`learnedIds` 以外，依資料順序取前 3 個，確保可重現）。
  3. 文法 1 題（當前級別，優先取 `loadGrammarStats` 中答錯率高的）。
  4. 漢字讀音或聽力 1 題，二擇一輪替（依當天日期奇偶）。
- 不足時依序補位：到期不足 5 題，用新單字補到 10 題；新單字也用完（該級別全學完），用已學單字的隨機複習補。
- 級別池：`level` 為 N5..N1 時取對應 JLPT 單字＋主題單字（主題單字視為 N5 池的一部分）。onboarding 目前存的是 `beginner | n5 | n4`，由 `getUserLevel()` 映射：beginner、n5 → N5，n4 → N4；onboarding 三個選項不動，N3 以上只能在設定頁選。

### 3.3 課程流程 `screens/LessonScreen.tsx`（新畫面，Stack）
- 逐題作答，沿用現有單字卡／選擇題元件。
- 結束畫面：正確率、新學單字、複習單字、連勝變化、新勳章。
- 完成時呼叫 `recordDailyActivity`，當天即打卡。單字 SRS 評分沿用 `updateSRSCard`。
- 第一次完成課程時觸發通知權限請求（見 4.1）。

### 3.4 級別推進
- 級別存於 `user_level`（現由 OnboardingScreen 直接寫 AsyncStorage），改成 `lib/storage.ts` 的 `getUserLevel / setUserLevel`，Onboarding 與 Progress 設定頁共用。
- 當前級別池已學比例達 80% 時，成績頁建議升級，用戶可接受或忽略，忽略後 7 天內不再提示（存 `level_prompt_dismissed_until`）。

### 3.5 測驗引擎共用化 `lib/quiz/`
- `shuffle.ts`：唯一的洗牌函式，取代 6 份複製。
- `options.ts`：選擇題干擾項生成（單字中譯、漢字讀音、文法填空）。
- `generators.ts`：`vocabQuestion / kanjiQuestion / grammarQuestion / listeningQuestion`，輸入資料池與已學狀態，輸出統一的 `QuizQuestion`。
- Katakana、Kanji、Listening、Grammar、Phrases 畫面改吃 `lib/quiz/`，行為不變。JLPTScreen 只改成吃 `shuffle.ts`，其餘不動。

### 3.6 Pro 狀態 `lib/pro.tsx`
- `ProProvider`（App 根節點）＋ `usePro()`，內部仍呼叫 `isPro()`，並訂閱 RevenueCat `addCustomerInfoUpdateListener`。
- CameraScreen、AIConversationScreen、JLPTScreen、ProgressScreen 改用 `usePro()`。超量導向 Paywall 的行為不變。

## 4. 階段一：提醒、連勝、analytics

### 4.1 通知權限時機
- 第一次課程成績頁彈出自訂對話「明天 HH:MM 提醒你？」，HH:MM 取當下時間四捨五入到整點或半點。按「好」才呼叫系統權限。
- 同意後 `scheduleDaily(hour, minute)` 並把「進度」頁開關同步為開。拒絕後不再主動問，仍可在「進度」頁手動開。

### 4.2 連勝風險通知（條件式）
- 21:30 通知改為：每次 App 進前景時，若當天已打卡則取消該則；未打卡則確保已排程。
- 實作：`lib/notifications.ts` 新增 `syncStreakRiskNotification(progress)`，在 `App.tsx` 的 AppState 變化與課程完成時呼叫。使用固定 identifier 以便取消。

### 4.3 流失召回序列
- 每次打卡完成時：取消舊的三則，重排 D+1、D+3、D+7 三則本地通知（固定 identifier `lapse-1/3/7`），時間取用戶的提醒時間，未設定時用 19:00。
- 文案（i18n）：D+1「你有 N 個單字快忘了，3 分鐘複習一下」；D+3「連勝停在 S 天，今天重新開始只要 3 分鐘」；D+7「我們幫你把 N5 的進度留著了」。N 取排程當下的到期數估算（`srsCards` 中 `nextReview` 落在未來 1/3/7 天內的數量）。
- 若用戶從未同意通知，這些排程不會送達，但排程本身無害。

### 4.4 連勝凍結
- `UserProgress` 新增 `streakFreezes: number`（預設 0，舊資料視為 0）。
- 賺取：`updateStreak` 中連勝達到 7 的倍數時 `streakFreezes = min(streakFreezes + 1, 2)`。
- 使用：`updateStreak` 判斷 `lastStudyDate` 為前天（斷了一天）時，若 `streakFreezes > 0` 或 `isPro`，視為連續，扣 1 張（Pro 不扣），回傳 `freezeUsed: true`；斷超過一天一律歸零。
- 與舊資料相容：現有的 legacy 寬鬆比對（`dateSchema !== 'local'` 時前天也算連續）優先於凍結判斷，該路徑不扣凍結。
- `updateStreak` 簽名加入 `opts: { isPro: boolean }`，由呼叫端傳入，保持純函式可測。
- 首頁在 `freezeUsed` 當天顯示「昨天用了一張凍結，連勝保住了」。

### 4.5 通知文案 i18n
- `lib/notifications.ts` 所有 title/body 改走 `i18n.t`，三語補齊。

### 4.6 Analytics `lib/analytics.ts`
- SDK：`posthog-react-native`（免費 100 萬事件/月）。key 放 `EXPO_PUBLIC_POSTHOG_KEY`，host 用 EU 或 US 預設。
- 封裝 `track(event, props)`，SDK 未初始化或無 key 時靜默。
- 事件清單（固定命名，不再加）：

| 事件 | 屬性 |
|---|---|
| app_open | |
| onboarding_complete | level |
| lesson_start | level, due_count |
| lesson_complete | level, correct, total, duration_s |
| notif_permission | granted |
| streak_lost | streak_before |
| streak_freeze_used | remaining |
| paywall_view | source |
| purchase | product_id |
| article_open | level, kind |
| article_complete | level, correct |
| level_up_prompt | level, accepted |

- 用戶識別：PostHog 匿名 distinct_id，同時 `identify` 帶 RevenueCat `appUserID` 當屬性，方便對照付費。
- 隱私：App Store 隱私標籤要補「產品互動資料，未與身分連結」，1.7.0 送審前 arlong 在 ASC 手動改。

## 5. 階段二：每日文章

### 5.1 產線 `server/api/cron/article.ts`
- Vercel cron 每天 19:00 UTC（台灣 03:00）觸發，`vercel.json` 加 `crons`，用 `CRON_SECRET` 驗證。
- 五個級別各一篇：
  - N5、N4：`kind: 'story'`，生活小故事或文化小知識，題材由固定清單輪替（避免重複）。
  - N3、N2、N1：`kind: 'news'`，Gemini 2.5 Flash 開 Google Search grounding，取得當天日本新聞 3 則標題，選 1 則改寫成指定級別短文。不抓任何新聞網站內容。
- 輸出 JSON 結構（Zod 驗證）：

```
{
  date: 'YYYY-MM-DD', level: 'N5'..'N1', kind: 'story'|'news',
  title: string,
  body: Paragraph[]            // Paragraph = Segment[]；Segment = { text: string, reading?: string }
                               // reading 為該詞段的假名，純假名或標點的詞段省略
  vocab: [{ word, reading, meaning_zh, meaning_en, meaning_ko }]  // 5–8 個
  questions: [{ q, options: string[4], answer: number }]  // 2 題
  source_hint?: string  // news 時記標題來源，不含內文
}
```

- 審稿：第二次呼叫讓模型檢查「級別是否相符、文法是否正確、JSON 是否符合結構」，回 `pass: boolean, issues: string[]`。不過就重生一次；再不過，news 退回 story 模式生成；story 也失敗就不寫入，當天沿用前一天（見 5.3）。
- 寫入 Upstash：`article:{date}:{level}`，TTL 30 天；`article:latest:{level}` 指向最新日期。
- 每次 cron 結果 Telegram 通知（沿用 reels 的 bot），失敗時含 issues。

### 5.2 讀取 `server/api/article.ts`
- `GET /api/article?level=N4`，先讀 `article:latest:{level}`，再讀該日內容。回 JSON，`Cache-Control: s-maxage=3600`。
- 查無資料回 204。

### 5.3 App 文章頁 `screens/ArticleScreen.tsx`
- 「今天」頁文章卡顯示標題與級別，點進文章頁。
- 正文以 ruby 顯示假名，點單字彈出 `vocab` 解釋（當前語系）。
- 兩題答完顯示結果並呼叫 `recordDailyActivity(0, 0, 0, 0)` 打卡（不計單字數）。
- 快取：最後一篇存 AsyncStorage `article_cache:{level}`，離線或 204 時顯示快取並標示日期；完全沒有時顯示「今天的文章準備中」，不影響主線。
- 免費與 Pro 都能看當天的。

## 6. 錯誤處理

| 情境 | 行為 |
|---|---|
| 課程組題池不足 | 依 3.2 補位規則，最少 1 題即可開始 |
| 通知權限被拒 | 不再主動問，設定頁可開，召回排程仍排但不送達 |
| RevenueCat 離線 | `usePro()` 沿用最後已知值，預設 false |
| PostHog 無 key | 所有 track 靜默 |
| 文章生成失敗 | 沿用前一天；無前一天顯示準備中；Telegram 告警 |
| Gemini grounding 無結果 | news 退回 story 模式 |

## 7. 測試

- `__tests__/lesson.test.ts`：組題順序、補位規則、級別池、可重現性。
- `__tests__/streak-freeze.test.ts`：賺取上限 2、斷一天用凍結、Pro 不扣、斷兩天歸零、舊資料預設 0。
- `__tests__/notifications.test.ts`：召回排程的時間與文案參數、風險通知條件式取消（mock expo-notifications）。
- `__tests__/quiz.test.ts`：各 generator 的選項不重複、含正解。
- `server/__tests__/article.test.ts`：Zod 結構驗證、審稿不過的退回路徑（mock Gemini）。
- UI：模擬器截圖驗收「今天」頁、課程流程、成績頁、文章頁，三語各一輪。

## 8. 發布與量測

1. 階段一完成後 EAS production build 1.7.0 (build 17)，送審。送審前 arlong 在 ASC 更新隱私標籤。
2. 上線兩週看 PostHog D7；四週看 D30。PostHog SDK 需原生依賴，無法用 EAS Update 提前裝進 1.6.x，所以沒有改版前的基準，接受這個限制：以 1.7.0 上線後第一批用戶的 D7 當基準，階段二上線後再比較。
3. 階段二 server 部署後，App 端以 EAS Update 推送，不另送審。

## 9. 待 arlong 決定或動手
- PostHog 帳號建立並提供 project key。
- 1.7.0 送審前更新 App Store 隱私標籤。
- 文章的新聞改寫法律邊界，若有疑慮可只上 story 模式。
