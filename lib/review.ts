/**
 * In-app App Store review prompt.
 *
 * Deliberately uses a Linking deep-link to the App Store review composer
 * rather than the native SKStoreReviewController (expo-store-review): the
 * native module isn't in the shipped binary, and this file must stay
 * OTA-deployable (pure JS). If a future native build adds expo-store-review,
 * swap openReview() for StoreReview.requestReview() for the smoother in-app
 * popup.
 *
 * Flow: a positive milestone (new streak badge) *arms* the prompt; the ask
 * itself surfaces the next time the user lands on Home, so we never interrupt
 * mid-study. Guarded to at most once per MIN_DAYS_BETWEEN.
 */
import { Alert, Linking, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
