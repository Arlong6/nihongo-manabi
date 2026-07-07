# Reels 內容配比再平衡（方案 A：小步試水）

日期：2026-07-06
狀態：已與 arlong 確認方向（方案 A）

## 背景與問題

點擊歸因數據（/api/stats，截至 2026-07-06）：

- 總點擊 236（IG 228 / TikTok 7），近 28 天 23 個新用戶、0 訂閱。
- 歷史點擊最好的主題：Kana、單字 Reel、Travel、Grammar、Oops（每支約 10-13 次）；Anime 略低。
- 點擊事件停在 6/28，但 pipeline 正常（7/6 凌晨仍成功發文）——即最近一週發的影片零點擊。
- 對照 upload queue：25 支 pending 全是 Reel / Anime / Oops；Kana、Grammar、Travel 已全數發完、無新集數。強主題斷貨與零點擊的時間點吻合。

## 目標

把表現好的主題（Kana / Grammar / Travel)補回每日排程，用最小改動驗證「主題配比」是否為近週零點擊的主因。

## 改動範圍

1. **新增內容（各 +3 集，生活化取向）**
   - `src/kana/data.ts`：15-17（沿用 KanaPair 格式，避開已用的假名對；例詞取日常生活場景——便利商店、通勤、外食等）
   - `src/grammar/data.ts`：14-16（GrammarPoint 格式，N4-N3 常見誤用點，避開已用文法；例句用生活對話而非教科書句）
   - `src/travel/data.ts`：14-16（TravelPhrase 格式，避開已用場景；往「在日生活」情境延伸——藥妝店、車站人身事故廣播、居酒屋點餐後續等）
   - 內容原則：與已發集數零重複、貼近真實生活、切角有梗（呼應 Oops/Anime 系列的表現）
2. **音訊 + timings**：跑現有 `gen_kana_audio.py` / `gen_grammar_audio.py` / `gen_travel_audio.py`（Edge TTS，免費）。
3. **渲染**：`auto_render.py` 的 ROTATION 範圍擴充（Kana→15..17、Grammar→14..16、Travel→14..16），Root.tsx 動態 map data 無須改。用 `--force --batch 9` 一次渲染 9 支。
4. **Queue 重排**：現有 25 支 pending + 新 9 支，交錯成 Kana → Reel → Grammar → Anime → Travel → Oops 循環（強主題每 2 天至少 1 支）。
5. **BGM 變化（arlong 2026-07-07 加入）**：目前 Kana / Grammar / Travel / Reel 四模板共用同一首 `music/bgm.mp3`。擴充 `gen_bgm.py` 產出 2 首新變奏（不同 BPM / 調性 / 音色，仍為 numpy 合成、無版權問題），三個強主題各配不同 BGM，打破千篇一律。
6. **視覺力度（arlong 2026-07-07 加入）**：只動 theme.ts 與場景進場動畫參數、不重寫模板結構——背景改高對比深色或飽和漸層、標題字重與描邊加強、hook 場景加 punch-in 進場。每主題渲染 1 支樣片先給 arlong 過目再套用到 9 支。
7. **順帶修復**：`archive_uploaded.py` 在 SSD 未掛載時靜默跳過（exit 0），停止每日報錯。

## 不做（本波）

- 不重寫模板結構、不改 caption 文案、不做 TikTok 客製。
- 不動 auto_post.py / webhook / Publer 邏輯。

## 驗收標準

- 9 支新 mp4 渲染成功且可播放（抽查影格）。
- upload_queue.json 的 pending 順序符合交錯規則，caption 格式與同主題舊集一致。
- 新集數內容與已發集數零重複（假名對、文法點、旅遊情境逐一比對）。
- 跑 1-2 週後以 /api/stats 對比：新發強主題影片是否恢復點擊（對照組：同期 Anime/Oops）。

## 風險

- 若零點擊主因是 IG 觸及下降而非主題，本波調整效果有限——但成本低（內容可重用），且數據可證偽。
- Edge TTS 語音品質偶有波動：渲染後抽查音訊。
