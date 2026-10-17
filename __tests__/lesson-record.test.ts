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
