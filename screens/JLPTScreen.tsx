import React, { useState, useEffect, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Alert
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import i18n from '../lib/i18n'
import { allVocabulary } from '../data/vocabulary'
import { grammarQuestions, GrammarQuestion } from '../data/grammar'
import { saveExamRecord, loadExamHistory, clearExamHistory } from '../lib/storage'
import type { Vocabulary, ExamRecord, ExamWrongItem } from '../types'
import { useTheme } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'

// ── 型別 ────────────────────────────────────────────────────────────────────
type ExamLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
type Mode = 'menu' | 'exam' | 'result'
type VocabQType = 'meaning' | 'reading' | 'reverse'

interface ExamQuestion {
  id: string
  type: 'vocab' | 'grammar'
  vocabQType?: VocabQType
  prompt: string
  subPrompt?: string
  options: string[]
  answer: string
  explanation: string
  point: string
}

// ── 考試設定 ─────────────────────────────────────────────────────────────────
const EXAM_CONFIG: Record<ExamLevel, { vocabCount: number; grammarCount: number; desc: string }> = {
  N5: { vocabCount: 8,  grammarCount: 7,  desc: '基礎語彙 + 助詞・動詞變化' },
  N4: { vocabCount: 10, grammarCount: 8,  desc: '日常語彙 + N4 文法句型' },
  N3: { vocabCount: 12, grammarCount: 8,  desc: 'N3 語彙 + 條件・推測文法' },
  N2: { vocabCount: 14, grammarCount: 9,  desc: 'N2 語彙 + 複合文法構造' },
  N1: { vocabCount: 16, grammarCount: 10, desc: 'N1 語彙 + 高度文法・敬語' },
}

// ── 工具 ─────────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function hasKanji(str: string): boolean {
  return /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(str)
}

function getVocabPool(level: ExamLevel): Vocabulary[] {
  if (level === 'N5') return allVocabulary.filter(v => v.level === 'N5' || v.level === 'daily')
  if (level === 'N4') return allVocabulary.filter(v => v.level === 'N4')
  if (level === 'N3') return allVocabulary.filter(v => v.level === 'N3')
  if (level === 'N2') return allVocabulary.filter(v => v.level === 'N2')
  return allVocabulary.filter(v => v.level === 'N1')
}

// ── 題目生成：三種題型 ────────────────────────────────────────────────────────
function makeMeaningQ(word: Vocabulary, pool: Vocabulary[]): ExamQuestion {
  const distractors = shuffle(pool.filter(v => v.id !== word.id)).slice(0, 3)
  const options = shuffle([word.chinese, ...distractors.map(v => v.chinese)])
  const showReading = word.japanese !== word.reading
  return {
    id: `meaning-${word.id}`,
    type: 'vocab', vocabQType: 'meaning',
    prompt: word.japanese,
    subPrompt: showReading ? `（${word.reading}）` : undefined,
    options,
    answer: word.chinese,
    explanation: `${word.japanese}（${word.reading}）= ${word.chinese}\n${word.english}${word.example ? `\n例：${word.example}` : ''}`,
    point: i18n.t('jlpt.qTypeMeaning'),
  }
}

function makeReadingQ(word: Vocabulary, pool: Vocabulary[]): ExamQuestion {
  const kanjiPool = pool.filter(v => v.id !== word.id && v.reading !== v.japanese)
  const distractors = shuffle(kanjiPool).slice(0, 3)
  const options = shuffle([word.reading, ...distractors.map(v => v.reading)])
  return {
    id: `reading-${word.id}`,
    type: 'vocab', vocabQType: 'reading',
    prompt: word.japanese,
    subPrompt: i18n.t('jlpt.readingPrompt'),
    options,
    answer: word.reading,
    explanation: `${word.japanese} 的讀音是「${word.reading}」\n意思：${word.chinese}（${word.english}）`,
    point: i18n.t('jlpt.qTypeReading'),
  }
}

function makeReverseQ(word: Vocabulary, pool: Vocabulary[]): ExamQuestion {
  const distractors = shuffle(pool.filter(v => v.id !== word.id)).slice(0, 3)
  const options = shuffle([word.japanese, ...distractors.map(v => v.japanese)])
  return {
    id: `reverse-${word.id}`,
    type: 'vocab', vocabQType: 'reverse',
    prompt: word.chinese,
    subPrompt: i18n.t('jlpt.examHintReverse'),
    options,
    answer: word.japanese,
    explanation: `「${word.chinese}」的日文是「${word.japanese}」（${word.reading}）\n${word.english}`,
    point: i18n.t('jlpt.qTypeReverse'),
  }
}

function makeGrammarQ(q: GrammarQuestion): ExamQuestion {
  return {
    id: q.id,
    type: 'grammar',
    prompt: q.sentence,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
    point: q.point,
  }
}

function buildExam(level: ExamLevel): ExamQuestion[] {
  const { vocabCount, grammarCount } = EXAM_CONFIG[level]
  const pool = getVocabPool(level)
  const kanjiPool = pool.filter(v => hasKanji(v.japanese) && v.japanese !== v.reading)

  const reverseCount = Math.floor(vocabCount / 3)
  const readingCount = Math.min(Math.floor(vocabCount / 3), kanjiPool.length)
  const meaningCount = vocabCount - reverseCount - readingCount

  const shuffledPool = shuffle(pool)
  const shuffledKanji = shuffle(kanjiPool)

  const meaningWords = shuffledPool.slice(0, meaningCount)
  const readingWords = shuffledKanji.slice(0, readingCount)
  const usedIds = new Set([...meaningWords, ...readingWords].map(v => v.id))
  const reverseWords = shuffle(pool.filter(v => !usedIds.has(v.id))).slice(0, reverseCount)

  const vocabQs: ExamQuestion[] = [
    ...meaningWords.map(w => makeMeaningQ(w, pool)),
    ...readingWords.map(w => makeReadingQ(w, pool)),
    ...reverseWords.map(w => makeReverseQ(w, pool)),
  ]

  const grammarPool = grammarQuestions.filter(q => q.level === level)
  const grammarQs = shuffle(grammarPool).slice(0, grammarCount).map(makeGrammarQ)

  return shuffle([...vocabQs, ...grammarQs])
}

// ── 歷史紀錄：錯題卡片 ────────────────────────────────────────────────────────
function WrongItemCard({ item }: { item: ExamWrongItem }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const s = useMemo(() => createStyles(colors), [colors])
  const [open, setOpen] = useState(false)
  return (
    <TouchableOpacity
      style={s.wrongCard}
      onPress={() => setOpen(o => !o)}
      activeOpacity={0.8}
    >
      <View style={s.wrongHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.wrongPrompt} numberOfLines={open ? undefined : 1}>{item.prompt}</Text>
          {item.subPrompt && <Text style={s.wrongSub}>{item.subPrompt}</Text>}
        </View>
        <Text style={s.expandIcon}>{open ? '▲' : '▼'}</Text>
      </View>
      <View style={s.answerRow}>
        <View style={s.wrongBox}>
          <Text style={s.answerLabel}>{t('jlpt.yourAnswer')}</Text>
          <Text style={s.wrongText}>{item.yourAnswer || t('jlpt.noAnswer')}</Text>
        </View>
        <View style={s.correctBox}>
          <Text style={s.answerLabel}>{t('jlpt.correctAnswer')}</Text>
          <Text style={s.correctText}>{item.correctAnswer}</Text>
        </View>
      </View>
      {open && (
        <View style={s.explainBox}>
          <Text style={s.explainPoint}>{item.point}</Text>
          <Text style={s.explainText}>{item.explanation}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

// ── 歷史紀錄：單筆結果 ────────────────────────────────────────────────────────
function HistoryCard({ record }: { record: ExamRecord }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const s = useMemo(() => createStyles(colors), [colors])
  const [open, setOpen] = useState(false)
  const pct = Math.round((record.score / record.total) * 100)
  const passed = pct >= 60
  const date = new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <View style={s.historyCard}>
      <TouchableOpacity style={s.historyHeader} onPress={() => setOpen(o => !o)}>
        <View style={[s.levelDot, { backgroundColor: ({ N5: '#16A34A', N4: '#2563EB', N3: '#7C3AED', N2: '#DC2626', N1: '#9333EA' } as Record<string, string>)[record.level] }]} />
        <Text style={s.historyLevel}>{record.level}</Text>
        <Text style={s.historyDate}>{date}</Text>
        <View style={[s.historyScore, { backgroundColor: passed ? '#F0FDF4' : '#FEF2F2' }]}>
          <Text style={[s.historyScoreText, { color: passed ? '#16A34A' : '#DC2626' }]}>
            {record.score}/{record.total}　{pct}%
          </Text>
        </View>
        <Text style={s.expandIcon}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={s.historyDetail}>
          <View style={s.historyBreakdown}>
            <Text style={s.historyBreakdownText}>
              {t('jlpt.historyBreakdown', { vocabScore: record.vocabScore, vocabTotal: record.vocabTotal, grammarScore: record.grammarScore, grammarTotal: record.grammarTotal })}
            </Text>
          </View>
          {record.wrongItems.length === 0 ? (
            <Text style={s.allCorrectText}>{t('jlpt.allCorrect')}</Text>
          ) : (
            <>
              <Text style={s.wrongTitle}>{t('jlpt.wrongTitle', { count: record.wrongItems.length })}</Text>
              {record.wrongItems.map((item, i) => (
                <WrongItemCard key={i} item={item} />
              ))}
            </>
          )}
        </View>
      )}
    </View>
  )
}

// ── 結果畫面 ─────────────────────────────────────────────────────────────────
function ResultScreen({
  questions, answers, level, onRetry, onBack,
}: {
  questions: ExamQuestion[]
  answers: Record<string, string>
  level: ExamLevel
  onRetry: () => void
  onBack: () => void
}) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const s = useMemo(() => createStyles(colors), [colors])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const vocabQs = questions.filter(q => q.type === 'vocab')
  const grammarQs = questions.filter(q => q.type === 'grammar')
  const vocabCorrect = vocabQs.filter(q => answers[q.id] === q.answer).length
  const grammarCorrect = grammarQs.filter(q => answers[q.id] === q.answer).length
  const total = questions.length
  const correct = vocabCorrect + grammarCorrect
  const pct = Math.round((correct / total) * 100)
  const passed = pct >= 60
  const wrongQs = questions.filter(q => answers[q.id] !== q.answer)

  const meaningQs = vocabQs.filter(q => q.vocabQType === 'meaning')
  const readingQs = vocabQs.filter(q => q.vocabQType === 'reading')
  const reverseQs = vocabQs.filter(q => q.vocabQType === 'reverse')
  const meaningCorrect = meaningQs.filter(q => answers[q.id] === q.answer).length
  const readingCorrect = readingQs.filter(q => answers[q.id] === q.answer).length
  const reverseCorrect = reverseQs.filter(q => answers[q.id] === q.answer).length

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View style={s.resultHeader}>
        <Text style={{ fontSize: 64 }}>{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</Text>
        <Text style={s.resultTitle}>{t('jlpt.resultTitle', { level })}</Text>
        <View style={[s.scoreBadge, { backgroundColor: passed ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[s.scoreText, { color: passed ? '#16A34A' : '#DC2626' }]}>
            {correct} / {total}
          </Text>
          <Text style={[s.pctText, { color: passed ? '#16A34A' : '#DC2626' }]}>
            {pct}%　{passed ? t('jlpt.passed') : t('jlpt.failed')}
          </Text>
        </View>
      </View>

      <View style={s.breakdown}>
        <View style={s.breakdownItem}>
          <Text style={s.breakdownLabel}>{t('jlpt.breakdownVocab')}</Text>
          <Text style={s.breakdownScore}>{vocabCorrect}/{vocabQs.length}</Text>
          <Text style={s.breakdownSub}>
            {t('jlpt.breakdownMeaning', { correct: meaningCorrect, total: meaningQs.length })}
            {readingQs.length > 0 ? `  ${t('jlpt.breakdownReading', { correct: readingCorrect, total: readingQs.length })}` : ''}
            {reverseQs.length > 0 ? `  ${t('jlpt.breakdownJapanese', { correct: reverseCorrect, total: reverseQs.length })}` : ''}
          </Text>
        </View>
        <View style={s.breakdownDivider} />
        <View style={s.breakdownItem}>
          <Text style={s.breakdownLabel}>{t('jlpt.breakdownGrammar')}</Text>
          <Text style={s.breakdownScore}>{grammarCorrect}/{grammarQs.length}</Text>
        </View>
      </View>

      {wrongQs.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('jlpt.wrongSection', { count: wrongQs.length })}</Text>
          {wrongQs.map(q => (
            <TouchableOpacity
              key={q.id}
              style={s.wrongCard}
              onPress={() => setExpandedId(expandedId === q.id ? null : q.id)}
              activeOpacity={0.8}
            >
              <View style={s.wrongHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.wrongPrompt} numberOfLines={expandedId === q.id ? undefined : 1}>
                    {q.prompt}
                  </Text>
                  {q.subPrompt && <Text style={s.wrongSub}>{q.subPrompt}</Text>}
                </View>
                <Text style={s.expandIcon}>{expandedId === q.id ? '▲' : '▼'}</Text>
              </View>
              <View style={s.answerRow}>
                <View style={s.wrongBox}>
                  <Text style={s.answerLabel}>{t('jlpt.yourAnswer')}</Text>
                  <Text style={s.wrongText}>{answers[q.id] || t('jlpt.noAnswer')}</Text>
                </View>
                <View style={s.correctBox}>
                  <Text style={s.answerLabel}>{t('jlpt.correctAnswer')}</Text>
                  <Text style={s.correctText}>{q.answer}</Text>
                </View>
              </View>
              {expandedId === q.id && (
                <View style={s.explainBox}>
                  <Text style={s.explainPoint}>{q.point}</Text>
                  <Text style={s.explainText}>{q.explanation}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {wrongQs.length === 0 && (
        <View style={[s.section, { alignItems: 'center', paddingVertical: 24 }]}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🌟</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{t('jlpt.allCorrectFull')}</Text>
        </View>
      )}

      <TouchableOpacity style={s.retryBtn} onPress={onRetry}>
        <Text style={s.retryBtnText}>{t('jlpt.retryBtn')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.backBtn2} onPress={onBack}>
        <Text style={s.backBtn2Text}>{t('jlpt.backToMenu')}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ── 考試畫面 ─────────────────────────────────────────────────────────────────
function ExamScreen({
  questions, level, onFinish,
}: {
  questions: ExamQuestion[]
  level: ExamLevel
  onFinish: (answers: Record<string, string>) => void
}) {
  const { colors } = useTheme()
  const s = useMemo(() => createStyles(colors), [colors])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)

  const current = questions[index]
  const isLast = index === questions.length - 1
  const isGrammar = current.type === 'grammar'
  const parts = isGrammar ? current.prompt.split('___') : []

  const handleNext = () => {
    const newAnswers = { ...answers, [current.id]: selected ?? '' }
    if (isLast) {
      onFinish(newAnswers)
    } else {
      setAnswers(newAnswers)
      setIndex(i => i + 1)
      setSelected(null)
    }
  }

  const qTypeLabel: Record<VocabQType, string> = {
    meaning: '語彙・意味',
    reading: '語彙・讀音',
    reverse: '語彙・日文',
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <View style={s.progressRow}>
        <Text style={s.progressText}>{index + 1} / {questions.length}</Text>
        <View style={[s.typeBadge, { backgroundColor: current.type === 'vocab' ? '#EEF2FF' : '#F0FDF4' }]}>
          <Text style={[s.typeBadgeText, { color: current.type === 'vocab' ? colors.primary : '#16A34A' }]}>
            {current.type === 'vocab' ? qTypeLabel[current.vocabQType!] : '文法'}
          </Text>
        </View>
        <Text style={s.levelBadgeText}>{level}</Text>
      </View>
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${(index / questions.length) * 100}%` as any }]} />
      </View>

      <View style={s.questionCard}>
        {isGrammar ? (
          <>
            <Text style={s.questionHint}>選出正確的答案</Text>
            <View style={s.sentenceRow}>
              <Text style={s.sentenceText}>{parts[0]}</Text>
              <View style={[s.blankBox, selected && s.blankFilled]}>
                <Text style={[s.blankText, selected && s.blankFilledText]}>
                  {selected ?? '　＿＿　'}
                </Text>
              </View>
              <Text style={s.sentenceText}>{parts[1] ?? ''}</Text>
            </View>
          </>
        ) : current.vocabQType === 'reverse' ? (
          <>
            <Text style={s.questionHint}>{current.subPrompt}</Text>
            <Text style={s.vocabWord}>{current.prompt}</Text>
          </>
        ) : (
          <>
            <Text style={s.vocabWord}>{current.prompt}</Text>
            {current.subPrompt && (
              <Text style={s.vocabReading}>{current.subPrompt}</Text>
            )}
          </>
        )}
      </View>

      <View style={s.optionsGrid}>
        {current.options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[s.optBtn, selected === opt && s.optBtnSelected]}
            onPress={() => !selected && setSelected(opt)}
            disabled={!!selected}
          >
            <Text style={[s.optText, selected === opt && s.optTextSelected]} numberOfLines={2}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selected && (
        <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
          <Text style={s.nextBtnText}>{isLast ? '查看結果' : '下一題 →'}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── 主 Screen ────────────────────────────────────────────────────────────────
export default function JLPTScreen() {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const s = useMemo(() => createStyles(colors), [colors])
  const [mode, setMode] = useState<Mode>('menu')
  const [level, setLevel] = useState<ExamLevel>('N5')
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [history, setHistory] = useState<ExamRecord[]>([])

  useEffect(() => {
    loadExamHistory().then(setHistory)
  }, [])

  const startExam = (l: ExamLevel) => {
    setLevel(l)
    setQuestions(buildExam(l))
    setAnswers({})
    setMode('exam')
  }

  const handleFinish = async (ans: Record<string, string>) => {
    setAnswers(ans)
    setMode('result')

    const vocabQs = questions.filter(q => q.type === 'vocab')
    const grammarQs = questions.filter(q => q.type === 'grammar')
    const vocabScore = vocabQs.filter(q => ans[q.id] === q.answer).length
    const grammarScore = grammarQs.filter(q => ans[q.id] === q.answer).length

    const wrongItems: ExamWrongItem[] = questions
      .filter(q => ans[q.id] !== q.answer)
      .map(q => ({
        type: q.type,
        prompt: q.prompt,
        subPrompt: q.subPrompt,
        yourAnswer: ans[q.id] || '',
        correctAnswer: q.answer,
        explanation: q.explanation,
        point: q.point,
      }))

    const record: ExamRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      level,
      score: vocabScore + grammarScore,
      total: questions.length,
      vocabScore,
      vocabTotal: vocabQs.length,
      grammarScore,
      grammarTotal: grammarQs.length,
      wrongItems,
    }

    await saveExamRecord(record)
    setHistory(h => [record, ...h])
  }

  const handleClearHistory = () => {
    Alert.alert('清除紀錄', '確定要刪除所有考試紀錄嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除', style: 'destructive',
        onPress: async () => {
          await clearExamHistory()
          setHistory([])
        },
      },
    ])
  }

  const levelCards: { level: ExamLevel; emoji: string; color: string; bg: string; border: string }[] = [
    { level: 'N5', emoji: '🌱', color: '#16A34A', bg: '#F0FDF4', border: '#86EFAC' },
    { level: 'N4', emoji: '📖', color: '#2563EB', bg: '#EFF6FF', border: '#93C5FD' },
    { level: 'N3', emoji: '🎯', color: '#7C3AED', bg: '#F5F3FF', border: '#C4B5FD' },
    { level: 'N2', emoji: '⚡', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    { level: 'N1', emoji: '🏆', color: '#9333EA', bg: '#FAF5FF', border: '#E9D5FF' },
  ]

  if (mode === 'exam') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <TouchableOpacity style={s.backBtn} onPress={() => setMode('menu')}>
          <Text style={s.backText}>← 返回</Text>
        </TouchableOpacity>
        <ExamScreen questions={questions} level={level} onFinish={handleFinish} />
      </SafeAreaView>
    )
  }

  if (mode === 'result') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ResultScreen
          questions={questions}
          answers={answers}
          level={level}
          onRetry={() => startExam(level)}
          onBack={() => setMode('menu')}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← 返回</Text>
        </TouchableOpacity>

        <Text style={s.pageTitle}>JLPT 模擬考</Text>
        <Text style={s.pageSub}>語彙（意味・讀音・反向）＋ 文法混合出題</Text>

        {levelCards.map(({ level: l, emoji, color, bg, border }) => {
          const cfg = EXAM_CONFIG[l]
          const total = cfg.vocabCount + cfg.grammarCount
          const best = history.filter(r => r.level === l)
            .reduce<number | null>((max, r) => {
              const pct = Math.round((r.score / r.total) * 100)
              return max === null ? pct : Math.max(max, pct)
            }, null)
          return (
            <TouchableOpacity
              key={l}
              style={[s.levelCard, { backgroundColor: bg, borderColor: border }]}
              onPress={() => startExam(l)}
            >
              <View style={[s.levelEmojiBg, { backgroundColor: color + '20' }]}>
                <Text style={{ fontSize: 30 }}>{emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.levelTitleRow}>
                  <Text style={[s.levelTitle, { color }]}>{l}</Text>
                  <View style={[s.questionCount, { backgroundColor: color + '20' }]}>
                    <Text style={[s.questionCountText, { color }]}>{total} 題</Text>
                  </View>
                  {best !== null && (
                    <Text style={[s.bestScore, { color }]}>最高 {best}%</Text>
                  )}
                </View>
                <Text style={s.levelDesc}>{cfg.desc}</Text>
                <View style={s.questionBreakdown}>
                  <Text style={s.breakdownChip}>語彙 {cfg.vocabCount}（意味・讀音・日文）</Text>
                  <Text style={s.breakdownChip}>文法 {cfg.grammarCount}</Text>
                </View>
              </View>
              <Text style={[s.arrow, { color }]}>→</Text>
            </TouchableOpacity>
          )
        })}

        <View style={s.infoBox}>
          <Text style={s.infoTitle}>📝 出題方式</Text>
          <Text style={s.infoText}>・<Text style={{ fontWeight: '700' }}>意味</Text>：看日文 → 選中文</Text>
          <Text style={s.infoText}>・<Text style={{ fontWeight: '700' }}>讀音</Text>：看漢字 → 選平假名讀法</Text>
          <Text style={s.infoText}>・<Text style={{ fontWeight: '700' }}>日文</Text>：看中文 → 選日文單字</Text>
          <Text style={s.infoText}>・<Text style={{ fontWeight: '700' }}>文法</Text>：填入正確助詞或句型</Text>
          <Text style={[s.infoText, { marginTop: 4, color: colors.subtext }]}>每次出題隨機，60% 以上視為通過</Text>
        </View>

        {history.length > 0 && (
          <View style={s.historySection}>
            <View style={s.historySectionHeader}>
              <Text style={s.sectionTitle}>📋 考試紀錄</Text>
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={s.clearText}>清除</Text>
              </TouchableOpacity>
            </View>
            {history.slice(0, 10).map(record => (
              <HistoryCard key={record.id} record={record} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backBtn: { paddingVertical: 8, paddingHorizontal: 4, marginBottom: 8 },
    backText: { color: colors.subtext, fontSize: 15 },
    pageTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    pageSub: { fontSize: 13, color: colors.subtext, marginBottom: 20 },

    levelCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderRadius: 18, padding: 16, marginBottom: 12,
      borderWidth: 1.5,
      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    levelEmojiBg: { width: 54, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    levelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    levelTitle: { fontSize: 20, fontWeight: 'bold' },
    questionCount: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
    questionCountText: { fontSize: 12, fontWeight: '700' },
    bestScore: { fontSize: 11, fontWeight: '600', opacity: 0.7 },
    levelDesc: { fontSize: 12, color: colors.subtext, marginBottom: 6 },
    questionBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    breakdownChip: { fontSize: 10, color: colors.subtext, backgroundColor: colors.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    arrow: { fontSize: 18, fontWeight: '600' },

    infoBox: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    infoTitle: { fontWeight: '700', color: colors.text, marginBottom: 10, fontSize: 14 },
    infoText: { color: colors.subtext, fontSize: 13, marginBottom: 5 },

    // Exam
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    progressText: { color: colors.subtext, fontSize: 13 },
    typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
    typeBadgeText: { fontSize: 11, fontWeight: '700' },
    levelBadgeText: { fontSize: 13, fontWeight: '700', color: colors.subtext },
    progressBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: 20 },
    progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },

    questionCard: {
      backgroundColor: colors.card, borderRadius: 20, padding: 24, marginBottom: 20,
      shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
      minHeight: 120, justifyContent: 'center', alignItems: 'center',
    },
    questionHint: { fontSize: 13, color: colors.subtext, marginBottom: 12, textAlign: 'center' },
    vocabWord: { fontSize: 34, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
    vocabReading: { fontSize: 15, color: colors.subtext, marginTop: 6, textAlign: 'center' },

    sentenceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, justifyContent: 'center' },
    sentenceText: { fontSize: 19, color: colors.text, fontWeight: '500' },
    blankBox: { borderBottomWidth: 2, borderBottomColor: colors.subtext, minWidth: 64, paddingHorizontal: 6, paddingBottom: 2 },
    blankFilled: { borderBottomColor: colors.primary },
    blankText: { fontSize: 19, color: colors.subtext, textAlign: 'center', fontWeight: '700' },
    blankFilledText: { color: colors.primary },

    optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    optBtn: {
      width: '47%', backgroundColor: colors.card, borderRadius: 14, padding: 14,
      alignItems: 'center', borderWidth: 2, borderColor: colors.border, minHeight: 56, justifyContent: 'center',
    },
    optBtnSelected: { backgroundColor: '#EEF2FF', borderColor: colors.primary },
    optText: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
    optTextSelected: { color: colors.primary },

    nextBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Result
    resultHeader: { alignItems: 'center', marginBottom: 20 },
    resultTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 8, marginBottom: 14 },
    scoreBadge: { borderRadius: 20, paddingHorizontal: 32, paddingVertical: 16, alignItems: 'center', width: '80%' },
    scoreText: { fontSize: 42, fontWeight: 'bold' },
    pctText: { fontSize: 16, fontWeight: '600', marginTop: 4 },

    breakdown: {
      flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16,
      padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    },
    breakdownItem: { flex: 1, alignItems: 'center' },
    breakdownLabel: { fontSize: 13, color: colors.subtext, marginBottom: 4 },
    breakdownScore: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    breakdownSub: { fontSize: 10, color: colors.subtext, marginTop: 4, textAlign: 'center' },
    breakdownDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },

    section: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text },

    wrongCard: {
      backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 10,
      borderWidth: 1, borderColor: '#FECACA',
    },
    wrongHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    wrongPrompt: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
    wrongSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    expandIcon: { color: colors.subtext, fontSize: 12, marginLeft: 8, marginTop: 2 },
    answerRow: { flexDirection: 'row', gap: 10 },
    wrongBox: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#FECACA' },
    correctBox: { flex: 1, backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#BBF7D0' },
    answerLabel: { fontSize: 10, color: '#9CA3AF', marginBottom: 4 },
    wrongText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
    correctText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
    explainBox: { marginTop: 10, backgroundColor: colors.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: colors.border },
    explainPoint: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 6 },
    explainText: { fontSize: 13, color: colors.text, lineHeight: 20 },

    retryBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
    retryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backBtn2: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 20 },
    backBtn2Text: { color: colors.subtext, fontSize: 15 },

    // History
    historySection: { marginTop: 4 },
    historySectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    clearText: { fontSize: 13, color: colors.subtext },
    historyCard: {
      backgroundColor: colors.card, borderRadius: 14, marginBottom: 10,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    historyHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14,
    },
    levelDot: { width: 8, height: 8, borderRadius: 4 },
    historyLevel: { fontSize: 14, fontWeight: '700', color: colors.text, width: 28 },
    historyDate: { flex: 1, fontSize: 12, color: colors.subtext },
    historyScore: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    historyScoreText: { fontSize: 12, fontWeight: '700' },
    historyDetail: { borderTopWidth: 1, borderTopColor: colors.border, padding: 14 },
    historyBreakdown: { marginBottom: 10 },
    historyBreakdownText: { fontSize: 12, color: colors.subtext },
    wrongTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
    allCorrectText: { fontSize: 14, color: '#16A34A', fontWeight: '600', textAlign: 'center', paddingVertical: 8 },
  })
}
