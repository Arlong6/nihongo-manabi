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
