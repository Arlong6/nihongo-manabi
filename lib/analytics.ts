// PostHog 封裝。沒有 key（本機 dev、Jest）時全部 no-op，App 其他地方不用判斷。
// 事件名稱固定 12 個（spec 4.6），不要在呼叫端用字串拼。
import { PostHog } from 'posthog-react-native'

export type AnalyticsEvent =
  | 'app_open' | 'onboarding_complete' | 'lesson_start' | 'lesson_complete' | 'notif_permission'
  | 'streak_lost' | 'streak_freeze_used' | 'paywall_view' | 'purchase'
  | 'article_open' | 'article_complete' | 'level_up_prompt'

type Props = Record<string, string | number | boolean>

let client: PostHog | null = null

export function analyticsEnabled(): boolean {
  return client != null
}

export async function initAnalytics(): Promise<void> {
  if (client) return
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY
  if (!apiKey) return
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  try {
    client = new PostHog(apiKey, { host, captureAppLifecycleEvents: false })
  } catch {
    client = null
  }
}

export function track(event: AnalyticsEvent, props?: Props): void {
  if (!client) return
  try { client.capture(event, props) } catch { /* analytics 永遠不能弄壞 App */ }
}

/** 把 RevenueCat 的 appUserID 掛成 person property，方便對照付費。distinctId 維持 PostHog 自己的匿名 id。 */
export function identifyWithRevenueCat(appUserId: string): void {
  if (!client) return
  try { client.identify(undefined, { rc_app_user_id: appUserId }) } catch { /* ignore */ }
}
