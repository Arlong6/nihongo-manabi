/**
 * 試用標籤只能在「商品真的有免費試用」且 Apple 沒說不符資格時顯示。
 * 背景：2026-10 付費牆在 ASC 完全沒設優惠的情況下仍顯示「含 7 天免費試用」，
 * 因為 SDK 回的是 NO_INTRO_OFFER_EXISTS 而非 INELIGIBLE。
 */
// jest.mock 會被提升到 import 之前，工廠內不能引用測試檔的變數，所以函式在工廠裡建，
// 之後從被 mock 的模組取回引用。
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(async () => {}),
    setLogLevel: jest.fn(),
    checkTrialOrIntroductoryPriceEligibility: jest.fn(),
  },
  INTRO_ELIGIBILITY_STATUS: {
    INTRO_ELIGIBILITY_STATUS_UNKNOWN: 0,
    INTRO_ELIGIBILITY_STATUS_INELIGIBLE: 1,
    INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2,
    INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS: 3,
  },
  LOG_LEVEL: { WARN: 'WARN', ERROR: 'ERROR' },
  PURCHASES_ERROR_CODE: {},
}))

process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = 'appl_test'

import Purchases from 'react-native-purchases'
import { checkTrialEligibility, productHasFreeTrial } from '../lib/iap'

const mockCheck = Purchases.checkTrialOrIntroductoryPriceEligibility as jest.Mock

const freeTrial = { price: 0, priceString: 'NT$0', cycles: 1, period: 'P1W', periodUnit: 'WEEK', periodNumberOfUnits: 1 }
const paidIntro = { ...freeTrial, price: 50, priceString: 'NT$50' }
const product = (introPrice: typeof freeTrial | null) => ({ identifier: 'nihongo_pro_yearly', introPrice } as any)
const status = (s: number) => { mockCheck.mockResolvedValue({ nihongo_pro_yearly: { status: s, description: '' } }) }

beforeEach(() => { mockCheck.mockReset() })

describe('productHasFreeTrial', () => {
  it('沒有 introPrice 就沒有試用', () => {
    expect(productHasFreeTrial(product(null))).toBe(false)
  })
  it('introPrice 價格大於 0 是折扣價不是免費試用', () => {
    expect(productHasFreeTrial(product(paidIntro))).toBe(false)
  })
  it('introPrice 價格為 0 才是免費試用', () => {
    expect(productHasFreeTrial(product(freeTrial))).toBe(true)
  })
})

describe('checkTrialEligibility', () => {
  it('商品沒有試用時，即使 SDK 說符合資格也回 false，且不呼叫 SDK', async () => {
    status(2)
    expect(await checkTrialEligibility(product(null))).toBe(false)
    expect(mockCheck).not.toHaveBeenCalled()
  })
  it('有免費試用 + ELIGIBLE → true', async () => {
    status(2)
    expect(await checkTrialEligibility(product(freeTrial))).toBe(true)
  })
  it('有免費試用 + INELIGIBLE（用過了）→ false', async () => {
    status(1)
    expect(await checkTrialEligibility(product(freeTrial))).toBe(false)
  })
  it('有免費試用 + NO_INTRO_OFFER_EXISTS（SDK 與商品矛盾）→ 保守回 false', async () => {
    status(3)
    expect(await checkTrialEligibility(product(freeTrial))).toBe(false)
  })
  it('有免費試用 + UNKNOWN（StoreKit 暖機中）→ 不藏有效試用，回 true', async () => {
    status(0)
    expect(await checkTrialEligibility(product(freeTrial))).toBe(true)
  })
})
