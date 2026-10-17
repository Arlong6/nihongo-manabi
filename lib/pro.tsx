import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import Purchases from 'react-native-purchases'
import { isPro, initPurchases, purchasesConfigured, packageIsPro } from './iap'

interface ProContextValue {
  pro: boolean
  /** 重新向 RevenueCat 查一次並回傳最新值；gate 判斷時用它取代快取的 pro。 */
  refresh: () => Promise<boolean>
}

const ProContext = createContext<ProContextValue | null>(null)

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [pro, setPro] = useState(false)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    const next = await isPro()
    if (mounted.current) setPro(next)
    return next
  }, [])

  useEffect(() => {
    mounted.current = true
    refresh().catch(() => {})
    let sub: { remove: () => void } | null = null
    initPurchases()
      .then(() => {
        if (!purchasesConfigured()) return   // 無 key：SDK 未 configure，不能掛 listener
        sub = Purchases.addCustomerInfoUpdateListener(info => {
          if (mounted.current) setPro(packageIsPro(info))
        }) as unknown as { remove: () => void }
      })
      .catch(() => { /* 無 key 時沒有 listener，pro 維持 false */ })
    return () => { mounted.current = false; sub?.remove() }
  }, [refresh])

  return <ProContext.Provider value={{ pro, refresh }}>{children}</ProContext.Provider>
}

export function usePro(): ProContextValue {
  const ctx = useContext(ProContext)
  if (!ctx) throw new Error('usePro must be used within ProProvider')
  return ctx
}
