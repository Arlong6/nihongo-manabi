// AdMob 激勵影片：唯一的廣告版位。
//
// 用途不是賺廣告費（用量太小），而是讓免費用戶在 AI 對話／拍照翻譯額度用完時，
// 看一支 15–30 秒影片多換 1 次，當作 Pro 的漏斗。Pro 用戶永遠不會走到這裡。
//
// 設計重點：
// - 用 require 包起來：react-native-google-mobile-ads 在 import 時就會找 TurboModule，
//   Expo Go、dev client 舊 binary 或忘了 bump runtimeVersion 的 OTA 都會直接 crash。
//   沒有模組時所有函式安靜地回傳 false，UI 就不顯示「看廣告」按鈕。
// - 初始化順序固定 ATT → UMP 同意 → SDK initialize（Apple 5.1.2 要求先問追蹤再初始化）。
// - Pro 用戶連 SDK 都不初始化、不問 ATT。
import { Platform } from 'react-native'
import { isPro } from './iap'

type GMA = typeof import('react-native-google-mobile-ads')

let gma: GMA | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  gma = require('react-native-google-mobile-ads') as GMA
} catch {
  gma = null
}

/** 原生模組存在（不代表已初始化）。UI 用來決定要不要露出「看廣告」入口。 */
export function adsAvailable(): boolean {
  return gma != null
}

// 冷啟動後第一次請求（SDK 剛 initialize）在模擬器上實測可能超過 15 秒
const LOAD_TIMEOUT_MS = 30_000

let initPromise: Promise<boolean> | null = null

/** 初始化一次；回傳是否可以請求廣告。失敗會清掉快取讓下次再試。 */
export function initAds(): Promise<boolean> {
  if (!initPromise) {
    initPromise = doInit().catch(() => {
      initPromise = null
      return false
    })
  }
  return initPromise
}

async function doInit(): Promise<boolean> {
  if (!gma) return false
  if (await isPro()) return false

  if (Platform.OS === 'ios') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const att = require('expo-tracking-transparency') as typeof import('expo-tracking-transparency')
      await att.requestTrackingPermissionsAsync()
    } catch {
      // 模組不在（舊 binary）或使用者已回答過：都不影響後面流程
    }
  }

  try {
    // 台灣、日本等非受規範地區不會顯示表單；歐盟會。照官方流程走，不自己判斷地區。
    await gma.AdsConsent.gatherConsent()
  } catch {
    // 沒網路或表單失敗：交給 canRequestAds 決定
  }
  const info = await gma.AdsConsent.getConsentInfo().catch(() => null)
  if (info && info.canRequestAds === false) return false

  const mobileAds = gma.default()
  await mobileAds.setRequestConfiguration({
    // 目標用戶含學生：內容分級到 PG 為止
    maxAdContentRating: gma.MaxAdContentRating.PG,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
  })
  await mobileAds.initialize()
  return true
}

function rewardedUnitId(g: GMA): string {
  // 正式 unit ID 放 EAS production 環境變數；沒設就用 Google 官方測試 ID（點了不會被判無效流量）
  return process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || g.TestIds.REWARDED
}

/**
 * 載入並播放一支激勵影片。回傳「使用者是否看完並取得獎勵」。
 * 任何失敗（沒模組、沒初始化、載入逾時、播放錯誤、中途關掉）都回傳 false，不丟例外。
 */
export async function showRewarded(): Promise<boolean> {
  const g = gma
  if (!g) return false
  if (!(await initAds())) return false

  return new Promise<boolean>(resolve => {
    const ad = g.RewardedAd.createForAdRequest(rewardedUnitId(g))
    let earned = false
    let settled = false
    const unsubscribers: Array<() => void> = []

    const finish = (value: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(loadTimer)
      unsubscribers.forEach(u => u())
      resolve(value)
    }

    // 只對「載入」設逾時；播放中要等使用者看完或關掉
    const loadTimer = setTimeout(() => finish(false), LOAD_TIMEOUT_MS)

    unsubscribers.push(
      ad.addAdEventListener(g.RewardedAdEventType.LOADED, () => {
        clearTimeout(loadTimer)
        ad.show().catch(() => finish(false))
      }),
      ad.addAdEventListener(g.RewardedAdEventType.EARNED_REWARD, () => {
        earned = true
      }),
      ad.addAdEventListener(g.AdEventType.CLOSED, () => finish(earned)),
      ad.addAdEventListener(g.AdEventType.ERROR, () => finish(false)),
    )
    ad.load()
  })
}
