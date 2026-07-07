# Reels 內容再平衡 + BGM 變奏 + 視覺力度 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 補回 Kana / Grammar / Travel 各 3 集生活化新內容、給三主題不同 BGM、加強視覺力度，重排 queue 讓強弱主題交錯。

**Architecture:** 純資料層 + 生成腳本 + theme 微調。data.ts 加項 → Edge TTS 產音訊/timings → Root.tsx 動態註冊 composition → auto_render 渲染 → queue 重排。不動 auto_post / webhook / Publer。

**Tech Stack:** Remotion（TypeScript）、Python（edge-tts、numpy 合成 BGM）、ffmpeg。

## Global Constraints

- 工作目錄一律 `/Users/arlong/Projects/japanese-learner/nihongo-reels`（下稱 `$REELS`）。
- 新內容不得與已用內容重複。已用清單——Kana：ル/レ、ウ/ク、ナ/メ、ハ/ノ、コ/ユ、き/さ、あ/お、る/ろ、わ/れ、ふ/み、ね/れ、ま/も、ち/ら、ヌ/ス。Grammar：てしまう、ばかり、なければならない、ことができる、ために、ながら、そうだ(聽說)、らしい、はずだ、のに、たり、ば、と思う。Travel：結帳これください、WiFi、英文菜單、刷卡、拍照、おすすめ、試穿、廁所、外帶、check-in、收據、營業時間、過敏。
- git commit 只 add 明確列出的檔案，絕不 `git add -A`（.env 保護）。
- commit message 結尾附 `Claude-Session: https://claude.ai/code/session_016HatEKasmdDsC2Y8Gi4sJZ`。
- 既有已渲染 mp4 與已用音訊/timings 不得重生成（Task 1 的 skip 保護）。

---

### Task 1: gen_*_audio.py 加 skip-existing 保護

**Files:**
- Modify: `scripts/gen_kana_audio.py`（main 迴圈）
- Modify: `scripts/gen_grammar_audio.py`（main 迴圈）
- Modify: `scripts/gen_travel_audio.py`（main 迴圈）

**Interfaces:**
- Produces: 三個腳本重跑時只處理 timings JSON 尚不存在的集數（新集），舊音檔不被覆蓋。

- [ ] **Step 1: 改 gen_kana_audio.py**

在 `async def main():` 的 `for p in pairs:` 迴圈開頭（`d = OUT / p["id"]` 之前）加：

```python
        if (TIMINGS_DIR / f"{p['id']}.json").exists():
            print(f"[kana {p['id']}] timings exist, skip")
            continue
```

- [ ] **Step 2: 改 gen_grammar_audio.py 與 gen_travel_audio.py**

先看各檔 main 迴圈的變數名與 TIMINGS 目錄常數：

```bash
grep -nE "TIMINGS|for .+ in|\.json" scripts/gen_grammar_audio.py scripts/gen_travel_audio.py
```

在各自「per-entry 迴圈」開頭加同樣三行（用該檔的 id 變數與 timings 目錄常數）：timings JSON 已存在 → print skip → continue。

- [ ] **Step 3: 驗證 skip 生效（此時尚無新資料，應全部 skip、零新檔）**

```bash
cd $REELS && ls src/kana/timings | wc -l   # 記下數量（14）
python3 scripts/gen_kana_audio.py | tail -3    # 應全為 "timings exist, skip"
ls src/kana/timings | wc -l   # 仍為 14
```

- [ ] **Step 4: Commit**

```bash
git add scripts/gen_kana_audio.py scripts/gen_grammar_audio.py scripts/gen_travel_audio.py
git commit -m "chore(reels): audio gen scripts skip existing timings (protect shipped assets)"
```

---

### Task 2: Kana 15-17 新資料 + 音訊

**Files:**
- Modify: `src/kana/data.ts`（型別區之後的 imports 加 t15-t17；陣列尾加 3 筆）
- Create: `src/kana/timings/15.json`、`16.json`、`17.json`（由腳本產生）
- Create: `public/kana/15/`、`16/`、`17/` 音檔（由腳本產生）

**Interfaces:**
- Consumes: Task 1 的 skip 保護。
- Produces: `kanaPairs` 含 id "15"-"17"，Root.tsx 自動註冊 composition `Kana-15..17`。

- [ ] **Step 1: data.ts 加 timings imports（在 `import t14` 之後）**

```typescript
import t15 from "./timings/15.json";
import t16 from "./timings/16.json";
import t17 from "./timings/17.json";
```

注意：timings JSON 尚未存在，此時 TypeScript 會編不過——先寫資料、跑完 Step 3 的音訊生成後再驗證。若想保持每步可編譯，可先跑 Step 3 再加 imports（腳本用 regex 讀 data.ts，不需要它可編譯）。

- [ ] **Step 2: kanaPairs 陣列尾加 3 筆（生活化例詞、經典易混對）**

```typescript
  {
    id: "15", kind: "katakana",
    left: { char: "シ", word: "シャワー", reading: "しゃわー", meaning: "淋浴" },
    right: { char: "ツ", word: "ツナ", reading: "つな", meaning: "鮪魚" },
    mnemonic: "シ 的點橫著躺、ツ 的點站著排。",
    quizWhich: "left", timings: t15,
  },
  {
    id: "16", kind: "katakana",
    left: { char: "ソ", word: "ソース", reading: "そーす", meaning: "醬汁" },
    right: { char: "ン", word: "ラーメン", reading: "らーめん", meaning: "拉麵" },
    mnemonic: "ソ 由上往下畫、ン 由下往上甩。",
    quizWhich: "right", timings: t16,
  },
  {
    id: "17", kind: "hiragana",
    left: { char: "は", word: "はし", reading: "はし", meaning: "筷子" },
    right: { char: "ほ", word: "ほし", reading: "ほし", meaning: "星星" },
    mnemonic: "は 少一橫在吃飯、ほ 多一橫掛天上。",
    quizWhich: "left", timings: t17,
  },
```

- [ ] **Step 3: 產音訊 + timings**

```bash
cd $REELS && python3 scripts/gen_kana_audio.py
```

Expected: 01-14 全部 skip，15-17 各產 `chars.mp3`、`example.mp3` 與 timings JSON。

- [ ] **Step 4: 驗證**

```bash
ls src/kana/timings/1[567].json && cat src/kana/timings/15.json
ffprobe -v error -show_entries format=duration -of csv=p=0 public/kana/15/chars.mp3
npx remotion compositions src/index.ts 2>/dev/null | grep -E "Kana-1[567]"
```

Expected: 三個 JSON 存在且 chars/example 為正數秒；compositions 列表含 Kana-15、Kana-16、Kana-17。

- [ ] **Step 5: Commit**

```bash
git add src/kana/data.ts src/kana/timings/15.json src/kana/timings/16.json src/kana/timings/17.json public/kana/15 public/kana/16 public/kana/17
git commit -m "feat(reels): Kana 15-17 — シ/ツ、ソ/ン、は/ほ with daily-life words"
```

---

### Task 3: Grammar 14-16 新資料 + 音訊

**Files:**
- Modify: `src/grammar/data.ts`（imports 加 g14-g16；陣列尾加 3 筆）
- Create: `src/grammar/timings/14.json`-`16.json`、`public/grammar/14..16/` 音檔（腳本產生）

**Interfaces:**
- Produces: `grammarPoints` 含 id "14"-"16"，composition `Grammar-14..16`。

- [ ] **Step 1: imports（在 `import g13` 之後）**

```typescript
import g14 from "./timings/14.json";
import g15 from "./timings/15.json";
import g16 from "./timings/16.json";
```

- [ ] **Step 2: grammarPoints 陣列尾加 3 筆（生活對話例句）**

```typescript
  {
    id: "14", pattern: "〜すぎる", meaning: "太…了", level: "N4",
    example1: { ja: "昨日食べすぎて、お腹が痛いです。", zh: "昨天吃太多，肚子好痛。" },
    example2: { ja: "この服はちょっと高すぎる。", zh: "這件衣服有點太貴了。" },
    wrong: { ja: "高いすぎる", zh: "太貴了（✗）" },
    correct: { ja: "高すぎる", zh: "太貴了（✓）" },
    mistakeExplain: "い形容詞要先去掉「い」再接すぎる：高い→高すぎる，不是整個照抄。",
    timings: g14,
  },
  {
    id: "15", pattern: "〜ておく", meaning: "先做好準備", level: "N4",
    example1: { ja: "ビール、冷蔵庫に入れておくね。", zh: "啤酒我先放冰箱囉。" },
    example2: { ja: "旅行の前にホテルを予約しておきます。", zh: "旅行前先把飯店訂好。" },
    wrong: { ja: "会議の資料を読んでいます", zh: "我在讀會議資料（想表達「先讀好」時 ✗）" },
    correct: { ja: "会議の資料を読んでおきます", zh: "我先把會議資料讀好（✓）" },
    mistakeExplain: "「ている」是正在做；要表達「為了之後先做好」用「ておく」。",
    timings: g15,
  },
  {
    id: "16", pattern: "〜かもしれない", meaning: "說不定", level: "N3",
    example1: { ja: "午後は雨が降るかもしれない。", zh: "下午說不定會下雨。" },
    example2: { ja: "彼はもう帰ったかもしれません。", zh: "他說不定已經回家了。" },
    wrong: { ja: "明日は休みだかもしれない", zh: "明天說不定放假（✗）" },
    correct: { ja: "明日は休みかもしれない", zh: "明天說不定放假（✓）" },
    mistakeExplain: "名詞和な形容詞後面直接接かもしれない，不要多加「だ」。",
    timings: g16,
  },
```

- [ ] **Step 3: 產音訊 + 驗證 + Commit**

```bash
cd $REELS && python3 scripts/gen_grammar_audio.py
ls src/grammar/timings/1[456].json
npx remotion compositions src/index.ts 2>/dev/null | grep -E "Grammar-1[456]"
git add src/grammar/data.ts src/grammar/timings/14.json src/grammar/timings/15.json src/grammar/timings/16.json public/grammar/14 public/grammar/15 public/grammar/16
git commit -m "feat(reels): Grammar 14-16 — すぎる/ておく/かもしれない daily-conversation examples"
```

---

### Task 4: Travel 14-16 新資料 + 音訊（在日生活情境）

**Files:**
- Modify: `src/travel/data.ts`（imports 加 tv14-tv16；陣列尾加 3 筆）
- Create: `src/travel/timings/14.json`-`16.json`、`public/travel/14..16/` 音檔（腳本產生）

**Interfaces:**
- Produces: `travelPhrases` 含 id "14"-"16"，composition `Travel-14..16`。

- [ ] **Step 1: imports（在 `import tv13` 之後）**

```typescript
import tv14 from "./timings/14.json";
import tv15 from "./timings/15.json";
import tv16 from "./timings/16.json";
```

- [ ] **Step 2: travelPhrases 陣列尾加 3 筆**

```typescript
  {
    id: "14", situation: "便利商店買便當", emoji: "🍱",
    phrase: "温めてもらえますか？",
    reading: "あたためてもらえますか",
    meaning: "可以幫我加熱嗎？",
    breakdown: [
      { word: "温めて", role: "加熱（て形）" },
      { word: "もらえますか", role: "能幫我…嗎" },
    ],
    response: { ja: "はい、少々お待ちください。", reading: "はい、しょうしょうおまちください", zh: "好的，請稍等。" },
    tip: "店員通常會先問「温めますか？」，聽到就回「お願いします」就好。",
    timings: tv14,
  },
  {
    id: "15", situation: "藥妝店找藥", emoji: "💊",
    phrase: "頭痛に効く薬はありますか？",
    reading: "ずつうにきくくすりはありますか",
    meaning: "有治頭痛的藥嗎？",
    breakdown: [
      { word: "頭痛に", role: "對頭痛" },
      { word: "効く", role: "有效" },
      { word: "薬", role: "藥" },
    ],
    response: { ja: "こちらがおすすめです。", reading: "こちらがおすすめです", zh: "這款是我們推薦的。" },
    tip: "有過敏或正在吃藥，把「アレルギー」寫在手機備忘給藥師看最保險。",
    timings: tv15,
  },
  {
    id: "16", situation: "月台上不確定搭哪班", emoji: "🚃",
    phrase: "この電車は新宿に止まりますか？",
    reading: "このでんしゃはしんじゅくにとまりますか",
    meaning: "這班電車停新宿嗎？",
    breakdown: [
      { word: "この電車", role: "這班電車" },
      { word: "新宿に", role: "在新宿" },
      { word: "止まりますか", role: "停嗎" },
    ],
    response: { ja: "いいえ、快速は止まりません。", reading: "いいえ、かいそくはとまりません", zh: "不，快速列車不停。" },
    tip: "「各駅停車」每站都停；「快速」「特急」會跳站，上車前先看月台電子看板。",
    timings: tv16,
  },
```

- [ ] **Step 3: 產音訊 + 驗證 + Commit**

```bash
cd $REELS && python3 scripts/gen_travel_audio.py
ls src/travel/timings/1[456].json
npx remotion compositions src/index.ts 2>/dev/null | grep -E "Travel-1[456]"
git add src/travel/data.ts src/travel/timings/14.json src/travel/timings/15.json src/travel/timings/16.json public/travel/14 public/travel/15 public/travel/16
git commit -m "feat(reels): Travel 14-16 — konbini/drugstore/train real-life scenes"
```

---

### Task 5: BGM 兩首變奏 + 模板接線

**Files:**
- Modify: `scripts/gen_bgm.py`（main 重構為參數化 build_track，產 3 首）
- Modify: `src/kana/KanaReel.tsx:19`（bgm.mp3 → bgm-upbeat.mp3）
- Modify: `src/travel/TravelReel.tsx:20`（bgm.mp3 → bgm-warm.mp3）
- Create: `public/music/bgm-upbeat.mp3`、`public/music/bgm-warm.mp3`（腳本產生）

**Interfaces:**
- Consumes: 現有合成器函式 pluck / soft_pad / hihat / kick / vinyl_crackle / lowpass / mix_at / note_freq。
- Produces: `build_track(bpm, progression, out_path, *, kick_beats, hihat_off_vol, pluck_vol, pad_vol, vinyl_vol, cutoff)`；GrammarReel 與 Reel.tsx 維持原 `bgm.mp3` 不動。

- [ ] **Step 1: 重構 gen_bgm.py**

把 `main()` 的組曲邏輯抽成函式（模組層 `BPM`/`BEAT`/`DURATION`/`OUT` 改為參數；原 main 內容照搬、把寫死值換成參數）：

```python
def build_track(bpm: float, progression: list, out_path: Path, *,
                kick_beats=(0, 2), kick_vol=0.18,
                hihat_off_vol=0.03, pluck_vol=0.20, pad_vol=0.18,
                vinyl_vol=0.012, cutoff=4500, duration=60):
    beat = 60 / bpm
    total_samples = SR * duration
    track = np.zeros(total_samples)
    beats_total = int(duration / beat)
    for beat_i in range(beats_total):
        t_offset = int(beat_i * beat * SR)
        bar_i = (beat_i // 4) % len(progression)
        chord_notes, bass_notes = progression[bar_i]
        beat_in_bar = beat_i % 4
        if beat_in_bar in (0, 2, 3):
            for note in chord_notes:
                mix_at(track, pluck(note_freq(note), beat * 1.5, vol=pluck_vol), t_offset)
        if beat_in_bar == 1:
            half_beat = int(beat * 0.5 * SR)
            for note in chord_notes:
                mix_at(track, pluck(note_freq(note), beat, vol=pluck_vol * 0.6), t_offset + half_beat)
        if beat_in_bar in (0, 2):
            for note in bass_notes:
                mix_at(track, soft_pad(note_freq(note), beat * 2, vol=pad_vol), t_offset)
        mix_at(track, hihat(vol=0.06), t_offset)
        mix_at(track, hihat(vol=hihat_off_vol), t_offset + int(beat * 0.5 * SR))
        if beat_in_bar in kick_beats:
            mix_at(track, kick(vol=kick_vol), t_offset)
    if vinyl_vol > 0:
        track += vinyl_crackle(duration, vol=vinyl_vol)
    track = lowpass(track, cutoff=cutoff)
    fade_samples = int(SR * 2)
    track[:fade_samples] *= np.linspace(0, 1, fade_samples)
    track[-fade_samples:] *= np.linspace(1, 0, fade_samples)
    peak = np.max(np.abs(track))
    if peak > 0:
        track = track / peak * 0.85
    _write_mp3(track, out_path)   # 抽出原 wav→ffmpeg 段為 _write_mp3(track, out_path)
```

新 `main()` 產三首（原版參數與現行完全一致）：

```python
PROG_ORIG = [(["C4","E4","G4"],["C3"]), (["A3","C4","E4"],["A2"]),
             (["F3","A3","C4"],["F2"]), (["G3","B3","D4"],["G2"])]
PROG_UPBEAT = [(["C4","E4","G4"],["C3"]), (["G3","B3","D4"],["G2"]),
               (["A3","C4","E4"],["A2"]), (["F3","A3","C4"],["F2"])]
PROG_WARM = [(["A3","C4","E4"],["A2"]), (["F3","A3","C4"],["F2"]),
             (["C4","E4","G4"],["C3"]), (["G3","B3","D4"],["G2"])]

def main():
    music = ROOT / "public" / "music"
    build_track(95, PROG_ORIG, music / "bgm.mp3")  # 原版參數，輸出應與現行等價
    build_track(112, PROG_UPBEAT, music / "bgm-upbeat.mp3",
                kick_beats=(0, 1, 2, 3), kick_vol=0.22, hihat_off_vol=0.06,
                vinyl_vol=0.0, cutoff=6000)
    build_track(82, PROG_WARM, music / "bgm-warm.mp3",
                kick_vol=0.12, pluck_vol=0.12, pad_vol=0.26,
                vinyl_vol=0.02, cutoff=3000)
```

- [ ] **Step 2: 產生並驗證**

```bash
cd $REELS && python3 scripts/gen_bgm.py
for f in public/music/bgm.mp3 public/music/bgm-upbeat.mp3 public/music/bgm-warm.mp3; do ffprobe -v error -show_entries format=duration -of csv=p=0 "$f"; done
afplay public/music/bgm-upbeat.mp3 & sleep 5; kill %1   # 抽聽 5 秒（upbeat 應明顯更快更亮）
afplay public/music/bgm-warm.mp3 & sleep 5; kill %1
```

Expected: 三檔皆 ~60s；upbeat 節奏快（每拍 kick）、warm 慢而柔。

- [ ] **Step 3: 模板接線**

`src/kana/KanaReel.tsx` 19 行：`staticFile("music/bgm.mp3")` → `staticFile("music/bgm-upbeat.mp3")`。
`src/travel/TravelReel.tsx` 20 行：`staticFile("music/bgm.mp3")` → `staticFile("music/bgm-warm.mp3")`。

- [ ] **Step 4: Commit**

```bash
git add scripts/gen_bgm.py public/music/bgm-upbeat.mp3 public/music/bgm-warm.mp3 src/kana/KanaReel.tsx src/travel/TravelReel.tsx
git commit -m "feat(reels): per-theme BGM — upbeat for Kana, warm lo-fi for Travel"
```

---

### Task 6: 視覺力度 — theme 調整 + Kana hook punch-in

**Files:**
- Modify: `src/kana/theme.ts:3-12`（kanaTheme 換高對比深色）
- Modify: `src/kana/scenes/KanaHook.tsx:8-9`（spring 參數）與題字樣式
- Modify: `src/grammar/theme.ts:4,9`（bg 飽和化、accent 加深）
- Modify: `src/travel/theme.ts:4,8-10`（bg 飽和化、accent 加強）

**Interfaces:**
- Produces: theme key 名稱全部不變（僅值變），scenes 無須改動（Kana 深色版靠 text/muted 值翻白達成）。

- [ ] **Step 1: kanaTheme 改為高對比深色**

```typescript
export const kanaTheme = {
  bg: "linear-gradient(165deg, #191036 0%, #3b1660 55%, #c2247a 130%)",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.72)",
  accentL: "#ff6ea9",
  accentR: "#4fd8ff",
  accentOk: "#35f0a6",
  fontJa: '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif',
  fontZh: '"PingFang TC", "Microsoft JhengHei", sans-serif',
};
```

- [ ] **Step 2: KanaHook punch-in**

8-9 行 spring 參數 `damping: 12, stiffness: 110` 改為 `damping: 9, stiffness: 240`（兩處）；「分得出這兩個嗎？」的 div：`fontSize: 56` → `64`，`color: kanaTheme.muted` → `color: kanaTheme.text`。

- [ ] **Step 3: grammarTheme / travelTheme 飽和化（淺底白卡結構不變）**

grammar：`bg` → `"linear-gradient(180deg, #dcffe9 0%, #7dedb4 100%)"`；`accent` → `"#0d9e5a"`。
travel：`bg` → `"linear-gradient(180deg, #ffe9c2 0%, #ffc37a 55%, #7ac2ff 130%)"`；`accent` → `"#ff6a00"`；`accent2` → `"#0d8bff"`；`badge` → `"#ff6a00"`。

- [ ] **Step 4: Commit**

```bash
git add src/kana/theme.ts src/kana/scenes/KanaHook.tsx src/grammar/theme.ts src/travel/theme.ts
git commit -m "feat(reels): bolder visuals — dark high-contrast Kana + saturated Grammar/Travel"
```

---

### Task 7: 樣片渲染 + arlong 審查（CHECKPOINT — 過了才進 Task 8）

**Files:**
- Create: `out/Kana-15.mp4`、`out/Grammar-14.mp4`、`out/Travel-14.mp4`

- [ ] **Step 1: 渲染 3 支樣片**

```bash
cd $REELS
npx remotion render src/index.ts Kana-15 out/Kana-15.mp4
npx remotion render src/index.ts Grammar-14 out/Grammar-14.mp4
npx remotion render src/index.ts Travel-14 out/Travel-14.mp4
```

- [ ] **Step 2: 自查（交付前必看）**

```bash
for v in Kana-15 Grammar-14 Travel-14; do
  ffmpeg -v error -ss 1 -i out/$v.mp4 -frames:v 1 /tmp/$v-hook.png -y
  ffmpeg -v error -sseof -2 -i out/$v.mp4 -frames:v 1 /tmp/$v-end.png -y
done
```

用 Read 檢視 6 張影格：文字無溢出、深色 Kana 對比正確、音訊正常（ffprobe 有 audio stream）。

- [ ] **Step 3: SendUserFile 三支樣片給 arlong，等回覆**

視覺 / BGM 不滿意 → 回 Task 5/6 調參重渲染；OK → 續行。樣片 mp4 不 commit（out/ 在 .gitignore）。

---

### Task 8: auto_render ROTATION 擴充 + 批量渲染 enqueue

**Files:**
- Modify: `scripts/auto_render.py:47-57`（ROTATION 範圍）與 18-23 行 docstring

**Interfaces:**
- Consumes: Task 2-4 的 compositions、Task 5-6 的音畫。
- Produces: out/ 有 9 支新 mp4，queue 尾部多 9 筆 pending。

- [ ] **Step 1: 擴充範圍**

```python
for n in range(4, 18):      # Kana 04..17（原 range(4, 15)）
    ROTATION.append(("Kana", f"{n:02d}"))
for n in range(4, 17):      # Grammar 04..16（原 range(4, 14)）
    ROTATION.append(("Grammar", f"{n:02d}"))
for n in range(4, 17):      # Travel 04..16（原 range(4, 14)）
    ROTATION.append(("Travel", f"{n:02d}"))
```

docstring 的 universe 註解同步改為 `Kana-04..17`、`Grammar-04..16`、`Travel-04..16`。

- [ ] **Step 2: dry-run 確認目標正確**

```bash
cd $REELS && python3 scripts/auto_render.py --force --batch 9 --dry-run
```

Expected: 列出的 9 個目標恰為 Kana-15..17、Grammar-14..16、Travel-14..16（其餘都已在 queue）。不符則停下排查 pick_targets。

- [ ] **Step 3: 實跑渲染 + enqueue**

```bash
python3 scripts/auto_render.py --force --batch 9
python3 -c "
import json; q=json.load(open('upload_queue.json'))
print('pending', sum(1 for e in q if e['status']=='pending'))
print([e['video'] for e in q if e['status']=='pending'][-9:])"
```

Expected: pending 34（25+9），尾部為 9 支新片。

- [ ] **Step 4: Commit**

```bash
git add scripts/auto_render.py upload_queue.json
git commit -m "feat(reels): extend rotation to Kana-17/Grammar-16/Travel-16, render + enqueue 9"
```

---

### Task 9: queue pending 交錯重排

**Files:**
- Create: `scripts/reorder_queue.py`

**Interfaces:**
- Produces: pending 段依 Kana → Reel → Grammar → Anime → Travel → Oops 輪替；uploaded 段順序與內容不動。

- [ ] **Step 1: 寫 reorder_queue.py**

```python
#!/usr/bin/env python3
"""Interleave pending queue entries by theme. Uploaded entries untouched.

Usage: reorder_queue.py [--dry-run]
"""
import json
import sys
from pathlib import Path

QUEUE = Path(__file__).resolve().parent.parent / "upload_queue.json"
ORDER = ["Kana", "Reel", "Grammar", "Anime", "Travel", "Oops"]


def theme_of(entry: dict) -> str:
    name = Path(entry["video"]).name
    return name.split("-")[0]


def main():
    dry = "--dry-run" in sys.argv
    q = json.loads(QUEUE.read_text())
    uploaded = [e for e in q if e["status"] != "pending"]
    pending = [e for e in q if e["status"] == "pending"]
    buckets = {t: [] for t in ORDER}
    for e in pending:
        buckets.setdefault(theme_of(e), []).append(e)
    interleaved = []
    while any(buckets.get(t) for t in buckets):
        for t in ORDER:
            if buckets.get(t):
                interleaved.append(buckets[t].pop(0))
        for t in list(buckets):
            if t not in ORDER and buckets[t]:
                interleaved.append(buckets[t].pop(0))
    assert len(interleaved) == len(pending), "entry count changed!"
    print("new pending order:")
    for e in interleaved:
        print(" ", Path(e["video"]).name)
    if dry:
        return
    QUEUE.write_text(json.dumps(uploaded + interleaved, ensure_ascii=False, indent=2) + "\n")
    print(f"✓ reordered {len(interleaved)} pending entries")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: dry-run 檢查 → 實跑**

```bash
cd $REELS && python3 scripts/reorder_queue.py --dry-run
```

Expected: 開頭順序近似 Kana-15, Reel-30, Grammar-14, Anime-08, Travel-14, Oops-07…（各主題輪替；Reel/Anime/Oops 存量多，後段會連續，可接受）。確認後：

```bash
python3 scripts/reorder_queue.py
python3 -c "import json; q=json.load(open('upload_queue.json')); print('total', len(q), 'pending', sum(1 for e in q if e['status']=='pending'))"
```

Expected: total 105（96+9）、pending 34、uploaded 71 不變。

- [ ] **Step 3: Commit**

```bash
git add scripts/reorder_queue.py upload_queue.json
git commit -m "feat(reels): interleave pending queue — strong themes back in daily rotation"
```

---

### Task 10: archive_uploaded.py SSD 未掛載時靜默跳過

**Files:**
- Modify: `scripts/archive_uploaded.py:56-57`

- [ ] **Step 1: 改 dest 不存在的行為**

```python
    if not dest.exists():
        print(f"[archive] destination not mounted, skipping: {dest}")
        sys.exit(0)
```

（原本 `sys.exit(f"...")` 是非零退出，會讓 ig_schedule.sh 記一行錯誤。）

- [ ] **Step 2: 驗證 + Commit**

```bash
cd $REELS && python3 scripts/archive_uploaded.py; echo "exit=$?"
```

Expected: 印 skipping、`exit=0`（SSD 未掛載時）。

```bash
git add scripts/archive_uploaded.py
git commit -m "fix(reels): archive skips silently when SSD not mounted"
```

---

## 完成後（不在本計畫內執行）

- 明天 02:00 pipeline 自動發下一支（應為強主題）；1-2 週後查 `/api/stats` 對比新發強主題 vs Anime/Oops 的點擊。
- 若 arlong 樣片審查要求視覺再調，只回 Task 5/6 改值重渲染，不影響其他任務。
