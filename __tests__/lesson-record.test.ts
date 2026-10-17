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
