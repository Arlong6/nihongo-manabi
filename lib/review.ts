/**
 * In-app App Store review prompt.
 *
 * Prefers the native SKStoreReviewController popup (expo-store-review, in the
 * binary as of build 13 / v1.5.3) — no app leave, Apple-throttled. Falls back
 * to a soft Alert + App Store review deep-link if the native module isn't
 * available (e.g. an older build the change reaches via OTA); the fallback is
 * guarded so it can never crash on a missing native module.
 *
 * Flow: a positive milestone (new streak badge) *arms* the prompt; the ask
 * itself surfaces the next time the user lands on Home, so we never interrupt
 * mid-study. Guarded to at most once per MIN_DAYS_BETWEEN.
 */
import { Alert, Linking, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as StoreReview from 'expo-store-review'

const APP_STORE_ID = '6760352124'
const REVIEW_URL = `itms-apps://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`
const PENDING_KEY = 'review_prompt_pending'
const LAST_ASKED_KEY = 'review_last_asked'
const MIN_DAYS_BETWEEN = 60

// Arm the prompt after a positive moment. Cheap, fire-and-forget safe.
export async function armReviewPrompt(): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_KEY, '1')
  } catch {
    // best-effort — a missed review prompt is not worth surfacing
  }
}

async function markAsked(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ASKED_KEY, String(Date.now()))
    await AsyncStorage.removeItem(PENDING_KEY)
  } catch {
    // ignore
  }
}

// If armed and not asked recently, show a soft opt-in Alert; only open the
// App Store composer if the user agrees. iOS only.
export async function maybeAskForReview(): Promise<void> {
  if (Platform.OS !== 'ios') return
  try {
    if ((await AsyncStorage.getItem(PENDING_KEY)) !== '1') return
    const lastRaw = await AsyncStorage.getItem(LAST_ASKED_KEY)
    if (lastRaw) {
      const days = (Date.now() - Number(lastRaw)) / 86_400_000
      if (!Number.isNaN(days) && days < MIN_DAYS_BETWEEN) {
        await AsyncStorage.removeItem(PENDING_KEY)
        return
      }
    }
  } catch {
    return
  }

  // Preferred path: native in-app review popup (no app leave, Apple-throttled).
  try {
    if (await StoreReview.isAvailableAsync()) {
      await markAsked()
      await StoreReview.requestReview()
      return
    }
  } catch {
    // Native module unavailable (older build via OTA) — fall through to Linking.
  }

  Alert.alert(
    '喜歡 Nihongo Manabi 嗎？',
    '你的一則 App Store 評分，能幫助更多人發現我們 🙏',
    [
      { text: '以後再說', style: 'cancel', onPress: () => { markAsked() } },
      {
        text: '給評分',
        onPress: () => {
          markAsked()
          Linking.openURL(REVIEW_URL).catch(() => {
            Linking.openURL(`https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`).catch(() => {})
          })
        },
      },
    ],
  )
}
