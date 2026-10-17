// Jest 共用設定：AsyncStorage 用官方 in-memory mock；expo-store-review 與廣告 SDK 是原生模組，一律 mock。
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)
jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(async () => false),
  requestReview: jest.fn(async () => {}),
}))
jest.mock('react-native-google-mobile-ads', () => {
  throw new Error('native module not available in jest')
})
jest.mock('posthog-react-native', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    capture: jest.fn(), identify: jest.fn(), flush: jest.fn(async () => {}),
  })),
}))
