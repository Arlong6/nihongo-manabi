import AsyncStorage from '@react-native-async-storage/async-storage'

// jest.mock 工廠只能引用 mock 開頭的外部變數
const mockScheduled: any[] = []
const mockCancelled: string[] = []
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async (req: any) => { mockScheduled.push(req); return req.identifier }),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => { mockCancelled.push(id) }),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => { mockScheduled.length = 0 }),
  SchedulableTriggerInputTypes: { DAILY: 'daily', DATE: 'date' },
}))
const scheduled = mockScheduled
const cancelled = mockCancelled
jest.mock('../lib/i18n', () => {
  const t = (key: string, opts?: Record<string, unknown>) => `${key}${opts ? ':' + JSON.stringify(opts) : ''}`
  return { __esModule: true, default: { t, language: 'zh-TW' } }
})

import {
  syncStreakRiskNotification, scheduleLapseReminders, countDueWithin, suggestReminderTime,
  hasAskedNotificationPermission, markAskedNotificationPermission, lapseBody,
  STREAK_NOTIF_ID, LAPSE_IDS, DEFAULT_LAPSE_HOUR,
} from '../lib/notifications'
import { toLocalDateString } from '../lib/storage'
import type { UserProgress, SRSCard } from '../types'

function base(over: Partial<UserProgress> = {}): UserProgress {
  return {
    streak: 0, longestStreak: 0, lastStudyDate: '', totalWordsLearned: 0, categoryProgress: {},
    dailyHistory: [], srsCards: [], learnedIds: [], earnedBadges: [], streakFreezes: 0, dateSchema: 'local', ...over,
  }
}
function card(id: string, daysFromNow: number, now: Date): SRSCard {
  const d = new Date(now); d.setDate(d.getDate() + daysFromNow)
  return { id, type: 'vocabulary', nextReview: d.toISOString(), interval: 1, repetitions: 1, easeFactor: 2.5 }
}

beforeEach(async () => { await AsyncStorage.clear(); scheduled.length = 0; cancelled.length = 0 })

describe('syncStreakRiskNotification', () => {
  const now = new Date(2026, 9, 12, 18, 0)
  test('當天已打卡 → 取消，不排', async () => {
    await syncStreakRiskNotification(base({ streak: 5, lastStudyDate: toLocalDateString(now) }), now)
    expect(cancelled).toContain(STREAK_NOTIF_ID)
    expect(scheduled.find(s => s.identifier === STREAK_NOTIF_ID)).toBeUndefined()
  })
  test('未打卡且 streak ≥ 1 → 排今天 21:30 一次性', async () => {
    const y = new Date(now); y.setDate(y.getDate() - 1)
    await syncStreakRiskNotification(base({ streak: 5, lastStudyDate: toLocalDateString(y) }), now)
    const req = scheduled.find(s => s.identifier === STREAK_NOTIF_ID)
    expect(req).toBeDefined()
    expect(req.trigger.type).toBe('date')
    const fire = new Date(req.trigger.date)
    expect(fire.getHours()).toBe(21); expect(fire.getMinutes()).toBe(30)
    expect(toLocalDateString(fire)).toBe(toLocalDateString(now))
  })
  test('streak 0 → 不排', async () => {
    await syncStreakRiskNotification(base({ streak: 0 }), now)
    expect(scheduled.find(s => s.identifier === STREAK_NOTIF_ID)).toBeUndefined()
  })
  test('已過 21:30 → 不排', async () => {
    const late = new Date(2026, 9, 12, 22, 0)
    const y = new Date(late); y.setDate(y.getDate() - 1)
    await syncStreakRiskNotification(base({ streak: 5, lastStudyDate: toLocalDateString(y) }), late)
    expect(scheduled.find(s => s.identifier === STREAK_NOTIF_ID)).toBeUndefined()
  })
})

describe('scheduleLapseReminders', () => {
  const now = new Date(2026, 9, 12, 20, 15)
  test('先取消三則再排 D+1/D+3/D+7，預設 19:00', async () => {
    await scheduleLapseReminders(base({ streak: 3 }), now)
    for (const id of LAPSE_IDS) expect(cancelled).toContain(id)
    const reqs = LAPSE_IDS.map(id => scheduled.find(s => s.identifier === id))
    expect(reqs.every(Boolean)).toBe(true)
    const days = reqs.map(r => Math.round((new Date(r.trigger.date).getTime() - now.getTime()) / 86400000))
    expect(days).toEqual([1, 3, 7])
    expect(new Date(reqs[0].trigger.date).getHours()).toBe(DEFAULT_LAPSE_HOUR)
  })
  test('使用者有設提醒時間就用那個小時', async () => {
    await AsyncStorage.setItem('notification_hour', '8')
    await scheduleLapseReminders(base(), now)
    expect(new Date(scheduled.find(s => s.identifier === 'lapse-3').trigger.date).getHours()).toBe(8)
  })
  test('文案帶到期數與連勝', async () => {
    const p = base({ streak: 9, srsCards: [card('a', 0, now), card('b', 2, now), card('c', 10, now)] })
    await scheduleLapseReminders(p, now)
    const d3 = scheduled.find(s => s.identifier === 'lapse-3')
    expect(d3.content.body).toContain('notif.lapse3')
    expect(d3.content.body).toContain('"streak":9')
  })
})

test('countDueWithin', () => {
  const now = new Date(2026, 9, 12, 12, 0)
  const cards = [card('a', -1, now), card('b', 0, now), card('c', 2, now), card('d', 5, now)]
  expect(countDueWithin(cards, 1, now)).toBe(2)
  expect(countDueWithin(cards, 3, now)).toBe(3)
  expect(countDueWithin(cards, 7, now)).toBe(4)
})

test('suggestReminderTime 四捨五入到整點或半點', () => {
  expect(suggestReminderTime(new Date(2026, 9, 12, 20, 10))).toEqual({ hour: 20, minute: 0 })
  expect(suggestReminderTime(new Date(2026, 9, 12, 20, 20))).toEqual({ hour: 20, minute: 30 })
  expect(suggestReminderTime(new Date(2026, 9, 12, 20, 50))).toEqual({ hour: 21, minute: 0 })
  expect(suggestReminderTime(new Date(2026, 9, 12, 23, 50))).toEqual({ hour: 0, minute: 0 })
})

test('權限對話只問一次（永久旗標）', async () => {
  expect(await hasAskedNotificationPermission()).toBe(false)
  await markAskedNotificationPermission()
  expect(await hasAskedNotificationPermission()).toBe(true)
})

test('lapseBody 三種文案都走 i18n', () => {
  expect(lapseBody(1, { dueIn: 4, streak: 2, level: 'N5' })).toContain('notif.lapse1')
  expect(lapseBody(3, { dueIn: 4, streak: 2, level: 'N5' })).toContain('notif.lapse3')
  expect(lapseBody(7, { dueIn: 4, streak: 2, level: 'N5' })).toContain('notif.lapse7')
})
