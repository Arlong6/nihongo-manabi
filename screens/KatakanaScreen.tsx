import React, { useState, useEffect, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView
} from 'react-native'
import { useTranslation } from 'react-i18next'
import * as Haptics from 'expo-haptics'
import { speakJapanese } from '../lib/speech'
import { katakanaChars, confusablePairs } from '../data/katakana'
import { hiraganaChars, hiraganaConfusablePairs, hiraganaConfusableSet } from '../data/hiragana'
import { recordDailyActivity } from '../lib/storage'
import type { KatakanaChar, HiraganaChar } from '../types'
import { useTheme } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'

type KanaItem = {
  id: string
  display: string
  romaji: string
  pair: string
  similar?: string[]
}

type KanaType = 'hiragana' | 'katakana'
type Mode = 'menu' | 'quiz-all' | 'quiz-confusable' | 'chart'

const TOTAL_QUESTIONS = 10

function toKanaItem(char: KatakanaChar | HiraganaChar, type: KanaType): KanaItem {
  if (type === 'katakana') {
    const c = char as KatakanaChar
    return { id: c.romaji, display: c.katakana, romaji: c.romaji, pair: c.hiragana, similar: c.similar }
  } else {
    const c = char as HiraganaChar
    return { id: c.romaji, display: c.hiragana, romaji: c.romaji, pair: c.katakana, similar: c.similar }
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getChoices(correct: KanaItem, pool: KanaItem[]): KanaItem[] {
  const distractors = pool
    .filter(c => c.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  return shuffle([correct, ...distractors])
}

function Quiz({ pool, onBack }: { pool: KanaItem[]; onBack: () => void }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const total = Math.min(TOTAL_QUESTIONS, pool.length)
  const [questions] = useState<KanaItem[]>(() => shuffle(pool).slice(0, total))
  const [index, setIndex] = useState(0)
  const [choices, setChoices] = useState<KanaItem[]>(() => getChoices(questions[0], pool))
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [wrongAnswers, setWrongAnswers] = useState<{ question: KanaItem; chosen: KanaItem }[]>([])

  useEffect(() => {
    if (index < questions.length) {
      setChoices(getChoices(questions[index], pool))
      setSelected(null)
    }
  }, [index, questions, pool])

  const handleSelect = (choice: KanaItem) => {
    if (selected) return
    setSelected(choice.romaji)
    const correct = choice.id === questions[index].id
    const newScore = correct ? score + 1 : score
    if (correct) {
      setScore(newScore)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      setWrongAnswers(prev => [...prev, { question: questions[index], chosen: choice }])
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }

    setTimeout(() => {
      if (index + 1 >= questions.length) {
        setFinished(true)
        recordDailyActivity(0, 0, newScore, questions.length)
      } else {
        setIndex(i => i + 1)
      }
    }, 1200)
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <ScrollView contentContainerStyle={styles.centeredScroll}>
        <Text style={{ fontSize: 64 }}>{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</Text>
        <Text style={styles.resultTitle}>{t('common.quizDone')}</Text>
        <View style={styles.resultBox}>
          <Text style={styles.resultScore}>{score} / {questions.length}</Text>
          <Text style={styles.resultPct}>{t('common.correctRate', { pct })}</Text>
          <Text style={styles.resultMsg}>
            {pct >= 80 ? t('kana.resultMsg80') : pct >= 60 ? t('kana.resultMsg60') : t('kana.resultMsgLow')}
          </Text>
        </View>
        {wrongAnswers.length > 0 && (
          <View style={styles.wrongBox}>
            <Text style={styles.wrongTitle}>{t('kana.wrongSectionTitle')}</Text>
            {wrongAnswers.map((item, i) => (
              <View key={i} style={styles.wrongRow}>
                <Text style={styles.wrongChar}>{item.question.display}</Text>
                <View style={styles.wrongDetail}>
                  <Text style={styles.wrongCorrect}>{t('kana.wrongCorrect', { romaji: item.question.romaji })}</Text>
                  <Text style={styles.wrongChosen}>{t('kana.wrongChosen', { romaji: item.chosen.romaji })}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity style={styles.primaryBtn} onPress={onBack}>
          <Text style={styles.primaryBtnText}>{t('kana.back')}</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  const current = questions[index]
  return (
    <View style={styles.quizContainer}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{t('common.progressFraction', { current: index, total: questions.length })}</Text>
        <Text style={styles.scoreText}>{t('common.score', { count: score })}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(index / questions.length) * 100}%` as any }]} />
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionHint}>{t('kana.questionHint')}</Text>
        <Text style={styles.questionChar}>{current.display}</Text>
        <TouchableOpacity onPress={() => speakJapanese(current.display)} style={styles.speakBtn}>
          <Text style={styles.speakIcon}>🔊</Text>
        </TouchableOpacity>
        {current.similar && (
          <Text style={styles.similarHint}>{t('kana.similarHint', { chars: current.similar.join('、') })}</Text>
        )}
      </View>

      <View style={styles.choicesGrid}>
        {choices.map(choice => {
          let btnStyle = styles.choiceBtn
          let textStyle = styles.choiceText
          if (selected) {
            if (choice.id === current.id) {
              btnStyle = styles.choiceBtnCorrect
              textStyle = styles.choiceTextCorrect
            } else if (choice.romaji === selected) {
              btnStyle = styles.choiceBtnWrong
              textStyle = styles.choiceTextWrong
            }
          }
          return (
            <TouchableOpacity
              key={choice.id}
              style={btnStyle}
              onPress={() => handleSelect(choice)}
              disabled={!!selected}
            >
              <Text style={textStyle}>{choice.romaji}</Text>
              <Text style={styles.choicePair}>({choice.pair})</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const KANA_ROWS = [
  ['a','i','u','e','o'],
  ['ka','ki','ku','ke','ko'],
  ['sa','shi','su','se','so'],
  ['ta','chi','tsu','te','to'],
  ['na','ni','nu','ne','no'],
  ['ha','hi','fu','he','ho'],
  ['ma','mi','mu','me','mo'],
  ['ya', null, 'yu', null, 'yo'],
  ['ra','ri','ru','re','ro'],
  ['wa', null, null, null, 'wo'],
  ['n', null, null, null, null],
]

function Chart({ items, confusable, kanaType }: {
  items: KanaItem[]
  confusable: { chars: string[]; hint: string }[]
  kanaType: KanaType
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const itemMap = new Map(items.map(c => [c.romaji, c]))
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.pageTitle}>
        {kanaType === 'katakana' ? t('kana.chartKatakana') : t('kana.chartHiragana')}
      </Text>
      <View style={styles.chartGrid}>
        {KANA_ROWS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.chartRow}>
            {row.map((romaji, colIdx) => {
              if (!romaji) {
                return <View key={colIdx} style={styles.chartCellEmpty} />
              }
              const c = itemMap.get(romaji)
              if (!c) return <View key={colIdx} style={styles.chartCellEmpty} />
              return (
                <View key={c.id} style={[styles.chartCell, c.similar && styles.chartCellWarn]}>
                  <Text style={styles.chartMain}>{c.display}</Text>
                  <Text style={styles.chartRomaji}>{c.romaji}</Text>
                  <Text style={styles.chartPair}>{c.pair}</Text>
                </View>
              )
            })}
          </View>
        ))}
      </View>
      <Text style={styles.warnNote}>{t('kana.warnNote')}</Text>

      <Text style={[styles.pageTitle, { marginTop: 24 }]}>{t('kana.confusableSection')}</Text>
      {confusable.map(pair => (
        <View key={pair.chars.join('')} style={styles.confusableRow}>
          {pair.chars.map(c => (
            <View key={c} style={styles.confusableChar}>
              <Text style={styles.confusableCharText}>{c}</Text>
            </View>
          ))}
          <Text style={styles.confusableHint}>{pair.hint}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

export default function KatakanaScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [mode, setMode] = useState<Mode>('menu')
  const [kanaType, setKanaType] = useState<KanaType>('katakana')

  const confusableSet = kanaType === 'katakana'
    ? new Set(['シ', 'ツ', 'ソ', 'ン', 'リ', 'ア', 'マ', 'ウ', 'ワ'])
    : hiraganaConfusableSet

  const rawChars = kanaType === 'katakana' ? katakanaChars : hiraganaChars
  const allItems: KanaItem[] = rawChars.map(c => toKanaItem(c, kanaType))
  const confusableItems = allItems.filter(c => confusableSet.has(c.display))
  const confusablePairData = kanaType === 'katakana' ? confusablePairs : hiraganaConfusablePairs

  const quizPool = mode === 'quiz-confusable' ? confusableItems : allItems

  if (mode === 'quiz-all' || mode === 'quiz-confusable') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setMode('menu')}>
          <Text style={styles.backText}>{t('kana.back')}</Text>
        </TouchableOpacity>
        <Quiz pool={quizPool} onBack={() => setMode('menu')} />
      </SafeAreaView>
    )
  }

  if (mode === 'chart') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setMode('menu')}>
          <Text style={styles.backText}>{t('kana.back')}</Text>
        </TouchableOpacity>
        <Chart items={allItems} confusable={confusablePairData} kanaType={kanaType} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.pageTitle}>{t('kana.title')}</Text>

        <View style={styles.kanaToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, kanaType === 'hiragana' && styles.toggleBtnActive]}
            onPress={() => setKanaType('hiragana')}
          >
            <Text style={[styles.toggleText, kanaType === 'hiragana' && styles.toggleTextActive]}>
              ひらがな
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, kanaType === 'katakana' && styles.toggleBtnActive]}
            onPress={() => setKanaType('katakana')}
          >
            <Text style={[styles.toggleText, kanaType === 'katakana' && styles.toggleTextActive]}>
              カタカナ
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.pageSub}>
          {kanaType === 'hiragana' ? t('kana.hiraganaCount') : t('kana.katakanaCount')}
        </Text>

        <TouchableOpacity style={styles.menuCard} onPress={() => setMode('quiz-all')}>
          <Text style={styles.menuEmoji}>📝</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{t('kana.practiceAll')}</Text>
            <Text style={styles.menuSub}>{t('kana.practiceAllSub')}</Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuCard, { borderColor: '#FED7AA' }]}
          onPress={() => setMode('quiz-confusable')}
        >
          <Text style={styles.menuEmoji}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{t('kana.practiceConfusable')}</Text>
            <Text style={styles.menuSub}>
              {kanaType === 'hiragana'
                ? t('kana.practiceConfusableSubHiragana')
                : t('kana.practiceConfusableSubKatakana')}
            </Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCard} onPress={() => setMode('chart')}>
          <Text style={styles.menuEmoji}>📊</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>
              {kanaType === 'hiragana' ? t('kana.chartHiragana') : t('kana.chartKatakana')}
            </Text>
            <Text style={styles.menuSub}>{t('kana.chartSub')}</Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>{t('kana.tipTitle')}</Text>
          {kanaType === 'hiragana' ? (
            <>
              <Text style={styles.tipText}>{t('kana.tipHiragana1')}</Text>
              <Text style={styles.tipText}>{t('kana.tipHiragana2')}</Text>
              <Text style={styles.tipText}>{t('kana.tipHiragana3')}</Text>
            </>
          ) : (
            <>
              <Text style={styles.tipText}>{t('kana.tipKatakana1')}</Text>
              <Text style={styles.tipText}>{t('kana.tipKatakana2')}</Text>
              <Text style={styles.tipText}>{t('kana.tipKatakana3')}</Text>
            </>
          )}
        </View>
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
    kanaToggle: {
      flexDirection: 'row', backgroundColor: colors.border, borderRadius: 12,
      padding: 4, marginBottom: 16,
    },
    toggleBtn: {
      flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    },
    toggleBtnActive: { backgroundColor: colors.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    toggleText: { fontSize: 16, fontWeight: '600', color: colors.subtext },
    toggleTextActive: { color: colors.primary },
    menuCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.card, borderRadius: 16, padding: 16,
      marginBottom: 12, borderWidth: 1, borderColor: colors.border,
    },
    menuEmoji: { fontSize: 28 },
    menuTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
    menuSub: { fontSize: 13, color: colors.subtext, marginTop: 2 },
    menuArrow: { fontSize: 18, color: colors.subtext },
    tipBox: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#FDE68A', marginTop: 8 },
    tipTitle: { fontWeight: 'bold', color: '#92400E', marginBottom: 8 },
    tipText: { color: '#78350F', fontSize: 13, marginBottom: 4 },
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
    questionChar: { fontSize: 96, color: colors.text },
    speakBtn: { marginTop: 8, alignSelf: 'center', padding: 8 },
    speakIcon: { fontSize: 22 },
    similarHint: { color: '#F97316', fontSize: 12, marginTop: 8 },
    choicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    choiceBtn: {
      width: '47%', backgroundColor: colors.card, borderRadius: 14, padding: 16,
      alignItems: 'center', borderWidth: 2, borderColor: colors.border,
    },
    choiceBtnCorrect: {
      width: '47%', backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16,
      alignItems: 'center', borderWidth: 2, borderColor: '#16A34A',
    },
    choiceBtnWrong: {
      width: '47%', backgroundColor: '#FEF2F2', borderRadius: 14, padding: 16,
      alignItems: 'center', borderWidth: 2, borderColor: '#DC2626',
    },
    choiceText: { fontSize: 20, fontWeight: '600', color: colors.text },
    choiceTextCorrect: { fontSize: 20, fontWeight: '600', color: '#16A34A' },
    choiceTextWrong: { fontSize: 20, fontWeight: '600', color: '#DC2626' },
    choicePair: { fontSize: 12, color: colors.subtext, marginTop: 4 },
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
    wrongChar: { fontSize: 36, color: colors.text, width: 48, textAlign: 'center' },
    wrongDetail: { flex: 1 },
    wrongCorrect: { fontSize: 14, color: '#16A34A', fontWeight: '600' },
    wrongChosen: { fontSize: 13, color: '#DC2626', marginTop: 2 },
    primaryBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    // Chart
    chartGrid: { gap: 4 },
    chartRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
    chartCell: {
      flex: 1, backgroundColor: colors.bg, borderRadius: 10, padding: 8,
      alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    },
    chartCellEmpty: { flex: 1 },
    chartCellWarn: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
    chartMain: { fontSize: 20, fontWeight: '600', color: colors.text },
    chartRomaji: { fontSize: 11, color: colors.primary, fontWeight: '500' },
    chartPair: { fontSize: 10, color: colors.subtext },
    warnNote: { fontSize: 12, color: '#F97316', marginTop: 12, textAlign: 'center' },
    confusableRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.card, borderRadius: 12, padding: 12,
      marginBottom: 8, borderWidth: 1, borderColor: '#FED7AA',
    },
    confusableChar: {
      width: 44, height: 44, backgroundColor: '#FFF7ED', borderRadius: 10,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FED7AA',
    },
    confusableCharText: { fontSize: 22, fontWeight: '600', color: '#111827' },
    confusableHint: { flex: 1, fontSize: 12, color: colors.subtext },
  })
}
