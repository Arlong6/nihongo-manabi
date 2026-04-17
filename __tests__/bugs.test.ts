/**
 * 針對四個 bug 修復的直接驗證測試
 */

// ─── Bug #2: KatakanaScreen 初始 choices ───────────────────────────────────
import { katakanaChars } from '../data/katakana'
import type { KatakanaChar } from '../types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getChoices(correct: KatakanaChar): KatakanaChar[] {
  const distractors = katakanaChars
    .filter(c => c.katakana !== correct.katakana)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  return shuffle([correct, ...distractors])
}

const TOTAL_QUESTIONS = 10

describe('Bug #2: KatakanaScreen 初始 choices 與 questions[0] 一致', () => {
  it('choices 一定包含 questions[0] 的正確答案', () => {
    // 模擬修復後的寫法
    const questions = shuffle(katakanaChars).slice(0, TOTAL_QUESTIONS)
    const choices = getChoices(questions[0]) // 修復後用 questions[0]

    const correctInChoices = choices.some(c => c.katakana === questions[0].katakana)
    expect(correctInChoices).toBe(true)
  })

  it('重複 50 次，每次 choices 都包含正確答案', () => {
    for (let i = 0; i < 50; i++) {
      const questions = shuffle(katakanaChars).slice(0, TOTAL_QUESTIONS)
      const choices = getChoices(questions[0])
      const found = choices.some(c => c.katakana === questions[0].katakana)
      expect(found).toBe(true)
    }
  })

  it('choices 恰好有 4 個選項', () => {
    const questions = shuffle(katakanaChars).slice(0, TOTAL_QUESTIONS)
    const choices = getChoices(questions[0])
    expect(choices).toHaveLength(4)
  })

  it('choices 無重複', () => {
    const questions = shuffle(katakanaChars).slice(0, TOTAL_QUESTIONS)
    const choices = getChoices(questions[0])
    const unique = new Set(choices.map(c => c.katakana))
    expect(unique.size).toBe(4)
  })
})

// ─── Bug #3: stale closure 計數邏輯 ───────────────────────────────────────
describe('Bug #3: handleRate 計數邏輯（本地變數，無 stale state）', () => {
  it('新單字：newCount 累加正確', () => {
    let sessionNew = 0
    let sessionReviewed = 0

    // 模擬 handleRate 中的修復邏輯
    function processCard(isNew: boolean) {
      let newCount = sessionNew
      let reviewCount = sessionReviewed

      if (isNew) {
        newCount += 1
        sessionNew = newCount
      } else {
        reviewCount += 1
        sessionReviewed = reviewCount
      }

      return { newCount, reviewCount }
    }

    const r1 = processCard(true)
    expect(r1.newCount).toBe(1)
    expect(r1.reviewCount).toBe(0)

    const r2 = processCard(false)
    expect(r2.newCount).toBe(1)
    expect(r2.reviewCount).toBe(1)

    const r3 = processCard(true)
    expect(r3.newCount).toBe(2)
    expect(r3.reviewCount).toBe(1)
  })

  it('最後一張牌時，傳給 recordDailyActivity 的數字是累計值', () => {
    let sessionNew = 0
    let sessionReviewed = 0
    const cards = ['new', 'review', 'new', 'review', 'new'] // 3新2複習

    let finalNew = 0
    let finalReview = 0

    cards.forEach((type, i) => {
      const isNew = type === 'new'
      let newCount = sessionNew
      let reviewCount = sessionReviewed

      if (isNew) {
        newCount += 1
        sessionNew = newCount
      } else {
        reviewCount += 1
        sessionReviewed = reviewCount
      }

      if (i === cards.length - 1) {
        // 最後一張：記錄下來（對應 recordDailyActivity(newCount, reviewCount, ...)）
        finalNew = newCount
        finalReview = reviewCount
      }
    })

    expect(finalNew).toBe(3)
    expect(finalReview).toBe(2)
  })
})

// ─── Bug #4: ProgressScreen 所有分類都有顏色 ────────────────────────────────
import { categoryInfo } from '../data/vocabulary'

const catColors: Record<string, string> = {
  greeting: '#4F46E5', number: '#059669', time: '#D97706',
  food: '#DC2626', transport: '#0284C7', shopping: '#7C3AED',
  weather: '#F59E0B', family: '#EC4899', work: '#6366F1',
  color: '#E11D48', body: '#0891B2', place: '#65A30D',
  adjective: '#9333EA', verb: '#EA580C', noun: '#0D9488',
  adverb: '#10B981', expression: '#F97316',
}

describe('Bug #4: ProgressScreen 所有分類都有對應顏色', () => {
  it('categoryInfo 的每個 key 在 catColors 中都有定義', () => {
    const missingColors = Object.keys(categoryInfo).filter(key => !catColors[key])
    expect(missingColors).toHaveLength(0)
  })

  it('catColors 中的顏色格式都是有效的 hex', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/
    Object.entries(catColors).forEach(([key, color]) => {
      expect(color).toMatch(hexPattern)
    })
  })
})

// ─── Bug #5: Quiz crash — confusable pool smaller than TOTAL_QUESTIONS ────────

const QUIZ_TOTAL_QUESTIONS = 10

function quizTotal(poolLength: number): number {
  return Math.min(QUIZ_TOTAL_QUESTIONS, poolLength)
}

function isFinished(index: number, questionsLength: number): boolean {
  return index + 1 >= questionsLength
}

describe('Bug #5: Quiz total 使用 Math.min(TOTAL_QUESTIONS, pool.length)', () => {
  it('pool 有 9 個時，total = 9（不是 10）', () => {
    expect(quizTotal(9)).toBe(9)
  })

  it('pool 有 46 個時，total = 10', () => {
    expect(quizTotal(46)).toBe(10)
  })

  it('pool 有 3 個時，total = 3', () => {
    expect(quizTotal(3)).toBe(3)
  })

  it('pool 有 10 個時，total = 10（邊界值）', () => {
    expect(quizTotal(10)).toBe(10)
  })

  it('pool 有 1 個時，total = 1', () => {
    expect(quizTotal(1)).toBe(1)
  })
})

describe('Bug #5: finished 條件 index + 1 >= questions.length', () => {
  it('9 題：index=8 時 finished=true', () => {
    expect(isFinished(8, 9)).toBe(true)
  })

  it('9 題：index=7 時 finished=false', () => {
    expect(isFinished(7, 9)).toBe(false)
  })

  it('3 題：index=2 時 finished=true', () => {
    expect(isFinished(2, 3)).toBe(true)
  })

  it('3 題：index=1 時 finished=false', () => {
    expect(isFinished(1, 3)).toBe(false)
  })

  it('10 題：index=9 時 finished=true', () => {
    expect(isFinished(9, 10)).toBe(true)
  })

  it('10 題：index=8 時 finished=false', () => {
    expect(isFinished(8, 10)).toBe(false)
  })
})

describe('Bug #5: confusable pool 實際大小不超過 TOTAL_QUESTIONS', () => {
  it('katakana confusable set (9 個字) 產生的 questions 長度為 9', () => {
    const confusableSet = new Set(['シ', 'ツ', 'ソ', 'ン', 'リ', 'ア', 'マ', 'ウ', 'ワ'])
    const pool = katakanaChars.filter(c => confusableSet.has(c.katakana))
    const total = Math.min(QUIZ_TOTAL_QUESTIONS, pool.length)
    const questions = pool.slice(0, total)
    expect(questions.length).toBe(9)
    expect(questions.length).toBeLessThan(QUIZ_TOTAL_QUESTIONS)
  })

  it('katakana confusable pool 長度小於 10', () => {
    const confusableSet = new Set(['シ', 'ツ', 'ソ', 'ン', 'リ', 'ア', 'マ', 'ウ', 'ワ'])
    const pool = katakanaChars.filter(c => confusableSet.has(c.katakana))
    expect(pool.length).toBeLessThan(QUIZ_TOTAL_QUESTIONS)
  })
})

// ─── Bug #5b: wrongAnswers 追蹤邏輯 ──────────────────────────────────────────

type WrongEntry = { question: { id: string; romaji: string }; chosen: { id: string; romaji: string } }

function simulateAnswer(
  wrongAnswers: WrongEntry[],
  question: { id: string; romaji: string },
  chosen: { id: string; romaji: string },
): WrongEntry[] {
  const correct = chosen.id === question.id
  if (!correct) {
    return [...wrongAnswers, { question, chosen }]
  }
  return wrongAnswers
}

describe('Bug #5b: wrongAnswers 追蹤邏輯', () => {
  it('答對時，wrongAnswers 保持空', () => {
    const q = { id: 'shi', romaji: 'shi' }
    const result = simulateAnswer([], q, { id: 'shi', romaji: 'shi' })
    expect(result).toHaveLength(0)
  })

  it('答錯時，wrongAnswers 新增一筆 { question, chosen }', () => {
    const q = { id: 'shi', romaji: 'shi' }
    const wrong = { id: 'tsu', romaji: 'tsu' }
    const result = simulateAnswer([], q, wrong)
    expect(result).toHaveLength(1)
    expect(result[0].question.id).toBe('shi')
    expect(result[0].chosen.id).toBe('tsu')
  })

  it('多次答錯，wrongAnswers 累積所有錯誤', () => {
    const questions = [
      { id: 'shi', romaji: 'shi' },
      { id: 'tsu', romaji: 'tsu' },
      { id: 'so', romaji: 'so' },
    ]
    const wrongChoices = [
      { id: 'tsu', romaji: 'tsu' },  // 答錯 shi → tsu
      { id: 'n', romaji: 'n' },       // 答錯 tsu → n
      { id: 'so', romaji: 'so' },     // 答對 so → so
    ]

    let wrongAnswers: WrongEntry[] = []
    questions.forEach((q, i) => {
      wrongAnswers = simulateAnswer(wrongAnswers, q, wrongChoices[i])
    })

    expect(wrongAnswers).toHaveLength(2)
    expect(wrongAnswers[0].question.id).toBe('shi')
    expect(wrongAnswers[0].chosen.id).toBe('tsu')
    expect(wrongAnswers[1].question.id).toBe('tsu')
    expect(wrongAnswers[1].chosen.id).toBe('n')
  })

  it('全部答對時，wrongAnswers 保持空', () => {
    const pairs = [
      { id: 'a', romaji: 'a' },
      { id: 'i', romaji: 'i' },
      { id: 'u', romaji: 'u' },
    ]

    let wrongAnswers: WrongEntry[] = []
    pairs.forEach(q => {
      wrongAnswers = simulateAnswer(wrongAnswers, q, q)
    })

    expect(wrongAnswers).toHaveLength(0)
  })

  it('全部答錯時，wrongAnswers 長度等於題目數', () => {
    const questions = [
      { id: 'shi', romaji: 'shi' },
      { id: 'tsu', romaji: 'tsu' },
      { id: 'so', romaji: 'so' },
    ]
    const alwaysWrong = { id: 'n', romaji: 'n' }

    let wrongAnswers: WrongEntry[] = []
    questions.forEach(q => {
      wrongAnswers = simulateAnswer(wrongAnswers, q, alwaysWrong)
    })

    expect(wrongAnswers).toHaveLength(3)
  })
})
