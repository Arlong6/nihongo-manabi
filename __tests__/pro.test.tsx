import React from 'react'
import { Text } from 'react-native'
import { render, waitFor, act } from '@testing-library/react-native'

// jest.mock 工廠只能引用 mock 開頭的外部變數
const mockListenerRef: { cb: ((info: any) => void) | null } = { cb: null }
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    addCustomerInfoUpdateListener: jest.fn((cb: (info: any) => void) => { mockListenerRef.cb = cb; return { remove: jest.fn() } }),
  },
  LOG_LEVEL: {}, INTRO_ELIGIBILITY_STATUS: {},
}))
const mockIsPro = jest.fn(async () => false)
jest.mock('../lib/iap', () => ({
  isPro: () => mockIsPro(),
  initPurchases: jest.fn(async () => {}),
  purchasesConfigured: () => true,
  packageIsPro: (info: any) => Boolean(info?.entitlements?.active?.pro),
}))

import { ProProvider, usePro } from '../lib/pro'

function Probe() {
  const { pro } = usePro()
  return <Text testID="pro">{pro ? 'yes' : 'no'}</Text>
}

beforeEach(() => { mockListenerRef.cb = null; mockIsPro.mockReset(); mockIsPro.mockResolvedValue(false) })

test('初始 false，isPro 回 true 後變 true', async () => {
  mockIsPro.mockResolvedValue(true)
  const { getByTestId } = render(<ProProvider><Probe /></ProProvider>)
  await waitFor(() => expect(getByTestId('pro').props.children).toBe('yes'))
})

test('RevenueCat listener 推送 entitlement 時更新', async () => {
  const { getByTestId } = render(<ProProvider><Probe /></ProProvider>)
  await waitFor(() => expect(mockListenerRef.cb).not.toBeNull())
  act(() => mockListenerRef.cb!({ entitlements: { active: { pro: {} } } }))
  await waitFor(() => expect(getByTestId('pro').props.children).toBe('yes'))
})

test('usePro 在 Provider 外使用會 throw', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<Probe />)).toThrow('usePro must be used within ProProvider')
  spy.mockRestore()
})
