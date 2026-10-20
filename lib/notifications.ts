import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from './i18n'
import type { UserProgress, SRSCard } from '../types'
import { STREAK_BADGES } from '../types'
import { toLocalDateString } from './storage'

const NOTIF_HOUR_KEY = 'notification_hour'
const NOTIF_MINUTE_KEY = 'notification_minute'
const NOTIF_ENABLED_KEY = 'notification_enabled'
const NOTIF_ASKED_KEY = 'notification_asked'
export const DAILY_NOTIF_ID = 'daily-reminder'
export const STREAK_NOTIF_ID = 'streak-warning'
export const LAPSE_IDS = ['lapse-1', 'lapse-3', 'lapse-7'] as const
export const LAPSE_DAYS = [1, 3, 7] as const
export const DEFAULT_LAPSE_HOUR = 19
const STREAK_RISK_HOUR = 21
const STREAK_RISK_MINUTE = 30

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true,
  }),
})

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export interface DailyScheduleContext {
  dueCount?: number
  currentStreak?: number
  longestStreak?: number
}

/** 每日提醒（固定時間，每天重複）。連勝風險通知改由 syncStreakRiskNotification 條件式管理。 */
export async function scheduleDaily(hour: number, minute: number = 0, context: DailyScheduleContext = {}): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIF_ID)
  const granted = await requestPermissions()
  if (!granted) return
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_NOTIF_ID,
    content: { title: i18n.t('notif.dailyTitle'), body: composeDailyBody(context), sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  })
  await AsyncStorage.setItem(NOTIF_HOUR_KEY, String(hour))
  await AsyncStorage.setItem(NOTIF_MINUTE_KEY, String(minute))
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true')
}

/** 使用者在設定頁明確關閉（enabled === 'false'）。從未設定（null）視為允許。 */
async function isOptedOut(): Promise<boolean> {
  return (await AsyncStorage.getItem(NOTIF_ENABLED_KEY)) === 'false'
}

export async function cancelNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false')
}

export async function getNotificationSettings(): Promise<{ enabled: boolean; hour: number; minute: number }> {
  const [enabled, hour, minute] = await Promise.all([
    AsyncStorage.getItem(NOTIF_ENABLED_KEY), AsyncStorage.getItem(NOTIF_HOUR_KEY), AsyncStorage.getItem(NOTIF_MINUTE_KEY),
  ])
  return { enabled: enabled === 'true', hour: hour ? parseInt(hour, 10) : 9, minute: minute ? parseInt(minute, 10) : 0 }
}

function composeDailyBody({ dueCount, currentStreak, longestStreak }: DailyScheduleContext): string {
  if (dueCount && dueCount > 0) return i18n.t('notif.dailyDue', { count: dueCount })
  if (currentStreak && currentStreak >= 1) {
    const milestone = STREAK_BADGES.find(m => m > currentStreak)
    if (milestone && milestone - currentStreak <= 3) {
      return i18n.t('notif.dailyMilestone', { streak: currentStreak, remaining: milestone - currentStreak, milestone })
    }
    if (longestStreak && currentStreak >= longestStreak && currentStreak >= 7) {
      return i18n.t('notif.dailyRecord', { streak: currentStreak })
    }
    return i18n.t('notif.dailyStreak', { streak: currentStreak })
  }
  return i18n.t('notif.dailyGeneric')
}

// ── 連勝風險（條件式）────────────────────────────────────────────────────────
/** App 回前景或課程完成時呼叫。當天已打卡就取消；未打卡且有連勝就排今天 21:30 一次性。 */
export async function syncStreakRiskNotification(progress: UserProgress, now: Date = new Date()): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIF_ID)
  // 只有「昨天有打卡」的連勝才有可能今天斷；更早的連勝已斷（儲存的 streak 要到下次打卡才歸零）
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (progress.lastStudyDate !== toLocalDateString(yesterday) || progress.streak < 1) return
  if (await isOptedOut()) return
  const fire = new Date(now)
  fire.setHours(STREAK_RISK_HOUR, STREAK_RISK_MINUTE, 0, 0)
  if (fire.getTime() <= now.getTime()) return
  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_NOTIF_ID,
    content: { title: i18n.t('notif.streakRiskTitle'), body: i18n.t('notif.streakRiskBody', { streak: progress.streak }), sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire },
  })
}

// ── 流失召回 D+1 / D+3 / D+7 ─────────────────────────────────────────────────
export function countDueWithin(cards: SRSCard[], days: number, now: Date = new Date()): number {
  const limit = now.getTime() + days * 86400000
  return cards.filter(c => new Date(c.nextReview).getTime() <= limit).length
}

export function lapseBody(day: 1 | 3 | 7, ctx: { dueIn: number; streak: number; level: string }): string {
  if (day === 1) return ctx.dueIn > 0 ? i18n.t('notif.lapse1', { dueIn: ctx.dueIn }) : i18n.t('notif.lapse1Empty')
  if (day === 3) return ctx.streak > 0 ? i18n.t('notif.lapse3', { streak: ctx.streak }) : i18n.t('notif.lapse3NoStreak')
  return i18n.t('notif.lapse7', { level: ctx.level })
}

/** 每次打卡完成時重排。再打卡會先取消再排，所以活躍用戶永遠收不到。 */
export async function scheduleLapseReminders(progress: UserProgress, now: Date = new Date(), level: string = 'N5'): Promise<void> {
  for (const id of LAPSE_IDS) await Notifications.cancelScheduledNotificationAsync(id)
  if (await isOptedOut()) return
  const hourRaw = await AsyncStorage.getItem(NOTIF_HOUR_KEY)
  const hour = hourRaw ? parseInt(hourRaw, 10) : DEFAULT_LAPSE_HOUR
  // 每日提醒已開啟時，D+1 會和它撞在同一個小時重複打擾，所以只留 D+3 / D+7
  const dailyOn = (await AsyncStorage.getItem(NOTIF_ENABLED_KEY)) === 'true'
  for (let i = 0; i < LAPSE_DAYS.length; i++) {
    const day = LAPSE_DAYS[i]
    if (day === 1 && dailyOn) continue
    const fire = new Date(now)
    fire.setDate(fire.getDate() + day)
    fire.setHours(hour, 0, 0, 0)
    await Notifications.scheduleNotificationAsync({
      identifier: LAPSE_IDS[i],
      content: {
        title: i18n.t('notif.lapseTitle'),
        body: lapseBody(day, { dueIn: countDueWithin(progress.srsCards, day, now), streak: progress.streak, level }),
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fire },
    })
  }
}

// ── 權限時機 ─────────────────────────────────────────────────────────────────
export async function hasAskedNotificationPermission(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(NOTIF_ASKED_KEY)) === 'true' } catch { return false }
}
export async function markAskedNotificationPermission(): Promise<void> {
  try { await AsyncStorage.setItem(NOTIF_ASKED_KEY, 'true') } catch { /* best-effort */ }
}
/** iOS 還會跳出系統權限視窗（尚未決定過）才回 true；已允許或已拒絕時，再要求權限不會有任何畫面。 */
export async function canAskNotificationPermission(): Promise<boolean> {
  const p = await Notifications.getPermissionsAsync()
  return !p.granted && p.canAskAgain
}

/** 取現在時間往前取整到整點或半點，當作建議的提醒時間（提醒落在平常學習時間之前；深夜不會繞到隔天 00:00）。 */
export function suggestReminderTime(now: Date = new Date()): { hour: number; minute: number } {
  const total = now.getHours() * 60 + now.getMinutes()
  const floored = Math.floor(total / 30) * 30
  return { hour: Math.floor(floored / 60), minute: floored % 60 }
}

export const __test = { composeDailyBody }
