# 每日學習系統 階段一 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Nihongo Manabi 有一條「每日一節課」主線，配上條件式提醒、流失召回、連勝凍結與 PostHog analytics，讓用戶每天回來。

**Architecture:** 題目生成集中到 `lib/quiz/`，組題邏輯放 `lib/lesson.ts`（純函式），新畫面 `LessonScreen` 跑課程並在完成時打卡；`HomeScreen` 改為「今天」頁。通知邏輯全部留在 `lib/notifications.ts`，由 `App.tsx` 的 AppState 與課程完成事件觸發。Pro 狀態改由 `lib/pro.tsx` 的 context 提供。所有持久化仍走 AsyncStorage。

**Tech Stack:** Expo 55 / React Native 0.83 / TypeScript strict / react-navigation 7 / expo-notifications / react-native-purchases 10 / posthog-react-native / jest-expo。

**Spec:** `docs/superpowers/specs/2026-10-12-daily-learning-system-design.md`（第 3、4、6、7、8 節）。階段二「每日文章」（第 5 節）另案撰寫計畫，不在此份。

## Global Constraints

- 測試一律用 `node_modules/.bin/jest <path>`，**絕對不要用 npx**（這台機器的 hook 會把 npx 弄壞）。
- TypeScript `strict: true`；每個 task 結束前跑 `node_modules/.bin/tsc --noEmit` 必須 0 error。
- 新增的 i18n key 必須同時加進 `locales/zh-TW.json`、`locales/en.json`、`locales/ko.json`，`__tests__/i18n.test.ts` 會比對三份 key 完全一致且無空字串。
- 「今天」的日期一律用 `lib/storage.ts` 的 `toLocalDateString / getTodayString`，不可用 `toISOString()`。
- 課程題數固定 10；SRS 到期複習最多 5；新單字 3；文法 1；漢字或聽力 1。
- 連勝凍結最多存 2 張，每滿 7 天連勝得 1 張；Pro 用戶不扣張數。
- 召回通知固定 identifier `lapse-1`、`lapse-3`、`lapse-7`；風險通知 identifier `streak-warning`；每日提醒 `daily-reminder`。
- PostHog 事件名稱固定為 spec 4.6 的 12 個，不再新增；無 key 時所有 `track` 靜默。
- 版本：`app.json` `expo.version` 1.7.0、`ios.buildNumber` "17"、`android.versionCode` 16；`package.json` version 1.7.0。
- 原生依賴只新增 `posthog-react-native` 及其 peer（`expo-application`、`expo-device`、`expo-file-system` 若未安裝）；其餘不動。
- 每個 task 獨立 commit，commit message 結尾加 `Claude-Session: https://claude.ai/code/session_01HH5tzELse2kVzX6LvEsQae`。

## Review Focus

1. **舊 onboarding 等級值**：既有用戶的 `user_level` 是 `'beginner' | 'n5' | 'n4'`（小寫，且 beginner 不是 JLPT 級別）。`getUserLevel()` 必須把它們映射成 `'N5' | 'N5' | 'N4'`，否則組題池為空。→ Task 3 測試 `getUserLevel 把舊值 beginner/n5/n4 映射成 N5/N5/N4`。
2. **連勝斷兩天以上**：有凍結張數時，斷 2 天以上仍要歸零且不扣張數。→ Task 3 測試 `斷兩天：連勝歸 1、凍結不扣`。
3. **當天重複完成課程**：第二次完成不得重複觸發權限對話、不得重複賺凍結、`lesson_complete` 事件可重複但 streak 不變。→ Task 3 測試 `同一天兩次 updateStreak 只算一次`；Task 7 測試 `權限對話只問一次（永久旗標）`。
4. **AppState 回前景時當天已打卡**：`syncStreakRiskNotification` 要取消 `streak-warning`，未打卡且 streak ≥ 1 才排。→ Task 7 測試。
5. **新裝置第一次開 App（無任何進度）**：組題池只有新單字，`composeLesson` 仍要回 10 題且無重複 id。→ Task 4 測試 `空進度：10 題全為新單字且 id 不重複`。

---

## 檔案總覽

| 檔案 | 動作 | 責任 |
|---|---|---|
| `lib/quiz/shuffle.ts` | 新增 | 唯一的 Fisher-Yates 洗牌 |
| `lib/quiz/options.ts` | 新增 | 干擾項挑選，保證不重複且含正解 |
| `lib/quiz/generators.ts` | 新增 | `vocabQuestion / kanjiQuestion / grammarQuestion / listeningQuestion`，統一 `QuizQuestion` |
| `lib/quiz/index.ts` | 新增 | re-export |
| `screens/KanjiScreen.tsx` 等 5 個測驗畫面 + `JLPTScreen.tsx` | 修改 | 改吃 `lib/quiz`，刪本地 shuffle |
| `lib/pro.tsx` | 新增 | `ProProvider`、`usePro()` |
| `screens/CameraScreen.tsx`、`AIConversationScreen.tsx`、`JLPTScreen.tsx`、`ProgressScreen.tsx`、`App.tsx` | 修改 | 改用 `usePro()` |
| `types/index.ts` | 修改 | `UserProgress.streakFreezes`、`JlptLevel` |
| `lib/storage.ts` | 修改 | `getUserLevel / setUserLevel`、`updateStreak` 凍結、`level_prompt_dismissed_until` |
| `screens/OnboardingScreen.tsx`、`HomeScreen.tsx` | 修改 | 不再直接碰 `user_level` |
| `lib/lesson.ts` | 新增 | `composeLesson` 純函式、`levelPool` |
| `screens/LessonScreen.tsx` | 新增 | 課程流程 + 成績頁 |
| `screens/HomeScreen.tsx` | 修改 | 「今天」頁 |
| `lib/notifications.ts` | 修改 | i18n、`syncStreakRiskNotification`、`scheduleLapseReminders`、`hasAskedNotificationPermission` |
| `lib/analytics.ts` | 新增 | PostHog 封裝 `initAnalytics / track / identifyWithRevenueCat` |
| `locales/*.json` | 修改 | 新 key：`lesson.*`、`home.today*`、`notif.*`、`progress.level*` |
| `app.json`、`package.json` | 修改 | 1.7.0 / 17 |
| `__tests__/quiz.test.ts`、`lesson.test.ts`、`streak-freeze.test.ts`、`notifications.test.ts`、`user-level.test.ts`、`analytics.test.ts` | 新增 | 單元測試 |

---

### Task 1: 共用測驗引擎 `lib/quiz/`

**Files:**
- Create: `lib/quiz/shuffle.ts`、`lib/quiz/options.ts`、`lib/quiz/generators.ts`、`lib/quiz/index.ts`
- Modify: `screens/KanjiScreen.tsx:25-57`、`screens/ListeningScreen.tsx:26-77`、`screens/KatakanaScreen.tsx:26-53`、`screens/GrammarScreen.tsx:16-23,172-176`、`screens/PhrasesScreen.tsx:22-34,43`、`screens/JLPTScreen.tsx:40-47`
- Test: `__tests__/quiz.test.ts`

**Interfaces:**
- Consumes: `Vocabulary`、`Phrase`（`types/index.ts`）、`GrammarQuestion`（`data/grammar.ts`）
- Produces:
  ```ts
  export function shuffle<T>(arr: T[], rng?: () => number): T[]
  export function pickDistractors<T>(pool: T[], correct: T, n: number, key: (x: T) => string, rng?: () => number): T[]
  export interface QuizQuestion { id: string; kind: 'vocab' | 'kanji' | 'grammar' | 'listening'; prompt: string; audioText?: string; options: string[]; answer: string; explanation?: string }
  export function vocabQuestion(v: Vocabulary, pool: Vocabulary[], rng?: () => number): QuizQuestion   // 日文→中文意思
  export function kanjiQuestion(v: Vocabulary, pool: Vocabulary[], rng?: () => number): QuizQuestion   // 漢字→讀音
  export function grammarQuestion(g: GrammarQuestion, rng?: () => number): QuizQuestion
  export function listeningQuestion(v: Vocabulary, pool: Vocabulary[], rng?: () => number): QuizQuestion // audioText=v.japanese，選日文
  export function hasKanji(text: string): boolean
  ```
  `rng` 預設 `Math.random`，測試傳固定函式取得可重現結果。

- [ ] **Step 1: 寫失敗測試**

```ts
// __tests__/quiz.test.ts
import { shuffle, pickDistractors, vocabQuestion, kanjiQuestion, grammarQuestion, listeningQuestion, hasKanji } from '../lib/quiz'
import { allVocabulary } from '../data/vocabulary'
import { grammarQuestions } from '../data/grammar'

const fixedRng = () => 0.42
const n5 = allVocabulary.filter(v => v.level === 'N5')

describe('shuffle', () => {
  test('長度與元素不變，傳固定 rng 結果可重現', () => {
    const a = [1, 2, 3, 4, 5]
    const s1 = shuffle(a, fixedRng)
    const s2 = shuffle(a, fixedRng)
    expect(s1).toEqual(s2)
    expect([...s1].sort()).toEqual(a)
    expect(a).toEqual([1, 2, 3, 4, 5])
  })
})

describe('pickDistractors', () => {
  test('不含正解、不重複、數量正確', () => {
    const correct = n5[0]
    const d = pickDistractors(n5, correct, 3, v => v.id, fixedRng)
    expect(d).toHaveLength(3)
    expect(d.map(v => v.id)).not.toContain(correct.id)
    expect(new Set(d.map(v => v.id)).size).toBe(3)
  })
  test('池子不足時回傳能給的數量', () => {
    const pool = n5.slice(0, 3)
    expect(pickDistractors(pool, pool[0], 3, v => v.id, fixedRng)).toHaveLength(2)
  })
})

describe('generators', () => {
  test('vocabQuestion 四個選項含正解且不重複', () => {
    const q = vocabQuestion(n5[0], n5, fixedRng)
    expect(q.kind).toBe('vocab')
    expect(q.options).toHaveLength(4)
    expect(q.options).toContain(q.answer)
    expect(new Set(q.options).size).toBe(4)
    expect(q.answer).toBe(n5[0].chinese)
  })
  test('kanjiQuestion 只接受含漢字的單字，答案是讀音', () => {
    const v = n5.find(x => hasKanji(x.japanese))!
    const q = kanjiQuestion(v, n5, fixedRng)
    expect(q.kind).toBe('kanji')
    expect(q.prompt).toBe(v.japanese)
    expect(q.answer).toBe(v.reading)
    expect(q.options).toContain(v.reading)
  })
  test('grammarQuestion 沿用資料裡的 4 個選項並洗牌', () => {
    const g = grammarQuestions[0]
    const q = grammarQuestion(g, fixedRng)
    expect(q.kind).toBe('grammar')
    expect([...q.options].sort()).toEqual([...g.options].sort())
    expect(q.answer).toBe(g.answer)
    expect(q.explanation).toBe(g.explanation)
  })
  test('listeningQuestion 帶 audioText，選項是日文', () => {
    const q = listeningQuestion(n5[1], n5, fixedRng)
    expect(q.kind).toBe('listening')
    expect(q.audioText).toBe(n5[1].japanese)
    expect(q.answer).toBe(n5[1].japanese)
    expect(q.options).toContain(q.answer)
  })
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `node_modules/.bin/jest __tests__/quiz.test.ts`
Expected: FAIL，`Cannot find module '../lib/quiz'`

- [ ] **Step 3: 實作 `lib/quiz/`**

```ts
// lib/quiz/shuffle.ts
/** Fisher-Yates。全 App 唯一的洗牌實作；rng 可注入以便測試。 */
export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
```

```ts
// lib/quiz/options.ts
import { shuffle } from './shuffle'

/** 從 pool 挑 n 個干擾項：排除正解、依 key 去重。池子不足就回能給的數量。 */
export function pickDistractors<T>(
  pool: T[], correct: T, n: number, key: (x: T) => string, rng: () => number = Math.random,
): T[] {
  const correctKey = key(correct)
  const seen = new Set<string>([correctKey])
  const out: T[] = []
  for (const item of shuffle(pool, rng)) {
    const k = key(item)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(item)
    if (out.length === n) break
  }
  return out
}
```

```ts
// lib/quiz/generators.ts
import type { Vocabulary } from '../../types'
import type { GrammarQuestion } from '../../data/grammar'
import { shuffle } from './shuffle'
import { pickDistractors } from './options'

export interface QuizQuestion {
  id: string
  kind: 'vocab' | 'kanji' | 'grammar' | 'listening'
  prompt: string
  audioText?: string
  options: string[]
  answer: string
  explanation?: string
}

export function hasKanji(text: string): boolean {
  return /[一-鿿㐀-䶿]/.test(text)
}

export function vocabQuestion(v: Vocabulary, pool: Vocabulary[], rng: () => number = Math.random): QuizQuestion {
  const distractors = pickDistractors(pool, v, 3, x => x.chinese, rng).map(x => x.chinese)
  return {
    id: v.id, kind: 'vocab', prompt: v.japanese,
    options: shuffle([v.chinese, ...distractors], rng), answer: v.chinese,
    explanation: `${v.reading}・${v.example}`,
  }
}

export function kanjiQuestion(v: Vocabulary, pool: Vocabulary[], rng: () => number = Math.random): QuizQuestion {
  const kanjiPool = pool.filter(x => hasKanji(x.japanese))
  const distractors = pickDistractors(kanjiPool, v, 3, x => x.reading, rng).map(x => x.reading)
  return {
    id: v.id, kind: 'kanji', prompt: v.japanese,
    options: shuffle([v.reading, ...distractors], rng), answer: v.reading,
    explanation: v.chinese,
  }
}

export function grammarQuestion(g: GrammarQuestion, rng: () => number = Math.random): QuizQuestion {
  return {
    id: g.id, kind: 'grammar', prompt: g.sentence,
    options: shuffle(g.options, rng), answer: g.answer, explanation: g.explanation,
  }
}

export function listeningQuestion(v: Vocabulary, pool: Vocabulary[], rng: () => number = Math.random): QuizQuestion {
  const distractors = pickDistractors(pool, v, 3, x => x.japanese, rng).map(x => x.japanese)
  return {
    id: v.id, kind: 'listening', prompt: '', audioText: v.japanese,
    options: shuffle([v.japanese, ...distractors], rng), answer: v.japanese,
    explanation: v.chinese,
  }
}
```

```ts
// lib/quiz/index.ts
export { shuffle } from './shuffle'
export { pickDistractors } from './options'
export { vocabQuestion, kanjiQuestion, grammarQuestion, listeningQuestion, hasKanji } from './generators'
export type { QuizQuestion } from './generators'
```

- [ ] **Step 4: 跑測試確認通過**

Run: `node_modules/.bin/jest __tests__/quiz.test.ts`
Expected: PASS，7 tests

- [ ] **Step 5: 五個畫面與 JLPT 改吃共用引擎**

每個檔案：刪掉本地 `function shuffle<T>`，改 `import { shuffle, pickDistractors } from '../lib/quiz'`。干擾項的 `.filter(x => x.id !== v.id).sort(() => Math.random() - 0.5).slice(0, 3)` 改成 `pickDistractors(pool, v, 3, x => x.id)`。具體：

`screens/KanjiScreen.tsx`：刪 L27-37（`hasKanji` 與 `shuffle`），改 `import { shuffle, pickDistractors, hasKanji } from '../lib/quiz'`；`buildQuestions` 內
```ts
const distractors = pickDistractors(pool, v, 3, x => x.id)
```

`screens/ListeningScreen.tsx`：刪 L28-35 `shuffle`；兩處 distractors 改
```ts
const distractors = pickDistractors(pool, p, 3, x => x.id).map(x => x.japanese)
```
（vocab 分支同樣以 `v` 取代 `p`）。

`screens/KatakanaScreen.tsx`：刪 L38-45 `shuffle`；`getChoices` 改
```ts
function getChoices(correct: KanaItem, pool: KanaItem[]): KanaItem[] {
  return shuffle([correct, ...pickDistractors(pool, correct, 3, c => c.id)])
}
```

`screens/GrammarScreen.tsx`：刪 L16-23 `shuffle`，加 import。

`screens/PhrasesScreen.tsx`：刪 L22-29 `shuffle`；`getChoices` 改
```ts
function getChoices(correct: Phrase, pool: Phrase[]): Phrase[] {
  return shuffle([correct, ...pickDistractors(pool, correct, 3, p => p.id)])
}
```

`screens/JLPTScreen.tsx`：刪 L40-47 `shuffle` 與 L49-51 `hasKanji`，改 `import { shuffle, hasKanji } from '../lib/quiz'`。其餘不動。

- [ ] **Step 6: 型別檢查與全部測試**

Run: `node_modules/.bin/tsc --noEmit && node_modules/.bin/jest`
Expected: tsc 無輸出；jest 全部 PASS（含既有 6 個測試檔）

- [ ] **Step 7: Commit**

```bash
git add lib/quiz __tests__/quiz.test.ts screens/KanjiScreen.tsx screens/ListeningScreen.tsx screens/KatakanaScreen.tsx screens/GrammarScreen.tsx screens/PhrasesScreen.tsx screens/JLPTScreen.tsx
git commit -m "refactor(quiz): 共用測驗引擎 lib/quiz，六份 shuffle 收成一份

Claude-Session: https://claude.ai/code/session_01HH5tzELse2kVzX6LvEsQae"
```

---

### Task 2: Pro 狀態 context `lib/pro.tsx`

**Files:**
- Create: `lib/pro.tsx`
- Modify: `App.tsx:218-224`（ThemeProvider 內包 ProProvider）、`screens/CameraScreen.tsx:31-42`、`screens/AIConversationScreen.tsx:76-86`、`screens/JLPTScreen.tsx:555-576`、`screens/ProgressScreen.tsx:49-68,150-152`
- Test: `__tests__/pro.test.tsx`

**Interfaces:**
- Consumes: `isPro()`、`initPurchases()`（`lib/iap.ts`）、`Purchases.addCustomerInfoUpdateListener`（react-native-purchases）
- 同時在 `lib/iap.ts` 加 `export function purchasesConfigured(): boolean { return configured }`（放在 `isPro` 上方），讓 Provider 知道 SDK 有沒有 configure。
- Produces:
  ```ts
  export function ProProvider({ children }: { children: React.ReactNode }): JSX.Element
  export function usePro(): { pro: boolean; refresh: () => Promise<boolean> }
  ```
  `pro` 初始 false，mount 時 `isPro()` 一次，之後跟 RevenueCat listener；`refresh()` 重新 `isPro()` 並回傳最新值（取代各畫面的 `pro || await isPro()`）。

- [ ] **Step 1: 寫失敗測試**

```tsx
// __tests__/pro.test.tsx
import React from 'react'
import { Text } from 'react-native'
import { render, waitFor, act } from '@testing-library/react-native'

// jest.mock 工廠只能引用 mock 開頭的外部變數
const mockListenerRef: { cb: ((info: any) => void) | null } = { cb: null }
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    addCustomerInfoUpdateListener: jest.fn((cb: (info: any) => void) => { mockListenerRef.cb = cb; return { remove: jest.fn() } }),
  },
  LOG_LEVEL: {}, INTRO_ELIGIBILITY_STATUS: {},
}))
const mockIsPro = jest.fn(async () => false)
jest.mock('../lib/iap', () => ({
  isPro: () => mockIsPro(),
  initPurchases: jest.fn(async () => {}),
  purchasesConfigured: () => true,
  packageIsPro: (info: any) => Boolean(info?.entitlements?.active?.pro),
}))

import { ProProvider, usePro } from '../lib/pro'

function Probe() {
  const { pro } = usePro()
  return <Text testID="pro">{pro ? 'yes' : 'no'}</Text>
}

beforeEach(() => { mockListenerRef.cb = null; mockIsPro.mockReset(); mockIsPro.mockResolvedValue(false) })

test('初始 false，isPro 回 true 後變 true', async () => {
  mockIsPro.mockResolvedValue(true)
  const { getByTestId } = render(<ProProvider><Probe /></ProProvider>)
  await waitFor(() => expect(getByTestId('pro').props.children).toBe('yes'))
})

test('RevenueCat listener 推送 entitlement 時更新', async () => {
  const { getByTestId } = render(<ProProvider><Probe /></ProProvider>)
  await waitFor(() => expect(mockListenerRef.cb).not.toBeNull())
  act(() => mockListenerRef.cb!({ entitlements: { active: { pro: {} } } }))
  await waitFor(() => expect(getByTestId('pro').props.children).toBe('yes'))
})

test('usePro 在 Provider 外使用會 throw', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<Probe />)).toThrow('usePro must be used within ProProvider')
  spy.mockRestore()
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `node_modules/.bin/jest __tests__/pro.test.tsx`
Expected: FAIL，`Cannot find module '../lib/pro'`

- [ ] **Step 3: 實作**

```tsx
// lib/pro.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import Purchases from 'react-native-purchases'
import { isPro, initPurchases, purchasesConfigured, packageIsPro } from './iap'

interface ProContextValue {
  pro: boolean
  /** 重新向 RevenueCat 查一次並回傳最新值；gate 判斷時用它取代快取的 pro。 */
  refresh: () => Promise<boolean>
}

const ProContext = createContext<ProContextValue | null>(null)

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [pro, setPro] = useState(false)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    const next = await isPro()
    if (mounted.current) setPro(next)
    return next
  }, [])

  useEffect(() => {
    mounted.current = true
    refresh().catch(() => {})
    let sub: { remove: () => void } | null = null
    initPurchases()
      .then(() => {
        if (!purchasesConfigured()) return   // 無 key：SDK 未 configure，不能掛 listener
        sub = Purchases.addCustomerInfoUpdateListener(info => {
          if (mounted.current) setPro(packageIsPro(info))
        })
      })
      .catch(() => { /* 無 key 時沒有 listener，pro 維持 false */ })
    return () => { mounted.current = false; sub?.remove() }
  }, [refresh])

  return <ProContext.Provider value={{ pro, refresh }}>{children}</ProContext.Provider>
}

export function usePro(): ProContextValue {
  const ctx = useContext(ProContext)
  if (!ctx) throw new Error('usePro must be used within ProProvider')
  return ctx
}
```

注意：`react-native-purchases` 的 `addCustomerInfoUpdateListener` 回傳值型別在 v10 是 `{ remove(): void }`，若 tsc 報型別不符，改成 `const sub = Purchases.addCustomerInfoUpdateListener(...)` 後 `sub.remove()` 並以 `as any` 收斂，不要改 jest mock。

- [ ] **Step 4: 跑測試確認通過**

Run: `node_modules/.bin/jest __tests__/pro.test.tsx`
Expected: PASS，3 tests

- [ ] **Step 5: 接上 App 與四個畫面**

`App.tsx`：`import { ProProvider } from './lib/pro'`，`<ThemeProvider><ProProvider><AppInner /></ProProvider></ThemeProvider>`。

`screens/CameraScreen.tsx`：刪 `const [pro, setPro] = useState(false)` 與 `useEffect(() => { isPro().then(setPro) }, [])`；改 `const { pro, refresh } = usePro()`；`const currentlyPro = pro || await isPro()` 改 `const currentlyPro = pro || await refresh()`；移除 `isPro` import。

`screens/AIConversationScreen.tsx`：同上，`useEffect` 只留 `getAIChatUsage().then(setUsage)`。

`screens/JLPTScreen.tsx`：同上，`useEffect` 只留 `loadExamHistory().then(setHistory)`。

`screens/ProgressScreen.tsx`：刪 `pro` state 與兩個 `isPro().then(setPro)`；改 `const { pro, refresh } = usePro()`；`useFocusEffect` 內改 `refresh().catch(() => {})`；restore 成功處 `setPro(true)` 改 `await refresh()`。

- [ ] **Step 6: 型別檢查與全部測試**

Run: `node_modules/.bin/tsc --noEmit && node_modules/.bin/jest`
Expected: 全綠

- [ ] **Step 7: Commit**

```bash
git add lib/pro.tsx lib/iap.ts __tests__/pro.test.tsx App.tsx screens/CameraScreen.tsx screens/AIConversationScreen.tsx screens/JLPTScreen.tsx screens/ProgressScreen.tsx
git commit -m "refactor(pro): usePro() context 取代四個畫面各自的 isPro 輪詢

Claude-Session: https://claude.ai/code/session_01HH5tzELse2kVzX6LvEsQae"
```

---

### Task 3: 使用者級別、連勝凍結（`lib/storage.ts`、`types/index.ts`）

**Files:**
- Modify: `types/index.ts:79-95`、`lib/storage.ts:232-262,316-350`、`screens/OnboardingScreen.tsx:16-18,59-64`、`screens/HomeScreen.tsx:9,44`
- Test: `__tests__/user-level.test.ts`、`__tests__/streak-freeze.test.ts`

**Interfaces:**
- Consumes: `AsyncStorage`、`STREAK_BADGES`
- Produces:
  ```ts
  // types/index.ts
  export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  export const JLPT_LEVELS: readonly JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']
  export interface UserProgress { /* 既有欄位 */ streakFreezes?: number }
  // lib/storage.ts
  export const USER_LEVEL_KEY = 'user_level'
  export const MAX_STREAK_FREEZES = 2
  export const FREEZE_EARN_EVERY = 7
  export async function getUserLevel(): Promise<JlptLevel>          // 舊值 beginner/n5/n4 → N5/N5/N4；缺值 → N5
  export async function setUserLevel(level: JlptLevel): Promise<void>
  export async function getLevelPromptDismissedUntil(): Promise<string | null>  // YYYY-MM-DD
  export async function setLevelPromptDismissedUntil(date: string): Promise<void>
  export interface StreakUpdateResult { newBadges: number[]; newRecord: boolean; freezeUsed: boolean; freezeEarned: boolean }
  export function updateStreak(progress: UserProgress, now?: Date, opts?: { isPro?: boolean }): StreakUpdateResult
  ```
  `OnboardingScreen` 的 `USER_LEVEL_KEY`、`UserLevel` 匯出保留（onboarding 的三個選項仍寫 `beginner/n5/n4`，由 `getUserLevel` 映射），但改成從 storage re-export：`export { USER_LEVEL_KEY } from '../lib/storage'`。

- [ ] **Step 1: 寫失敗測試（級別）**

```ts
// __tests__/user-level.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getUserLevel, setUserLevel, USER_LEVEL_KEY, getLevelPromptDismissedUntil, setLevelPromptDismissedUntil } from '../lib/storage'

beforeEach(async () => { await AsyncStorage.clear() })

test('getUserLevel 把舊值 beginner/n5/n4 映射成 N5/N5/N4', async () => {
  for (const [raw, expected] of [['beginner', 'N5'], ['n5', 'N5'], ['n4', 'N4']] as const) {
    await AsyncStorage.setItem(USER_LEVEL_KEY, raw)
    expect(await getUserLevel()).toBe(expected)
  }
})

test('缺值或壞值回 N5', async () => {
  expect(await getUserLevel()).toBe('N5')
  await AsyncStorage.setItem(USER_LEVEL_KEY, 'banana')
  expect(await getUserLevel()).toBe('N5')
})

test('setUserLevel 之後 getUserLevel 原樣回傳', async () => {
  await setUserLevel('N3')
  expect(await getUserLevel()).toBe('N3')
  expect(await AsyncStorage.getItem(USER_LEVEL_KEY)).toBe('N3')
})

test('level prompt dismissed until 讀寫', async () => {
  expect(await getLevelPromptDismissedUntil()).toBeNull()
  await setLevelPromptDismissedUntil('2026-10-19')
  expect(await getLevelPromptDismissedUntil()).toBe('2026-10-19')
})
```

- [ ] **Step 2: 寫失敗測試（凍結）**

```ts
// __tests__/streak-freeze.test.ts
import { updateStreak, toLocalDateString, MAX_STREAK_FREEZES } from '../lib/storage'
import type { UserProgress } from '../types'

function daysAgo(n: number, from: Date): string {
  const d = new Date(from); d.setDate(d.getDate() - n); return toLocalDateString(d)
}
function base(over: Partial<UserProgress> = {}): UserProgress {
  return {
    streak: 0, longestStreak: 0, lastStudyDate: '', totalWordsLearned: 0, categoryProgress: {},
    dailyHistory: [], srsCards: [], learnedIds: [], earnedBadges: [], dateSchema: 'local', ...over,
  }
}
const now = new Date(2026, 9, 12, 20, 0, 0)

test('連勝到 7 得 1 張，到 14 再得 1 張，上限 2', () => {
  const p = base({ streak: 6, lastStudyDate: daysAgo(1, now) })
  const r = updateStreak(p, now)
  expect(p.streak).toBe(7); expect(p.streakFreezes).toBe(1); expect(r.freezeEarned).toBe(true)
  const p2 = base({ streak: 13, lastStudyDate: daysAgo(1, now), streakFreezes: 1 })
  updateStreak(p2, now); expect(p2.streakFreezes).toBe(2)
  const p3 = base({ streak: 20, lastStudyDate: daysAgo(1, now), streakFreezes: 2 })
  updateStreak(p3, now); expect(p3.streakFreezes).toBe(MAX_STREAK_FREEZES)
})

test('斷一天：有凍結就扣 1 張並延續連勝', () => {
  const p = base({ streak: 10, lastStudyDate: daysAgo(2, now), streakFreezes: 1 })
  const r = updateStreak(p, now)
  expect(p.streak).toBe(11); expect(p.streakFreezes).toBe(0); expect(r.freezeUsed).toBe(true)
})

test('斷一天：沒凍結就歸 1', () => {
  const p = base({ streak: 10, lastStudyDate: daysAgo(2, now), streakFreezes: 0 })
  const r = updateStreak(p, now)
  expect(p.streak).toBe(1); expect(r.freezeUsed).toBe(false)
})

test('斷一天：Pro 延續連勝且不扣張數', () => {
  const p = base({ streak: 10, lastStudyDate: daysAgo(2, now), streakFreezes: 0 })
  const r = updateStreak(p, now, { isPro: true })
  expect(p.streak).toBe(11); expect(p.streakFreezes).toBe(0); expect(r.freezeUsed).toBe(true)
})

test('斷兩天：連勝歸 1、凍結不扣', () => {
  const p = base({ streak: 10, lastStudyDate: daysAgo(3, now), streakFreezes: 2 })
  const r = updateStreak(p, now, { isPro: true })
  expect(p.streak).toBe(1); expect(p.streakFreezes).toBe(2); expect(r.freezeUsed).toBe(false)
})

test('舊資料（無 dateSchema）前天也算連續，不扣凍結', () => {
  const p = base({ streak: 5, lastStudyDate: daysAgo(2, now), streakFreezes: 1 })
  delete (p as Partial<UserProgress>).dateSchema
  const r = updateStreak(p, now)
  expect(p.streak).toBe(6); expect(p.streakFreezes).toBe(1); expect(r.freezeUsed).toBe(false)
  expect(p.dateSchema).toBe('local')
})

test('同一天兩次 updateStreak 只算一次', () => {
  const p = base({ streak: 6, lastStudyDate: daysAgo(1, now) })
  updateStreak(p, now)
  const r = updateStreak(p, now)
  expect(p.streak).toBe(7); expect(p.streakFreezes).toBe(1)
  expect(r).toEqual({ newBadges: [], newRecord: false, freezeUsed: false, freezeEarned: false })
})

test('舊資料無 streakFreezes 欄位視為 0', () => {
  const p = base({ streak: 3, lastStudyDate: daysAgo(2, now) })
  updateStreak(p, now)
  expect(p.streak).toBe(1); expect(p.streakFreezes).toBe(0)
})
```

- [ ] **Step 3: 跑兩個測試確認失敗**

Run: `node_modules/.bin/jest __tests__/user-level.test.ts __tests__/streak-freeze.test.ts`
Expected: FAIL（`getUserLevel is not a function`；凍結測試 `freezeUsed` undefined）

- [ ] **Step 4: 改型別**

`types/index.ts` 在 `UserProgress` 加：
```ts
  // 連勝凍結張數：每滿 7 天連勝 +1，上限 2；斷一天時自動用掉一張。舊資料缺欄位視為 0。
  streakFreezes?: number
```
檔尾加：
```ts
export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
export const JLPT_LEVELS: readonly JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']
```

- [ ] **Step 5: 改 `lib/storage.ts`**

在 `STORAGE_KEY` 上方加：
```ts
// ── 使用者級別 ────────────────────────────────────────────────────────────────
// onboarding 寫的是 'beginner' | 'n5' | 'n4'（1.6.x 以前），這裡統一映射成 JLPT 級別。
export const USER_LEVEL_KEY = 'user_level'
const LEVEL_PROMPT_DISMISSED_KEY = 'level_prompt_dismissed_until'
const LEGACY_LEVEL_MAP: Record<string, JlptLevel> = { beginner: 'N5', n5: 'N5', n4: 'N4' }

export async function getUserLevel(): Promise<JlptLevel> {
  try {
    const raw = await AsyncStorage.getItem(USER_LEVEL_KEY)
    if (!raw) return 'N5'
    if ((JLPT_LEVELS as readonly string[]).includes(raw)) return raw as JlptLevel
    return LEGACY_LEVEL_MAP[raw] ?? 'N5'
  } catch {
    return 'N5'
  }
}

export async function setUserLevel(level: JlptLevel): Promise<void> {
  try { await AsyncStorage.setItem(USER_LEVEL_KEY, level) } catch { console.error('Failed to save level') }
}

export async function getLevelPromptDismissedUntil(): Promise<string | null> {
  try { return await AsyncStorage.getItem(LEVEL_PROMPT_DISMISSED_KEY) } catch { return null }
}

export async function setLevelPromptDismissedUntil(date: string): Promise<void> {
  try { await AsyncStorage.setItem(LEVEL_PROMPT_DISMISSED_KEY, date) } catch { /* best-effort */ }
}
```
import 行改 `import type { UserProgress, DailyProgress, SRSCard, ExamRecord, JlptLevel } from '../types'` 與 `import { STREAK_BADGES, JLPT_LEVELS } from '../types'`。

`defaultProgress` 加 `streakFreezes: 0`。

`updateStreak` 整段換成：
```ts
export const MAX_STREAK_FREEZES = 2
export const FREEZE_EARN_EVERY = 7

export interface StreakUpdateResult {
  newBadges: number[]
  newRecord: boolean
  /** 這次打卡用掉一張凍結（或 Pro 免費延續）保住了連勝。 */
  freezeUsed: boolean
  /** 這次打卡剛好賺到一張凍結。 */
  freezeEarned: boolean
}

export function updateStreak(
  progress: UserProgress, now: Date = new Date(), opts: { isPro?: boolean } = {},
): StreakUpdateResult {
  const none: StreakUpdateResult = { newBadges: [], newRecord: false, freezeUsed: false, freezeEarned: false }
  const today = toLocalDateString(now)
  const yesterday = toLocalDateString(addDays(now, -1))
  const dayBeforeYesterday = toLocalDateString(addDays(now, -2))
  if (typeof progress.streakFreezes !== 'number') progress.streakFreezes = 0
  if (progress.lastStudyDate === today) return none

  // 舊資料（1.6.0 前）的日期是 UTC，最多比本地日期落後一天，第一次遇到時「前天」也視為連續。
  // 這條寬鬆路徑優先於凍結，不扣張數。
  const legacy = progress.dateSchema !== 'local'
  if (legacy) progress.dateSchema = 'local'

  let freezeUsed = false
  let isContinuing = progress.lastStudyDate === yesterday
  if (!isContinuing && progress.lastStudyDate === dayBeforeYesterday) {
    if (legacy) {
      isContinuing = true
    } else if (opts.isPro) {
      isContinuing = true; freezeUsed = true
    } else if (progress.streakFreezes > 0) {
      progress.streakFreezes -= 1; isContinuing = true; freezeUsed = true
    }
  }

  progress.streak = isContinuing ? progress.streak + 1 : 1
  progress.lastStudyDate = today
  if (typeof progress.longestStreak !== 'number') progress.longestStreak = 0
  if (!Array.isArray(progress.earnedBadges)) progress.earnedBadges = []
  const newRecord = progress.streak > progress.longestStreak
  if (newRecord) progress.longestStreak = progress.streak

  let freezeEarned = false
  if (progress.streak % FREEZE_EARN_EVERY === 0 && progress.streakFreezes < MAX_STREAK_FREEZES) {
    progress.streakFreezes += 1; freezeEarned = true
  }

  const newBadges: number[] = []
  for (const threshold of STREAK_BADGES) {
    if (progress.streak >= threshold && !progress.earnedBadges.includes(threshold)) {
      progress.earnedBadges.push(threshold); newBadges.push(threshold)
    }
  }
  return { newBadges, newRecord, freezeUsed, freezeEarned }
}
```

`markWordLearned` 與 `recordDailyActivity` 簽名改成：
```ts
export async function markWordLearned(
  id: string, category: string, totalInCategory: number, opts: { isPro?: boolean } = {},
): Promise<void> {
  // ...既有內容...
  const { newBadges } = updateStreak(progress, new Date(), opts)
  if (newBadges.length > 0) await armReviewPrompt()
  await saveProgress(progress)
}

export async function recordDailyActivity(
  newWords: number, reviewed: number, katakanaCorrect: number, katakanaTotal: number,
  opts: { isPro?: boolean } = {},
): Promise<StreakUpdateResult> {
  // ...既有內容...
  const result = updateStreak(progress, new Date(), opts)
  if (result.newBadges.length > 0) await armReviewPrompt()
  await saveProgress(progress)
  return result
}
```
既有呼叫端（VocabularyScreen、KatakanaScreen）不傳 `opts` 也能編譯。

- [ ] **Step 6: Onboarding 與 Home 改走 storage**

`screens/OnboardingScreen.tsx`：L17 改 `export { USER_LEVEL_KEY } from '../lib/storage'`；L62 改 `await setUserLevel(LEGACY_TO_JLPT[level])`，檔頭加
```ts
import { setUserLevel } from '../lib/storage'
import type { JlptLevel } from '../types'
const LEGACY_TO_JLPT: Record<UserLevel, JlptLevel> = { beginner: 'N5', n5: 'N5', n4: 'N4' }
```
並移除 `AsyncStorage` 對 `USER_LEVEL_KEY` 的直接寫入（`ONBOARDING_KEY` 的寫入保留）。

`screens/HomeScreen.tsx` L44-52：改
```ts
getUserLevel().then(level => {
  const vocab = getVocabularyByLevel(level === 'N5' ? 'n5' : 'n4')
  ...
})
```
import 加 `getUserLevel`，移除 `USER_LEVEL_KEY, UserLevel` import。（Task 6 會整頁重寫，這裡只求 tsc 過與行為不變。）

- [ ] **Step 7: 跑測試**

Run: `node_modules/.bin/tsc --noEmit && node_modules/.bin/jest`
Expected: 全綠；`storage-quota.test.ts` 既有的 `updateStreak` 測試仍通過（回傳物件多了兩個欄位，若該檔用 `toEqual` 比對整個結果，更新期望值加上 `freezeUsed: false, freezeEarned: false`）

- [ ] **Step 8: Commit**

```bash
git add types/index.ts lib/storage.ts screens/OnboardingScreen.tsx screens/HomeScreen.tsx __tests__/user-level.test.ts __tests__/streak-freeze.test.ts __tests__/storage-quota.test.ts
git commit -m "feat(storage): JLPT 使用者級別 getter/setter、連勝凍結（7 天 +1、上限 2、Pro 免扣）

Claude-Session: https://claude.ai/code/session_01HH5tzELse2kVzX6LvEsQae"
```

---

### Task 4: 組題 `lib/lesson.ts`

**Files:**
- Create: `lib/lesson.ts`
- Test: `__tests__/lesson.test.ts`

**Interfaces:**
- Consumes: `QuizQuestion`、`vocabQuestion / kanjiQuestion / grammarQuestion / listeningQuestion / hasKanji`（Task 1）、`UserProgress`、`JlptLevel`、`GrammarStats`、`allVocabulary`、`grammarQuestions`、`getDueCards / sortByDueDate`
- Produces:
  ```ts
  export const LESSON_SIZE = 10
  export const MAX_REVIEW = 5
  export const NEW_WORDS = 3
  export interface LessonItem { question: QuizQuestion; role: 'review' | 'new' | 'grammar' | 'extra'; vocabId?: string }
  export function levelPool(level: JlptLevel, vocab?: Vocabulary[]): Vocabulary[]   // N5 含 level==='daily' 的主題單字
  export function composeLesson(input: { progress: UserProgress; level: JlptLevel; grammarStats: GrammarStats; today: string; rng?: () => number }): LessonItem[]
  export function levelMasteryRatio(progress: UserProgress, level: JlptLevel): number  // learnedIds ∩ pool / pool
  ```

- [ ] **Step 1: 寫失敗測試**

```ts
// __tests__/lesson.test.ts
import { composeLesson, levelPool, levelMasteryRatio, LESSON_SIZE, MAX_REVIEW, NEW_WORDS } from '../lib/lesson'
import { allVocabulary } from '../data/vocabulary'
import type { UserProgress, SRSCard } from '../types'

const rng = () => 0.5
function base(over: Partial<UserProgress> = {}): UserProgress {
  return {
    streak: 0, longestStreak: 0, lastStudyDate: '', totalWordsLearned: 0, categoryProgress: {},
    dailyHistory: [], srsCards: [], learnedIds: [], earnedBadges: [], streakFreezes: 0, dateSchema: 'local', ...over,
  }
}
function dueCard(id: string, daysAgo: number): SRSCard {
  const d = new Date(); d.setDate(d.getDate() - daysAgo)
  return { id, type: 'vocabulary', nextReview: d.toISOString(), interval: 1, repetitions: 1, easeFactor: 2.5 }
}

test('levelPool N5 含主題單字（daily），N4 不含', () => {
  expect(levelPool('N5').some(v => v.level === 'daily')).toBe(true)
  expect(levelPool('N4').every(v => v.level === 'N4')).toBe(true)
})

test('空進度：10 題全為新單字且 id 不重複', () => {
  const items = composeLesson({ progress: base(), level: 'N5', grammarStats: {}, today: '2026-10-12', rng })
  expect(items).toHaveLength(LESSON_SIZE)
  const ids = items.map(i => i.question.id)
  expect(new Set(ids).size).toBe(LESSON_SIZE)
  expect(items.filter(i => i.role === 'new')).toHaveLength(NEW_WORDS)
  expect(items.filter(i => i.role === 'grammar')).toHaveLength(1)
  expect(items.filter(i => i.role === 'review')).toHaveLength(0)
})

test('有 8 張到期卡只取最早的 5 張當複習', () => {
  const pool = levelPool('N5')
  const cards = pool.slice(0, 8).map((v, i) => dueCard(v.id, 8 - i))  // 第 0 張最早到期
  const p = base({ srsCards: cards, learnedIds: cards.map(c => c.id) })
  const items = composeLesson({ progress: p, level: 'N5', grammarStats: {}, today: '2026-10-12', rng })
  const reviews = items.filter(i => i.role === 'review')
  // 前 5 個 review 一定是最早到期的 5 張；補位用的已學單字也會標 review，所以總數 ≥ 5
  expect(reviews.length).toBeGreaterThanOrEqual(MAX_REVIEW)
  expect(reviews.slice(0, MAX_REVIEW).map(r => r.vocabId)).toEqual(cards.slice(0, 5).map(c => c.id))
  expect(items[0].role).toBe('review')
})

test('順序固定：review → new → grammar → extra', () => {
  const pool = levelPool('N5')
  const p = base({ srsCards: [dueCard(pool[0].id, 1)], learnedIds: [pool[0].id] })
  const roles = composeLesson({ progress: p, level: 'N5', grammarStats: {}, today: '2026-10-12', rng }).map(i => i.role)
  const firstNew = roles.indexOf('new'), g = roles.indexOf('grammar'), extra = roles.indexOf('extra')
  expect(roles[0]).toBe('review')
  expect(firstNew).toBeGreaterThan(0)
  expect(g).toBeGreaterThan(firstNew)
  expect(extra).toBeGreaterThan(g)
})

test('文法優先取答錯率高的題', () => {
  const stats = { 'g-002': { correct: 0, total: 3 }, 'g-001': { correct: 3, total: 3 } }
  const items = composeLesson({ progress: base(), level: 'N5', grammarStats: stats, today: '2026-10-12', rng })
  expect(items.find(i => i.role === 'grammar')!.question.id).toBe('g-002')
})

test('日期奇偶決定 extra 是 kanji 或 listening', () => {
  const k = composeLesson({ progress: base(), level: 'N5', grammarStats: {}, today: '2026-10-12', rng })
  const l = composeLesson({ progress: base(), level: 'N5', grammarStats: {}, today: '2026-10-13', rng })
  const kind = (items: ReturnType<typeof composeLesson>) => items.find(i => i.role === 'extra')!.question.kind
  expect(new Set([kind(k), kind(l)])).toEqual(new Set(['kanji', 'listening']))
})

test('級別全學完：用已學單字隨機複習補到 10 題', () => {
  const pool = levelPool('N4')
  const p = base({ learnedIds: pool.map(v => v.id) })
  const items = composeLesson({ progress: p, level: 'N4', grammarStats: {}, today: '2026-10-12', rng })
  expect(items).toHaveLength(LESSON_SIZE)
  expect(items.filter(i => i.role === 'new')).toHaveLength(0)
})

test('同輸入同 rng 結果可重現', () => {
  const a = composeLesson({ progress: base(), level: 'N3', grammarStats: {}, today: '2026-10-12', rng })
  const b = composeLesson({ progress: base(), level: 'N3', grammarStats: {}, today: '2026-10-12', rng })
  expect(a.map(i => i.question.id)).toEqual(b.map(i => i.question.id))
})

test('levelMasteryRatio', () => {
  const pool = levelPool('N4')
  const half = pool.slice(0, Math.floor(pool.length / 2)).map(v => v.id)
  expect(levelMasteryRatio(base({ learnedIds: half }), 'N4')).toBeCloseTo(0.5, 1)
  expect(levelMasteryRatio(base(), 'N4')).toBe(0)
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `node_modules/.bin/jest __tests__/lesson.test.ts`
Expected: FAIL，`Cannot find module '../lib/lesson'`

- [ ] **Step 3: 實作**

```ts
// lib/lesson.ts
import type { UserProgress, Vocabulary, JlptLevel } from '../types'
import { allVocabulary } from '../data/vocabulary'
import { grammarQuestions } from '../data/grammar'
import type { GrammarStats } from './storage'
import { getDueCards, sortByDueDate } from './srs'
import { vocabQuestion, kanjiQuestion, grammarQuestion, listeningQuestion, hasKanji, shuffle } from './quiz'
import type { QuizQuestion } from './quiz'

export const LESSON_SIZE = 10
export const MAX_REVIEW = 5
export const NEW_WORDS = 3

export interface LessonItem {
  question: QuizQuestion
  role: 'review' | 'new' | 'grammar' | 'extra'
  vocabId?: string
}

/** 級別單字池。主題單字（level 'daily'）視為 N5 池的一部分。 */
export function levelPool(level: JlptLevel, vocab: Vocabulary[] = allVocabulary): Vocabulary[] {
  return vocab.filter(v => v.level === level || (level === 'N5' && v.level === 'daily'))
}

export function levelMasteryRatio(progress: UserProgress, level: JlptLevel): number {
  const pool = levelPool(level)
  if (pool.length === 0) return 0
  const learned = new Set(progress.learnedIds)
  return pool.filter(v => learned.has(v.id)).length / pool.length
}

interface ComposeInput {
  progress: UserProgress
  level: JlptLevel
  grammarStats: GrammarStats
  today: string           // YYYY-MM-DD，決定 extra 題型
  rng?: () => number
}

export function composeLesson({ progress, level, grammarStats, today, rng = Math.random }: ComposeInput): LessonItem[] {
  const pool = levelPool(level)
  const byId = new Map(pool.map(v => [v.id, v]))
  const learned = new Set(progress.learnedIds)
  const used = new Set<string>()
  const items: LessonItem[] = []

  // 1. SRS 到期複習，最早到期優先，最多 MAX_REVIEW（只取本級別池內的單字）
  for (const card of sortByDueDate(getDueCards(progress.srsCards))) {
    if (items.length >= MAX_REVIEW) break
    const v = byId.get(card.id)
    if (!v || used.has(v.id)) continue
    used.add(v.id)
    items.push({ question: vocabQuestion(v, pool, rng), role: 'review', vocabId: v.id })
  }

  // 2. 新單字 NEW_WORDS，依資料順序取未學的前幾個（可重現）
  const unlearned = pool.filter(v => !learned.has(v.id) && !used.has(v.id))
  for (const v of unlearned.slice(0, NEW_WORDS)) {
    used.add(v.id)
    items.push({ question: vocabQuestion(v, pool, rng), role: 'new', vocabId: v.id })
  }

  // 3. 文法 1 題：本級別中答錯率最高者（未作答過的算 0 錯誤率），同率取資料順序
  const grammarPool = grammarQuestions.filter(g => g.level === level)
  if (grammarPool.length > 0) {
    const errorRate = (id: string) => {
      const s = grammarStats[id]
      return s && s.total > 0 ? 1 - s.correct / s.total : 0
    }
    const pick = [...grammarPool].sort((a, b) => errorRate(b.id) - errorRate(a.id))[0]
    items.push({ question: grammarQuestion(pick, rng), role: 'grammar' })
  }

  // 4. 漢字或聽力 1 題，依日期奇偶輪替，從已學或池中單字取
  const dayNum = parseInt(today.replace(/-/g, ''), 10)
  const extraSource = shuffle(pool.filter(v => !used.has(v.id)), rng)
  if (dayNum % 2 === 0) {
    const v = extraSource.find(x => hasKanji(x.japanese))
    if (v) { used.add(v.id); items.push({ question: kanjiQuestion(v, pool, rng), role: 'extra', vocabId: v.id }) }
  } else {
    const v = extraSource[0]
    if (v) { used.add(v.id); items.push({ question: listeningQuestion(v, pool, rng), role: 'extra', vocabId: v.id }) }
  }

  // 補位：先用剩餘新單字，再用已學單字隨機複習，直到 LESSON_SIZE
  const fillers = [
    ...unlearned.filter(v => !used.has(v.id)),
    ...shuffle(pool.filter(v => learned.has(v.id) && !used.has(v.id)), rng),
  ]
  // 補位的未學單字標 'extra'（spec 的「新單字」固定 3 個），已學單字標 'review'
  for (const v of fillers) {
    if (items.length >= LESSON_SIZE) break
    used.add(v.id)
    const role: LessonItem['role'] = learned.has(v.id) ? 'review' : 'extra'
    items.push({ question: vocabQuestion(v, pool, rng), role, vocabId: v.id })
  }

  return items.slice(0, LESSON_SIZE)
}
```

- [ ] **Step 4: 跑測試確認通過**

Run: `node_modules/.bin/jest __tests__/lesson.test.ts`
Expected: PASS，9 tests

- [ ] **Step 5: 型別檢查與 commit**

Run: `node_modules/.bin/tsc --noEmit`
Expected: 無輸出

```bash
git add lib/lesson.ts __tests__/lesson.test.ts
git commit -m "feat(lesson): composeLesson 純函式 — 複習5/新字3/文法1/漢字或聽力1，補位規則

Claude-Session: https://claude.ai/code/session_01HH5tzELse2kVzX6LvEsQae"
```

---

### Task 5: 課程畫面 `screens/LessonScreen.tsx` 與成績頁

**Files:**
- Create: `screens/LessonScreen.tsx`
- Modify: `App.tsx`（Stack 加 `Lesson`）、`locales/zh-TW.json`、`locales/en.json`、`locales/ko.json`（新增 `lesson` 區塊）、`lib/storage.ts`（`recordLessonResult`）
- Test: `__tests__/lesson-record.test.ts`、`__tests__/i18n.test.ts`（既有，驗 key 一致）

**Interfaces:**
- Consumes: `composeLesson / LessonItem / levelMasteryRatio`（Task 4）、`usePro`（Task 2）、`getUserLevel / setUserLevel / getLevelPromptDismissedUntil / setLevelPromptDismissedUntil / loadProgress / loadGrammarStats / saveGrammarResult / updateSRSCard / markWordLearned / recordDailyActivity`（Task 3）、`createSRSCard / updateSRSCard as computeNextSRS`（`lib/srs.ts`）、`speakJapanese`（`lib/speech.ts`）、`JLPT_LEVELS`
- Produces:
  ```ts
  // lib/storage.ts
  export interface LessonSummary { correct: number; total: number; newWords: number; reviewed: number; durationS: number }
  export async function recordLessonResult(summary: LessonSummary, opts?: { isPro?: boolean }): Promise<StreakUpdateResult>
  export async function getLastLessonDate(): Promise<string | null>   // YYYY-MM-DD；HomeScreen 用來判斷今天完成了沒
  export async function getFreezeUsedDate(): Promise<string | null>   // YYYY-MM-DD；當天用了凍結時 HomeScreen 顯示提示
  // Navigation
  navigation.navigate('Lesson')   // 無參數
  ```
  `recordLessonResult` = 寫 `last_lesson_date` + 呼叫 `recordDailyActivity(newWords, reviewed, 0, 0, opts)` 並回傳其結果。

- [ ] **Step 1: 寫失敗測試（storage 部分）**

```ts
// __tests__/lesson-record.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { recordLessonResult, getLastLessonDate, loadProgress, getTodayString } from '../lib/storage'

beforeEach(async () => { await AsyncStorage.clear() })

test('recordLessonResult 寫 last_lesson_date、累計每日統計、回傳 streak 結果', async () => {
  const r = await recordLessonResult({ correct: 8, total: 10, newWords: 3, reviewed: 5, durationS: 180 })
  expect(r.freezeUsed).toBe(false)
  expect(await getLastLessonDate()).toBe(getTodayString())
  const p = await loadProgress()
  expect(p.streak).toBe(1)
  const today = p.dailyHistory.find(d => d.date === getTodayString())!
  expect(today.newWordsLearned).toBe(3)
  expect(today.wordsReviewed).toBe(5)
})

test('沒做過課程時 getLastLessonDate 回 null', async () => {
  expect(await getLastLessonDate()).toBeNull()
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `node_modules/.bin/jest __tests__/lesson-record.test.ts`
Expected: FAIL，`recordLessonResult is not a function`

- [ ] **Step 3: 加 storage 函式**

`lib/storage.ts` 在 `resetProgress` 前加：
```ts
const LAST_LESSON_DATE_KEY = 'last_lesson_date'
const FREEZE_USED_DATE_KEY = 'freeze_used_date'

export interface LessonSummary {
  correct: number
  total: number
  newWords: number
  reviewed: number
  durationS: number
}

/** 課程完成：打卡 + 記當日統計 + 記最後完成日期（首頁判斷「今天完成了」用）。 */
export async function recordLessonResult(summary: LessonSummary, opts: { isPro?: boolean } = {}): Promise<StreakUpdateResult> {
  const result = await recordDailyActivity(summary.newWords, summary.reviewed, 0, 0, opts)
  try {
    await AsyncStorage.setItem(LAST_LESSON_DATE_KEY, getTodayString())
    // 首頁要顯示「昨天用了一張凍結」，但 progress 沒存這件事，單獨記日期
    if (result.freezeUsed) await AsyncStorage.setItem(FREEZE_USED_DATE_KEY, getTodayString())
  } catch { /* best-effort */ }
  return result
}

export async function getLastLessonDate(): Promise<string | null> {
  try { return await AsyncStorage.getItem(LAST_LESSON_DATE_KEY) } catch { return null }
}

export async function getFreezeUsedDate(): Promise<string | null> {
  try { return await AsyncStorage.getItem(FREEZE_USED_DATE_KEY) } catch { return null }
}
```
`resetProgress` 加 `await AsyncStorage.multiRemove([LAST_LESSON_DATE_KEY, FREEZE_USED_DATE_KEY])`。

- [ ] **Step 4: 跑測試確認通過**

Run: `node_modules/.bin/jest __tests__/lesson-record.test.ts`
Expected: PASS，2 tests

- [ ] **Step 5: 加 i18n key（三份語系檔都要）**

`locales/zh-TW.json` 新增頂層 `"lesson"`：
```json
"lesson": {
  "title": "今日課程",
  "roleReview": "複習",
  "roleNew": "新單字",
  "roleGrammar": "文法",
  "roleExtra": "加碼",
  "listenPrompt": "聽聽看，選出你聽到的詞",
  "replay": "再聽一次",
  "next": "下一題",
  "finish": "看成績",
  "resultTitle": "今天完成了！",
  "resultScore": "答對 {{correct}} / {{total}}",
  "resultNew": "新學 {{count}} 個單字",
  "resultReviewed": "複習 {{count}} 個單字",
  "resultStreak": "連勝 {{count}} 天",
  "resultFreezeUsed": "昨天用了一張凍結，連勝保住了",
  "resultFreezeEarned": "獲得一張連勝凍結！",
  "resultBadge": "解鎖 {{count}} 日勳章",
  "levelUpTitle": "要挑戰 {{level}} 了嗎？",
  "levelUpMessage": "你已經學會 {{pct}}% 的 {{current}} 單字，可以升級到 {{level}}。",
  "levelUpAccept": "升級",
  "levelUpLater": "再等等",
  "backHome": "回首頁",
  "exitTitle": "離開課程？",
  "exitMessage": "這節課的進度不會保存。",
  "exitConfirm": "離開"
}
```
`locales/en.json`：
```json
"lesson": {
  "title": "Today's Lesson",
  "roleReview": "Review", "roleNew": "New word", "roleGrammar": "Grammar", "roleExtra": "Bonus",
  "listenPrompt": "Listen and pick the word you heard",
  "replay": "Play again", "next": "Next", "finish": "See results",
  "resultTitle": "Done for today!",
  "resultScore": "{{correct}} / {{total}} correct",
  "resultNew": "{{count}} new words", "resultReviewed": "{{count}} words reviewed",
  "resultStreak": "{{count}}-day streak",
  "resultFreezeUsed": "A streak freeze saved yesterday — streak kept",
  "resultFreezeEarned": "You earned a streak freeze!",
  "resultBadge": "{{count}}-day badge unlocked",
  "levelUpTitle": "Ready for {{level}}?",
  "levelUpMessage": "You know {{pct}}% of {{current}} words. Move up to {{level}}?",
  "levelUpAccept": "Level up", "levelUpLater": "Not yet",
  "backHome": "Back to Home",
  "exitTitle": "Leave lesson?", "exitMessage": "Progress in this lesson won't be saved.", "exitConfirm": "Leave"
}
```
`locales/ko.json`：
```json
"lesson": {
  "title": "오늘의 수업",
  "roleReview": "복습", "roleNew": "새 단어", "roleGrammar": "문법", "roleExtra": "보너스",
  "listenPrompt": "듣고 들린 단어를 고르세요",
  "replay": "다시 듣기", "next": "다음", "finish": "결과 보기",
  "resultTitle": "오늘 완료!",
  "resultScore": "{{correct}} / {{total}} 정답",
  "resultNew": "새 단어 {{count}}개", "resultReviewed": "복습 {{count}}개",
  "resultStreak": "{{count}}일 연속",
  "resultFreezeUsed": "어제 연속 보호권을 사용해 연속이 유지됐어요",
  "resultFreezeEarned": "연속 보호권을 획득했어요!",
  "resultBadge": "{{count}}일 배지 획득",
  "levelUpTitle": "{{level}}에 도전할까요?",
  "levelUpMessage": "{{current}} 단어의 {{pct}}%를 익혔어요. {{level}}로 올라갈까요?",
  "levelUpAccept": "올리기", "levelUpLater": "나중에",
  "backHome": "홈으로",
  "exitTitle": "수업을 나갈까요?", "exitMessage": "이 수업의 진행 상황은 저장되지 않아요.", "exitConfirm": "나가기"
}
```

Run: `node_modules/.bin/jest __tests__/i18n.test.ts`
Expected: PASS（三份 key 一致）

- [ ] **Step 6: 寫 `screens/LessonScreen.tsx`**

```tsx
// screens/LessonScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import * as Haptics from 'expo-haptics'
import { composeLesson, levelMasteryRatio, type LessonItem } from '../lib/lesson'
import {
  loadProgress, loadGrammarStats, saveGrammarResult, updateSRSCard, markWordLearned,
  recordLessonResult, getUserLevel, setUserLevel, getLevelPromptDismissedUntil, setLevelPromptDismissedUntil,
  getTodayString, toLocalDateString, type StreakUpdateResult,
} from '../lib/storage'
import { createSRSCard, updateSRSCard as computeNextSRS } from '../lib/srs'
import { speakJapanese } from '../lib/speech'
import { usePro } from '../lib/pro'
import { getVocabularyById, getVocabularyByCategory } from '../data/vocabulary'
import { JLPT_LEVELS, type JlptLevel, type UserProgress } from '../types'
import { useTheme } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'

const LEVEL_UP_THRESHOLD = 0.8
const LEVEL_UP_SNOOZE_DAYS = 7

type Phase = 'loading' | 'quiz' | 'result'

interface Summary {
  correct: number
  total: number
  newWords: number
  reviewed: number
  streak: StreakUpdateResult
  streakDays: number
}

export default function LessonScreen() {
  const navigation = useNavigation<any>()
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { pro } = usePro()

  const [phase, setPhase] = useState<Phase>('loading')
  const [items, setItems] = useState<LessonItem[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [level, setLevel] = useState<JlptLevel>('N5')
  const startedAt = useRef(Date.now())
  const newIds = useRef<Set<string>>(new Set())
  const reviewedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    (async () => {
      const [progress, grammarStats, lvl] = await Promise.all([loadProgress(), loadGrammarStats(), getUserLevel()])
      setLevel(lvl)
      const composed = composeLesson({ progress, level: lvl, grammarStats, today: getTodayString() })
      setItems(composed)
      setPhase('quiz')
      if (composed[0]?.question.kind === 'listening') speakJapanese(composed[0].question.audioText!)
    })()
  }, [])

  const current = items[index]

  const handleSelect = async (option: string) => {
    if (!current || selected) return
    setSelected(option)
    const correct = option === current.question.answer
    if (correct) setCorrectCount(c => c + 1)
    Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error)

    // 寫回學習狀態：單字類更新 SRS 與已學；文法寫統計
    if (current.question.kind === 'grammar') {
      await saveGrammarResult(current.question.id, correct)
    } else if (current.vocabId) {
      const progress = await loadProgress()
      const card = progress.srsCards.find(c => c.id === current.vocabId) ?? createSRSCard(current.vocabId, 'vocabulary')
      await updateSRSCard(computeNextSRS(card, correct ? 'good' : 'unknown'))
      const wasLearned = progress.learnedIds.includes(current.vocabId)
      if (!wasLearned) {
        const v = getVocabularyById(current.vocabId)
        if (v) await markWordLearned(v.id, v.category, getVocabularyByCategory(v.category).length, { isPro: pro })
        newIds.current.add(current.vocabId)
      } else {
        reviewedIds.current.add(current.vocabId)
      }
    }
  }

  const handleNext = async () => {
    if (index + 1 < items.length) {
      const nextIdx = index + 1
      setIndex(nextIdx)
      setSelected(null)
      const q = items[nextIdx].question
      if (q.kind === 'listening' && q.audioText) speakJapanese(q.audioText)
      return
    }
    const durationS = Math.round((Date.now() - startedAt.current) / 1000)
    const streak = await recordLessonResult(
      { correct: correctCount, total: items.length, newWords: newIds.current.size, reviewed: reviewedIds.current.size, durationS },
      { isPro: pro },
    )
    const progress = await loadProgress()
    setSummary({ correct: correctCount, total: items.length, newWords: newIds.current.size, reviewed: reviewedIds.current.size, streak, streakDays: progress.streak })
    setPhase('result')
    maybePromptLevelUp(progress)
  }

  const maybePromptLevelUp = async (p: UserProgress) => {
    const idx = JLPT_LEVELS.indexOf(level)
    if (idx < 0 || idx === JLPT_LEVELS.length - 1) return
    const ratio = levelMasteryRatio(p, level)
    if (ratio < LEVEL_UP_THRESHOLD) return
    const until = await getLevelPromptDismissedUntil()
    if (until && until > getTodayString()) return
    const next = JLPT_LEVELS[idx + 1]
    Alert.alert(
      t('lesson.levelUpTitle', { level: next }),
      t('lesson.levelUpMessage', { pct: Math.round(ratio * 100), current: level, level: next }),
      [
        { text: t('lesson.levelUpLater'), style: 'cancel', onPress: async () => {
          const d = new Date(); d.setDate(d.getDate() + LEVEL_UP_SNOOZE_DAYS)
          await setLevelPromptDismissedUntil(toLocalDateString(d))
        } },
        { text: t('lesson.levelUpAccept'), onPress: () => setUserLevel(next) },
      ],
    )
  }

  const confirmExit = () => {
    Alert.alert(t('lesson.exitTitle'), t('lesson.exitMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('lesson.exitConfirm'), style: 'destructive', onPress: () => navigation.goBack() },
    ])
  }

  if (phase === 'loading' || !current) return <SafeAreaView style={styles.container} />

  if (phase === 'result' && summary) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <Text style={styles.resultEmoji}>🎉</Text>
          <Text style={styles.resultTitle}>{t('lesson.resultTitle')}</Text>
          <Text style={styles.resultBig}>{t('lesson.resultScore', { correct: summary.correct, total: summary.total })}</Text>
          <Text style={styles.resultLine}>{t('lesson.resultNew', { count: summary.newWords })}</Text>
          <Text style={styles.resultLine}>{t('lesson.resultReviewed', { count: summary.reviewed })}</Text>
          <Text style={styles.resultLine}>🔥 {t('lesson.resultStreak', { count: summary.streakDays })}</Text>
          {summary.streak.freezeUsed && <Text style={styles.resultNote}>🧊 {t('lesson.resultFreezeUsed')}</Text>}
          {summary.streak.freezeEarned && <Text style={styles.resultNote}>🧊 {t('lesson.resultFreezeEarned')}</Text>}
          {summary.streak.newBadges.map(b => (
            <Text key={b} style={styles.resultNote}>🏅 {t('lesson.resultBadge', { count: b })}</Text>
          ))}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>{t('lesson.backHome')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }

  const q = current.question
  const roleLabel = {
    review: t('lesson.roleReview'), new: t('lesson.roleNew'), grammar: t('lesson.roleGrammar'), extra: t('lesson.roleExtra'),
  }[current.role]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={confirmExit}><Text style={styles.back}>{t('common.back')}</Text></TouchableOpacity>
        <Text style={styles.progressText}>{t('common.progressFraction', { current: index + 1, total: items.length })}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(index / items.length) * 100}%` as any }]} />
      </View>

      <View style={styles.card}>
        <Text style={styles.roleChip}>{roleLabel}</Text>
        {q.kind === 'listening' ? (
          <>
            <Text style={styles.prompt}>{t('lesson.listenPrompt')}</Text>
            <TouchableOpacity style={styles.replayBtn} onPress={() => q.audioText && speakJapanese(q.audioText)}>
              <Text style={styles.replayText}>🔊 {t('lesson.replay')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.prompt}>{q.prompt}</Text>
        )}
      </View>

      <View style={styles.options}>
        {q.options.map(opt => {
          const isAnswer = opt === q.answer
          const isSelected = opt === selected
          const bg = !selected ? colors.card : isAnswer ? '#DCFCE7' : isSelected ? '#FEE2E2' : colors.card
          return (
            <TouchableOpacity key={opt} style={[styles.option, { backgroundColor: bg }]} onPress={() => handleSelect(opt)} disabled={!!selected}>
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {selected && (
        <View style={styles.feedback}>
          {q.explanation ? <Text style={styles.explanation}>{q.explanation}</Text> : null}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>{index + 1 < items.length ? t('lesson.next') : t('lesson.finish')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    back: { fontSize: 15, color: colors.primary },
    progressText: { fontSize: 13, color: colors.subtext },
    progressBar: { height: 6, backgroundColor: colors.border, marginHorizontal: 20, borderRadius: 3 },
    progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
    card: { margin: 20, padding: 24, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center' },
    roleChip: { fontSize: 12, color: colors.subtext, marginBottom: 12, letterSpacing: 1 },
    prompt: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center' },
    replayBtn: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.bg },
    replayText: { fontSize: 15, color: colors.primary },
    options: { paddingHorizontal: 20, gap: 10 },
    option: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    optionText: { fontSize: 17, color: colors.text, textAlign: 'center' },
    feedback: { padding: 20, gap: 12 },
    explanation: { fontSize: 14, color: colors.subtext, lineHeight: 20 },
    primaryBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    resultContent: { padding: 24, alignItems: 'center', gap: 8 },
    resultEmoji: { fontSize: 56, marginTop: 24 },
    resultTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
    resultBig: { fontSize: 32, fontWeight: '800', color: colors.primary, marginVertical: 8 },
    resultLine: { fontSize: 16, color: colors.text },
    resultNote: { fontSize: 14, color: colors.subtext, marginTop: 4 },
  })
}
```

`markWordLearned` 的第四個參數 `opts` 是 Task 3 加的；若 Task 3 未加，請在 `lib/storage.ts` 補上 `opts: { isPro?: boolean } = {}` 並傳給 `updateStreak`。`ThemeColors` 必須有 `background / card / border / text / subtext / primary`，先用 `grep -n "card\|border" lib/theme.ts` 確認欄位名，不存在就改用既有名稱。

- [ ] **Step 7: 掛進導航**

`App.tsx`：`import LessonScreen from './screens/LessonScreen'`，Stack 內 `MainTabs` 之後加
```tsx
<Stack.Screen name="Lesson" component={LessonScreen} options={{ gestureEnabled: false }} />
```

- [ ] **Step 8: 型別檢查、全部測試、模擬器驗收**

Run: `node_modules/.bin/tsc --noEmit && node_modules/.bin/jest`
Expected: 全綠

模擬器：`node_modules/.bin/expo run:ios` 後，暫時在 HomeScreen 任一按鈕 `navigation.navigate('Lesson')`（Task 6 會正式接），跑完 10 題看到成績頁，截圖存 `screenshots/lesson-quiz.png`、`screenshots/lesson-result.png`。（`screenshots/` 已在 .gitignore，不會進 repo。）

- [ ] **Step 9: Commit**

```bash
git add screens/LessonScreen.tsx App.tsx lib/storage.ts locales/zh-TW.json locales/en.json locales/ko.json __tests__/lesson-record.test.ts
git commit -m "feat(lesson): LessonScreen 十題課程流程 + 成績頁 + 級別升級提示

Claude-Session: https://claude.ai/code/session_01HH5tzELse2kVzX6LvEsQae"
```

---

### Task 6: 「今天」頁（改寫 `screens/HomeScreen.tsx`）

**Files:**
- Modify: `screens/HomeScreen.tsx`（L16-125 的資料載入與上半部 UI）、`screens/ProgressScreen.tsx`（級別設定列）、`locales/*.json`（`home`、`progress` 新增 key）
- Consumes 另含 `getFreezeUsedDate`（Task 5）、`getUserLevel / setUserLevel`（Task 3）
- Test: `__tests__/i18n.test.ts`（既有）

**Interfaces:**
- Consumes: `loadProgress / getLastLessonDate / getTodayString`（Task 5）、`getDueCards`、`maybeAskForReview`
- Produces: 無新模組。首頁 `useFocusEffect` 重新載入，離開課程回來時數字即時更新。

- [ ] **Step 1: 加 i18n key（三份）**

zh-TW `home` 內新增：
```json
"startLesson": "開始今日課程",
"lessonDone": "今天完成了",
"lessonDoneSub": "答對 {{correct}} / {{total}}，明天見",
"practiceMore": "再練一組",
"dueReview": "{{count}} 個單字快忘了",
"dueNone": "沒有到期的複習",
"freezes": "凍結 {{count}} 張",
"freezeUsedToday": "昨天用了一張凍結，連勝保住了",
"bestStreak": "最佳紀錄 {{count}} 天",
"nextBadge": "再 {{days}} 天解鎖 {{badge}} 日勳章",
"badgeLabel": "日勳章"
```
en：
```json
"startLesson": "Start today's lesson",
"lessonDone": "Done for today",
"lessonDoneSub": "{{correct}} / {{total}} correct — see you tomorrow",
"practiceMore": "Practice one more",
"dueReview": "{{count}} words about to be forgotten",
"dueNone": "No reviews due",
"freezes": "{{count}} freezes",
"freezeUsedToday": "A freeze saved yesterday — streak kept",
"bestStreak": "Best: {{count}} days",
"nextBadge": "{{days}} more days to the {{badge}}-day badge",
"badgeLabel": "day badge"
```
ko：
```json
"startLesson": "오늘의 수업 시작",
"lessonDone": "오늘 완료",
"lessonDoneSub": "{{correct}} / {{total}} 정답, 내일 만나요",
"practiceMore": "한 세트 더",
"dueReview": "잊기 직전인 단어 {{count}}개",
"dueNone": "복습할 단어 없음",
"freezes": "보호권 {{count}}장",
"freezeUsedToday": "어제 보호권을 사용해 연속이 유지됐어요",
"bestStreak": "최고 기록 {{count}}일",
"nextBadge": "{{days}}일 더 하면 {{badge}}일 배지",
"badgeLabel": "일 배지"
```
這組 key 同時取代 HomeScreen 原本寫死的中文「再 X 天解鎖 Y 日勳章」「🏆 最佳紀錄 N 天」「日勳章」。

Run: `node_modules/.bin/jest __tests__/i18n.test.ts` → PASS

- [ ] **Step 2: 改寫 HomeScreen 的資料層與上半部**

把 L16-58 的 state 與 `useEffect` 改成：
```tsx
const [progress, setProgress] = useState<UserProgress | null>(null)
const [lessonDoneToday, setLessonDoneToday] = useState(false)
const [showTour, setShowTour] = useState(false)
const [dailyWords, setDailyWords] = useState<typeof allVocabulary>([])

const reload = useCallback(async () => {
  const [p, lastLesson, level, freezeDate] = await Promise.all([loadProgress(), getLastLessonDate(), getUserLevel(), getFreezeUsedDate()])
  setProgress(p)
  setLessonDoneToday(lastLesson === getTodayString())
  setFreezeUsedToday(freezeDate === getTodayString())
  const vocab = getVocabularyByLevel(level === 'N5' ? 'n5' : 'n4')
  const unlearned = vocab.filter(v => !p.learnedIds.includes(v.id))
  const seed = parseInt(getTodayString().replace(/-/g, ''))
  const shuffled = [...unlearned].sort((a, b) =>
    ((seed * a.id.charCodeAt(0)) % 100) - ((seed * b.id.charCodeAt(0)) % 100))
  setDailyWords(shuffled.slice(0, 5))
}, [])

useFocusEffect(useCallback(() => {
  reload()
  maybeAskForReview()
}, [reload]))

useEffect(() => {
  AsyncStorage.getItem('tour_home').then(done => { if (!done) setShowTour(true) })
}, [])
```
成績細節留在成績頁，首頁完成狀態只顯示 `t('home.lessonDone')` 一行；三份語系的 `lessonDoneSub` key 保留備用但這版不渲染。

`reload` 內同時讀 `getFreezeUsedDate()`（Task 5 已加）：
```tsx
const [freezeUsedToday, setFreezeUsedToday] = useState(false)
// reload 內：
const freezeDate = await getFreezeUsedDate()
setFreezeUsedToday(freezeDate === getTodayString())
```
在 `streak` 等衍生值之後加：
```tsx
const dueCount = progress ? getDueCards(progress.srsCards).length : 0
const freezes = progress?.streakFreezes ?? 0
```

把 L85-125（streak card 與 today stats）替換成：
```tsx
{/* 今日課程 */}
<TouchableOpacity
  style={[styles.lessonBtn, lessonDoneToday && styles.lessonBtnDone]}
  onPress={() => navigation.navigate('Lesson')}
  activeOpacity={0.9}
>
  <Text style={styles.lessonBtnTitle}>{lessonDoneToday ? `✅ ${t('home.lessonDone')}` : `▶ ${t('home.startLesson')}`}</Text>
  <Text style={styles.lessonBtnSub}>{lessonDoneToday ? t('home.practiceMore') : (dueCount > 0 ? t('home.dueReview', { count: dueCount }) : t('home.dueNone'))}</Text>
</TouchableOpacity>

{/* 連勝 + 凍結 + 到期 */}
<View style={styles.streakCard}>
  <Text style={styles.streakEmoji}>🔥</Text>
  <View style={{ flex: 1 }}>
    <Text style={styles.streakNum}>{t('home.streak', { count: streak })}</Text>
    <Text style={styles.streakSub}>
      {streak === 0 ? t('home.streakStart')
        : nextBadge ? t('home.nextBadge', { days: remainingToNext, badge: nextBadge })
        : t('home.streakKeepGoing')}
    </Text>
    {freezeUsedToday && <Text style={[styles.streakSub, { color: colors.primary }]}>🧊 {t('home.freezeUsedToday')}</Text>}
    {longestStreak > streak && <Text style={styles.streakSub}>🏆 {t('home.bestStreak', { count: longestStreak })}</Text>}
  </View>
  <View style={{ alignItems: 'flex-end', gap: 6 }}>
    <Text style={styles.freezeChip}>🧊 {t('home.freezes', { count: freezes })}</Text>
    {dueCount > 0 && <Text style={styles.dueChip}>{t('home.dueReview', { count: dueCount })}</Text>}
  </View>
</View>
```
styles 新增：
```ts
lessonBtn: { backgroundColor: colors.primary, borderRadius: 16, padding: 20, marginBottom: 16 },
lessonBtnDone: { backgroundColor: colors.success },
lessonBtnTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
lessonBtnSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
freezeChip: { fontSize: 12, color: colors.subtext },
dueChip: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
```
舊的 `badgeChip` 區塊與 `today && (...)` 的 stats row 刪除；Quick Actions 九宮格與每日推薦保留原樣。import 加 `getLastLessonDate, getUserLevel, getFreezeUsedDate`、`getDueCards`；移除未用的 `USER_LEVEL_KEY, UserLevel`。

- [ ] **Step 3: 「進度」頁加級別設定（spec 3.4：Onboarding 與設定頁共用 getUserLevel/setUserLevel）**

三份語系 `progress` 內加 `"levelSection": "🎯 目前級別"`（en `"🎯 Current level"`、ko `"🎯 현재 레벨"`）。`screens/ProgressScreen.tsx` 在通知區塊上方加：
```tsx
const [level, setLevel] = useState<JlptLevel>('N5')
// useEffect 內：getUserLevel().then(setLevel)
<View style={styles.section}>
  <Text style={styles.sectionTitle}>{t('progress.levelSection')}</Text>
  <View style={{ flexDirection: 'row', gap: 8 }}>
    {JLPT_LEVELS.map(l => (
      <TouchableOpacity key={l} style={[styles.hourBtn, level === l && styles.hourBtnActive]}
        onPress={async () => { setLevel(l); await setUserLevel(l) }}>
        <Text style={[styles.hourText, level === l && styles.hourTextActive]}>{l}</Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
```
import 加 `getUserLevel, setUserLevel`、`JLPT_LEVELS, type JlptLevel`。沿用 `hourBtn` 系列樣式。

- [ ] **Step 4: 型別檢查、測試、截圖**

Run: `node_modules/.bin/tsc --noEmit && node_modules/.bin/jest`
Expected: 全綠

模擬器三個狀態各截一張：未完成（`screenshots/home-todo.png`）、完成後（`home-done.png`）、有到期單字顯示紅字（`home-due.png`）。切換語系到 en、ko 各看一次首頁沒有中文殘留。

- [ ] **Step 5: Commit**

```bash
git add screens/HomeScreen.tsx screens/ProgressScreen.tsx locales/zh-TW.json locales/en.json locales/ko.json
git commit -m "feat(home): 首頁改「今天」頁 — 開始今日課程、連勝凍結、到期紅字；首頁中文字串走 i18n

Claude-Session: https://claude.ai/code/session_01HH5tzELse2kVzX6LvEsQae"
```

---

### Task 7: 通知 — i18n、條件式連勝風險、召回序列、權限時機

**Files:**
- Modify: `lib/notifications.ts`（整檔）、`App.tsx`（AppState）、`screens/LessonScreen.tsx`（成績頁問權限）、`screens/ProgressScreen.tsx:285-291`（開關同步）、`locales/*.json`（新增頂層 `notif`）
- Test: `__tests__/notifications.test.ts`

**Interfaces:**
- Consumes: `i18n`（`lib/i18n.ts` default export，用 `i18n.t`）、`UserProgress`、`getDueCards`、`getTodayString`、`recordLessonResult`（Task 5）
- Produces:
  ```ts
  export const DAILY_NOTIF_ID = 'daily-reminder'
  export const STREAK_NOTIF_ID = 'streak-warning'
  export const LAPSE_IDS = ['lapse-1', 'lapse-3', 'lapse-7'] as const
  export const LAPSE_DAYS = [1, 3, 7] as const
  export const DEFAULT_LAPSE_HOUR = 19
  export async function scheduleDaily(hour: number, minute?: number, context?: DailyScheduleContext): Promise<void>  // 既有，改文案走 i18n，且不再排 streak-warning
  export async function cancelNotifications(): Promise<void>   // 既有，取消全部並 enabled=false
  export async function getNotificationSettings(): Promise<{ enabled: boolean; hour: number; minute: number }>  // 既有，加 minute
  export async function syncStreakRiskNotification(progress: UserProgress, now?: Date): Promise<void>
  //   當天已打卡（lastStudyDate === today）或 streak < 1 → cancel STREAK_NOTIF_ID；否則排今天 21:30 一次性（若已過 21:30 則不排）
  export async function scheduleLapseReminders(progress: UserProgress, now?: Date): Promise<void>
  //   取消三則舊的，重排 D+1/D+3/D+7，時間 = 使用者提醒小時（未設定 → DEFAULT_LAPSE_HOUR）
  export function lapseBody(day: 1 | 3 | 7, ctx: { dueIn: number; streak: number; level: string }): string
  export function countDueWithin(cards: SRSCard[], days: number, now?: Date): number
  export async function hasAskedNotificationPermission(): Promise<boolean>
  export async function markAskedNotificationPermission(): Promise<void>
  export function suggestReminderTime(now?: Date): { hour: number; minute: number }   // 四捨五入到整點或半點
  ```

- [ ] **Step 1: 寫失敗測試**

```ts
// __tests__/notifications.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

// jest.mock 工廠只能引用 mock 開頭的外部變數
const mockScheduled: any[] = []
const mockCancelled: string[] = []
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async (req: any) => { mockScheduled.push(req); return req.identifier }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => { mockCancelled.push(id) }),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => { mockScheduled.length = 0 }),
  SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date' },
}))
const scheduled = mockScheduled
const cancelled = mockCancelled
jest.mock('../lib/i18n', () => {
  const t = (key: string, opts?: Record<string, unknown>) => `${key}${opts ? ':' + JSON.stringify(opts) : ''}`
  return { __esModule: true, default: { t, language: 'zh-TW' } }
})

import {
  syncStreakRiskNotification, scheduleLapseReminders, countDueWithin, suggestReminderTime,
  hasAskedNotificationPermission, markAskedNotificationPermission, lapseBody,
  STREAK_NOTIF_ID, LAPSE_IDS, DEFAULT_LAPSE_HOUR,
} from '../lib/notifications'
import { toLocalDateString } from '../lib/storage'
import type { UserProgress, SRSCard } from '../types'

function base(over: Partial<UserProgress> = {}): UserProgress {
  return {
    streak: 0, longestStreak: 0, lastStudyDate: '', totalWordsLearned: 0, categoryProgress: {},
    dailyHistory: [], srsCards: [], learnedIds: [], earnedBadges: [], streakFreezes: 0, dateSchema: 'local', ...over,
  }
}
function card(id: string, daysFromNow: number, now: Date): SRSCard {
  const d = new Date(now); d.setDate(d.getDate() + daysFromNow)
  return { id, type: 'vocabulary', nextReview: d.toISOString(), interval: 1, repetitions: 1, easeFactor: 2.5 }
}

beforeEach(async () => { await AsyncStorage.clear(); scheduled.length = 0; cancelled.length = 0 })

describe('syncStreakRiskNotification', () => {
  const now = new Date(2026, 9, 12, 18, 0)
  test('當天已打卡 → 取消，不排', async () => {
    await syncStreakRiskNotification(base({ streak: 5, lastStudyDate: toLocalDateString(now) }), now)
    expect(cancelled).toContain(STREAK_NOTIF_ID)
    expect(scheduled.find(s => s.identifier === STREAK_NOTIF_ID)).toBeUndefined()
  })
  test('未打卡且 streak ≥ 1 → 排今天 21:30 一次性', async () => {
    const y = new Date(now); y.setDate(y.getDate() - 1)
    await syncStreakRiskNotification(base({ streak: 5, lastStudyDate: toLocalDateString(y) }), now)
    const req = scheduled.find(s => s.identifier === STREAK_NOTIF_ID)
    expect(req).toBeDefined()
    expect(req.trigger.type).toBe('date')
    const fire = new Date(req.trigger.date)
    expect(fire.getHours()).toBe(21); expect(fire.getMinutes()).toBe(30)
    expect(toLocalDateString(fire)).toBe(toLocalDateString(now))
  })
  test('streak 0 → 不排', async () => {
    await syncStreakRiskNotification(base({ streak: 0 }), now)
    expect(scheduled.find(s => s.identifier === STREAK_NOTIF_ID)).toBeUndefined()
  })
  test('已過 21:30 → 不排', async () => {
    const late = new Date(2026, 9, 12, 22, 0)
    const y = new Date(late); y.setDate(y.getDate() - 1)
    await syncStreakRiskNotification(base({ streak: 5, lastStudyDate: toLocalDateString(y) }), late)
    expect(scheduled.find(s => s.identifier === STREAK_NOTIF_ID)).toBeUndefined()
  })
})

describe('scheduleLapseReminders', () => {
  const now = new Date(2026, 9, 12, 20, 15)
  test('先取消三則再排 D+1/D+3/D+7，預設 19:00', async () => {
    await scheduleLapseReminders(base({ streak: 3 }), now)
    for (const id of LAPSE_IDS) expect(cancelled).toContain(id)
    const reqs = LAPSE_IDS.map(id => scheduled.find(s => s.identifier === id))
    expect(reqs.every(Boolean)).toBe(true)
    const days = reqs.map(r => Math.round((new Date(r.trigger.date).getTime() - now.getTime()) / 86400000))
    expect(days).toEqual([1, 3, 7])
    expect(new Date(reqs[0].trigger.date).getHours()).toBe(DEFAULT_LAPSE_HOUR)
  })
  test('使用者有設提醒時間就用那個小時', async () => {
    await AsyncStorage.setItem('notification_hour', '8')
    await scheduleLapseReminders(base(), now)
    expect(new Date(scheduled.find(s => s.identifier === 'lapse-3').trigger.date).getHours()).toBe(8)
  })
  test('文案帶到期數與連勝', async () => {
    const p = base({ streak: 9, srsCards: [card('a', 0, now), card('b', 2, now), card('c', 10, now)] })
    await scheduleLapseReminders(p, now)
    const d3 = scheduled.find(s => s.identifier === 'lapse-3')
    expect(d3.content.body).toContain('notif.lapse3')
    expect(d3.content.body).toContain('"streak":9')
  })
})

test('countDueWithin', () => {
  const now = new Date(2026, 9, 12, 12, 0)
  const cards = [card('a', -1, now), card('b', 0, now), card('c', 2, now), card('d', 5, now)]
  expect(countDueWithin(cards, 1, now)).toBe(2)
  expect(countDueWithin(cards, 3, now)).toBe(3)
  expect(countDueWithin(cards, 7, now)).toBe(4)
})

test('suggestReminderTime 四捨五入到整點或半點', () => {
  expect(suggestReminderTime(new Date(2026, 9, 12, 20, 10))).toEqual({ hour: 20, minute: 0 })
  expect(suggestReminderTime(new Date(2026, 9, 12, 20, 20))).toEqual({ hour: 20, minute: 30 })
  expect(suggestReminderTime(new Date(2026, 9, 12, 20, 50))).toEqual({ hour: 21, minute: 0 })
  expect(suggestReminderTime(new Date(2026, 9, 12, 23, 50))).toEqual({ hour: 0, minute: 0 })
})

test('權限對話只問一次（永久旗標）', async () => {
  expect(await hasAskedNotificationPermission()).toBe(false)
  await markAskedNotificationPermission()
  expect(await hasAskedNotificationPermission()).toBe(true)
})

test('lapseBody 三種文案都走 i18n', () => {
  expect(lapseBody(1, { dueIn: 4, streak: 2, level: 'N5' })).toContain('notif.lapse1')
  expect(lapseBody(3, { dueIn: 4, streak: 2, level: 'N5' })).toContain('notif.lapse3')
  expect(lapseBody(7, { dueIn: 4, streak: 2, level: 'N5' })).toContain('notif.lapse7')
})
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `node_modules/.bin/jest __tests__/notifications.test.ts`
Expected: FAIL，`syncStreakRiskNotification is not a function`

- [ ] **Step 3: 加 i18n `notif` 區塊（三份）**

zh-TW：
```json
"notif": {
  "dailyTitle": "🌸 日語學習時間！",
  "dailyDue": "今天有 {{count}} 個單字到期複習，10 分鐘就能掃完 🔥",
  "dailyMilestone": "🔥 連勝第 {{streak}} 天！再 {{remaining}} 天解鎖「{{milestone}} 日勳章」",
  "dailyRecord": "🏆 {{streak}} 天連勝 — 你正在創造個人新紀錄",
  "dailyStreak": "🔥 連勝第 {{streak}} 天，繼續保持！",
  "dailyGeneric": "今日份的日文練習等你來！",
  "streakRiskTitle": "🔥 別讓連勝斷在今天",
  "streakRiskBody": "你的 {{streak}} 天連勝今天還沒打卡，3 分鐘就能保住記錄！",
  "lapseTitle": "Nihongo Manabi",
  "lapse1": "你有 {{dueIn}} 個單字快忘了，3 分鐘複習一下",
  "lapse3": "連勝停在 {{streak}} 天，今天重新開始只要 3 分鐘",
  "lapse7": "我們幫你把 {{level}} 的進度留著了，隨時回來",
  "askTitle": "明天 {{time}} 提醒你？",
  "askMessage": "每天一節課，三分鐘就夠。我們在你剛才學習的時間提醒你。",
  "askYes": "好",
  "askNo": "先不要"
}
```
en：
```json
"notif": {
  "dailyTitle": "🌸 Time for Japanese!",
  "dailyDue": "{{count}} words are due for review — 10 minutes clears them 🔥",
  "dailyMilestone": "🔥 Day {{streak}}! {{remaining}} more days to the {{milestone}}-day badge",
  "dailyRecord": "🏆 {{streak}}-day streak — a new personal record",
  "dailyStreak": "🔥 Day {{streak}} — keep it going!",
  "dailyGeneric": "Today's Japanese practice is waiting!",
  "streakRiskTitle": "🔥 Don't break your streak today",
  "streakRiskBody": "Your {{streak}}-day streak isn't checked in yet — 3 minutes saves it!",
  "lapseTitle": "Nihongo Manabi",
  "lapse1": "{{dueIn}} words are slipping away — a 3-minute review fixes that",
  "lapse3": "Your streak stopped at {{streak}} days. Restart today in 3 minutes",
  "lapse7": "We kept your {{level}} progress safe. Come back anytime",
  "askTitle": "Remind you tomorrow at {{time}}?",
  "askMessage": "One lesson a day, three minutes. We'll nudge you at the time you just studied.",
  "askYes": "Sure",
  "askNo": "Not now"
}
```
ko：
```json
"notif": {
  "dailyTitle": "🌸 일본어 공부 시간!",
  "dailyDue": "오늘 복습할 단어 {{count}}개, 10분이면 끝 🔥",
  "dailyMilestone": "🔥 연속 {{streak}}일! {{remaining}}일 더 하면 {{milestone}}일 배지",
  "dailyRecord": "🏆 {{streak}}일 연속 — 개인 최고 기록 갱신 중",
  "dailyStreak": "🔥 연속 {{streak}}일, 계속 가요!",
  "dailyGeneric": "오늘의 일본어 연습이 기다리고 있어요!",
  "streakRiskTitle": "🔥 오늘 연속을 끊지 마세요",
  "streakRiskBody": "{{streak}}일 연속, 아직 오늘 체크인 전이에요. 3분이면 지켜요!",
  "lapseTitle": "Nihongo Manabi",
  "lapse1": "잊기 직전인 단어 {{dueIn}}개, 3분만 복습해요",
  "lapse3": "연속이 {{streak}}일에서 멈췄어요. 오늘 다시 시작하는 데 3분이면 돼요",
  "lapse7": "{{level}} 진행 상황을 잘 보관해 뒀어요. 언제든 돌아오세요",
  "askTitle": "내일 {{time}}에 알려드릴까요?",
  "askMessage": "하루 한 수업, 3분이면 충분해요. 방금 공부한 시간에 알려드릴게요.",
  "askYes": "좋아요",
  "askNo": "나중에"
}
```

- [ ] **Step 4: 改寫 `lib/notifications.ts`**

```ts
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from './i18n'
import type { UserProgress, SRSCard } from '../types'
import { STREAK_BADGES } from '../types'
import { toLocalDateString } from './storage'

const NOTIF_HOUR_KEY = 'notification_hour'
const NOTIF_MINUTE_KEY = 'notification_minute'
const NOTIF_ENABLED_KEY = 'notification_enabled'
const NOTIF_ASKED_KEY = 'notification_asked'
export const DAILY_NOTIF_ID = 'daily-reminder'
export const STREAK_NOTIF_ID = 'streak-warning'
export const LAPSE_IDS = ['lapse-1', 'lapse-3', 'lapse-7'] as const
export const LAPSE_DAYS = [1, 3, 7] as const
export const DEFAULT_LAPSE_HOUR = 19
const STREAK_RISK_HOUR = 21
const STREAK_RISK_MINUTE = 30

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true,
  }),
})

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export interface DailyScheduleContext {
  dueCount?: number
  currentStreak?: number
  longestStreak?: number
}

/** 每日提醒（固定時間，每天重複）。連勝風險通知改由 syncStreakRiskNotification 條件式管理。 */
export async function scheduleDaily(hour: number, minute: number = 0, context: DailyScheduleContext = {}): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIF_ID)
  const granted = await requestPermissions()
  if (!granted) return
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_NOTIF_ID,
    content: { title: i18n.t('notif.dailyTitle'), body: composeDailyBody(context), sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  })
  await AsyncStorage.setItem(NOTIF_HOUR_KEY, String(hour))
  await AsyncStorage.setItem(NOTIF_MINUTE_KEY, String(minute))
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true')
}

export async function cancelNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false')
}

export async function getNotificationSettings(): Promise<{ enabled: boolean; hour: number; minute: number }> {
  const [enabled, hour, minute] = await Promise.all([
    AsyncStorage.getItem(NOTIF_ENABLED_KEY), AsyncStorage.getItem(NOTIF_HOUR_KEY), AsyncStorage.getItem(NOTIF_MINUTE_KEY),
  ])
  return { enabled: enabled === 'true', hour: hour ? parseInt(hour, 10) : 9, minute: minute ? parseInt(minute, 10) : 0 }
}

function composeDailyBody({ dueCount, currentStreak, longestStreak }: DailyScheduleContext): string {
  if (dueCount && dueCount > 0) return i18n.t('notif.dailyDue', { count: dueCount })
  if (currentStreak && currentStreak >= 1) {
    const milestone = STREAK_BADGES.find(m => m > currentStreak)
    if (milestone && milestone - currentStreak <= 3) {
      return i18n.t('notif.dailyMilestone', { streak: currentStreak, remaining: milestone - currentStreak, milestone })
    }
    if (longestStreak && currentStreak >= longestStreak && currentStreak >= 7) {
      return i18n.t('notif.dailyRecord', { streak: currentStreak })
    }
    return i18n.t('notif.dailyStreak', { streak: currentStreak })
  }
  return i18n.t('notif.dailyGeneric')
}

// ── 連勝風險（條件式）────────────────────────────────────────────────────────
/** App 回前景或課程完成時呼叫。當天已打卡就取消；未打卡且有連勝就排今天 21:30 一次性。 */
export async function syncStreakRiskNotification(progress: UserProgress, now: Date = new Date()): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIF_ID)
  const today = toLocalDateString(now)
  if (progress.lastStudyDate === today || progress.streak < 1) return
  const fire = new Date(now)
  fire.setHours(STREAK_RISK_HOUR, STREAK_RISK_MINUTE, 0, 0)
  if (fire.getTime() <= now.getTime()) return
  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_NOTIF_ID,
    content: { title: i18n.t('notif.streakRiskTitle'), body: i18n.t('notif.streakRiskBody', { streak: progress.streak }), sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire },
  })
}

// ── 流失召回 D+1 / D+3 / D+7 ─────────────────────────────────────────────────
export function countDueWithin(cards: SRSCard[], days: number, now: Date = new Date()): number {
  const limit = now.getTime() + days * 86400000
  return cards.filter(c => new Date(c.nextReview).getTime() <= limit).length
}

export function lapseBody(day: 1 | 3 | 7, ctx: { dueIn: number; streak: number; level: string }): string {
  if (day === 1) return i18n.t('notif.lapse1', { dueIn: ctx.dueIn })
  if (day === 3) return i18n.t('notif.lapse3', { streak: ctx.streak })
  return i18n.t('notif.lapse7', { level: ctx.level })
}

/** 每次打卡完成時重排。再打卡會先取消再排，所以活躍用戶永遠收不到。 */
export async function scheduleLapseReminders(progress: UserProgress, now: Date = new Date(), level: string = 'N5'): Promise<void> {
  for (const id of LAPSE_IDS) await Notifications.cancelScheduledNotificationAsync(id)
  const hourRaw = await AsyncStorage.getItem(NOTIF_HOUR_KEY)
  const hour = hourRaw ? parseInt(hourRaw, 10) : DEFAULT_LAPSE_HOUR
  for (let i = 0; i < LAPSE_DAYS.length; i++) {
    const day = LAPSE_DAYS[i]
    const fire = new Date(now)
    fire.setDate(fire.getDate() + day)
    fire.setHours(hour, 0, 0, 0)
    await Notifications.scheduleNotificationAsync({
      identifier: LAPSE_IDS[i],
      content: {
        title: i18n.t('notif.lapseTitle'),
        body: lapseBody(day, { dueIn: countDueWithin(progress.srsCards, day, now), streak: progress.streak, level }),
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire },
    })
  }
}

// ── 權限時機 ─────────────────────────────────────────────────────────────────
export async function hasAskedNotificationPermission(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(NOTIF_ASKED_KEY)) === 'true' } catch { return false }
}
export async function markAskedNotificationPermission(): Promise<void> {
  try { await AsyncStorage.setItem(NOTIF_ASKED_KEY, 'true') } catch { /* best-effort */ }
}

/** 取現在時間四捨五入到整點或半點，當作建議的提醒時間。 */
export function suggestReminderTime(now: Date = new Date()): { hour: number; minute: number } {
  const total = now.getHours() * 60 + now.getMinutes()
  const rounded = (Math.round(total / 30) * 30) % (24 * 60)
  return { hour: Math.floor(rounded / 60), minute: rounded % 60 }
}

export const __test = { composeDailyBody }
```

`scheduleLapseReminders` 多了第三個參數 `level`，測試裡不傳走預設 `'N5'`。`DailyScheduleContext` 型別上 `STREAK_BADGES` 是 readonly tuple，`find` 回 `number | undefined`，OK。

- [ ] **Step 5: 跑測試確認通過**

Run: `node_modules/.bin/jest __tests__/notifications.test.ts __tests__/i18n.test.ts`
Expected: PASS，全部

- [ ] **Step 6: 接 App.tsx 的 AppState**

`App.tsx` 的 `AppInner` 內加：
```tsx
import { AppState } from 'react-native'
import { syncStreakRiskNotification } from './lib/notifications'
// ...
useEffect(() => {
  if (!onboardingDone) return
  const sync = () => loadProgress().then(p => syncStreakRiskNotification(p)).catch(() => {})
  sync()
  const sub = AppState.addEventListener('change', state => { if (state === 'active') sync() })
  return () => sub.remove()
}, [onboardingDone])
```
既有 `App()` 內 `scheduleDaily(settings.hour, 0, {...})` 的呼叫保留（它現在只排每日提醒）。

- [ ] **Step 7: 課程成績頁問權限 + 排召回**

`screens/LessonScreen.tsx` 的 `handleNext` 完成分支，在 `setPhase('result')` 之後加：
```tsx
const progressAfter = await loadProgress()
await syncStreakRiskNotification(progressAfter)
await scheduleLapseReminders(progressAfter, new Date(), level)
if (!(await hasAskedNotificationPermission())) {
  await markAskedNotificationPermission()
  const { hour, minute } = suggestReminderTime()
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  Alert.alert(t('notif.askTitle', { time }), t('notif.askMessage'), [
    { text: t('notif.askNo'), style: 'cancel' },
    { text: t('notif.askYes'), onPress: () => scheduleDaily(hour, minute, {
      dueCount: getDueCards(progressAfter.srsCards).length, currentStreak: progressAfter.streak, longestStreak: progressAfter.longestStreak,
    }).catch(() => {}) },
  ])
}
```
import 加 `syncStreakRiskNotification, scheduleLapseReminders, hasAskedNotificationPermission, markAskedNotificationPermission, suggestReminderTime, scheduleDaily` 與 `getDueCards`。`maybePromptLevelUp` 與權限對話可能同時出現，Alert 會排隊，接受。

`App.tsx` 啟動時的 `scheduleDaily(settings.hour, 0, ...)` 改成 `scheduleDaily(settings.hour, settings.minute, ...)`，否則會把成績頁同意的半點提醒歸零（Step 4 的 `getNotificationSettings` 已回傳 `minute`）。`ProgressScreen.tsx` 的小時按鈕仍傳 0。

`screens/ProgressScreen.tsx`：`useFocusEffect` 內多呼叫 `getNotificationSettings().then(s => { setNotifEnabled(s.enabled); setNotifHour(s.hour) })`，讓成績頁同意後回到設定頁開關是開的。

- [ ] **Step 8: 型別檢查、全部測試、模擬器驗收**

Run: `node_modules/.bin/tsc --noEmit && node_modules/.bin/jest`
Expected: 全綠

模擬器：做完第一節課看到權限對話（截 `screenshots/notif-ask.png`）；按「好」後到「進度」頁開關為開。用 `xcrun simctl` 無法列排程通知，改在 dev 加一行 `Notifications.getAllScheduledNotificationsAsync().then(console.log)` 看 identifier 有 `daily-reminder`、`lapse-1/3/7`、`streak-warning`（當天未打卡時），確認後移除那行。

- [ ] **Step 9: Commit**

```bash
git add lib/notifications.ts App.tsx screens/LessonScreen.tsx screens/ProgressScreen.tsx locales/zh-TW.json locales/en.json locales/ko.json __tests__/notifications.test.ts
git commit -m "feat(notif): 通知走 i18n、連勝風險改條件式、D+1/3/7 召回、首次課程後才問權限

Claude-Session: https://claude.ai/code/session_01HH5tzELse2kVzX6LvEsQae"
```

---

### Task 8: Analytics（PostHog）

**Files:**
- Create: `lib/analytics.ts`
- Modify: `package.json`（依賴）、`App.tsx`（init + app_open）、`screens/OnboardingScreen.tsx`（onboarding_complete）、`screens/LessonScreen.tsx`（lesson_start / lesson_complete / level_up_prompt / notif_permission）、`screens/PaywallScreen.tsx`（paywall_view / purchase）、`lib/storage.ts`（streak_lost / streak_freeze_used 由 `recordLessonResult` 回報）、`jest/setup.ts`（mock posthog）
- Test: `__tests__/analytics.test.ts`

**Interfaces:**
- Consumes: `posthog-react-native`、`process.env.EXPO_PUBLIC_POSTHOG_KEY`、`process.env.EXPO_PUBLIC_POSTHOG_HOST`（預設 `https://us.i.posthog.com`）、`Purchases.getAppUserID()`
- Produces:
  ```ts
  export type AnalyticsEvent =
    | 'app_open' | 'onboarding_complete' | 'lesson_start' | 'lesson_complete' | 'notif_permission'
    | 'streak_lost' | 'streak_freeze_used' | 'paywall_view' | 'purchase' | 'article_open' | 'article_complete' | 'level_up_prompt'
  export function initAnalytics(): Promise<void>        // 無 key → no-op
  export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void   // 未 init → 靜默
  export function identifyWithRevenueCat(appUserId: string): void   // 設 person property rc_app_user_id
  export function analyticsEnabled(): boolean
  ```

- [ ] **Step 1: 安裝依賴並確認 peer**

Run:
```bash
node_modules/.bin/expo install posthog-react-native expo-device expo-file-system
cat node_modules/posthog-react-native/package.json | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['version']);print(d.get('peerDependencies'));print(d.get('peerDependenciesMeta'))"
```
Expected: 印出版本與 peer 清單。若 peer 裡還有 `expo-application`、`expo-localization`、`@react-native-async-storage/async-storage` 以外的必需套件，再補 `expo install`。全部要用 `expo install` 讓版本對齊 SDK 55。

`jest/setup.ts` 加：
```ts
jest.mock('posthog-react-native', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    capture: jest.fn(), identify: jest.fn(), flush: jest.fn(async () => {}),
  })),
}))
```

- [ ] **Step 2: 寫失敗測試**

```ts
// __tests__/analytics.test.ts
const mockCapture = jest.fn()
const mockIdentify = jest.fn()
jest.mock('posthog-react-native', () => ({
  PostHog: jest.fn().mockImplementation(() => ({ capture: mockCapture, identify: mockIdentify, flush: jest.fn(async () => {}) })),
}))

describe('analytics', () => {
  const OLD = process.env
  beforeEach(() => { jest.resetModules(); process.env = { ...OLD }; mockCapture.mockClear(); mockIdentify.mockClear() })
  afterAll(() => { process.env = OLD })

  test('沒有 key：initAnalytics 不建 client，track 靜默', async () => {
    delete process.env.EXPO_PUBLIC_POSTHOG_KEY
    const a = await import('../lib/analytics')
    await a.initAnalytics()
    expect(a.analyticsEnabled()).toBe(false)
    expect(() => a.track('app_open')).not.toThrow()
    expect(mockCapture).not.toHaveBeenCalled()
  })

  test('有 key：track 呼叫 capture 帶事件名與屬性', async () => {
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test'
    const a = await import('../lib/analytics')
    await a.initAnalytics()
    expect(a.analyticsEnabled()).toBe(true)
    a.track('lesson_complete', { level: 'N5', correct: 8, total: 10, duration_s: 120 })
    expect(mockCapture).toHaveBeenCalledWith('lesson_complete', { level: 'N5', correct: 8, total: 10, duration_s: 120 })
  })

  test('init 之前的 track 不會 throw 也不會補送', async () => {
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test'
    const a = await import('../lib/analytics')
    a.track('app_open')
    await a.initAnalytics()
    expect(mockCapture).not.toHaveBeenCalled()
  })

  test('identifyWithRevenueCat 設 person property', async () => {
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test'
    const a = await import('../lib/analytics')
    await a.initAnalytics()
    a.identifyWithRevenueCat('$RCAnonymousID:abc')
    expect(mockIdentify).toHaveBeenCalledWith(undefined, { rc_app_user_id: '$RCAnonymousID:abc' })
  })
})
```

- [ ] **Step 3: 跑測試確認失敗**

Run: `node_modules/.bin/jest __tests__/analytics.test.ts`
Expected: FAIL，`Cannot find module '../lib/analytics'`

- [ ] **Step 4: 實作**

```ts
// lib/analytics.ts
// PostHog 封裝。沒有 key（本機 dev、Jest）時全部 no-op，App 其他地方不用判斷。
// 事件名稱固定 12 個（spec 4.6），不要在呼叫端用字串拼。
import { PostHog } from 'posthog-react-native'

export type AnalyticsEvent =
  | 'app_open' | 'onboarding_complete' | 'lesson_start' | 'lesson_complete' | 'notif_permission'
  | 'streak_lost' | 'streak_freeze_used' | 'paywall_view' | 'purchase'
  | 'article_open' | 'article_complete' | 'level_up_prompt'

type Props = Record<string, string | number | boolean>

let client: PostHog | null = null

export function analyticsEnabled(): boolean {
  return client != null
}

export async function initAnalytics(): Promise<void> {
  if (client) return
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY
  if (!apiKey) return
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  try {
    client = new PostHog(apiKey, { host, captureAppLifecycleEvents: false })
  } catch {
    client = null
  }
}

export function track(event: AnalyticsEvent, props?: Props): void {
  if (!client) return
  try { client.capture(event, props) } catch { /* analytics 永遠不能弄壞 App */ }
}

/** 把 RevenueCat 的 appUserID 掛成 person property，方便對照付費。distinctId 維持 PostHog 自己的匿名 id。 */
export function identifyWithRevenueCat(appUserId: string): void {
  if (!client) return
  try { client.identify(undefined, { rc_app_user_id: appUserId }) } catch { /* ignore */ }
}
```
若 `posthog-react-native` 的 `identify` 簽名不接受 `undefined` 當第一參數（tsc 會報），改用 `client.capture('$set', { $set: { rc_app_user_id: appUserId } })` 並同步改測試期望為 `mockCapture` 被呼叫 `'$set'`。

- [ ] **Step 5: 跑測試確認通過**

Run: `node_modules/.bin/jest __tests__/analytics.test.ts`
Expected: PASS，4 tests

- [ ] **Step 6: 埋點**

`App.tsx` 的 `initI18n().then(async () => {...})` 內最前面加：
```ts
await initAnalytics()
track('app_open')
initPurchases().then(async () => {
  try { identifyWithRevenueCat(await Purchases.getAppUserID()) } catch { /* no key */ }
}).catch(() => {})
```
（取代原本單獨的 `initPurchases().catch(() => {})`；`import Purchases from 'react-native-purchases'`。）

`screens/OnboardingScreen.tsx` `handleStart`：`track('onboarding_complete', { level: LEGACY_TO_JLPT[level] })`。

`screens/LessonScreen.tsx`：
- 組題完成後 `track('lesson_start', { level: lvl, due_count: composed.filter(i => i.role === 'review').length })`
- `recordLessonResult` 之後 `track('lesson_complete', { level, correct: correctCount, total: items.length, duration_s: durationS })`
- `streak.freezeUsed` 為真 → `track('streak_freeze_used', { remaining: progress.streakFreezes ?? 0 })`
- 權限對話兩個按鈕分別 `track('notif_permission', { granted: true/false })`（「好」按下且 `scheduleDaily` 之後再 `getNotificationSettings()` 看 `enabled` 決定 granted）
- `maybePromptLevelUp` 兩個按鈕 `track('level_up_prompt', { level: next, accepted: true/false })`

`streak_lost`：在 `lib/storage.ts` 的 `recordLessonResult` 之前先 `loadProgress()` 記 `before.streak`，若 `before.streak >= 2 && after.streak === 1` → `track('streak_lost', { streak_before: before.streak })`。`lib/storage.ts` import `track` 會造成 storage → analytics 相依，可接受（analytics 不依賴 storage）。

`screens/PaywallScreen.tsx`：mount 時 `track('paywall_view', { source: route?.params?.source ?? 'unknown' })`；購買成功（`packageIsPro(info)` 為真）後 `track('purchase', { product_id: pkg.product.identifier })`。三個導向 Paywall 的地方加 `source`：Camera `navigate('Paywall', { source: 'camera' })`、AIChat `{ source: 'ai_chat' }`、JLPT `{ source: 'jlpt' }`、Progress `{ source: 'progress' }`。

`article_open` / `article_complete` 留給階段二，型別先定義。

- [ ] **Step 7: 型別檢查、全部測試、實機驗證**

Run: `node_modules/.bin/tsc --noEmit && node_modules/.bin/jest`
Expected: 全綠

`.env` 加 `EXPO_PUBLIC_POSTHOG_KEY=<arlong 提供>`（`.env` 已在 .gitignore）。EAS production env 也要加同名變數：`node_modules/.bin/eas env:create --environment production --name EXPO_PUBLIC_POSTHOG_KEY --value <key> --visibility sensitive`。模擬器跑一次 app_open → lesson_complete，到 PostHog 的 Live events 看到事件，截圖 `screenshots/posthog-live.png`。arlong 還沒給 key 的話，這一步標記為「待 key」，其餘照常 commit。

- [ ] **Step 8: Commit**

```bash
git add lib/analytics.ts __tests__/analytics.test.ts jest/setup.ts package.json package-lock.json App.tsx screens/OnboardingScreen.tsx screens/LessonScreen.tsx screens/PaywallScreen.tsx screens/CameraScreen.tsx screens/AIConversationScreen.tsx screens/JLPTScreen.tsx screens/ProgressScreen.tsx lib/storage.ts
git commit -m "feat(analytics): PostHog 封裝與 12 個固定事件埋點；無 key 時靜默

Claude-Session: https://claude.ai/code/session_01HH5tzELse2kVzX6LvEsQae"
```

---

### Task 9: 版號 1.7.0 (build 17)、送審文案、記憶更新

**Files:**
- Modify: `app.json:5,23,40`、`package.json:3`
- Create: `docs/release-notes/1.7.0.md`

**Interfaces:** 無。

- [ ] **Step 1: 改版號**

`app.json`：`"version": "1.7.0"`、`"buildNumber": "17"`、`"versionCode": 16`。`package.json`：`"version": "1.7.0"`。不要用 `scripts/bump-version.js`（它會同時 bump 三個數，但 versionCode 要 16 不是 17）。

Run: `grep -nE '"version"|buildNumber|versionCode' app.json package.json`
Expected:
```
app.json:5:    "version": "1.7.0",
app.json:23:      "buildNumber": "17",
app.json:40:      "versionCode": 16
package.json:3:  "version": "1.7.0",
```

- [ ] **Step 2: 寫送審文案**

`docs/release-notes/1.7.0.md`：
```markdown
# 1.7.0 (build 17)

## What's New（ASC 三語）

zh-TW：
每天一節課，三分鐘就夠。新的「今日課程」自動幫你混排複習、新單字、文法和聽力。連勝新增凍結卡，偶爾忘了一天也不會前功盡棄。提醒更聰明：只在你還沒學的時候才提醒。

en：
A 3-minute daily lesson that mixes your due reviews, new words, grammar and listening. Streak freezes keep your streak safe if you miss a day. Smarter reminders that only nudge you when you haven't studied yet.

ko：
하루 3분 수업: 복습, 새 단어, 문법, 듣기를 자동으로 섞어 드려요. 연속 보호권으로 하루를 놓쳐도 기록이 지켜져요. 아직 공부하지 않은 날에만 알려드리는 더 똑똑한 알림.

## Review Notes 補充
- 無新權限。通知權限改在第一次完成課程後詢問。
- 新增 PostHog 產品分析（匿名事件，無身分連結）。隱私標籤已更新為「產品互動資料，未與身分連結」。

## 送審前 arlong 手動
- [ ] ASC → App 隱私權 → 新增「產品互動」資料類型（分析用途，未連結身分，不追蹤）
- [ ] 確認 1.6.1 已過審（否則 1.7.0 要等）
- [ ] EAS production env 有 EXPO_PUBLIC_POSTHOG_KEY
```

- [ ] **Step 3: 全部測試 + production build**

Run: `node_modules/.bin/tsc --noEmit && node_modules/.bin/jest`
Expected: 全綠

Run: `node_modules/.bin/eas build --platform ios --profile production --non-interactive`
Expected: build 完成，輸出 build id；接著 `node_modules/.bin/eas submit --platform ios --latest --non-interactive`。送審版本頁文案與 Review Notes 用既有 ASC API 腳本（見 memory `project_admob_integration`）填入，或 arlong 手動貼。

- [ ] **Step 4: Commit**

```bash
git add app.json package.json docs/release-notes/1.7.0.md
git commit -m "chore: 1.7.0 (build 17) — 每日課程、連勝凍結、召回通知、PostHog

Claude-Session: https://claude.ai/code/session_01HH5tzELse2kVzX6LvEsQae"
```

- [ ] **Step 5: 更新 memory**

`/Users/arlong/.claude/projects/-Users-arlong-Projects-japanese-learner/memory/project_daily_learning_system.md` 補一段：1.7.0 送審日期、build id、PostHog key 是否已設、階段二待開工。

---

## 執行順序與相依

Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9，嚴格依序。Task 5 用到 Task 1–4 的全部介面；Task 7、8 都改 `LessonScreen.tsx`，衝突時以後者為準。每個 task 完成後 `tsc --noEmit` 與 `jest` 全綠才進下一個。
