import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const THEME_KEY = 'app_theme'

export type ThemeMode = 'light' | 'dark' | 'system'

export type ThemeColors = {
  bg: string
  card: string
  text: string
  subtext: string
  border: string
  primary: string
  tabBar: string
  tabBarBorder: string
}

export const lightColors: ThemeColors = {
  bg: '#F9FAFB',
  card: '#ffffff',
  text: '#111827',
  subtext: '#6B7280',
  border: '#E5E7EB',
  primary: '#4F46E5',
  tabBar: '#ffffff',
  tabBarBorder: '#E5E7EB',
}

export const darkColors: ThemeColors = {
  bg: '#111827',
  card: '#1F2937',
  text: '#F9FAFB',
  subtext: '#9CA3AF',
  border: '#374151',
  primary: '#6366F1',
  tabBar: '#1F2937',
  tabBarBorder: '#374151',
}

type ThemeContextValue = {
  themeMode: ThemeMode
  colors: ThemeColors
  isDark: boolean
  setThemeMode: (mode: ThemeMode) => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'system',
  colors: lightColors,
  isDark: false,
  setThemeMode: async () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system')

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setThemeModeState(val)
      }
    })
  }, [])

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode)
    await AsyncStorage.setItem(THEME_KEY, mode)
  }

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark')
  const colors = isDark ? darkColors : lightColors

  const value = useMemo(
    () => ({ themeMode, colors, isDark, setThemeMode }),
    [themeMode, colors, isDark]
  )

  return React.createElement(ThemeContext.Provider, { value }, children)
}

export function useTheme() {
  return useContext(ThemeContext)
}
