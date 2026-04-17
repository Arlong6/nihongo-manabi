import React, { useState, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  ScrollView, SafeAreaView
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n, { SUPPORTED_LANGUAGES } from '../lib/i18n'
import { setLocale } from '../lib/storage'
import { useTheme } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'

const { width } = Dimensions.get('window')

export const ONBOARDING_KEY = 'onboarding_completed'
export const USER_LEVEL_KEY = 'user_level'
export type UserLevel = 'beginner' | 'n5' | 'n4'

interface Props {
  onComplete: (level: UserLevel) => void
}

export default function OnboardingScreen({ onComplete }: Props) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const s = useMemo(() => createStyles(colors), [colors])
  const [page, setPage] = useState(0)
  const [selectedLevel, setSelectedLevel] = useState<UserLevel | null>(null)
  const [selectedLang, setSelectedLang] = useState(i18n.language)
  const scrollRef = useRef<ScrollView>(null)
  const TOTAL_PAGES = 4

  const levelOptions: { key: UserLevel; emoji: string; title: string; desc: string }[] = [
    { key: 'beginner', emoji: '🌱', title: t('onboarding.levelBeginner'), desc: t('onboarding.levelBeginnerDesc') },
    { key: 'n5', emoji: '📖', title: t('onboarding.levelN5'), desc: t('onboarding.levelN5Desc') },
    { key: 'n4', emoji: '🎯', title: t('onboarding.levelN4'), desc: t('onboarding.levelN4Desc') },
  ]

  const features = [
    { emoji: '📚', title: t('onboarding.featureVocabTitle'), desc: t('onboarding.featureVocabDesc') },
    { emoji: 'カ', title: t('onboarding.featureKanaTitle'), desc: t('onboarding.featureKanaDesc') },
    { emoji: '💬', title: t('onboarding.featurePhrasesTitle'), desc: t('onboarding.featurePhrasesDesc') },
  ]

  const handleLangSelect = async (code: string) => {
    setSelectedLang(code)
    await i18n.changeLanguage(code)
    await setLocale(code)
  }

  const goNext = () => {
    if (page < TOTAL_PAGES - 1) {
      const next = page + 1
      setPage(next)
      scrollRef.current?.scrollTo({ x: next * width, animated: true })
    }
  }

  const handleStart = async () => {
    const level = selectedLevel ?? 'beginner'
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    await AsyncStorage.setItem(USER_LEVEL_KEY, level)
    onComplete(level)
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* Page 1: Welcome + Language Selection */}
        <View style={s.page}>
          <Text style={s.bigEmoji}>🌸</Text>
          <Text style={s.mainTitle}>{t('onboarding.welcomeTitle')}</Text>
          <Text style={s.mainDesc}>{t('onboarding.welcomeDesc')}</Text>

          <View style={s.langRow}>
            {SUPPORTED_LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[s.langBtn, selectedLang === lang.code && s.langBtnActive]}
                onPress={() => handleLangSelect(lang.code)}
              >
                <Text style={[s.langBtnText, selectedLang === lang.code && s.langBtnTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.tagRow}>
            <View style={s.tag}><Text style={s.tagText}>{t('onboarding.tagSRS')}</Text></View>
            <View style={s.tag}><Text style={s.tagText}>{t('onboarding.tagProgress')}</Text></View>
            <View style={s.tag}><Text style={s.tagText}>{t('onboarding.tagGoal')}</Text></View>
          </View>
        </View>

        {/* Page 2: Level selection */}
        <View style={s.page}>
          <Text style={s.pageTitle}>{t('onboarding.levelTitle')}</Text>
          <Text style={s.pageDesc}>{t('onboarding.levelDesc')}</Text>
          <View style={s.levelList}>
            {levelOptions.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[s.levelCard, selectedLevel === opt.key && s.levelCardActive]}
                onPress={() => setSelectedLevel(opt.key)}
              >
                <Text style={s.levelEmoji}>{opt.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.levelTitle, selectedLevel === opt.key && s.levelTitleActive]}>
                    {opt.title}
                  </Text>
                  <Text style={s.levelDesc}>{opt.desc}</Text>
                </View>
                {selectedLevel === opt.key && (
                  <Text style={s.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Page 3: Features */}
        <View style={s.page}>
          <Text style={s.pageTitle}>{t('onboarding.featuresTitle')}</Text>
          <Text style={s.pageDesc}>{t('onboarding.featuresDesc')}</Text>
          <View style={s.featureList}>
            {features.map((f, i) => (
              <View key={i} style={s.featureCard}>
                <Text style={s.featureEmoji}>{f.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.featureTitle}>{f.title}</Text>
                  <Text style={s.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Page 4: Ready */}
        <View style={s.page}>
          <Text style={s.bigEmoji}>🚀</Text>
          <Text style={s.mainTitle}>{t('onboarding.readyTitle')}</Text>
          <Text style={s.mainDesc}>{t('onboarding.readyDesc')}</Text>
          <View style={s.tipCard}>
            <Text style={s.tipTitle}>{t('onboarding.tipTitle')}</Text>
            <Text style={s.tipItem}>{t('onboarding.tip1')}</Text>
            <Text style={s.tipItem}>{t('onboarding.tip2')}</Text>
            <Text style={s.tipItem}>{t('onboarding.tip3')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Dots */}
      <View style={s.dotsRow}>
        {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
          <View key={i} style={[s.dot, page === i && s.dotActive]} />
        ))}
      </View>

      {/* Buttons */}
      <View style={s.btnRow}>
        {page < TOTAL_PAGES - 1 ? (
          <>
            {page > 0 && (
              <TouchableOpacity
                style={s.ghostBtn}
                onPress={() => {
                  const prev = page - 1
                  setPage(prev)
                  scrollRef.current?.scrollTo({ x: prev * width, animated: true })
                }}
              >
                <Text style={s.ghostBtnText}>{t('onboarding.btnPrev')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.primaryBtn, page === 1 && !selectedLevel && s.primaryBtnDisabled]}
              onPress={goNext}
              disabled={page === 1 && !selectedLevel}
            >
              <Text style={s.primaryBtnText}>
                {page === 0 ? t('onboarding.btnSetup') : t('onboarding.btnNext')}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={s.primaryBtn} onPress={handleStart}>
            <Text style={s.primaryBtnText}>{t('onboarding.btnStart')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    page: {
      width,
      flex: 1,
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bigEmoji: { fontSize: 80, marginBottom: 24 },
    mainTitle: {
      fontSize: 32, fontWeight: 'bold', color: colors.text,
      textAlign: 'center', lineHeight: 42, marginBottom: 16,
    },
    mainDesc: {
      fontSize: 16, color: colors.subtext, textAlign: 'center',
      lineHeight: 26, marginBottom: 20,
    },
    langRow: {
      flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center',
    },
    langBtn: {
      paddingHorizontal: 18, paddingVertical: 9, borderRadius: 22,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
    },
    langBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    langBtnText: { fontSize: 14, color: colors.subtext, fontWeight: '600' },
    langBtnTextActive: { color: '#fff' },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    tag: {
      backgroundColor: '#EEF2FF', borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 6,
    },
    tagText: { color: colors.primary, fontSize: 13, fontWeight: '500' },
    pageTitle: {
      fontSize: 26, fontWeight: 'bold', color: colors.text,
      textAlign: 'center', marginBottom: 10,
    },
    pageDesc: {
      fontSize: 15, color: colors.subtext, textAlign: 'center',
      lineHeight: 24, marginBottom: 28,
    },
    levelList: { width: '100%', gap: 12 },
    levelCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.card, borderRadius: 16, padding: 16,
      borderWidth: 2, borderColor: colors.border,
    },
    levelCardActive: { borderColor: colors.primary, backgroundColor: '#EEF2FF' },
    levelEmoji: { fontSize: 32 },
    levelTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
    levelTitleActive: { color: colors.primary },
    levelDesc: { fontSize: 12, color: colors.subtext, lineHeight: 18 },
    checkmark: { fontSize: 20, color: colors.primary, fontWeight: 'bold' },
    featureList: { width: '100%', gap: 12 },
    featureCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 14,
      backgroundColor: colors.card, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: colors.border,
    },
    featureEmoji: { fontSize: 36, width: 44 },
    featureTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
    featureDesc: { fontSize: 13, color: colors.subtext, lineHeight: 20 },
    tipCard: {
      backgroundColor: '#FFFBEB', borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: '#FDE68A', width: '100%',
    },
    tipTitle: { fontWeight: 'bold', color: '#92400E', marginBottom: 10, fontSize: 15 },
    tipItem: { color: '#78350F', fontSize: 14, marginBottom: 6 },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.primary, width: 24 },
    btnRow: {
      flexDirection: 'row', gap: 12, paddingHorizontal: 32,
      paddingBottom: 24, justifyContent: 'center',
    },
    primaryBtn: {
      flex: 1, backgroundColor: colors.primary, borderRadius: 16,
      paddingVertical: 16, alignItems: 'center',
    },
    primaryBtnDisabled: { backgroundColor: '#C7D2FE' },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    ghostBtn: {
      flex: 0.5, borderWidth: 1, borderColor: colors.border,
      borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    },
    ghostBtnText: { color: colors.subtext, fontSize: 16 },
  })
}
