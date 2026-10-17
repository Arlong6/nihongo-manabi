// screens/LessonScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import * as Haptics from 'expo-haptics'
import { composeLesson, levelMasteryRatio, levelPool, MAX_REVIEW, type LessonItem } from '../lib/lesson'
import {
  loadProgress, loadGrammarStats, saveGrammarResult, updateSRSCard, markWordLearned,
  recordLessonResult, getUserLevel, setUserLevel, getLevelPromptDismissedUntil, setLevelPromptDismissedUntil,
  getTodayString, toLocalDateString, type StreakUpdateResult,
} from '../lib/storage'
import { createSRSCard, updateSRSCard as computeNextSRS, getDueCards } from '../lib/srs'
import {
  syncStreakRiskNotification, scheduleLapseReminders, hasAskedNotificationPermission,
  markAskedNotificationPermission, suggestReminderTime, scheduleDaily, getNotificationSettings,
} from '../lib/notifications'
import { speakJapanese } from '../lib/speech'
import { usePro } from '../lib/pro'
import { track } from '../lib/analytics'
import { getVocabularyById, getVocabularyByCategory } from '../data/vocabulary'
import { JLPT_LEVELS, type JlptLevel, type UserProgress } from '../types'
import { useTheme } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'

const LEVEL_UP_THRESHOLD = 0.8
const LEVEL_UP_SNOOZE_DAYS = 7

type Phase = 'loading' | 'quiz' | 'result'

interface Summary {
  correct: number
  total: number
  newWords: number
  reviewed: number
  streak: StreakUpdateResult
  streakDays: number
}

export default function LessonScreen() {
  const navigation = useNavigation<any>()
  const { t } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { pro } = usePro()

  const [phase, setPhase] = useState<Phase>('loading')
  const [items, setItems] = useState<LessonItem[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [level, setLevel] = useState<JlptLevel>('N5')
  const startedAt = useRef(Date.now())
  const finishing = useRef(false)
  const learnedIds = useRef<Set<string>>(new Set())
  const pendingWrite = useRef<Promise<void>>(Promise.resolve())
  const newIds = useRef<Set<string>>(new Set())
  const reviewedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    (async () => {
      const [progress, grammarStats, lvl] = await Promise.all([loadProgress(), loadGrammarStats(), getUserLevel()])
      setLevel(lvl)
      learnedIds.current = new Set(progress.learnedIds)
      const composed = composeLesson({ progress, level: lvl, grammarStats, today: getTodayString() })
      setItems(composed)
      setPhase('quiz')
      // 到期卡片數（本級別池內、上限 MAX_REVIEW）；不能用 role === 'review' 算，補題的已學單字也是 review
      const poolIds = new Set(levelPool(lvl).map(v => v.id))
      const dueCount = Math.min(getDueCards(progress.srsCards).filter(c => poolIds.has(c.id)).length, MAX_REVIEW)
      track('lesson_start', { level: lvl, due_count: dueCount })
      if (composed[0]?.question.kind === 'listening') speakJapanese(composed[0].question.audioText!)
    })()
  }, [])

  const current = items[index]

  const handleSelect = async (option: string) => {
    if (!current || selected) return
    setSelected(option)
    const correct = option === current.question.answer
    if (correct) setCorrectCount(c => c + 1)
    Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error)

    // 寫回學習狀態：單字類更新 SRS 與已學；文法寫統計。
    // 計數同步先記（不受 await 影響）；寫入串成一條 promise 鏈，避免讀改寫互相覆蓋，結束前會 await。
    const q = current.question
    const vocabId = current.vocabId
    let isNew = false
    if (q.kind !== 'grammar' && vocabId) {
      isNew = !learnedIds.current.has(vocabId)
      learnedIds.current.add(vocabId)
      ;(isNew ? newIds : reviewedIds).current.add(vocabId)
    }
    const job = async () => {
      if (q.kind === 'grammar') {
        await saveGrammarResult(q.id, correct)
      } else if (vocabId) {
        const progress = await loadProgress()
        const card = progress.srsCards.find(c => c.id === vocabId) ?? createSRSCard(vocabId, 'vocabulary')
        await updateSRSCard(computeNextSRS(card, correct ? 'good' : 'unknown'))
        if (isNew) {
          const v = getVocabularyById(vocabId)
          // 打卡只在課程結束的 recordLessonResult 做一次（spec 3.3）
          if (v) await markWordLearned(v.id, v.category, getVocabularyByCategory(v.category).length, { skipStreak: true })
        }
      }
    }
    pendingWrite.current = pendingWrite.current.then(job).catch(e => console.warn('lesson write failed', e))
  }

  const handleNext = async () => {
    if (index + 1 < items.length) {
      const nextIdx = index + 1
      setIndex(nextIdx)
      setSelected(null)
      const q = items[nextIdx].question
      if (q.kind === 'listening' && q.audioText) speakJapanese(q.audioText)
      return
    }
    if (finishing.current) return
    finishing.current = true
    await pendingWrite.current
    const durationS = Math.round((Date.now() - startedAt.current) / 1000)
    const streak = await recordLessonResult(
      { correct: correctCount, total: items.length, newWords: newIds.current.size, reviewed: reviewedIds.current.size, durationS },
      { isPro: pro },
    )
    track('lesson_complete', { level, correct: correctCount, total: items.length, duration_s: durationS })
    const progress = await loadProgress()
    setSummary({ correct: correctCount, total: items.length, newWords: newIds.current.size, reviewed: reviewedIds.current.size, streak, streakDays: progress.streak })
    setPhase('result')
    maybePromptLevelUp(progress)
    scheduleAfterLesson(progress).catch(() => { /* 通知是 best-effort */ })
  }

  // 課程完成後：重排連勝風險與 D+1/3/7 召回；首次完成才問要不要開每日提醒
  const scheduleAfterLesson = async (progressAfter: UserProgress) => {
    await syncStreakRiskNotification(progressAfter)
    await scheduleLapseReminders(progressAfter, new Date(), level)
    if (await hasAskedNotificationPermission()) return
    await markAskedNotificationPermission()
    // 已開啟提醒的用戶保留原本選的時間，不再詢問
    if ((await getNotificationSettings()).enabled) return
    const { hour, minute } = suggestReminderTime()
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    Alert.alert(t('notif.askTitle', { time }), t('notif.askMessage'), [
      { text: t('notif.askNo'), style: 'cancel', onPress: () => track('notif_permission', { granted: false }) },
      { text: t('notif.askYes'), onPress: () => scheduleDaily(hour, minute, {
        dueCount: getDueCards(progressAfter.srsCards).length,
        currentStreak: progressAfter.streak,
        longestStreak: progressAfter.longestStreak,
      }).then(async () => {
        track('notif_permission', { granted: (await getNotificationSettings()).enabled })
        // 授權在這之後才發生，前面排的召回可能被系統丟棄，授權後重排
        await syncStreakRiskNotification(progressAfter)
        await scheduleLapseReminders(progressAfter, new Date(), level)
      }).catch(() => {}) },
    ])
  }

  const maybePromptLevelUp = async (p: UserProgress) => {
    const idx = JLPT_LEVELS.indexOf(level)
    if (idx < 0 || idx === JLPT_LEVELS.length - 1) return
    const ratio = levelMasteryRatio(p, level)
    if (ratio < LEVEL_UP_THRESHOLD) return
    const until = await getLevelPromptDismissedUntil()
    if (until && until > getTodayString()) return
    const next = JLPT_LEVELS[idx + 1]
    Alert.alert(
      t('lesson.levelUpTitle', { level: next }),
      t('lesson.levelUpMessage', { pct: Math.round(ratio * 100), current: level, level: next }),
      [
        { text: t('lesson.levelUpLater'), style: 'cancel', onPress: async () => {
          track('level_up_prompt', { level: next, accepted: false })
          const d = new Date(); d.setDate(d.getDate() + LEVEL_UP_SNOOZE_DAYS)
          await setLevelPromptDismissedUntil(toLocalDateString(d))
        } },
        { text: t('lesson.levelUpAccept'), onPress: () => { track('level_up_prompt', { level: next, accepted: true }); setUserLevel(next) } },
      ],
    )
  }

  const confirmExit = () => {
    Alert.alert(t('lesson.exitTitle'), t('lesson.exitMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('lesson.exitConfirm'), style: 'destructive', onPress: () => navigation.goBack() },
    ])
  }

  if (phase === 'loading') return <SafeAreaView style={styles.container} />

  // 沒有題目可出（spec 6：至少 1 題才開始）→ 顯示完成狀態而不是崩潰
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <Text style={styles.resultEmoji}>🎉</Text>
          <Text style={styles.resultTitle}>{t('lesson.resultTitle')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>{t('lesson.backHome')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (phase === 'result' && summary) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <Text style={styles.resultEmoji}>🎉</Text>
          <Text style={styles.resultTitle}>{t('lesson.resultTitle')}</Text>
          <Text style={styles.resultBig}>{t('lesson.resultScore', { correct: summary.correct, total: summary.total })}</Text>
          <Text style={styles.resultLine}>{t('lesson.resultNew', { count: summary.newWords })}</Text>
          <Text style={styles.resultLine}>{t('lesson.resultReviewed', { count: summary.reviewed })}</Text>
          <Text style={styles.resultLine}>🔥 {t('lesson.resultStreak', { count: summary.streakDays })}</Text>
          {summary.streak.freezeUsed && <Text style={styles.resultNote}>🧊 {t('lesson.resultFreezeUsed')}</Text>}
          {summary.streak.freezeEarned && <Text style={styles.resultNote}>🧊 {t('lesson.resultFreezeEarned')}</Text>}
          {summary.streak.newBadges.map(b => (
            <Text key={b} style={styles.resultNote}>🏅 {t('lesson.resultBadge', { count: b })}</Text>
          ))}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>{t('lesson.backHome')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (!current) return <SafeAreaView style={styles.container} />
  const q = current.question
  const roleLabel = {
    review: t('lesson.roleReview'), new: t('lesson.roleNew'), grammar: t('lesson.roleGrammar'), extra: t('lesson.roleExtra'),
  }[current.role]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={confirmExit}><Text style={styles.back}>{t('common.back')}</Text></TouchableOpacity>
        <Text style={styles.progressText}>{t('common.progressFraction', { current: index + 1, total: items.length })}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(index / items.length) * 100}%` as any }]} />
      </View>

      <View style={styles.card}>
        <Text style={styles.roleChip}>{roleLabel}</Text>
        {q.kind === 'listening' ? (
          <>
            <Text style={styles.prompt}>{t('lesson.listenPrompt')}</Text>
            <TouchableOpacity style={styles.replayBtn} onPress={() => q.audioText && speakJapanese(q.audioText)}>
              <Text style={styles.replayText}>🔊 {t('lesson.replay')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.prompt}>{q.prompt}</Text>
        )}
      </View>

      <View style={styles.options}>
        {q.options.map(opt => {
          const isAnswer = opt === q.answer
          const isSelected = opt === selected
          const bg = !selected ? colors.card : isAnswer ? '#DCFCE7' : isSelected ? '#FEE2E2' : colors.card
          return (
            <TouchableOpacity key={opt} style={[styles.option, { backgroundColor: bg }]} onPress={() => handleSelect(opt)} disabled={!!selected}>
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {selected && (
        <View style={styles.feedback}>
          {q.explanation ? <Text style={styles.explanation}>{q.explanation}</Text> : null}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>{index + 1 < items.length ? t('lesson.next') : t('lesson.finish')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    back: { fontSize: 15, color: colors.primary },
    progressText: { fontSize: 13, color: colors.subtext },
    progressBar: { height: 6, backgroundColor: colors.border, marginHorizontal: 20, borderRadius: 3 },
    progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
    card: { margin: 20, padding: 24, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center' },
    roleChip: { fontSize: 12, color: colors.subtext, marginBottom: 12, letterSpacing: 1 },
    prompt: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center' },
    replayBtn: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.bg },
    replayText: { fontSize: 15, color: colors.primary },
    options: { paddingHorizontal: 20, gap: 10 },
    option: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    optionText: { fontSize: 17, color: colors.text, textAlign: 'center' },
    feedback: { padding: 20, gap: 12 },
    explanation: { fontSize: 14, color: colors.subtext, lineHeight: 20 },
    primaryBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    resultContent: { padding: 24, alignItems: 'center', gap: 8 },
    resultEmoji: { fontSize: 56, marginTop: 24 },
    resultTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
    resultBig: { fontSize: 32, fontWeight: '800', color: colors.primary, marginVertical: 8 },
    resultLine: { fontSize: 16, color: colors.text },
    resultNote: { fontSize: 14, color: colors.subtext, marginTop: 4 },
  })
}
