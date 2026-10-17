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
