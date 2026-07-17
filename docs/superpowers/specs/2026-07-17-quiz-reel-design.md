# Quiz Reel V1 — 互動挑戰系列（3 秒測驗）

日期：2026-07-17
狀態：arlong 已核可設計（2026-07-16 對話）

## 動機

現有 6 主題全是「知識卡片＋TTS」單一形式，無爆款（每支 7-13 點擊）。Kana 的「猜→揭曉」是唯一互動基因且表現前段班。Quiz 系列把這個基因抽成獨立形式，主打完播（等答案）＋留言（曬答對）兩個演算法訊號。

## 影片結構（~18 秒）

1. **Hook（0-3s）**：「3 秒，這格填什麼？」＋填空句大字
2. **倒數（3-8s）**：4 選項卡彈入＋3-2-1 倒數圈＋tick 音效
3. **揭曉（8-14s）**：正解卡高亮放大、其餘變暗；TTS 唸完整正確句；一行解說（explanation 首行）
4. **CTA（14-18s）**：「答對的留言 ✋｜App 還有 900 題等你」

## 資料流

- 來源：主 repo `data/grammar.ts` 的 `GrammarQuestion`（sentence 填空、options[4]、answer、explanation、point、level）約 150 題現成。
- `scripts/gen_quiz_data.py`：regex 抽題（N5/N4 先行、sentence ≤ 20 字避免爆版）→ 產 `src/quiz/data.ts` + Edge TTS 正解句音訊 + timings（沿用 gen_*_audio 模式與 skip-existing 保護）。
- 新 Remotion 模板 `src/quiz/`（QuizReel + Hook/Countdown/Reveal/CTA scenes），視覺沿用高對比方向（深底＋螢光選項卡），BGM 用現有 `bgm-upbeat.mp3`。
- `Quiz-01..10` 進 auto_render ROTATION；auto_post CAPTION_VARIANTS_IG/TT 各加 3 條 Quiz bucket（鉤子主打「90% 的人選錯」）；reorder_queue 的 ORDER 加 "Quiz"。

## V1 範圍與驗收

- 10 集試水；渲染 1 支樣片給 arlong 過目再批量。
- 驗收：樣片影格自查（選項不爆版、倒數節奏、正解高亮）；10 支進 queue 交錯；兩週後週報比對 Quiz vs 其他主題點擊。

## 不做

計分連動 app、多題連發、自訂音效、題目難度演算法。

## 之後（V2 候選，另開 spec）

方案 B：雙聲道實境對話系列（Edge TTS 男女聲、對話劇本、app AI 對話功能掛鉤）。
