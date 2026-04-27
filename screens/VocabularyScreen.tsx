import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Animated
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { speakJapanese } from '../lib/speech'
import { allVocabulary, categoryInfo, getVocabularyByCategory } from '../data/vocabulary'
import { loadProgress, markWordLearned, updateSRSCard, recordDailyActivity, loadFavorites, saveFavorites } from '../lib/storage'
import { createSRSCard, updateSRSCard as computeNextSRS, getDueCards } from '../lib/srs'
import type { Vocabulary, SRSRating, UserProgress } from '../types'
import { useTheme, fonts } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'

function FlashCard({
  card, onRate, onSkip, progress: progressStr, isFavorite, onToggleFavorite
}: {
  card: Vocabulary
  onRate: (id: string, rating: SRSRating) => void
  onSkip: () => void
  progress: string
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createFCStyles(colors), [colors])
  const ratings: { key: SRSRating; label: string; next: string; color: string }[] = [
    { key: 'unknown' as SRSRating, label: t('vocab.rateUnknown'), next: t('vocab.rateUnknownNext'), color: '#FEE2E2' },
    { key: 'hard' as SRSRating,    label: t('vocab.rateHard'),    next: t('vocab.rateHardNext'),    color: '#FEF3C7' },
    { key: 'good' as SRSRating,    label: t('vocab.rateGood'),    next: t('vocab.rateGoodNext'),    color: '#DBEAFE' },
    { key: 'easy' as SRSRating,    label: t('vocab.rateEasy'),    next: t('vocab.rateEasyNext'),    color: '#DCFCE7' },
  ]

  const [flipped, setFlipped] = useState(false)
  const flip = useRef(new Animated.Value(0)).current

  const handleFlip = () => {
    Animated.spring(flip, {
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
    }).start()
    setFlipped(f => !f)
  }

  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })
  const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] })

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>{progressStr}</Text>

      {/* Favorite button */}
      <TouchableOpacity
        style={styles.favoriteBtn}
        onPress={() => onToggleFavorite(card.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.favoriteIcon}>{isFavorite ? '⭐' : '☆'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleFlip} activeOpacity={0.9}>
        {/* Front */}
        <Animated.View style={[styles.card, { transform: [{ rotateY: frontRotate }] }, !flipped && styles.visible]}>
          <Text style={styles.categoryLabel}>{card.category} · {card.level}</Text>
          <Text style={styles.japanese}>{card.japanese}</Text>
          <Text style={styles.reading}>{card.reading}</Text>
          <TouchableOpacity
            style={styles.speakBtn}
            onPress={e => { e.stopPropagation?.(); speakJapanese(card.japanese) }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.speakIcon}>🔊</Text>
          </TouchableOpacity>
          <Text style={styles.flipHint}>{t('vocab.flipHint')}</Text>
        </Animated.View>

        {/* Back */}
        <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backRotate }] }, flipped && styles.visible]}>
          <Text style={styles.japanese}>{card.japanese}</Text>
          <Text style={styles.reading}>{card.reading}</Text>
          <View style={styles.meanings}>
            <Text style={styles.chinese}>{card.chinese}</Text>
            <Text style={styles.english}>{card.english}</Text>
          </View>
          {card.example && (
            <View style={styles.exampleBox}>
              <Text style={styles.example}>{card.example}</Text>
              {card.exampleChinese && <Text style={styles.exampleChinese}>{card.exampleChinese}</Text>}
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {flipped && (
        <View style={styles.ratings}>
          <Text style={styles.ratingHint}>{t('vocab.ratingHint')}</Text>
          <View style={styles.ratingRow}>
            {ratings.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[styles.ratingBtn, { backgroundColor: r.color }]}
                onPress={() => {
                  if (r.key === 'easy' || r.key === 'good') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                  } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
                  }
                  setFlipped(false)
                  onRate(card.id, r.key)
                }}
              >
                <Text style={styles.ratingLabel}>{r.label}</Text>
                <Text style={styles.ratingNext}>{r.next}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!flipped && (
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>{t('vocab.skip')}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default function VocabularyScreen({ route }: any) {
  const { t, i18n } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const initialCategory = route?.params?.category || 'all'
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [mode, setMode] = useState<'browse' | 'study'>('browse')
  const [cards, setCards] = useState<Vocabulary[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [sessionNew, setSessionNew] = useState(0)
  const [sessionReviewed, setSessionReviewed] = useState(0)
  const [finished, setFinished] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    loadFavorites().then(setFavorites)
  }, [])

  const handleToggleFavorite = async (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id]
    setFavorites(updated)
    await saveFavorites(updated)
  }

  const loadCards = useCallback(async () => {
    const p = await loadProgress()
    setProgress(p)
    let vocab: Vocabulary[]
    if (selectedCategory === 'all') {
      vocab = allVocabulary
    } else if (selectedCategory === 'review') {
      const dueIds = new Set(getDueCards(p.srsCards).map(c => c.id))
      vocab = allVocabulary.filter(v => dueIds.has(v.id))
    } else if (selectedCategory === 'favorites') {
      const favs = await loadFavorites()
      setFavorites(favs)
      vocab = allVocabulary.filter(v => favs.includes(v.id))
    } else {
      vocab = getVocabularyByCategory(selectedCategory)
    }
    setCards(vocab)
    setCurrentIndex(0)
    setFinished(false)
  }, [selectedCategory])

  useEffect(() => { loadCards() }, [loadCards])

  const handleRate = async (id: string, rating: SRSRating) => {
    if (!progress) return
    const srsCard = progress.srsCards.find(c => c.id === id) ?? createSRSCard(id, 'vocabulary')
    const updated = computeNextSRS(srsCard, rating)
    await updateSRSCard(updated)

    const isNew = !progress.learnedIds.includes(id)
    let newCount = sessionNew
    let reviewCount = sessionReviewed

    if (isNew) {
      const vocab = allVocabulary.find(v => v.id === id)
      if (vocab) {
        await markWordLearned(id, vocab.category, getVocabularyByCategory(vocab.category).length)
        newCount += 1
        setSessionNew(newCount)
      }
    } else {
      reviewCount += 1
      setSessionReviewed(reviewCount)
    }

    const next = currentIndex + 1
    if (next >= cards.length) {
      setFinished(true)
      await recordDailyActivity(newCount, reviewCount, 0, 0)
    } else {
      setCurrentIndex(next)
    }
    const p = await loadProgress()
    setProgress(p)
  }

  const dueCount = progress ? getDueCards(progress.srsCards).length : 0
  const categories = [
    { key: 'favorites', label: t('vocab.categoryFavorite'), emoji: '⭐' },
    { key: 'all', label: t('vocab.categoryAll'), emoji: '📚' },
    { key: 'review', label: t('vocab.categoryReview'), emoji: '🔄' },
    ...Object.entries(categoryInfo).map(([k, v]) => ({ key: k, label: v.label, emoji: v.emoji })),
  ]

  if (mode === 'study') {
    if (finished || cards.length === 0) {
      return (
        <SafeAreaView style={[styles.container, styles.centered]}>
          <Text style={{ fontSize: 64 }}>✅</Text>
          <Text style={styles.doneTitle}>{cards.length === 0 ? t('vocab.doneNoWords') : t('vocab.doneTitle')}</Text>
          <View style={styles.doneBox}>
            <Text style={styles.doneNum1}>{sessionNew}</Text>
            <Text style={styles.doneLabel}>{t('vocab.doneNew')}</Text>
            <Text style={styles.doneNum2}>{sessionReviewed}</Text>
            <Text style={styles.doneLabel}>{t('vocab.doneReview')}</Text>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => {
            setMode('browse')
            setSessionNew(0)
            setSessionReviewed(0)
            loadCards()
          }}>
            <Text style={styles.primaryBtnText}>{t('vocab.back')}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )
    }
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setMode('browse')}>
          <Text style={styles.backText}>{t('vocab.back')}</Text>
        </TouchableOpacity>
        <FlashCard
          key={cards[currentIndex].id}
          card={cards[currentIndex]}
          onRate={handleRate}
          onSkip={() => {
            if (currentIndex + 1 >= cards.length) setFinished(true)
            else setCurrentIndex(i => i + 1)
          }}
          progress={`${currentIndex + 1} / ${cards.length}`}
          isFavorite={favorites.includes(cards[currentIndex].id)}
          onToggleFavorite={handleToggleFavorite}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.pageTitle}>{t('vocab.title')}</Text>
        <Text style={styles.pageSub}>{t('vocab.subtitle', { learned: progress?.totalWordsLearned ?? 0, total: allVocabulary.length })}</Text>

        {dueCount > 0 && (
          <TouchableOpacity
            style={styles.reviewBanner}
            onPress={() => { setSelectedCategory('review'); setMode('study') }}
          >
            <Text style={styles.reviewBannerText}>{t('vocab.reviewBanner', { count: dueCount })}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.catGrid}>
          {categories.map(cat => {
            const count = cat.key === 'all' ? allVocabulary.length
              : cat.key === 'review' ? dueCount
              : cat.key === 'favorites' ? favorites.length
              : getVocabularyByCategory(cat.key).length
            const catProg = progress?.categoryProgress[cat.key]
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catCard, selectedCategory === cat.key && styles.catCardActive]}
                onPress={() => { setSelectedCategory(cat.key); setMode('study') }}
              >
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catCount}>{t('vocab.countLabel', { count })}</Text>
                {catProg && (
                  <View style={styles.catBar}>
                    <View style={[styles.catBarFill, { width: `${Math.round((catProg.learned / count) * 100)}%` as any }]} />
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    centered: { alignItems: 'center', justifyContent: 'center' },
    backBtn: { padding: 16 },
    backText: { color: colors.subtext, fontSize: 15 },
    pageTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    pageSub: { fontSize: 14, color: colors.subtext, marginBottom: 16 },
    reviewBanner: {
      backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12,
      marginBottom: 16, borderWidth: 1, borderColor: '#FDE68A',
    },
    reviewBannerText: { color: '#92400E', fontSize: 13, fontWeight: '600' },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    catCard: {
      width: '30%', backgroundColor: colors.card, borderRadius: 14, padding: 12,
      alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    },
    catCardActive: { borderColor: colors.primary, backgroundColor: '#EEF2FF' },
    catEmoji: { fontSize: 24, marginBottom: 4 },
    catLabel: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
    catCount: { fontSize: 11, color: colors.subtext, marginTop: 2 },
    catBar: { width: '100%', height: 3, backgroundColor: colors.border, borderRadius: 2, marginTop: 6 },
    catBarFill: { height: 3, backgroundColor: colors.primary, borderRadius: 2 },
    doneTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 12, marginBottom: 16 },
    doneBox: {
      backgroundColor: colors.card, borderRadius: 20, padding: 24, alignItems: 'center',
      width: '80%', marginBottom: 24, flexDirection: 'row', justifyContent: 'space-around',
    },
    doneNum1: { fontSize: 40, fontWeight: 'bold', color: colors.primary },
    doneNum2: { fontSize: 40, fontWeight: 'bold', color: '#16A34A' },
    doneLabel: { fontSize: 13, color: colors.subtext },
    primaryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  })
}

function createFCStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20 },
    progress: { textAlign: 'center', color: colors.subtext, fontSize: 13, marginBottom: 16, letterSpacing: 0.3 },
    favoriteBtn: { position: 'absolute', top: 0, right: 0, zIndex: 10, padding: 8 },
    favoriteIcon: { fontSize: 22 },
    card: {
      backgroundColor: colors.card, borderRadius: 28, padding: 32, minHeight: 260,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#1A1614', shadowOpacity: 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 4,
      borderWidth: 1, borderColor: colors.border,
      backfaceVisibility: 'hidden',
    },
    cardBack: { backgroundColor: colors.cardSoft, borderWidth: 1, borderColor: colors.primarySoft, position: 'absolute', top: 0, left: 0, right: 0 },
    visible: { zIndex: 1 },
    categoryLabel: { fontSize: 11, color: colors.subtext, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
    japanese: { fontSize: 44, fontWeight: '500', color: colors.text, marginBottom: 8, fontFamily: fonts.jpSerif, letterSpacing: 1 },
    reading: { fontSize: 16, color: colors.subtext, marginBottom: 8, fontFamily: fonts.jpSerif, letterSpacing: 0.5 },
    flipHint: { fontSize: 12, color: colors.mutedText, marginTop: 12, letterSpacing: 0.3 },
    speakBtn: { marginTop: 12, alignSelf: 'center', padding: 8 },
    speakIcon: { fontSize: 24 },
    meanings: { flexDirection: 'row', gap: 12, marginBottom: 16, marginTop: 12, alignItems: 'flex-end' },
    chinese: { fontSize: 22, fontWeight: '600', color: colors.primary, letterSpacing: -0.3 },
    english: { fontSize: 16, color: colors.subtext, alignSelf: 'flex-end' },
    exampleBox: {
      backgroundColor: colors.card, borderRadius: 16, padding: 14, width: '100%',
      borderWidth: 1, borderColor: colors.border,
    },
    example: { fontSize: 14, color: colors.text, marginBottom: 4, fontFamily: fonts.jpSerif, letterSpacing: 0.3 },
    exampleChinese: { fontSize: 12, color: colors.subtext, lineHeight: 18 },
    ratings: { marginTop: 20 },
    ratingHint: { textAlign: 'center', color: colors.subtext, fontSize: 13, marginBottom: 10, letterSpacing: 0.3 },
    ratingRow: { flexDirection: 'row', gap: 8 },
    ratingBtn: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
    ratingLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
    ratingNext: { fontSize: 11, color: '#6B7280', marginTop: 2, letterSpacing: 0.2 },
    skipBtn: { alignItems: 'center', marginTop: 16 },
    skipText: { color: colors.subtext, fontSize: 14 },
  })
}
