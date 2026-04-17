import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n, { initI18n } from './lib/i18n'
import { ThemeProvider, useTheme } from './lib/theme'
import HomeScreen from './screens/HomeScreen'
import KatakanaScreen from './screens/KatakanaScreen'
import VocabularyScreen from './screens/VocabularyScreen'
import PhrasesScreen from './screens/PhrasesScreen'
import ProgressScreen from './screens/ProgressScreen'
import GrammarScreen from './screens/GrammarScreen'
import JLPTScreen from './screens/JLPTScreen'
import ListeningScreen from './screens/ListeningScreen'
import KanjiScreen from './screens/KanjiScreen'
import OnboardingScreen, { ONBOARDING_KEY, UserLevel } from './screens/OnboardingScreen'
import { getNotificationSettings, scheduleDaily } from './lib/notifications'
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
        <Stack.Screen name="Grammar" component={GrammarScreen} />
        <Stack.Screen name="JLPT" component={JLPTScreen} />
        <Stack.Screen name="Kanji" component={KanjiScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  const [i18nReady, setI18nReady] = useState(false)

  useEffect(() => {
    initI18n().then(async () => {
      setI18nReady(true)
      // Reschedule notification with today's due SRS count
      try {
        const [settings, progress] = await Promise.all([
          getNotificationSettings(),
          loadProgress(),
        ])
        if (settings.enabled) {
          const dueCount = getDueCards(progress.srsCards).length
          await scheduleDaily(settings.hour, 0, dueCount)
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
        <AppInner />
      </ThemeProvider>
    </I18nextProvider>
  )
}
