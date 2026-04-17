import React, { useState, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView
} from 'react-native'
import { useTranslation } from 'react-i18next'
import * as Haptics from 'expo-haptics'
import { allVocabulary } from '../data/vocabulary'
import { useTheme } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'

type KanjiMode = 'kanjiToReading' | 'readingToKanji'
type Level = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
type ScreenMode = 'menu' | 'quiz' | 'result'

interface KanjiQuestion {
  id: string
  prompt: string
  options: string[]
  answer: string
  japanese: string
  reading: string
  meaning: string
}

const TOTAL_QUESTIONS = 10

function hasKanji(text: string): boolean {
  return /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestions(level: Level, mode: KanjiMode): KanjiQuestion[] {
  const pool = allVocabulary.filter(v => v.level === level && hasKanji(v.japanese))
  if (pool.length < 4) return []
  const shuffled = shuffle(pool)
  const selected = shuffled.slice(0, Math.min(TOTAL_QUESTIONS, shuffled.length))
  return selected.map(v => {
    const distractors = pool
      .filter(x => x.id !== v.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    if (mode === 'kanjiToReading') {
      const opts = shuffle([v.reading, ...distractors.map(d => d.reading)])
      return { id: v.id, prompt: v.japanese, options: opts, answer: v.reading, japanese: v.japanese, reading: v.reading, meaning: v.chinese }
    } else {
      const opts = shuffle([v.japanese, ...distractors.map(d => d.japanese)])
      return { id: v.id, prompt: v.reading, options: opts, answer: v.japanese, japanese: v.japanese, reading: v.reading, meaning: v.chinese }
    }
  })
}

function Quiz({
  questions,
  kanjiMode,
  onFinish,
}: {
  questions: KanjiQuestion[]
  kanjiMode: KanjiMode
  onFinish: (score: number, wrong: KanjiQuestion[]) => void
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<KanjiQuestion[]>([])

  const current = questions[index]

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
    const correct = option === current.answer
    const newScore = correct ? score + 1 : score
    if (correct) {
      setScore(newScore)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      setWrongAnswers(prev => [...prev, current])
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
    setTimeout(() => {
      if (index + 1 >= questions.length) {
        onFinish(newScore, correct ? wrongAnswers : [...wrongAnswers, current])
      } else {
        setIndex(i => i + 1)
        setSelected(null)
      }
    }, 1200)
  }

  const hint = kanjiMode === 'kanjiToReading'
    ? t('kanji.questionHintKanjiToReading')
    : t('kanji.questionHintReadingToKanji')

  return (
    <View style={styles.quizContainer}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {t('common.progressFraction', { current: index + 1, total: questions.length })}
        </Text>
        <Text style={styles.scoreText}>{t('common.score', { count: score })}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(index / questions.length) * 100}%` as any }]} />
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionHint}>{hint}</Text>
        <Text style={styles.questionPrompt}>{current.prompt}</Text>
      </View>

      <View style={styles.choicesGrid}>
        {current.options.map((option, i) => {
          let btnStyle = styles.choiceBtn
          let textStyle = styles.choiceText
          if (selected) {
            if (option === current.answer) {
              btnStyle = styles.choiceBtnCorrect
              textStyle = styles.choiceTextCorrect
            } else if (option === selected) {
              btnStyle = styles.choiceBtnWrong
              textStyle = styles.choiceTextWrong
            }
          }
          return (
            <TouchableOpacity
              key={i}
              style={btnStyle}
              onPress={() => handleSelect(option)}
              disabled={!!selected}
            >
              <Text style={textStyle}>{option}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

function ResultScreen({
  score,
  total,
  wrongAnswers,
  onBack,
  onRetry,
}: {
  score: number
  total: number
  wrongAnswers: KanjiQuestion[]
  onBack: () => void
  onRetry: () => void
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const pct = Math.round((score / total) * 100)
  const msg = pct >= 80
    ? t('kanji.resultMsg80')
    : pct >= 60
    ? t('kanji.resultMsg60')
    : t('kanji.resultMsgLow')

  return (
    <ScrollView contentContainerStyle={styles.centeredScroll}>
      <Text style={{ fontSize: 64 }}>{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</Text>
      <Text style={styles.resultTitle}>{t('common.quizDone')}</Text>
      <View style={styles.resultBox}>
        <Text style={styles.resultScore}>{score} / {total}</Text>
        <Text style={styles.resultPct}>{t('common.correctRate', { pct })}</Text>
        <Text style={styles.resultMsg}>{msg}</Text>
      </View>

      {wrongAnswers.length > 0 && (
        <View style={styles.wrongBox}>
          <Text style={styles.wrongTitle}>{t('kanji.wrongSectionTitle')}</Text>
          {wrongAnswers.map((item, i) => (
            <View key={i} style={styles.wrongRow}>
              <Text style={styles.wrongPrompt}>{item.japanese}</Text>
              <View style={styles.wrongDetail}>
                <Text style={styles.wrongCorrect}>{t('kanji.wrongReading')}{item.reading}</Text>
                <Text style={styles.wrongMeaning}>{t('kanji.wrongMeaning')}{item.meaning}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={onRetry}>
        <Text style={styles.primaryBtnText}>{t('common.retry')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.primaryBtn, styles.secondaryBtn]} onPress={onBack}>
        <Text style={styles.secondaryBtnText}>{t('kanji.back')}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

export default function KanjiScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [screenMode, setScreenMode] = useState<ScreenMode>('menu')
  const [kanjiMode, setKanjiMode] = useState<KanjiMode>('kanjiToReading')
  const [level, setLevel] = useState<Level>('N5')
  const [questions, setQuestions] = useState<KanjiQuestion[]>([])
  const [resultScore, setResultScore] = useState(0)
  const [resultWrong, setResultWrong] = useState<KanjiQuestion[]>([])

  const startQuiz = (m: KanjiMode, l: Level) => {
    const qs = buildQuestions(l, m)
    if (qs.length === 0) return
    setKanjiMode(m)
    setLevel(l)
    setQuestions(qs)
    setScreenMode('quiz')
  }

  const handleFinish = (score: number, wrong: KanjiQuestion[]) => {
    setResultScore(score)
    setResultWrong(wrong)
    setScreenMode('result')
  }

  const handleRetry = () => {
    setQuestions(buildQuestions(level, kanjiMode))
    setScreenMode('quiz')
  }

  if (screenMode === 'quiz') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setScreenMode('menu')}>
          <Text style={styles.backText}>{t('kanji.back')}</Text>
        </TouchableOpacity>
        <Quiz questions={questions} kanjiMode={kanjiMode} onFinish={handleFinish} />
      </SafeAreaView>
    )
  }

  if (screenMode === 'result') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ResultScreen
          score={resultScore}
          total={questions.length}
          wrongAnswers={resultWrong}
          onBack={() => setScreenMode('menu')}
          onRetry={handleRetry}
        />
      </SafeAreaView>
    )
  }

  const levels: Level[] = ['N5', 'N4', 'N3', 'N2', 'N1']
  const modes: Array<{ key: KanjiMode; titleKey: string; subKey: string; emoji: string }> = [
    { key: 'kanjiToReading', titleKey: 'kanji.modeKanjiToReading', subKey: 'kanji.modeKanjiToReadingSub', emoji: '漢→読' },
    { key: 'readingToKanji', titleKey: 'kanji.modeReadingToKanji', subKey: 'kanji.modeReadingToKanjiSub', emoji: '読→漢' },
  ]

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.pageTitle}>{t('kanji.title')}</Text>
        <Text style={styles.pageSub}>{t('kanji.subtitle')}</Text>

        <Text style={styles.sectionLabel}>{t('kanji.levelSelect')}</Text>
        <View style={styles.levelRow}>
          {levels.map(l => (
            <TouchableOpacity
              key={l}
              style={[styles.levelBtn, level === l && styles.levelBtnActive]}
              onPress={() => setLevel(l)}
            >
              <Text style={[styles.levelBtnText, level === l && styles.levelBtnTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {modes.map(card => (
          <TouchableOpacity
            key={card.key}
            style={styles.menuCard}
            onPress={() => startQuiz(card.key, level)}
          >
            <Text style={styles.menuEmoji}>{card.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>{t(card.titleKey)}</Text>
              <Text style={styles.menuSub}>{t(card.subKey)}</Text>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    backBtn: { padding: 16 },
    backText: { color: colors.subtext, fontSize: 15 },
    pageTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    pageSub: { fontSize: 14, color: colors.subtext, marginBottom: 20 },
    sectionLabel: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 10 },
    levelRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    levelBtn: {
      flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card,
    },
    levelBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary },
    levelBtnText: { fontSize: 16, fontWeight: '700', color: colors.subtext },
    levelBtnTextActive: { color: '#fff' },
    menuCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.card, borderRadius: 16, padding: 16,
      marginBottom: 12, borderWidth: 1, borderColor: colors.border,
    },
    menuEmoji: { fontSize: 20, fontWeight: '700', color: colors.primary, width: 48, textAlign: 'center' },
    menuTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    menuSub: { fontSize: 13, color: colors.subtext, marginTop: 2 },
    menuArrow: { fontSize: 18, color: colors.subtext },
    // Quiz
    quizContainer: { flex: 1, padding: 20 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { color: colors.subtext, fontSize: 13 },
    scoreText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
    progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 24 },
    progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
    questionCard: {
      backgroundColor: colors.card, borderRadius: 20, padding: 32,
      alignItems: 'center', marginBottom: 24,
      shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },
    questionHint: { color: colors.subtext, fontSize: 14, marginBottom: 16 },
    questionPrompt: { fontSize: 56, fontWeight: 'bold', color: colors.text },
    choicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    choiceBtn: {
      width: '47%', backgroundColor: colors.card, borderRadius: 14, padding: 16,
      alignItems: 'center', borderWidth: 2, borderColor: colors.border, minHeight: 64,
      justifyContent: 'center',
    },
    choiceBtnCorrect: {
      width: '47%', backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16,
      alignItems: 'center', borderWidth: 2, borderColor: '#16A34A', minHeight: 64,
      justifyContent: 'center',
    },
    choiceBtnWrong: {
      width: '47%', backgroundColor: '#FEF2F2', borderRadius: 14, padding: 16,
      alignItems: 'center', borderWidth: 2, borderColor: '#DC2626', minHeight: 64,
      justifyContent: 'center',
    },
    choiceText: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
    choiceTextCorrect: { fontSize: 16, fontWeight: '600', color: '#16A34A', textAlign: 'center' },
    choiceTextWrong: { fontSize: 16, fontWeight: '600', color: '#DC2626', textAlign: 'center' },
    // Result
    centeredScroll: { alignItems: 'center', padding: 24, paddingBottom: 40 },
    resultTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 12, marginBottom: 16 },
    resultBox: {
      backgroundColor: colors.card, borderRadius: 20, padding: 24,
      alignItems: 'center', width: '100%', marginBottom: 24,
      shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    resultScore: { fontSize: 48, fontWeight: 'bold', color: colors.primary },
    resultPct: { fontSize: 18, color: colors.subtext, marginTop: 4 },
    resultMsg: { fontSize: 14, color: colors.text, marginTop: 8, textAlign: 'center' },
    wrongBox: {
      backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16,
      width: '100%', marginBottom: 24, borderWidth: 1, borderColor: '#FECACA',
    },
    wrongTitle: { fontSize: 15, fontWeight: '700', color: '#DC2626', marginBottom: 12 },
    wrongRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#FECACA',
    },
    wrongPrompt: { fontSize: 28, fontWeight: 'bold', color: colors.text, width: 56, textAlign: 'center' },
    wrongDetail: { flex: 1 },
    wrongCorrect: { fontSize: 14, color: '#16A34A', fontWeight: '600' },
    wrongMeaning: { fontSize: 13, color: colors.subtext, marginTop: 2 },
    primaryBtn: {
      backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 32,
      paddingVertical: 14, marginBottom: 12, width: '80%',
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
    secondaryBtn: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    secondaryBtnText: { color: colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  })
}
