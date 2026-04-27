import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { loadProgress } from '../lib/storage'
import { allVocabulary, categoryInfo, getVocabularyByLevel } from '../data/vocabulary'
import { phrases } from '../data/phrases'
import { USER_LEVEL_KEY, UserLevel } from './OnboardingScreen'
import TourGuide from '../components/TourGuide'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { UserProgress } from '../types'
import { useTheme, fonts } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'

export default function HomeScreen() {
  const navigation = useNavigation<any>()
  const { t, i18n } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [showTour, setShowTour] = useState(false)
  const [dailyWords, setDailyWords] = useState<typeof allVocabulary>([])

  const HOME_TOUR_STEPS = [
    { emoji: '🏠', title: t('home.tourHomeTitle'), desc: t('home.tourHomeDesc') },
    { emoji: '📚', title: t('home.tourVocabTitle'), desc: t('home.tourVocabDesc') },
    { emoji: 'あ', title: t('home.tourKanaTitle'), desc: t('home.tourKanaDesc') },
    { emoji: '🎓', title: t('home.tourJlptTitle'), desc: t('home.tourJlptDesc') },
    { emoji: '🎯', title: t('home.tourDailyTitle'), desc: t('home.tourDailyDesc') },
  ]

  useEffect(() => {
    loadProgress().then(p => {
      setProgress(p)
      AsyncStorage.getItem(USER_LEVEL_KEY).then(level => {
        const vocab = getVocabularyByLevel((level as UserLevel) ?? 'beginner')
        const unlearned = vocab.filter(v => !p.learnedIds.includes(v.id))
        const seed = parseInt(new Date().toISOString().split('T')[0].replace(/-/g, ''))
        const shuffled = [...unlearned].sort((a, b) =>
          ((seed * a.id.charCodeAt(0)) % 100) - ((seed * b.id.charCodeAt(0)) % 100)
        )
        setDailyWords(shuffled.slice(0, 5))
      })
    })
    AsyncStorage.getItem('tour_home').then(done => {
      if (!done) setShowTour(true)
    })
  }, [])

  const streak = progress?.streak ?? 0
  const totalLearned = progress?.totalWordsLearned ?? 0
  const today = progress?.dailyHistory.find(
    d => d.date === new Date().toISOString().split('T')[0]
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {showTour && (
        <TourGuide
          tourKey="home"
          steps={HOME_TOUR_STEPS}
          onComplete={() => setShowTour(false)}
        />
      )}
      <Text style={styles.title}>{t('home.title')}</Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

      {/* Streak */}
      <View style={styles.streakCard}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <View>
          <Text style={styles.streakNum}>{t('home.streak', { count: streak })}</Text>
          <Text style={styles.streakSub}>
            {streak === 0 ? t('home.streakStart') : t('home.streakKeepGoing')}
          </Text>
        </View>
      </View>

      {/* Today stats */}
      {today && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{today.newWordsLearned}</Text>
            <Text style={styles.statLabel}>{t('home.todayNew')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: colors.success }]}>{today.wordsReviewed}</Text>
            <Text style={styles.statLabel}>{t('home.todayReview')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: colors.warning }]}>{totalLearned}</Text>
            <Text style={styles.statLabel}>{t('home.totalWords')}</Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Katakana')}
          activeOpacity={0.85}
        >
          <Text style={[styles.cardEmoji, { fontFamily: fonts.jpSerif }]}>あ</Text>
          <Text style={styles.cardTitle}>{t('home.kanaCard')}</Text>
          <Text style={styles.cardSub}>{t('home.kanaSub')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Vocabulary')}
          activeOpacity={0.85}
        >
          <Text style={styles.cardEmoji}>📚</Text>
          <Text style={styles.cardTitle}>{t('home.vocabCard')}</Text>
          <Text style={styles.cardSub}>{t('home.vocabSub', { count: allVocabulary.length })}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Phrases')}
          activeOpacity={0.85}
        >
          <Text style={styles.cardEmoji}>💬</Text>
          <Text style={styles.cardTitle}>{t('home.phrasesCard')}</Text>
          <Text style={styles.cardSub}>{t('home.phrasesSub', { count: phrases.length })}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Progress')}
          activeOpacity={0.85}
        >
          <Text style={styles.cardEmoji}>📊</Text>
          <Text style={styles.cardTitle}>{t('home.progressCard')}</Text>
          <Text style={styles.cardSub}>{t('home.progressSub')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Grammar')}
          activeOpacity={0.85}
        >
          <Text style={styles.cardEmoji}>✏️</Text>
          <Text style={styles.cardTitle}>{t('home.grammarCard')}</Text>
          <Text style={styles.cardSub}>{t('home.grammarSub')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('JLPT')}
          activeOpacity={0.85}
        >
          <Text style={styles.cardEmoji}>🎓</Text>
          <Text style={styles.cardTitle}>{t('home.jlptCard')}</Text>
          <Text style={styles.cardSub}>{t('home.jlptSub')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Kanji')}
          activeOpacity={0.85}
        >
          <Text style={[styles.cardEmoji, { fontFamily: fonts.jpSerif }]}>漢</Text>
          <Text style={styles.cardTitle}>{t('home.kanjiCard')}</Text>
          <Text style={styles.cardSub}>{t('home.kanjiSub')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
          onPress={() => navigation.navigate('AIChat')}
          activeOpacity={0.85}
        >
          <Text style={[styles.cardEmoji, { fontFamily: fonts.jpSerif, color: colors.primary }]}>先</Text>
          <Text style={[styles.cardTitle, { color: colors.primaryDeep }]}>{t('home.aiChatCard')}</Text>
          <Text style={[styles.cardSub, { color: colors.primaryDeep }]}>{t('home.aiChatSub')}</Text>
        </TouchableOpacity>
      </View>

      {/* Daily recommendation */}
      {dailyWords.length > 0 && (
        <View style={styles.dailySection}>
          <Text style={styles.sectionTitle}>{t('home.dailySection')}</Text>
          {dailyWords.map(w => (
            <TouchableOpacity
              key={w.id}
              style={styles.dailyCard}
              onPress={() => navigation.navigate('Vocabulary', { category: w.category })}
            >
              <View>
                <Text style={styles.dailyJP}>{w.japanese}</Text>
                <Text style={styles.dailyReading}>{w.reading}</Text>
              </View>
              <View style={styles.dailyRight}>
                <Text style={styles.dailyCN}>{i18n.language === 'en' ? (w.english ?? w.chinese) : w.chinese}</Text>
                <Text style={styles.dailyLevel}>{w.level}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Category overview */}
      <Text style={styles.sectionTitle}>{t('home.categorySection')}</Text>
      <View style={styles.categoryGrid}>
        {Object.entries(categoryInfo).map(([key, info]) => {
          const count = allVocabulary.filter(v => v.category === key).length
          return (
            <TouchableOpacity
              key={key}
              style={styles.categoryCard}
              onPress={() => navigation.navigate('Vocabulary', { category: key })}
            >
              <Text style={styles.categoryEmoji}>{info.emoji}</Text>
              <Text style={styles.categoryLabel}>{info.label}</Text>
              <Text style={styles.categoryCount}>{t('home.categoryCount', { count })}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </ScrollView>
  )
}

function createStyles(colors: ThemeColors) {
  const cardShadow = {
    shadowColor: '#1A1614',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  }
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 4, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: colors.subtext, marginBottom: 20 },
    streakCard: {
      flexDirection: 'row', alignItems: 'center', gap: 16,
      backgroundColor: colors.card, borderRadius: 20, padding: 20,
      marginBottom: 16, ...cardShadow,
    },
    streakEmoji: { fontSize: 36 },
    streakNum: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
    streakSub: { fontSize: 13, color: colors.subtext, marginTop: 2 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    statBox: {
      flex: 1, borderRadius: 16, padding: 14, alignItems: 'center',
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    statNum: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
    statLabel: { fontSize: 11, color: colors.subtext, marginTop: 2, letterSpacing: 0.2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    card: {
      width: '47%', borderRadius: 20, padding: 18,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      ...cardShadow,
    },
    cardEmoji: { fontSize: 28, marginBottom: 10 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4, letterSpacing: -0.2 },
    cardSub: { fontSize: 12, color: colors.subtext, lineHeight: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12, letterSpacing: -0.3 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryCard: {
      width: '30%', backgroundColor: colors.card, borderRadius: 16,
      padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    },
    dailySection: { marginBottom: 24 },
    dailyCard: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    dailyJP: { fontSize: 22, fontWeight: '500', color: colors.text, fontFamily: fonts.jpSerif, letterSpacing: 0.5 },
    dailyReading: { fontSize: 12, color: colors.subtext, marginTop: 4 },
    dailyRight: { alignItems: 'flex-end' },
    dailyCN: { fontSize: 15, fontWeight: '600', color: colors.primary },
    dailyLevel: { fontSize: 10, color: colors.subtext, marginTop: 2, letterSpacing: 0.3 },
    categoryEmoji: { fontSize: 24, marginBottom: 4 },
    categoryLabel: { fontSize: 12, fontWeight: '600', color: colors.text },
    categoryCount: { fontSize: 11, color: colors.subtext, marginTop: 2 },
  })
}
