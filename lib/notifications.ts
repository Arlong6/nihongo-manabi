import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'

const NOTIF_HOUR_KEY = 'notification_hour'
const NOTIF_ENABLED_KEY = 'notification_enabled'
// Identifiers so we can target the two reminders separately when needed.
const DAILY_NOTIF_ID = 'daily-reminder'
const STREAK_NOTIF_ID = 'streak-warning'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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

/**
 * Schedules the user-facing daily reminder at the chosen hour, plus a
 * separate late-evening "你的連勝快斷了" warning at 21:30 that only fires
 * when the user has an active streak worth protecting.
 *
 * Cancelling and rescheduling on every call keeps the message text fresh —
 * the body string is captured at schedule time, so we want it to reflect the
 * latest streak/due-count whenever the app launches.
 */
export async function scheduleDaily(
  hour: number,
  minute: number = 0,
  context: DailyScheduleContext = {},
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()

  const granted = await requestPermissions()
  if (!granted) return

  const body = composeDailyBody(context)
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_NOTIF_ID,
    content: { title: '🌸 日語學習時間！', body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })

  // Late-evening warning fires only if there's a streak >= 2 worth saving.
  // No-op for first-day or zero-streak users so they aren't nagged.
  const streak = context.currentStreak ?? 0
  if (streak >= 2) {
    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_NOTIF_ID,
      content: {
        title: '🔥 別讓連勝斷在今天',
        body: `你的 ${streak} 天連勝今天還沒打卡，1 分鐘就能保住記錄！`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 30,
      },
    })
  }

  await AsyncStorage.setItem(NOTIF_HOUR_KEY, String(hour))
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true')
}

export async function cancelNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false')
}

export async function getNotificationSettings(): Promise<{ enabled: boolean; hour: number }> {
  const [enabled, hour] = await Promise.all([
    AsyncStorage.getItem(NOTIF_ENABLED_KEY),
    AsyncStorage.getItem(NOTIF_HOUR_KEY),
  ])
  return {
    enabled: enabled === 'true',
    hour: hour ? parseInt(hour) : 9,
  }
}

function composeDailyBody({ dueCount, currentStreak, longestStreak }: DailyScheduleContext): string {
  // Priority: SRS reviews due > streak milestone close > generic
  if (dueCount && dueCount > 0) {
    return `今天有 ${dueCount} 個單字到期複習，10 分鐘就能掃完 🔥`
  }
  if (currentStreak && currentStreak >= 1) {
    const nextMilestone = [3, 7, 14, 30, 60, 100, 200, 365].find(m => m > currentStreak)
    if (nextMilestone) {
      const remaining = nextMilestone - currentStreak
      if (remaining <= 3) {
        return `🔥 連勝第 ${currentStreak} 天！再 ${remaining} 天解鎖「${nextMilestone} 日勳章」`
      }
    }
    if (longestStreak && currentStreak >= longestStreak && currentStreak >= 7) {
      return `🏆 ${currentStreak} 天連勝 — 你正在創造個人新紀錄`
    }
    return `🔥 連勝第 ${currentStreak} 天，繼續保持！`
  }
  const messages = [
    '今天要學幾個新單字？繼續保持！',
    '有單字到期複習了，快來看看！',
    '每天 10 分鐘，N3 不是夢！',
    '今日份的日文練習等你來！',
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}

export const __test = { composeDailyBody }
