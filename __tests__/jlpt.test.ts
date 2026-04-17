/**
 * JLPT 模擬考邏輯測試
 */
import { allVocabulary } from '../data/vocabulary'
import { grammarQuestions } from '../data/grammar'

// 複製 JLPTScreen 中的純函式來測試（不引入 React Native）
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type ExamLevel = 'N5' | 'N4' | 'N3'

function getVocabPool(level: ExamLevel) {
  if (level === 'N5') return allVocabulary.filter(v => v.level === 'N5' || v.level === 'daily')
  if (level === 'N4') return allVocabulary.filter(v => v.level === 'N4')
  return allVocabulary.filter(v => v.level === 'N3')
}

const EXAM_CONFIG = {
  N5: { vocabCount: 8,  grammarCount: 7 },
  N4: { vocabCount: 10, grammarCount: 8 },
  N3: { vocabCount: 12, grammarCount: 8 },
}

// ── 語彙資料池 ──────────────────────────────────────────────────────────────
describe('各等級語彙資料池', () => {
  it('N5 資料池有足夠單字（> 8）', () => {
    expect(getVocabPool('N5').length).toBeGreaterThan(8)
  })

  it('N4 資料池有足夠單字（> 10）', () => {
    expect(getVocabPool('N4').length).toBeGreaterThan(10)
  })

  it('N3 資料池有足夠單字（> 12）', () => {
    expect(getVocabPool('N3').length).toBeGreaterThan(12)
  })

  it('N5 資料池只含 N5/daily 單字', () => {
    getVocabPool('N5').forEach(v => {
      expect(['N5', 'daily']).toContain(v.level)
    })
  })

  it('N4 資料池只含 N4 單字', () => {
    getVocabPool('N4').forEach(v => expect(v.level).toBe('N4'))
  })

  it('N3 資料池只含 N3 單字', () => {
    getVocabPool('N3').forEach(v => expect(v.level).toBe('N3'))
  })
})

// ── 文法題庫 ───────────────────────────────────────────────────────────────
describe('各等級文法題數量', () => {
  const n5Grammar = grammarQuestions.filter(q => q.level === 'N5')
  const n4Grammar = grammarQuestions.filter(q => q.level === 'N4')
  const n3Grammar = grammarQuestions.filter(q => q.level === 'N3')

  it('N5 文法題 >= 7 題（夠出一場考）', () => {
    expect(n5Grammar.length).toBeGreaterThanOrEqual(7)
  })

  it('N4 文法題 >= 8 題', () => {
    expect(n4Grammar.length).toBeGreaterThanOrEqual(8)
  })

  it('N3 文法題 >= 8 題', () => {
    expect(n3Grammar.length).toBeGreaterThanOrEqual(8)
  })

  it('所有文法題 level 只有 N5/N4/N3/N2/N1', () => {
    grammarQuestions.forEach(q => {
      expect(['N5', 'N4', 'N3', 'N2', 'N1']).toContain(q.level)
    })
  })

  it('所有文法題都有正確答案在選項中', () => {
    grammarQuestions.forEach(q => {
      expect(q.options).toContain(q.answer)
    })
  })

  it('所有文法題的選項恰好 4 個', () => {
    grammarQuestions.forEach(q => {
      expect(q.options).toHaveLength(4)
    })
  })

  it('文法題 id 唯一', () => {
    const ids = grammarQuestions.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ── 考題生成邏輯 ────────────────────────────────────────────────────────────
describe('考題選項生成', () => {
  it('語彙選項：正確答案一定在選項中（重複50次）', () => {
    const pool = getVocabPool('N5')
    for (let i = 0; i < 50; i++) {
      const correct = pool[Math.floor(Math.random() * pool.length)]
      const distractors = shuffle(pool.filter(v => v.id !== correct.id)).slice(0, 3)
      const options = shuffle([correct.chinese, ...distractors.map(v => v.chinese)])
      expect(options).toContain(correct.chinese)
      expect(options).toHaveLength(4)
    }
  })

  it('語彙選項：4個選項不重複（重複50次）', () => {
    const pool = getVocabPool('N4')
    for (let i = 0; i < 50; i++) {
      const correct = pool[Math.floor(Math.random() * pool.length)]
      const distractors = shuffle(pool.filter(v => v.id !== correct.id)).slice(0, 3)
      const options = [correct.chinese, ...distractors.map(v => v.chinese)]
      expect(new Set(options).size).toBe(options.length)
    }
  })

  it('N5 考試題數正確：8語彙 + 7文法 = 15', () => {
    expect(EXAM_CONFIG.N5.vocabCount + EXAM_CONFIG.N5.grammarCount).toBe(15)
  })

  it('N4 考試題數正確：10語彙 + 8文法 = 18', () => {
    expect(EXAM_CONFIG.N4.vocabCount + EXAM_CONFIG.N4.grammarCount).toBe(18)
  })

  it('N3 考試題數正確：12語彙 + 8文法 = 20', () => {
    expect(EXAM_CONFIG.N3.vocabCount + EXAM_CONFIG.N3.grammarCount).toBe(20)
  })
})
