import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  getAIChatUsage, incrementAIChatUsage, grantAIChatBonus,
  getCameraUsage, incrementCameraUsage, grantCameraBonus,
  isUsageExhausted, usageRemaining, canGrantBonus,
  AI_CHAT_DAILY_LIMIT, CAMERA_DAILY_LIMIT, DAILY_BONUS_CAP,
  toLocalDateString, getTodayString, updateStreak,
} from '../lib/storage'
import type { UserProgress } from '../types'

beforeEach(async () => {
  await AsyncStorage.clear()
})

describe('每日額度 + 激勵廣告加成', () => {
  test('用滿 3 次就用完；看廣告 +1 後可再用一次', async () => {
    for (let i = 0; i < AI_CHAT_DAILY_LIMIT; i++) await incrementAIChatUsage()
    let usage = await getAIChatUsage()
    expect(isUsageExhausted(usage, AI_CHAT_DAILY_LIMIT)).toBe(true)
    expect(usageRemaining(usage, AI_CHAT_DAILY_LIMIT)).toBe(0)

    const granted = await grantAIChatBonus()
    expect(granted?.bonus).toBe(1)
    usage = await getAIChatUsage()
    expect(isUsageExhausted(usage, AI_CHAT_DAILY_LIMIT)).toBe(false)
    expect(usageRemaining(usage, AI_CHAT_DAILY_LIMIT)).toBe(1)

    await incrementAIChatUsage()
    expect(isUsageExhausted(await getAIChatUsage(), AI_CHAT_DAILY_LIMIT)).toBe(true)
  })

  test('每天最多加 3 次，第 4 次回 null', async () => {
    for (let i = 0; i < DAILY_BONUS_CAP; i++) {
      expect(await grantCameraBonus()).not.toBeNull()
    }
    const usage = await getCameraUsage()
    expect(canGrantBonus(usage)).toBe(false)
    expect(await grantCameraBonus()).toBeNull()
    expect((await getCameraUsage()).bonus).toBe(DAILY_BONUS_CAP)
  })

  test('AI 對話與拍照翻譯各自獨立計算', async () => {
    await incrementAIChatUsage()
    await grantAIChatBonus()
    const camera = await getCameraUsage()
    expect(camera).toEqual({ date: getTodayString(), count: 0, bonus: 0 })
    expect(isUsageExhausted(camera, CAMERA_DAILY_LIMIT)).toBe(false)
  })

  test('跨日歸零（含 bonus）', async () => {
    await AsyncStorage.setItem('ai_chat_usage', JSON.stringify({ date: '2000-01-01', count: 3, bonus: 2 }))
    const usage = await getAIChatUsage()
    expect(usage).toEqual({ date: getTodayString(), count: 0, bonus: 0 })
  })

  test('舊格式（沒有 bonus 欄位）讀起來 bonus 是 0', async () => {
    await AsyncStorage.setItem('camera_usage', JSON.stringify({ date: getTodayString(), count: 2 }))
    const usage = await getCameraUsage()
    expect(usage).toEqual({ date: getTodayString(), count: 2, bonus: 0 })
  })
})

describe('本地日期', () => {
  test('toLocalDateString 用裝置時區而不是 UTC', () => {
    // 2026-09-27 00:30 本地時間：UTC 版本在 UTC+8 會給 09-26
    const d = new Date(2026, 8, 27, 0, 30)
    expect(toLocalDateString(d)).toBe('2026-09-27')
    expect(toLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

function progressWith(lastStudyDate: string, streak: number, extra: Partial<UserProgress> = {}): UserProgress {
  return {
    streak, longestStreak: streak, lastStudyDate, totalWordsLearned: 0,
    categoryProgress: {}, dailyHistory: [], srsCards: [], learnedIds: [], earnedBadges: [],
    ...extra,
  }
}

describe('連勝與 UTC → 本地 遷移', () => {
  const now = new Date(2026, 8, 27, 10, 0) // 本地 2026-09-27 10:00

  test('新格式：昨天讀過 → +1；前天讀過 → 重置', () => {
    const a = progressWith('2026-09-26', 4, { dateSchema: 'local' })
    updateStreak(a, now)
    expect(a.streak).toBe(5)

    const b = progressWith('2026-09-25', 4, { dateSchema: 'local' })
    updateStreak(b, now)
    expect(b.streak).toBe(1)
  })

  test('舊格式（UTC 日期可能落後一天）：前天也算連續，且只寬鬆一次', () => {
    const p = progressWith('2026-09-25', 4) // 實際是 09-26 清晨讀的，UTC 存成 09-25
    updateStreak(p, now)
    expect(p.streak).toBe(5)
    expect(p.dateSchema).toBe('local')
    expect(p.lastStudyDate).toBe('2026-09-27')

    // 標成 local 之後恢復嚴格：隔兩天再讀就重置
    const later = new Date(2026, 8, 30, 10, 0)
    updateStreak(p, later)
    expect(p.streak).toBe(1)
  })

  test('同一天重複讀不重複計數', () => {
    const p = progressWith('2026-09-27', 2, { dateSchema: 'local' })
    const result = updateStreak(p, now)
    expect(p.streak).toBe(2)
    expect(result.newBadges).toEqual([])
  })
})
