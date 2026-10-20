import AsyncStorage from '@react-native-async-storage/async-storage'

// jest.mock 工廠只能引用 mock 開頭的外部變數
const mockScheduled: any[] = []
const mockCancelled: string[] = []
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getPermissionsAsync: jest.fn(async () => ({ status: 'undetermined', granted: false, canAskAgain: true })),
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
  hasAskedNotificationPermission, markAskedNotificationPermission, lapseBody, canAskNotificationPermission,
  STREAK_NOTIF_ID, LAPSE_IDS, DEFAULT_LAPSE_HOUR, scheduleDaily, DAILY_NOTIF_ID,
} from '../lib/notifications'
import { toLocalDateString } from '../lib/storage'
import * as Notifications from 'expo-notifications'
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
  test('最後打卡是 3 天前（連勝已斷）→ 取消，不排', async () => {
    const d = new Date(now); d.setDate(d.getDate() - 3)
    await syncStreakRiskNotification(base({ streak: 5, lastStudyDate: toLocalDateString(d) }), now)
    expect(cancelled).toContain(STREAK_NOTIF_ID)
    expect(scheduled.find(s => s.identifier === STREAK_NOTIF_ID)).toBeUndefined()
  })
  test('使用者關閉提醒 → 只取消，不排', async () => {
    await AsyncStorage.setItem('notification_enabled', 'false')
    const y = new Date(now); y.setDate(y.getDate() - 1)
    await syncStreakRiskNotification(base({ streak: 5, lastStudyDate: toLocalDateString(y) }), now)
    expect(cancelled).toContain(STREAK_NOTIF_ID)
    expect(scheduled).toHaveLength(0)
  })
  test('昨天打卡且 streak ≥ 1 → 排今天 21:30 一次性', async () => {
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
  test('使用者關閉提醒 → 只取消，不排', async () => {
    await AsyncStorage.setItem('notification_enabled', 'false')
    await scheduleLapseReminders(base({ streak: 3 }), now)
    for (const id of LAPSE_IDS) expect(cancelled).toContain(id)
    expect(scheduled).toHaveLength(0)
  })
  test('使用者有設提醒時間就用那個小時', async () => {
    await AsyncStorage.setItem('notification_hour', '8')
    await scheduleLapseReminders(base(), now)
    expect(new Date(scheduled.find(s => s.identifier === 'lapse-3').trigger.date).getHours()).toBe(8)
  })
  test('每日提醒開啟 → 不排 lapse-1（並取消），保留 lapse-3 / lapse-7', async () => {
    await AsyncStorage.setItem('notification_enabled', 'true')
    await scheduleLapseReminders(base({ streak: 3 }), now)
    expect(cancelled).toContain('lapse-1')
    expect(scheduled.map(s => s.identifier).sort()).toEqual(['lapse-3', 'lapse-7'])
  })
  test('每日提醒未開啟 → 三則都排', async () => {
    await scheduleLapseReminders(base({ streak: 3 }), now)
    expect(scheduled.map(s => s.identifier).sort()).toEqual(['lapse-1', 'lapse-3', 'lapse-7'])
  })
  test('到期數為 0 / 連勝為 0 時改用不帶數字的文案', () => {
    expect(lapseBody(1, { dueIn: 0, streak: 0, level: 'N5' })).toBe('notif.lapse1Empty')
    expect(lapseBody(3, { dueIn: 0, streak: 0, level: 'N5' })).toBe('notif.lapse3NoStreak')
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

test('suggestReminderTime 往前取整到整點或半點，深夜不繞到隔天', () => {
  expect(suggestReminderTime(new Date(2026, 9, 12, 20, 0))).toEqual({ hour: 20, minute: 0 })
  expect(suggestReminderTime(new Date(2026, 9, 12, 20, 10))).toEqual({ hour: 20, minute: 0 })
  expect(suggestReminderTime(new Date(2026, 9, 12, 20, 30))).toEqual({ hour: 20, minute: 30 })
  expect(suggestReminderTime(new Date(2026, 9, 12, 20, 50))).toEqual({ hour: 20, minute: 30 })
  expect(suggestReminderTime(new Date(2026, 9, 12, 23, 57))).toEqual({ hour: 23, minute: 30 })
  expect(suggestReminderTime(new Date(2026, 9, 12, 0, 10))).toEqual({ hour: 0, minute: 0 })
})

test('權限對話只問一次（永久旗標）', async () => {
  expect(await hasAskedNotificationPermission()).toBe(false)
  await markAskedNotificationPermission()
  expect(await hasAskedNotificationPermission()).toBe(true)
})

test('canAskNotificationPermission 只有 iOS 還沒決定過時才回 true', async () => {
  const get = Notifications.getPermissionsAsync as jest.Mock
  get.mockResolvedValueOnce({ status: 'undetermined', granted: false, canAskAgain: true })
  expect(await canAskNotificationPermission()).toBe(true)
  // 已允許：使用者在「進度」頁關掉提醒後，不能再用說明視窗把它打開
  get.mockResolvedValueOnce({ status: 'granted', granted: true, canAskAgain: true })
  expect(await canAskNotificationPermission()).toBe(false)
  // 已拒絕：iOS 不會再跳視窗
  get.mockResolvedValueOnce({ status: 'denied', granted: false, canAskAgain: false })
  expect(await canAskNotificationPermission()).toBe(false)
})

test('lapseBody 三種文案都走 i18n', () => {
  expect(lapseBody(1, { dueIn: 4, streak: 2, level: 'N5' })).toContain('notif.lapse1')
  expect(lapseBody(3, { dueIn: 4, streak: 2, level: 'N5' })).toContain('notif.lapse3')
  expect(lapseBody(7, { dueIn: 4, streak: 2, level: 'N5' })).toContain('notif.lapse7')
})

test('scheduleDaily 只取消 DAILY_NOTIF_ID，不清掉其他排程', async () => {
  await scheduleDaily(9, 30)
  expect(Notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled()
  expect(cancelled).toContain(DAILY_NOTIF_ID)
  expect(scheduled.find(s => s.identifier === DAILY_NOTIF_ID)).toBeDefined()
})
