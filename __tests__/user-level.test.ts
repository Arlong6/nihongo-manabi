// __tests__/user-level.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getUserLevel, setUserLevel, USER_LEVEL_KEY, getLevelPromptDismissedUntil, setLevelPromptDismissedUntil } from '../lib/storage'

beforeEach(async () => { await AsyncStorage.clear() })

test('getUserLevel 把舊值 beginner/n5/n4 映射成 N5/N5/N4', async () => {
  for (const [raw, expected] of [['beginner', 'N5'], ['n5', 'N5'], ['n4', 'N4']] as const) {
    await AsyncStorage.setItem(USER_LEVEL_KEY, raw)
    expect(await getUserLevel()).toBe(expected)
  }
})

test('缺值或壞值回 N5', async () => {
  expect(await getUserLevel()).toBe('N5')
  await AsyncStorage.setItem(USER_LEVEL_KEY, 'banana')
  expect(await getUserLevel()).toBe('N5')
})

test('setUserLevel 之後 getUserLevel 原樣回傳', async () => {
  await setUserLevel('N3')
  expect(await getUserLevel()).toBe('N3')
  expect(await AsyncStorage.getItem(USER_LEVEL_KEY)).toBe('N3')
})

test('level prompt dismissed until 讀寫', async () => {
  expect(await getLevelPromptDismissedUntil()).toBeNull()
  await setLevelPromptDismissedUntil('2026-10-19')
  expect(await getLevelPromptDismissedUntil()).toBe('2026-10-19')
})
