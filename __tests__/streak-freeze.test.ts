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
