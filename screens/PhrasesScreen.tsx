import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native'
import { useTranslation } from 'react-i18next'
import * as Haptics from 'expo-haptics'
import { phrases, phraseCategoryInfo } from '../data/phrases'
import type { Phrase } from '../types'
import { useTheme } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'

type ScreenMode = 'browse' | 'quiz'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getChoices(correct: Phrase, pool: Phrase[]): Phrase[] {
  const distractors = pool.filter(p => p.id !== correct.id).sort(() => Math.random() - 0.5).slice(0, 3)
  return shuffle([correct, ...distractors])
}

function PhraseQuiz({ pool, onBack }: { pool: Phrase[]; onBack: () => void }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const q = useMemo(() => createQuizStyles(colors), [colors])
  const [questions] = useState<Phrase[]>(() => shuffle(pool).slice(0, Math.min(10, pool.length)))
  const [index, setIndex] = useState(0)
  const [choices] = useState<Phrase[][]>(() =>
    shuffle(pool).slice(0, Math.min(10, pool.length)).map(qItem => getChoices(qItem, pool))
  )
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const current = questions[index]
  const currentChoices = choices[index]

  const handleSelect = (phrase: Phrase) => {
    if (selected) return
    setSelected(phrase.id)
    const correct = phrase.id === current.id
    if (correct) {
      setScore(s => s + 1)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
    setTimeout(() => {
      if (index + 1 >= questions.length) {
        setFinished(true)
      } else {
        setIndex(i => i + 1)
        setSelected(null)
      }
    }, 900)
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <View style={q.centered}>
        <Text style={{ fontSize: 64 }}>{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</Text>
        <Text style={q.resultTitle}>{t('common.quizDone')}</Text>
        <View style={q.resultBox}>
          <Text style={q.resultScore}>{score} / {questions.length}</Text>
          <Text style={q.resultPct}>{t('common.correctRate', { pct })}</Text>
          <Text style={q.resultMsg}>
            {pct >= 80 ? t('phrases.resultMsg80') : pct >= 60 ? t('phrases.resultMsg60') : t('phrases.resultMsgLow')}
          </Text>
        </View>
        <TouchableOpacity style={q.primaryBtn} onPress={onBack}>
          <Text style={q.primaryBtnText}>{t('phrases.back')}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={q.container}>
      <View style={q.progressRow}>
        <Text style={q.progressText}>{t('common.progressFraction', { current: index + 1, total: questions.length })}</Text>
        <Text style={q.scoreText}>{t('common.score', { count: score })}</Text>
      </View>
      <View style={q.progressBar}>
        <View style={[q.progressFill, { width: `${(index / questions.length) * 100}%` as any }]} />
      </View>

      <View style={q.questionCard}>
        <Text style={q.hint}>{t('phrases.quizHint')}</Text>
        <Text style={q.japanese}>{current.japanese}</Text>
        <Text style={q.reading}>{current.reading !== current.japanese ? current.reading : ''}</Text>
      </View>

      <View style={q.choicesGrid}>
        {currentChoices.map(choice => {
          let style = q.choiceBtn
          if (selected) {
            if (choice.id === current.id) style = q.choiceBtnCorrect
            else if (choice.id === selected) style = q.choiceBtnWrong
            else style = q.choiceBtnDim
          }
          return (
            <TouchableOpacity
              key={choice.id}
              style={style}
              onPress={() => handleSelect(choice)}
              disabled={!!selected}
            >
              <Text style={q.choiceText}>{choice.chinese}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

export default function PhrasesScreen() {
  const { t, i18n } = useTranslation()
  const { colors } = useTheme()
  const s = useMemo(() => createStyles(colors), [colors])
  const [screenMode, setScreenMode] = useState<ScreenMode>('browse')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = selectedCategory === 'all'
    ? phrases
    : phrases.filter(p => p.category === selectedCategory)

  const categories = ['all', ...Object.keys(phraseCategoryInfo)]

  if (screenMode === 'quiz') {
    return (
      <SafeAreaView style={s.container}>
        <TouchableOpacity style={s.backBtn} onPress={() => setScreenMode('browse')}>
          <Text style={s.backText}>{t('phrases.back')}</Text>
        </TouchableOpacity>
        <PhraseQuiz pool={filtered} onBack={() => setScreenMode('browse')} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={s.titleRow}>
          <View>
            <Text style={s.pageTitle}>{t('phrases.title')}</Text>
            <Text style={s.pageSub}>{t('phrases.subtitle')}</Text>
          </View>
          <TouchableOpacity style={s.quizBtn} onPress={() => setScreenMode('quiz')}>
            <Text style={s.quizBtnText}>{t('phrases.quizMode')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[s.filterBtn, selectedCategory === cat && s.filterBtnActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[s.filterText, selectedCategory === cat && s.filterTextActive]}>
                {cat === 'all' ? t('phrases.filterAll') : `${phraseCategoryInfo[cat]?.emoji} ${phraseCategoryInfo[cat]?.label}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map(phrase => (
          <View key={phrase.id} style={s.phraseCard}>
            <TouchableOpacity
              style={s.phraseHeader}
              onPress={() => setExpandedId(expandedId === phrase.id ? null : phrase.id)}
            >
              <View style={s.phraseHeaderLeft}>
                <View style={s.categoryTag}>
                  <Text style={s.categoryTagText}>
                    {phraseCategoryInfo[phrase.category]?.emoji} {phraseCategoryInfo[phrase.category]?.label}
                  </Text>
                </View>
                <Text style={s.phraseJapanese}>{phrase.japanese}</Text>
                <Text style={s.phraseReading}>{phrase.reading}</Text>
              </View>
              <Text style={s.expandIcon}>{expandedId === phrase.id ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {expandedId === phrase.id && (
              <View style={s.phraseBody}>
                <View style={s.translationRow}>
                  <View style={s.translationItem}>
                    <Text style={s.translationLabel}>{t('phrases.labelChinese')}</Text>
                    <Text style={s.translationText}>{phrase.chinese}</Text>
                  </View>
                  <View style={s.translationItem}>
                    <Text style={s.translationLabel}>{t('phrases.labelEnglish')}</Text>
                    <Text style={s.translationTextEn}>{phrase.english}</Text>
                  </View>
                </View>
                <View style={s.situationBox}>
                  <Text style={s.situationLabel}>{t('phrases.situationLabel')}</Text>
                  <Text style={s.situationText}>{phrase.situation}</Text>
                </View>
              </View>
            )}
          </View>
        ))}

        <View style={s.tipBox}>
          <Text style={s.tipTitle}>{t('phrases.tipTitle')}</Text>
          <Text style={s.tipText}>{t('phrases.tip1')}</Text>
          <Text style={s.tipText}>{t('phrases.tip2')}</Text>
          <Text style={s.tipText}>{t('phrases.tip3')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    backBtn: { padding: 16 },
    backText: { color: colors.subtext, fontSize: 15 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
    pageTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    pageSub: { fontSize: 14, color: colors.subtext, marginBottom: 16 },
    quizBtn: {
      backgroundColor: '#DC2626', borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 8, marginTop: 4,
    },
    quizBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    filterRow: { marginBottom: 16 },
    filterBtn: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, marginRight: 8,
    },
    filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterText: { fontSize: 13, color: colors.subtext, fontWeight: '500' },
    filterTextActive: { color: '#fff' },
    phraseCard: {
      backgroundColor: colors.card, borderRadius: 16, marginBottom: 10,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    phraseHeader: { flexDirection: 'row', padding: 16, alignItems: 'flex-start' },
    phraseHeaderLeft: { flex: 1 },
    categoryTag: {
      backgroundColor: colors.border, borderRadius: 8, paddingHorizontal: 8,
      paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8,
    },
    categoryTagText: { fontSize: 11, color: colors.subtext },
    phraseJapanese: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 4 },
    phraseReading: { fontSize: 13, color: colors.subtext },
    expandIcon: { color: colors.subtext, fontSize: 13, marginTop: 4 },
    phraseBody: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: '#EEF2FF', padding: 16 },
    translationRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
    translationItem: { flex: 1 },
    translationLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
    translationText: { fontSize: 16, fontWeight: '600', color: '#111827' },
    translationTextEn: { fontSize: 14, color: '#374151' },
    situationBox: {
      backgroundColor: '#fff', borderRadius: 10, padding: 10,
      borderWidth: 1, borderColor: '#C7D2FE', flexDirection: 'row',
    },
    situationLabel: { fontSize: 12, color: colors.primary, fontWeight: '600' },
    situationText: { fontSize: 12, color: '#374151', flex: 1 },
    tipBox: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#FDE68A', marginTop: 8 },
    tipTitle: { fontWeight: 'bold', color: '#92400E', marginBottom: 8 },
    tipText: { color: '#78350F', fontSize: 13, marginBottom: 4 },
  })
}

function createQuizStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { color: colors.subtext, fontSize: 13 },
    scoreText: { color: '#DC2626', fontWeight: '600', fontSize: 13 },
    progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 20 },
    progressFill: { height: 6, backgroundColor: '#DC2626', borderRadius: 3 },
    questionCard: {
      backgroundColor: colors.card, borderRadius: 20, padding: 24, marginBottom: 20,
      alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    },
    hint: { fontSize: 13, color: colors.subtext, marginBottom: 12 },
    japanese: { fontSize: 24, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 6 },
    reading: { fontSize: 14, color: colors.subtext },
    choicesGrid: { gap: 10 },
    choiceBtn: {
      backgroundColor: colors.card, borderRadius: 14, padding: 16,
      borderWidth: 2, borderColor: colors.border,
    },
    choiceBtnCorrect: {
      backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16,
      borderWidth: 2, borderColor: '#16A34A',
    },
    choiceBtnWrong: {
      backgroundColor: '#FEF2F2', borderRadius: 14, padding: 16,
      borderWidth: 2, borderColor: '#DC2626',
    },
    choiceBtnDim: {
      backgroundColor: colors.bg, borderRadius: 14, padding: 16,
      borderWidth: 2, borderColor: colors.border, opacity: 0.5,
    },
    choiceText: { fontSize: 16, fontWeight: '500', color: colors.text, textAlign: 'center' },
    resultTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 12, marginBottom: 16 },
    resultBox: {
      backgroundColor: colors.card, borderRadius: 20, padding: 24,
      alignItems: 'center', width: '100%', marginBottom: 24,
    },
    resultScore: { fontSize: 48, fontWeight: 'bold', color: '#DC2626' },
    resultPct: { fontSize: 18, color: colors.subtext, marginTop: 4 },
    resultMsg: { fontSize: 14, color: colors.text, marginTop: 8, textAlign: 'center' },
    primaryBtn: { backgroundColor: '#DC2626', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  })
}
