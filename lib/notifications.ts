import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'

const NOTIF_HOUR_KEY = 'notification_hour'
const NOTIF_ENABLED_KEY = 'notification_enabled'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function scheduleDaily(hour: number, minute: number = 0, dueCount?: number): Promise<void> {
  // 取消舊的通知
  await Notifications.cancelAllScheduledNotificationsAsync()

  const granted = await requestPermissions()
  if (!granted) return

  const body = dueCount && dueCount > 0
    ? `今天有 ${dueCount} 個單字待複習！加油！`
    : getDailyMessage()

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌸 日語學習時間！',
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })

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

function getDailyMessage(): string {
  const messages = [
    '今天要學幾個新單字？繼續保持！',
    '有單字到期複習了，快來看看！',
    '每天 10 分鐘，N3 不是夢！',
    '保持連續學習記錄 🔥 加油！',
    '今日份的日文練習等你來！',
  ]
  return messages[Math.floor(Math.random() * messages.length)]
}
