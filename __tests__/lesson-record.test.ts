jest.mock('../lib/analytics', () => ({ track: jest.fn() }))
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

import { markWordLearned, saveProgress, getFreezeUsedDate, toLocalDateString } from '../lib/storage'

function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return toLocalDateString(d) }

test('markWordLearned skipStreak 不動 lastStudyDate', async () => {
  const p = await loadProgress()
  p.lastStudyDate = daysAgo(2); p.dateSchema = 'local'; p.streak = 3
  await saveProgress(p)
  await markWordLearned('w1', 'cat', 10, { skipStreak: true })
  const after = await loadProgress()
  expect(after.lastStudyDate).toBe(daysAgo(2))
  expect(after.learnedIds).toContain('w1')
})

test('課程內 skipStreak 後 recordLessonResult 仍能消耗凍結並記錄日期', async () => {
  const p = await loadProgress()
  p.lastStudyDate = daysAgo(2); p.dateSchema = 'local'; p.streak = 3; p.streakFreezes = 1
  await saveProgress(p)
  await markWordLearned('w1', 'cat', 10, { skipStreak: true })
  const r = await recordLessonResult({ correct: 1, total: 1, newWords: 1, reviewed: 0, durationS: 5 })
  expect(r.freezeUsed).toBe(true)
  expect(await getFreezeUsedDate()).toBe(getTodayString())
})

test('直接 recordDailyActivity 消耗凍結也會記錄凍結日期', async () => {
  const { recordDailyActivity } = require('../lib/storage')
  const p = await loadProgress()
  p.lastStudyDate = daysAgo(2); p.dateSchema = 'local'; p.streak = 3; p.streakFreezes = 1
  await saveProgress(p)
  const r = await recordDailyActivity(1, 0, 0, 0)
  expect(r.freezeUsed).toBe(true)
  expect(await getFreezeUsedDate()).toBe(getTodayString())
})

test('Pro 免費延續（markWordLearned 路徑）也會記錄凍結日期', async () => {
  const p = await loadProgress()
  p.lastStudyDate = daysAgo(2); p.dateSchema = 'local'; p.streak = 3; p.streakFreezes = 0
  await saveProgress(p)
  await markWordLearned('w2', 'cat', 10, { isPro: true })
  expect((await loadProgress()).streak).toBe(4)
  expect(await getFreezeUsedDate()).toBe(getTodayString())
})

describe('streak 事件追蹤（所有打卡路徑）', () => {
  const { track } = require('../lib/analytics')
  const { recordDailyActivity } = require('../lib/storage')
  beforeEach(() => { (track as jest.Mock).mockClear() })

  async function seed(streak: number, lastDaysAgo: number, freezes = 0) {
    const p = await loadProgress()
    p.lastStudyDate = daysAgo(lastDaysAgo); p.dateSchema = 'local'; p.streak = streak; p.streakFreezes = freezes
    await saveProgress(p)
  }

  test('2+ 連勝斷掉：recordDailyActivity 觸發 streak_lost 一次', async () => {
    await seed(3, 3)
    await recordDailyActivity(1, 0, 0, 0)
    const calls = (track as jest.Mock).mock.calls.filter(c => c[0] === 'streak_lost')
    expect(calls).toEqual([['streak_lost', { streak_before: 3 }]])
  })

  test('消耗凍結：streak_freeze_used 一次且帶 remaining，不觸發 streak_lost', async () => {
    await seed(3, 2, 1)
    await recordDailyActivity(1, 0, 0, 0)
    const names = (track as jest.Mock).mock.calls.map(c => c[0])
    expect(names.filter(n => n === 'streak_freeze_used')).toHaveLength(1)
    expect((track as jest.Mock).mock.calls.find(c => c[0] === 'streak_freeze_used')![1]).toEqual({ remaining: 0 })
    expect(names).not.toContain('streak_lost')
  })

  test('recordLessonResult 路徑只觸發一次', async () => {
    await seed(3, 3)
    await recordLessonResult({ correct: 1, total: 1, newWords: 1, reviewed: 0, durationS: 5 })
    expect((track as jest.Mock).mock.calls.filter(c => c[0] === 'streak_lost')).toHaveLength(1)
  })

  test('連續的一天：兩者都不觸發', async () => {
    await seed(3, 1)
    await recordDailyActivity(1, 0, 0, 0)
    const names = (track as jest.Mock).mock.calls.map(c => c[0])
    expect(names).not.toContain('streak_lost')
    expect(names).not.toContain('streak_freeze_used')
  })
})
