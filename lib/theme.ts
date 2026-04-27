import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { Platform, useColorScheme, type TextStyle, type ViewStyle } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const THEME_KEY = 'app_theme'

export type ThemeMode = 'light' | 'dark' | 'system'

// ─── Base palette ────────────────────────────────────────────
const palette = {
  sakura: {
    50: '#FBEEF0',
    100: '#F4DDDF',
    300: '#E2A6AC',
    500: '#C8767D',
    700: '#9C545B',
    light: '#E89BA1',
  },
  sumi: {
    900: '#1A1614',
    800: '#25201E',
    700: '#3A332F',
    500: '#6B6258',
    300: '#A8A097',
    100: '#E8E2D6',
  },
  washi: {
    0: '#FFFFFF',
    50: '#FAF7F2',
    100: '#F4EFE5',
  },
  matcha: { 500: '#7BA876', light: '#9CC196' },
  yamabuki: { 500: '#D4A24C', light: '#E0B872' },
  ai: { indigo: '#5B6BB8', light: '#8593D4' },
}

// ─── Semantic tokens ─────────────────────────────────────────
// Keep all legacy field names (bg/card/text/subtext/border/primary/tabBar/tabBarBorder)
// so existing screens compile unchanged. New fields (cardSoft/primarySoft/success/warning/aiAccent)
// are additive.

export type ThemeColors = {
  // legacy
  bg: string
  card: string
  text: string
  subtext: string
  border: string
  primary: string
  tabBar: string
  tabBarBorder: string
  // new (additive)
  bgElevated: string
  cardSoft: string
  borderStrong: string
  mutedText: string
  primarySoft: string
  primaryDeep: string
  onPrimary: string
  success: string
  successSoft: string
  warning: string
  warningSoft: string
  aiAccent: string
  aiSoft: string
}

export const lightColors: ThemeColors = {
  bg: palette.washi[50],
  bgElevated: palette.washi[0],
  card: palette.washi[0],
  cardSoft: palette.washi[100],
  border: palette.sumi[100],
  borderStrong: '#D4CCBE',
  text: palette.sumi[900],
  subtext: palette.sumi[500],
  mutedText: '#9C9388',
  primary: palette.sakura[500],
  primarySoft: palette.sakura[100],
  primaryDeep: palette.sakura[700],
  onPrimary: '#FFFFFF',
  success: palette.matcha[500],
  successSoft: '#E5EEDD',
  warning: palette.yamabuki[500],
  warningSoft: '#F5E8C8',
  aiAccent: palette.ai.indigo,
  aiSoft: '#E2E5F2',
  tabBar: palette.washi[50],
  tabBarBorder: palette.sumi[100],
}

export const darkColors: ThemeColors = {
  bg: palette.sumi[900],
  bgElevated: '#2A2421',
  card: palette.sumi[800],
  cardSoft: '#1F1B19',
  border: palette.sumi[700],
  borderStrong: '#52483F',
  text: '#F2EDE5',
  subtext: palette.sumi[300],
  mutedText: '#7A7166',
  primary: palette.sakura.light,
  primarySoft: '#3D2A2C',
  primaryDeep: '#F4B5B9',
  onPrimary: palette.sumi[900],
  success: palette.matcha.light,
  successSoft: '#2A3527',
  warning: palette.yamabuki.light,
  warningSoft: '#3A2F1E',
  aiAccent: palette.ai.light,
  aiSoft: '#2A2D44',
  tabBar: palette.sumi[900],
  tabBarBorder: palette.sumi[700],
}

// ─── Typography ──────────────────────────────────────────────
export const fonts = {
  ui: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' })!,
  uiJP: Platform.select({ ios: 'HiraginoSans-W3', android: 'sans-serif', default: 'sans-serif' })!,
  jpSerif: Platform.select({
    ios: 'Hiragino Mincho ProN',
    android: 'serif',
    default: 'serif',
  })!,
}

export type TextVariant =
  | 'display' | 'h1' | 'h2' | 'h3'
  | 'bodyLg' | 'body' | 'caption' | 'tiny'
  | 'jpLearn' | 'jpLearnLg' | 'jpFurigana'

export const typography: Record<TextVariant, TextStyle> = {
  display: { fontSize: 36, lineHeight: 44, fontWeight: '700', letterSpacing: -0.5 },
  h1: { fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 22, lineHeight: 30, fontWeight: '600', letterSpacing: -0.3 },
  h3: { fontSize: 18, lineHeight: 26, fontWeight: '600', letterSpacing: -0.3 },
  bodyLg: { fontSize: 17, lineHeight: 26, fontWeight: '400' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: 0.2 },
  tiny: { fontSize: 11, lineHeight: 14, fontWeight: '500', letterSpacing: 0.2 },
  jpLearn: { fontSize: 24, lineHeight: 38, fontWeight: '500', letterSpacing: 0.5, fontFamily: fonts.jpSerif },
  jpLearnLg: { fontSize: 36, lineHeight: 52, fontWeight: '500', letterSpacing: 0.5, fontFamily: fonts.jpSerif },
  jpFurigana: { fontSize: 11, lineHeight: 14, fontWeight: '400', fontFamily: fonts.jpSerif },
}

// ─── Spacing / radius ────────────────────────────────────────
export const spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24,
  '2xl': 32, '3xl': 48, '4xl': 64,
} as const

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, '2xl': 28, pill: 9999,
} as const

// ─── Shadows ─────────────────────────────────────────────────
const baseShadows = {
  sm: { shadowColor: palette.sumi[900], shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: palette.sumi[900], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  lg: { shadowColor: palette.sumi[900], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6 },
} satisfies Record<'sm' | 'md' | 'lg', ViewStyle>

const darkShadows = {
  sm: { ...baseShadows.sm, shadowOpacity: 0.25 },
  md: { ...baseShadows.md, shadowOpacity: 0.35 },
  lg: { ...baseShadows.lg, shadowOpacity: 0.4 },
} satisfies Record<'sm' | 'md' | 'lg', ViewStyle>

// ─── Theme context ───────────────────────────────────────────
type ThemeContextValue = {
  themeMode: ThemeMode
  isDark: boolean
  colors: ThemeColors
  fonts: typeof fonts
  typography: typeof typography
  spacing: typeof spacing
  radius: typeof radius
  shadows: typeof baseShadows
  setThemeMode: (mode: ThemeMode) => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'system',
  isDark: false,
  colors: lightColors,
  fonts,
  typography,
  spacing,
  radius,
  shadows: baseShadows,
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
  const shadows = isDark ? darkShadows : baseShadows

  const value = useMemo<ThemeContextValue>(
    () => ({ themeMode, isDark, colors, fonts, typography, spacing, radius, shadows, setThemeMode }),
    [themeMode, isDark, colors, shadows]
  )

  return React.createElement(ThemeContext.Provider, { value }, children)
}

export function useTheme() {
  return useContext(ThemeContext)
}
