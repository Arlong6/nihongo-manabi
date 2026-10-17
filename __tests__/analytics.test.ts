const mockCapture = jest.fn()
const mockIdentify = jest.fn()
jest.mock('posthog-react-native', () => ({
  PostHog: jest.fn().mockImplementation(() => ({ capture: mockCapture, identify: mockIdentify, flush: jest.fn(async () => {}) })),
}))

describe('analytics', () => {
  const OLD = process.env
  beforeEach(() => { jest.resetModules(); process.env = { ...OLD }; mockCapture.mockClear(); mockIdentify.mockClear() })
  afterAll(() => { process.env = OLD })

  test('沒有 key：initAnalytics 不建 client，track 靜默', async () => {
    delete process.env.EXPO_PUBLIC_POSTHOG_KEY
    const a = require('../lib/analytics') as typeof import('../lib/analytics')
    await a.initAnalytics()
    expect(a.analyticsEnabled()).toBe(false)
    expect(() => a.track('app_open')).not.toThrow()
    expect(mockCapture).not.toHaveBeenCalled()
  })

  test('有 key：track 呼叫 capture 帶事件名與屬性', async () => {
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test'
    const a = require('../lib/analytics') as typeof import('../lib/analytics')
    await a.initAnalytics()
    expect(a.analyticsEnabled()).toBe(true)
    a.track('lesson_complete', { level: 'N5', correct: 8, total: 10, duration_s: 120 })
    expect(mockCapture).toHaveBeenCalledWith('lesson_complete', { level: 'N5', correct: 8, total: 10, duration_s: 120 })
  })

  test('init 之前的 track 不會 throw 也不會補送', async () => {
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test'
    const a = require('../lib/analytics') as typeof import('../lib/analytics')
    a.track('app_open')
    await a.initAnalytics()
    expect(mockCapture).not.toHaveBeenCalled()
  })

  test('identifyWithRevenueCat 設 person property', async () => {
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test'
    const a = require('../lib/analytics') as typeof import('../lib/analytics')
    await a.initAnalytics()
    a.identifyWithRevenueCat('$RCAnonymousID:abc')
    expect(mockIdentify).toHaveBeenCalledWith(undefined, { rc_app_user_id: '$RCAnonymousID:abc' })
  })
})
