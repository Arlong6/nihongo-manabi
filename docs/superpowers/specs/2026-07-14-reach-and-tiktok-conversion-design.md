# 觸及時段 + TikTok 轉換路徑（方案 A）

日期：2026-07-14
狀態：arlong 已核可方案 A

## 背景

- 兩平台目前都在凌晨 02:00 發文（launchd 觸發 → IG webhook 立即發、Publer scheduled_at=now+90s），完全錯過台灣受眾黃金時段；TikTok 演算法重視發文後第一小時互動。
- TikTok 一般帳號 caption 內連結**不可點擊**（auto_post.py 註解的舊假設錯誤），觀眾唯一可點路徑是 bio 連結——目前 TikTok bio 沒有追蹤連結（tt 累計點擊僅 7 次）。
- /r/ redirect 已是最短轉換路徑（302 直跳 App Store），不加 landing page。

## 改動範圍

1. **launchd 02:00 → 19:00**：改 `~/Library/LaunchAgents/com.nihongo.ig.plist` 的 StartCalendarInterval Hour 為 19，reload（launchctl unload + load）。整條 pipeline（health → render → post → nudge → digest → archive）跟著移到 19:00，IG/TikTok 都在 19:00-19:05 間發文。plist 不在 git repo 內，變更記錄留在 spec 與 README。
2. **TT caption CTA 指向 bio**（`scripts/auto_post.py`）：inject_redirect 的 TT 分支從
   `{TT_CTA}\n📲 {url}` 改為 `{TT_CTA}\n🔗 連結在個人檔案｜📲 {url}`，
   TT_CTA 文字不變（「免費下載 App 一起練日文 👇」）。URL 保留供複製與曝光，主 CTA 誠實指向可點的 bio。
3. **TikTok bio 固定追蹤連結**（arlong 手動一次）：TikTok 帳號 bio 網站欄位設
   `https://nihongo-manabi-proxy.vercel.app/r/bio?p=tt`。
   不需每天更換（與 IG 每日 nudge 不同）——TikTok 端以固定 bio 為唯一轉換路徑，點擊計入 `bio` × `tt` 歸因。
4. **README 更新**：daily flow 的「02:00」改為「19:00」。

## 不做

- 平台錯峰（IG/TT 不同時段）——等本波跑兩週有數據再議。
- Landing page、TikTok 商業帳號連結功能、內容節奏改版。

## 驗收

- `launchctl list | grep nihongo` 顯示 job 已載入；plist 顯示 Hour=19；當晚 19:00 log 出現完整 run。
- auto_post.py dry 檢查：TT caption 印出含「連結在個人檔案」。
- arlong 設好 TikTok bio 後，點一次連結 → /api/stats 的 recent 出現 `filename=bio, platform=tt` 事件。
- 兩週後（約 7/28）週報對比：tt 點擊是否脫離個位數。

## 風險

- pipeline_health 的「昨日發文」比對不依賴日界，移時段無影響（實作時再確認一眼）。
- 19:00 撞上用戶自己用電腦的時段，渲染吃 CPU 幾分鐘——queue 健康時 auto_render 不渲染，影響輕微。
