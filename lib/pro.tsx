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
    const listener = (info: Parameters<typeof packageIsPro>[0]) => {
      if (mounted.current) setPro(packageIsPro(info))
    }
    let attached = false
    initPurchases()
      .then(() => {
        if (!mounted.current) return          // 已 unmount：不要再掛 listener
        if (!purchasesConfigured()) return   // 無 key：SDK 未 configure，不能掛 listener
        Purchases.addCustomerInfoUpdateListener(listener)
        attached = true
      })
      .catch(() => { /* 無 key 時沒有 listener，pro 維持 false */ })
    return () => {
      mounted.current = false
      if (attached) Purchases.removeCustomerInfoUpdateListener(listener)
    }
  }, [refresh])

  return <ProContext.Provider value={{ pro, refresh }}>{children}</ProContext.Provider>
}

export function usePro(): ProContextValue {
  const ctx = useContext(ProContext)
  if (!ctx) throw new Error('usePro must be used within ProProvider')
  return ctx
}
