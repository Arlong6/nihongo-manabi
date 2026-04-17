/**
 * 資料完整性測試：驗證新增內容符合格式要求
 */
import { allVocabulary, categoryInfo } from '../data/vocabulary'
import { n3Vocabulary } from '../data/vocabulary/n3'
import { n2Vocabulary } from '../data/vocabulary/n2'
import { hiraganaChars, hiraganaConfusablePairs, hiraganaConfusableSet } from '../data/hiragana'
import { katakanaChars } from '../data/katakana'

// ─── 單字資料 ──────────────────────────────────────────────────────────────
describe('單字資料完整性', () => {
  it('allVocabulary 應超過 250 個單字', () => {
    expect(allVocabulary.length).toBeGreaterThan(250)
  })

  it('N3 單字有 200 個', () => {
    expect(n3Vocabulary).toHaveLength(200)
  })

  it('N2 單字有 150 個', () => {
    expect(n2Vocabulary).toHaveLength(150)
  })

  it('所有單字 id 唯一', () => {
    const ids = allVocabulary.map(v => v.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('所有單字都有必要欄位', () => {
    allVocabulary.forEach(v => {
      expect(v.id).toBeTruthy()
      expect(v.japanese).toBeTruthy()
      expect(v.reading).toBeTruthy()
      expect(v.chinese).toBeTruthy()
      expect(v.english).toBeTruthy()
      expect(v.category).toBeTruthy()
      expect(['daily', 'N5', 'N4', 'N3', 'N2', 'N1']).toContain(v.level)
    })
  })

  it('所有單字的 category 都存在於 categoryInfo', () => {
    const validCategories = Object.keys(categoryInfo)
    const invalid = allVocabulary.filter(v => !validCategories.includes(v.category))
    expect(invalid).toHaveLength(0)
  })

  it('N3 單字的 level 都是 N3', () => {
    n3Vocabulary.forEach(v => expect(v.level).toBe('N3'))
  })

  it('N2 單字的 level 都是 N2', () => {
    n2Vocabulary.forEach(v => expect(v.level).toBe('N2'))
  })
})

// ─── 平假名資料 ────────────────────────────────────────────────────────────
describe('平假名資料完整性', () => {
  it('有 46 個平假名', () => {
    expect(hiraganaChars).toHaveLength(46)
  })

  it('所有平假名都有 hiragana、romaji、katakana', () => {
    hiraganaChars.forEach(c => {
      expect(c.hiragana).toBeTruthy()
      expect(c.romaji).toBeTruthy()
      expect(c.katakana).toBeTruthy()
    })
  })

  it('片假名也有 46 個', () => {
    expect(katakanaChars).toHaveLength(46)
  })

  it('平假名 romaji 和片假名 romaji 的集合一致', () => {
    const hiraganaRomaji = new Set(hiraganaChars.map(c => c.romaji))
    const katakanaRomaji = new Set(katakanaChars.map(c => c.romaji))
    expect(hiraganaRomaji).toEqual(katakanaRomaji)
  })

  it('平假名無重複字', () => {
    const chars = hiraganaChars.map(c => c.hiragana)
    const unique = new Set(chars)
    expect(unique.size).toBe(chars.length)
  })

  it('confusableSet 中的字都存在於 hiraganaChars', () => {
    const allHiragana = new Set(hiraganaChars.map(c => c.hiragana))
    hiraganaConfusableSet.forEach(char => {
      expect(allHiragana.has(char)).toBe(true)
    })
  })

  it('confusablePairs 中的字都存在於 hiraganaChars', () => {
    const allHiragana = new Set(hiraganaChars.map(c => c.hiragana))
    hiraganaConfusablePairs.forEach(pair => {
      pair.chars.forEach(c => {
        expect(allHiragana.has(c)).toBe(true)
      })
    })
  })
})
