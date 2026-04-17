import React, { useState, useEffect, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTranslation } from 'react-i18next'
import { grammarQuestions, GrammarQuestion } from '../data/grammar'
import { saveGrammarResult, loadGrammarStats, GrammarStats } from '../lib/storage'
import { useTheme } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'

type Mode = 'menu' | 'quiz'
type Filter = 'all' | 'N5' | 'N4'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function Quiz({ questions, onBack, onAnswer }: {
  questions: GrammarQuestion[]
  onBack: () => void
  onAnswer: (id: string, correct: boolean) => void
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const s = useMemo(() => createStyles(colors), [colors])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [showExplain, setShowExplain] = useState(false)

  const current = questions[index]
  const isCorrect = selected === current?.answer

  const handleSelect = (opt: string) => {
    if (selected) return
    setSelected(opt)
    const correct = opt === current.answer
    if (correct) {
      setScore(sc => sc + 1)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
    onAnswer(current.id, correct)
    setShowExplain(true)
  }

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setFinished(true)
    } else {
      setIndex(i => i + 1)
      setSelected(null)
      setShowExplain(false)
    }
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <View style={s.centered}>
        <Text style={{ fontSize: 64 }}>{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</Text>
        <Text style={s.resultTitle}>{t('common.quizDone')}</Text>
        <View style={s.resultBox}>
          <Text style={s.resultScore}>{score} / {questions.length}</Text>
          <Text style={s.resultPct}>{t('common.correctRate', { pct })}</Text>
          <Text style={s.resultMsg}>
            {pct >= 80 ? t('grammar.resultMsg80') : pct >= 60 ? t('grammar.resultMsg60') : t('grammar.resultMsgLow')}
          </Text>
        </View>
        <TouchableOpacity style={s.primaryBtn} onPress={onBack}>
          <Text style={s.primaryBtnText}>{t('grammar.back')}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const parts = current.sentence.split('___')

  return (
    <View style={s.quizContainer}>
      <View style={s.progressRow}>
        <Text style={s.progressText}>{t('common.progressFraction', { current: index + 1, total: questions.length })}</Text>
        <View style={s.pointTag}>
          <Text style={s.pointText}>{current.point}</Text>
        </View>
        <Text style={s.scoreText}>{t('common.score', { count: score })}</Text>
      </View>
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${((index) / questions.length) * 100}%` as any }]} />
      </View>

      <View style={s.questionCard}>
        <Text style={s.levelBadge}>{current.level}</Text>
        <View style={s.sentenceRow}>
          <Text style={s.sentenceText}>{parts[0]}</Text>
          <View style={[s.blankBox, selected && (isCorrect ? s.blankCorrect : s.blankWrong)]}>
            <Text style={[s.blankText, selected && (isCorrect ? s.blankTextCorrect : s.blankTextWrong)]}>
              {selected ?? '＿＿'}
            </Text>
          </View>
          <Text style={s.sentenceText}>{parts[1] ?? ''}</Text>
        </View>
      </View>

      <View style={s.optionsGrid}>
        {current.options.map(opt => {
          let style = s.optBtn
          let textStyle = s.optText
          if (selected) {
            if (opt === current.answer) {
              style = s.optBtnCorrect
              textStyle = s.optTextCorrect
            } else if (opt === selected) {
              style = s.optBtnWrong
              textStyle = s.optTextWrong
            } else {
              style = s.optBtnDim
            }
          }
          return (
            <TouchableOpacity
              key={opt}
              style={style}
              onPress={() => handleSelect(opt)}
              disabled={!!selected}
            >
              <Text style={textStyle}>{opt}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {showExplain && (
        <View style={[s.explainBox, isCorrect ? s.explainCorrect : s.explainWrong]}>
          <Text style={s.explainTitle}>
            {isCorrect ? t('grammar.answerCorrect') : t('grammar.answerWrong', { answer: current.answer })}
          </Text>
          <Text style={s.explainText}>{current.explanation}</Text>
          <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
            <Text style={s.nextBtnText}>
              {index + 1 >= questions.length ? t('common.seeResult') : t('common.nextQuestion')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

export default function GrammarScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const s = useMemo(() => createStyles(colors), [colors])
  const [mode, setMode] = useState<Mode>('menu')
  const [filter, setFilter] = useState<Filter>('all')
  const [questions, setQuestions] = useState<GrammarQuestion[]>([])
  const [stats, setStats] = useState<GrammarStats>({})

  useEffect(() => {
    loadGrammarStats().then(setStats)
  }, [mode])

  const startQuiz = (f: Filter) => {
    const pool = f === 'all' ? grammarQuestions : grammarQuestions.filter(q => q.level === f)
    setQuestions(shuffle(pool))
    setFilter(f)
    setMode('quiz')
  }

  const handleAnswer = async (id: string, correct: boolean) => {
    await saveGrammarResult(id, correct)
  }

  const n5Count = grammarQuestions.filter(q => q.level === 'N5').length
  const n4Count = grammarQuestions.filter(q => q.level === 'N4').length
  const n3Count = grammarQuestions.filter(q => q.level === 'N3').length

  const totalAnswered = Object.keys(stats).length
  const totalCorrect = Object.values(stats).reduce((sum, st) => sum + st.correct, 0)
  const totalAttempts = Object.values(stats).reduce((sum, st) => sum + st.total, 0)
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

  if (mode === 'quiz') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <TouchableOpacity style={s.backBtn} onPress={() => setMode('menu')}>
          <Text style={s.backText}>{t('grammar.back')}</Text>
        </TouchableOpacity>
        <Quiz questions={questions} onBack={() => setMode('menu')} onAnswer={handleAnswer} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={s.pageTitle}>{t('grammar.title')}</Text>
        <Text style={s.pageSub}>{t('grammar.subtitle')}</Text>

        {totalAttempts > 0 && (
          <View style={s.statsCard}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{totalAnswered}</Text>
              <Text style={s.statLabel}>{t('grammar.statsAnswered')}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statNum, { color: accuracy >= 70 ? '#16A34A' : '#DC2626' }]}>{accuracy}%</Text>
              <Text style={s.statLabel}>{t('grammar.statsAccuracy')}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNum}>{totalAttempts}</Text>
              <Text style={s.statLabel}>{t('grammar.statsTotal')}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={s.menuCard} onPress={() => startQuiz('all')}>
          <Text style={s.menuEmoji}>📝</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.menuTitle}>{t('grammar.menuAll')}</Text>
            <Text style={s.menuSub}>{t('grammar.menuAllSub', { count: grammarQuestions.length })}</Text>
          </View>
          <Text style={s.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.menuCard, { borderColor: '#BBF7D0' }]}
          onPress={() => startQuiz('N5')}
        >
          <Text style={s.menuEmoji}>🌱</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.menuTitle}>{t('grammar.menuN5')}</Text>
            <Text style={s.menuSub}>{t('grammar.menuN5Sub', { count: n5Count })}</Text>
          </View>
          <Text style={s.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.menuCard, { borderColor: '#BFDBFE' }]}
          onPress={() => startQuiz('N4')}
        >
          <Text style={s.menuEmoji}>📖</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.menuTitle}>{t('grammar.menuN4')}</Text>
            <Text style={s.menuSub}>{t('grammar.menuN4Sub', { count: n4Count })}</Text>
          </View>
          <Text style={s.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.menuCard, { borderColor: '#DDD6FE' }]}
          onPress={() => startQuiz('N3' as Filter)}
        >
          <Text style={s.menuEmoji}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.menuTitle}>{t('grammar.menuN3')}</Text>
            <Text style={s.menuSub}>{t('grammar.menuN3Sub', { count: n3Count })}</Text>
          </View>
          <Text style={s.menuArrow}>→</Text>
        </TouchableOpacity>

        <Text style={[s.pageTitle, { fontSize: 17, marginTop: 24, marginBottom: 12 }]}>
          {t('grammar.refSection')}
        </Text>

        {[
          { level: 'N5', points: [
            { p: 'は', desc: '主題助詞，提示句子主題' },
            { p: 'が', desc: '主語助詞，用於存在句或強調' },
            { p: 'を', desc: '受詞助詞，接在動作對象後' },
            { p: 'に', desc: '方向、目的地、存在位置' },
            { p: 'で', desc: '動作場所、手段方法' },
            { p: '〜ます', desc: '禮貌形現在式／習慣' },
            { p: '〜ました', desc: '禮貌形過去式' },
            { p: '〜ません', desc: '禮貌形否定' },
            { p: '〜てください', desc: '禮貌請求' },
          ]},
          { level: 'N4', points: [
            { p: '〜たい', desc: '想做某事（願望）' },
            { p: '〜ています', desc: '正在進行或狀態持續' },
            { p: '〜から', desc: '因為〜所以〜（原因）' },
            { p: '〜ても', desc: '即使〜也〜（讓步）' },
          ]},
        ].map(group => (
          <View key={group.level} style={s.refSection}>
            <View style={s.refLevelBadge}>
              <Text style={s.refLevelText}>{group.level}</Text>
            </View>
            {group.points.map(item => (
              <View key={item.p} style={s.refRow}>
                <Text style={s.refPoint}>{item.p}</Text>
                <Text style={s.refDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backBtn: { padding: 16 },
    backText: { color: colors.subtext, fontSize: 15 },
    statsCard: {
      flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16,
      padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
      justifyContent: 'space-around', alignItems: 'center',
    },
    statItem: { alignItems: 'center', flex: 1 },
    statNum: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
    statLabel: { fontSize: 11, color: colors.subtext, marginTop: 2 },
    statDivider: { width: 1, height: 36, backgroundColor: colors.border },
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
    refSection: {
      backgroundColor: colors.card, borderRadius: 14, padding: 14,
      marginBottom: 12, borderWidth: 1, borderColor: colors.border,
    },
    refLevelBadge: {
      backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 10,
      paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 10,
    },
    refLevelText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    refRow: { flexDirection: 'row', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
    refPoint: { fontSize: 14, fontWeight: '700', color: colors.primary, width: 80 },
    refDesc: { fontSize: 13, color: colors.text, flex: 1 },
    // Quiz
    quizContainer: { flex: 1, padding: 20 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    progressText: { color: colors.subtext, fontSize: 13 },
    pointTag: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    pointText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
    scoreText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
    progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 20 },
    progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
    questionCard: {
      backgroundColor: colors.card, borderRadius: 20, padding: 24,
      marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06,
      shadowRadius: 10, elevation: 3,
    },
    levelBadge: {
      backgroundColor: colors.border, borderRadius: 6, paddingHorizontal: 8,
      paddingVertical: 2, alignSelf: 'flex-start', fontSize: 11,
      color: colors.subtext, fontWeight: '600', marginBottom: 12,
    },
    sentenceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
    sentenceText: { fontSize: 20, color: colors.text, fontWeight: '500' },
    blankBox: {
      borderBottomWidth: 2, borderBottomColor: colors.subtext,
      minWidth: 60, paddingHorizontal: 4, paddingBottom: 2,
    },
    blankCorrect: { borderBottomColor: '#16A34A' },
    blankWrong: { borderBottomColor: '#DC2626' },
    blankText: { fontSize: 20, fontWeight: '700', color: colors.subtext, textAlign: 'center' },
    blankTextCorrect: { color: '#16A34A' },
    blankTextWrong: { color: '#DC2626' },
    optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    optBtn: {
      width: '47%', backgroundColor: colors.card, borderRadius: 14, padding: 16,
      alignItems: 'center', borderWidth: 2, borderColor: colors.border,
    },
    optBtnCorrect: {
      width: '47%', backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16,
      alignItems: 'center', borderWidth: 2, borderColor: '#16A34A',
    },
    optBtnWrong: {
      width: '47%', backgroundColor: '#FEF2F2', borderRadius: 14, padding: 16,
      alignItems: 'center', borderWidth: 2, borderColor: '#DC2626',
    },
    optBtnDim: {
      width: '47%', backgroundColor: colors.bg, borderRadius: 14, padding: 16,
      alignItems: 'center', borderWidth: 2, borderColor: colors.border, opacity: 0.5,
    },
    optText: { fontSize: 20, fontWeight: '600', color: colors.text },
    optTextCorrect: { fontSize: 20, fontWeight: '600', color: '#16A34A' },
    optTextWrong: { fontSize: 20, fontWeight: '600', color: '#DC2626' },
    explainBox: {
      borderRadius: 16, padding: 16, marginTop: 16,
      borderWidth: 1,
    },
    explainCorrect: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
    explainWrong: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    explainTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
    explainText: { fontSize: 13, color: colors.text, lineHeight: 20, marginBottom: 12 },
    nextBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 12, alignItems: 'center' },
    nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    // Result
    resultTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 12, marginBottom: 16 },
    resultBox: {
      backgroundColor: colors.card, borderRadius: 20, padding: 24,
      alignItems: 'center', width: '100%', marginBottom: 24,
    },
    resultScore: { fontSize: 48, fontWeight: 'bold', color: colors.primary },
    resultPct: { fontSize: 18, color: colors.subtext, marginTop: 4 },
    resultMsg: { fontSize: 14, color: colors.text, marginTop: 8, textAlign: 'center' },
    primaryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  })
}
