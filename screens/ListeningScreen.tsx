import React, { useState, useEffect, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView
} from 'react-native'
import { useTranslation } from 'react-i18next'
import * as Haptics from 'expo-haptics'
import { speakJapanese } from '../lib/speech'
import { allVocabulary } from '../data/vocabulary/index'
import { phrases } from '../data/phrases'
import { useTheme } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'

interface ListeningQuestion {
  id: string
  audioText: string
  qType: 'vocab' | 'phrase'
  level?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  options: string[]
  answer: string
  answerMeaning: string
}

type DifficultyMode = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'phrases'
type ScreenMode = 'menu' | 'quiz' | 'result'

const TOTAL_QUESTIONS = 10

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestions(mode: DifficultyMode): ListeningQuestion[] {
  if (mode === 'phrases') {
    const pool = shuffle(phrases)
    const selected = pool.slice(0, Math.min(TOTAL_QUESTIONS, pool.length))
    return selected.map(p => {
      const distractors = pool
        .filter(x => x.id !== p.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(x => x.japanese)
      const options = shuffle([p.japanese, ...distractors])
      return {
        id: p.id,
        audioText: p.japanese,
        qType: 'phrase',
        options,
        answer: p.japanese,
        answerMeaning: p.chinese,
      }
    })
  } else {
    const pool = allVocabulary.filter(v => v.level === mode)
    const shuffled = shuffle(pool)
    const selected = shuffled.slice(0, Math.min(TOTAL_QUESTIONS, shuffled.length))
    return selected.map(v => {
      const distractors = pool
        .filter(x => x.id !== v.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(x => x.japanese)
      const options = shuffle([v.japanese, ...distractors])
      return {
        id: v.id,
        audioText: v.japanese,
        qType: 'vocab',
        level: mode,
        options,
        answer: v.japanese,
        answerMeaning: v.chinese,
      }
    })
  }
}

function Quiz({
  questions,
  onFinish,
}: {
  questions: ListeningQuestion[]
  onFinish: (score: number, wrong: ListeningQuestion[]) => void
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [wrongAnswers, setWrongAnswers] = useState<ListeningQuestion[]>([])

  const current = questions[index]

  useEffect(() => {
    if (current) {
      speakJapanese(current.audioText)
    }
  }, [index])

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

  return (
    <View style={styles.quizContainer}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {t('common.progressFraction', { current: index, total: questions.length })}
        </Text>
        <Text style={styles.scoreText}>{t('common.score', { count: score })}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(index / questions.length) * 100}%` as any }]} />
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionHint}>{t('listening.questionHint')}</Text>
        <TouchableOpacity onPress={() => speakJapanese(current.audioText)} style={styles.playBtn}>
          <Text style={styles.playBtnText}>{t('listening.playBtn')}</Text>
        </TouchableOpacity>
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
  wrongAnswers: ListeningQuestion[]
  onBack: () => void
  onRetry: () => void
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const pct = Math.round((score / total) * 100)
  const msg = pct >= 80
    ? t('listening.resultMsg80')
    : pct >= 60
    ? t('listening.resultMsg60')
    : t('listening.resultMsgLow')

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
          <Text style={styles.wrongTitle}>{t('listening.wrongSectionTitle')}</Text>
          {wrongAnswers.map((item, i) => (
            <View key={i} style={styles.wrongRow}>
              <TouchableOpacity onPress={() => speakJapanese(item.audioText)} style={styles.wrongPlayBtn}>
                <Text style={{ fontSize: 18 }}>🔊</Text>
              </TouchableOpacity>
              <View style={styles.wrongDetail}>
                <Text style={styles.wrongCorrect}>{t('listening.wrongAnswer')}{item.answer}</Text>
                <Text style={styles.wrongMeaning}>{t('listening.wrongMeaning')}{item.answerMeaning}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={onRetry}>
        <Text style={styles.primaryBtnText}>{t('common.retry')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.primaryBtn, styles.secondaryBtn]} onPress={onBack}>
        <Text style={styles.secondaryBtnText}>{t('listening.back')}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

export default function ListeningScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [mode, setMode] = useState<ScreenMode>('menu')
  const [difficulty, setDifficulty] = useState<DifficultyMode>('N5')
  const [questions, setQuestions] = useState<ListeningQuestion[]>([])
  const [resultScore, setResultScore] = useState(0)
  const [resultWrong, setResultWrong] = useState<ListeningQuestion[]>([])

  const startQuiz = (diff: DifficultyMode) => {
    setDifficulty(diff)
    setQuestions(buildQuestions(diff))
    setMode('quiz')
  }

  const handleFinish = (score: number, wrong: ListeningQuestion[]) => {
    setResultScore(score)
    setResultWrong(wrong)
    setMode('result')
  }

  const handleRetry = () => {
    setQuestions(buildQuestions(difficulty))
    setMode('quiz')
  }

  const modeCards: Array<{ mode: DifficultyMode; emoji: string; titleKey: string; subKey: string }> = [
    { mode: 'N5', emoji: '🌱', titleKey: 'listening.modeN5', subKey: 'listening.modeN5Sub' },
    { mode: 'N4', emoji: '🌿', titleKey: 'listening.modeN4', subKey: 'listening.modeN4Sub' },
    { mode: 'N3', emoji: '🌳', titleKey: 'listening.modeN3', subKey: 'listening.modeN3Sub' },
    { mode: 'N2', emoji: '⚡', titleKey: 'listening.modeN2', subKey: 'listening.modeN2Sub' },
    { mode: 'N1', emoji: '🏆', titleKey: 'listening.modeN1', subKey: 'listening.modeN1Sub' },
    { mode: 'phrases', emoji: '💬', titleKey: 'listening.modePhrases', subKey: 'listening.modePhrasesSub' },
  ]

  if (mode === 'quiz') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setMode('menu')}>
          <Text style={styles.backText}>{t('listening.back')}</Text>
        </TouchableOpacity>
        <Quiz questions={questions} onFinish={handleFinish} />
      </SafeAreaView>
    )
  }

  if (mode === 'result') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ResultScreen
          score={resultScore}
          total={questions.length}
          wrongAnswers={resultWrong}
          onBack={() => setMode('menu')}
          onRetry={handleRetry}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.pageTitle}>{t('listening.title')}</Text>
        <Text style={styles.pageSub}>{t('listening.subtitle')}</Text>

        {modeCards.map(card => (
          <TouchableOpacity
            key={card.mode}
            style={styles.menuCard}
            onPress={() => startQuiz(card.mode)}
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
    backBtn: { padding: 16 },
    backText: { color: colors.subtext, fontSize: 15 },
    pageTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    pageSub: { fontSize: 14, color: colors.subtext, marginBottom: 20 },
    menuCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.card, borderRadius: 16, padding: 16,
      marginBottom: 12, borderWidth: 1, borderColor: colors.border,
    },
    menuEmoji: { fontSize: 28 },
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
    questionHint: { color: colors.subtext, fontSize: 14, marginBottom: 20 },
    playBtn: {
      backgroundColor: colors.primary, borderRadius: 40,
      paddingHorizontal: 28, paddingVertical: 14,
    },
    playBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
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
    wrongPlayBtn: { padding: 4 },
    wrongDetail: { flex: 1 },
    wrongCorrect: { fontSize: 14, color: '#16A34A', fontWeight: '600' },
    wrongMeaning: { fontSize: 13, color: colors.subtext, marginTop: 2 },
    primaryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginBottom: 12, width: '80%' },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
    secondaryBtn: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    secondaryBtnText: { color: colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  })
}
