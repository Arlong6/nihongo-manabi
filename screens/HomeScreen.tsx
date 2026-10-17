import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { loadProgress, getTodayString, getUserLevel, getLastLessonDate, getFreezeUsedDate } from '../lib/storage'
import { getDueCards } from '../lib/srs'
import { maybeAskForReview } from '../lib/review'
import { allVocabulary, categoryInfo, getVocabularyByLevel } from '../data/vocabulary'
import { phrases } from '../data/phrases'
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
  const [lessonDoneToday, setLessonDoneToday] = useState(false)
  const [freezeUsedToday, setFreezeUsedToday] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [dailyWords, setDailyWords] = useState<typeof allVocabulary>([])

  const HOME_TOUR_STEPS = [
    { emoji: '🏠', title: t('home.tourHomeTitle'), desc: t('home.tourHomeDesc') },
    { emoji: '📚', title: t('home.tourVocabTitle'), desc: t('home.tourVocabDesc') },
    { emoji: 'あ', title: t('home.tourKanaTitle'), desc: t('home.tourKanaDesc') },
    { emoji: '🎓', title: t('home.tourJlptTitle'), desc: t('home.tourJlptDesc') },
    { emoji: '🎯', title: t('home.tourDailyTitle'), desc: t('home.tourDailyDesc') },
  ]

  const reload = useCallback(async () => {
    const [p, lastLesson, level, freezeDate] = await Promise.all([
      loadProgress(), getLastLessonDate(), getUserLevel(), getFreezeUsedDate(),
    ])
    setProgress(p)
    setLessonDoneToday(lastLesson === getTodayString())
    setFreezeUsedToday(freezeDate === getTodayString())
    const vocab = getVocabularyByLevel(level === 'N5' ? 'n5' : 'n4')
    const unlearned = vocab.filter(v => !p.learnedIds.includes(v.id))
    const seed = parseInt(getTodayString().replace(/-/g, ''))
    const shuffled = [...unlearned].sort((a, b) =>
      ((seed * a.id.charCodeAt(0)) % 100) - ((seed * b.id.charCodeAt(0)) % 100)
    )
    setDailyWords(shuffled.slice(0, 5))
  }, [])

  // Reload on every focus so numbers refresh when returning from a lesson.
  // Also ask for an App Store review after earning a streak badge (armed in
  // lib/storage); guarded internally to at most once / 60 days.
  useFocusEffect(
    useCallback(() => {
      reload()
      maybeAskForReview()
    }, [reload]),
  )

  useEffect(() => {
    AsyncStorage.getItem('tour_home').then(done => {
      if (!done) setShowTour(true)
    })
  }, [])

  const streak = progress?.streak ?? 0
  const longestStreak = progress?.longestStreak ?? 0
  // What comes next? Used to nudge "N more days to the X-day badge".
  const nextBadge = [3, 7, 14, 30, 60, 100, 200, 365].find(b => streak < b)
  const remainingToNext = nextBadge ? nextBadge - streak : 0
  const dueCount = progress ? getDueCards(progress.srsCards).length : 0
  const freezes = progress?.streakFreezes ?? 0

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

      {/* 今日課程 */}
      <TouchableOpacity
        style={[styles.lessonBtn, lessonDoneToday && styles.lessonBtnDone]}
        onPress={() => navigation.navigate('Lesson')}
        activeOpacity={0.9}
      >
        <Text style={styles.lessonBtnTitle}>{lessonDoneToday ? `✅ ${t('home.lessonDone')}` : `▶ ${t('home.startLesson')}`}</Text>
        <Text style={styles.lessonBtnSub}>{lessonDoneToday ? t('home.practiceMore') : (dueCount > 0 ? t('home.dueReview', { count: dueCount }) : t('home.dueNone'))}</Text>
      </TouchableOpacity>

      {/* 連勝 + 凍結 + 到期 */}
      <View style={styles.streakCard}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.streakNum}>{t('home.streak', { count: streak })}</Text>
          <Text style={styles.streakSub}>
            {streak === 0 ? t('home.streakStart')
              : nextBadge ? t('home.nextBadge', { days: remainingToNext, badge: nextBadge })
              : t('home.streakKeepGoing')}
          </Text>
          {freezeUsedToday && <Text style={[styles.streakSub, { color: colors.primary }]}>🧊 {t('home.freezeUsedToday')}</Text>}
          {longestStreak > streak && <Text style={styles.streakSub}>🏆 {t('home.bestStreak', { count: longestStreak })}</Text>}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={styles.freezeChip}>🧊 {t('home.freezes', { count: freezes })}</Text>
          {dueCount > 0 && <Text style={styles.dueChip}>{t('home.dueReview', { count: dueCount })}</Text>}
        </View>
      </View>

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

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Watch')}
          activeOpacity={0.85}
        >
          <Text style={styles.cardEmoji}>🎬</Text>
          <Text style={styles.cardTitle}>看 Reel 學日文</Text>
          <Text style={styles.cardSub}>每日新影片直接在 App 看</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Camera')}
          activeOpacity={0.85}
        >
          <Text style={styles.cardEmoji}>📸</Text>
          <Text style={styles.cardTitle}>拍照翻譯</Text>
          <Text style={styles.cardSub}>對著日文招牌、菜單直接翻</Text>
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
    lessonBtn: { backgroundColor: colors.primary, borderRadius: 16, padding: 20, marginBottom: 16 },
    lessonBtnDone: { backgroundColor: colors.success },
    lessonBtnTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
    lessonBtnSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
    freezeChip: { fontSize: 12, color: colors.subtext },
    dueChip: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
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
