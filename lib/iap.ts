/**
 * RevenueCat (in-app purchase) wrapper.
 *
 * Pro entitlement unlocks:
 *   - AI conversation: no daily quota
 *   - JLPT N1/N2 mode
 *   - Camera OCR translation: unlimited
 *
 * Setup the user has to do before this actually fires real charges:
 *   1. App Store Connect → create two auto-renewable subscriptions:
 *        product_id: nihongo_pro_monthly     price: NT$99/月
 *        product_id: nihongo_pro_yearly      price: NT$590/年   (7-day free trial)
 *      Group both into a single Subscription Group named "Nihongo Pro".
 *   2. RevenueCat dashboard → New Project "Nihongo Manabi"
 *      → Apps: add iOS app with the bundle id (com.nihongomanabi.app)
 *      → Products: import both IAPs from App Store Connect
 *      → Entitlements: create "pro" and attach both products
 *      → Offerings: create "default" with monthly + yearly packages
 *      → Mark "default" as the Current offering
 *      → Copy the public iOS SDK key
 *   3. Set EXPO_PUBLIC_REVENUECAT_IOS_KEY env in Expo project / .env
 *
 * Without those, getOfferings() returns empty and isPro() returns false.
 * The app still runs, just like a free-only build.
 */
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases'
import { Platform } from 'react-native'

export const PRO_ENTITLEMENT = 'pro'

let configured = false
let configurePromise: Promise<void> | null = null

export function initPurchases(appUserId?: string): Promise<void> {
  if (configurePromise) return configurePromise
  configurePromise = (async () => {
    const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
    const apiKey = Platform.OS === 'ios' ? iosKey : androidKey
    if (!apiKey) {
      console.warn('[iap] RevenueCat key missing; running without IAP')
      return
    }
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR)
    await Purchases.configure({ apiKey, appUserID: appUserId ?? null })
    configured = true
  })()
  return configurePromise
}

export async function isPro(): Promise<boolean> {
  await initPurchases()
  if (!configured) return false
  try {
    const info = await Purchases.getCustomerInfo()
    return Boolean(info.entitlements.active[PRO_ENTITLEMENT])
  } catch {
    return false
  }
}

export type OfferingsResult =
  | { kind: 'ok'; offering: PurchasesOffering }
  | { kind: 'no-key' }
  | { kind: 'no-current-offering' }
  | { kind: 'network'; error: string }

// Callers should branch on kind to give the user an accurate message.
// Apple's reviewer needs to see why Pro upgrade isn't working — a generic
// "loading..." is what got us rejected last time.
export async function fetchOfferings(): Promise<OfferingsResult> {
  await initPurchases()
  if (!configured) return { kind: 'no-key' }
  try {
    const o = await Purchases.getOfferings()
    if (!o.current) return { kind: 'no-current-offering' }
    return { kind: 'ok', offering: o.current }
  } catch (e: any) {
    return { kind: 'network', error: e?.message ?? 'unknown' }
  }
}

// Backward-compat for callers that just want the offering or null.
export async function getOfferings(): Promise<PurchasesOffering | null> {
  const r = await fetchOfferings()
  return r.kind === 'ok' ? r.offering : null
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg)
  return customerInfo
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return await Purchases.restorePurchases()
}

export function packageIsPro(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[PRO_ENTITLEMENT])
}
