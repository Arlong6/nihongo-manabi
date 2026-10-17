import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, LogBox, AppState } from 'react-native'

// expo-notifications eagerly tries to register an APNS push token at module
// init. In simulator + local debug builds we don't have the aps-environment
// entitlement, so the SDK raises an "Uncaught (in promise) Keychain access
// failed" warning. It's cosmetic — scheduleNotificationAsync (the local
// notification path we actually use for streak reminders) still works fine.
// Hide both the warning ribbon and the red-box exception in dev.
LogBox.ignoreLogs([
  /getRegistrationInfoAsync/,
  /Keychain access failed/,
  /A required entitlement isn't present/,
])
// @ts-ignore — ErrorUtils is a React Native global without a public type
const _origHandler = global.ErrorUtils?.getGlobalHandler?.()
// @ts-ignore
global.ErrorUtils?.setGlobalHandler?.((err: any, isFatal: boolean) => {
  const msg = String(err?.message || err || '')
  if (msg.includes('getRegistrationInfoAsync') || msg.includes('Keychain access failed')) {
    return  // swallow the dev-only entitlement noise
  }
  _origHandler?.(err, isFatal)
})
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n, { initI18n } from './lib/i18n'
import { initAds } from './lib/ads'
import { ThemeProvider, useTheme } from './lib/theme'
import { ProProvider } from './lib/pro'
import HomeScreen from './screens/HomeScreen'
import KatakanaScreen from './screens/KatakanaScreen'
import VocabularyScreen from './screens/VocabularyScreen'
import PhrasesScreen from './screens/PhrasesScreen'
import ProgressScreen from './screens/ProgressScreen'
import GrammarScreen from './screens/GrammarScreen'
import JLPTScreen from './screens/JLPTScreen'
import ListeningScreen from './screens/ListeningScreen'
import KanjiScreen from './screens/KanjiScreen'
import AIConversationScreen from './screens/AIConversationScreen'
import WatchScreen from './screens/WatchScreen'
import CameraScreen from './screens/CameraScreen'
import PaywallScreen from './screens/PaywallScreen'
import LessonScreen from './screens/LessonScreen'
import { initPurchases } from './lib/iap'
import OnboardingScreen, { ONBOARDING_KEY, UserLevel } from './screens/OnboardingScreen'
import { getNotificationSettings, scheduleDaily, syncStreakRiskNotification } from './lib/notifications'
import { loadProgress } from './lib/storage'
import { getDueCards } from './lib/srs'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
}

function MainTabs() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('nav.home'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Vocabulary"
        component={VocabularyScreen}
        options={{
          tabBarLabel: t('nav.vocab'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Katakana"
        component={KatakanaScreen}
        options={{
          tabBarLabel: t('nav.kana'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="あ" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Phrases"
        component={PhrasesScreen}
        options={{
          tabBarLabel: t('nav.phrases'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Listening"
        component={ListeningScreen}
        options={{
          tabBarLabel: t('nav.listening'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="👂" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: t('nav.progress'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  )
}

function AppInner() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setOnboardingDone(val === 'true')
    })
  }, [])

  // 廣告（ATT → UMP → SDK）只在 onboarding 完成、進入主畫面後才初始化；Pro 用戶在 initAds 內直接略過。
  // 不放在 App() 的 initPurchases 旁邊：那時 onboarding 可能還沒做完，新用戶第一眼就被問追蹤很突兀。
  useEffect(() => {
    if (onboardingDone) initAds().catch(() => {})
  }, [onboardingDone])

  // 連勝風險通知：啟動與回前景時依「今天是否已打卡」重排或取消
  useEffect(() => {
    if (!onboardingDone) return
    const sync = () => loadProgress().then(p => syncStreakRiskNotification(p)).catch(() => {})
    sync()
    const sub = AppState.addEventListener('change', state => { if (state === 'active') sync() })
    return () => sub.remove()
  }, [onboardingDone])

  if (onboardingDone === null) return null

  if (!onboardingDone) {
    return (
      <OnboardingScreen
        onComplete={(_level: UserLevel) => setOnboardingDone(true)}
      />
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Lesson" component={LessonScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="Grammar" component={GrammarScreen} />
        <Stack.Screen name="JLPT" component={JLPTScreen} />
        <Stack.Screen name="Kanji" component={KanjiScreen} />
        <Stack.Screen name="AIChat" component={AIConversationScreen} />
        <Stack.Screen
          name="Watch"
          component={WatchScreen}
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{
            headerShown: false,
            // Modal feel — slides up so the rest of the app stays in user's mind.
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  const [i18nReady, setI18nReady] = useState(false)

  useEffect(() => {
    initI18n().then(async () => {
      setI18nReady(true)
      // RevenueCat init — runs early so getOfferings() is warm by the time
      // the user lands on the paywall. Tolerates missing keys (no-op in that case).
      initPurchases().catch(() => { /* silent */ })
      // Reschedule notification with today's due SRS count
      try {
        const [settings, progress] = await Promise.all([
          getNotificationSettings(),
          loadProgress(),
        ])
        if (settings.enabled) {
          const dueCount = getDueCards(progress.srsCards).length
          await scheduleDaily(settings.hour, settings.minute, {
            dueCount,
            currentStreak: progress.streak,
            longestStreak: progress.longestStreak,
          })
        }
      } catch {
        // Notifications are best-effort; ignore errors
      }
    })
  }, [])

  if (!i18nReady) return null

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <ProProvider>
          <AppInner />
        </ProProvider>
      </ThemeProvider>
    </I18nextProvider>
  )
}
