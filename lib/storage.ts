import AsyncStorage from '@react-native-async-storage/async-storage'
import type { UserProgress, DailyProgress, SRSCard, ExamRecord } from '../types'
import { STREAK_BADGES } from '../types'
import { armReviewPrompt } from './review'

const EXAM_HISTORY_KEY = 'jlpt_exam_history'
const GRAMMAR_PROGRESS_KEY = 'grammar_progress'
const LOCALE_KEY = 'app_locale'
const FAVORITES_KEY = 'vocab_favorites'
const AI_CHAT_USAGE_KEY = 'ai_chat_usage'
const AI_EXPLAIN_CACHE_KEY = 'ai_explain_cache'
const AI_EXPLAIN_CACHE_MAX = 200

export const AI_CHAT_DAILY_LIMIT = 3

interface AIChatUsage {
  date: string
  count: number
}

export async function getAIChatUsage(): Promise<AIChatUsage> {
  const today = getTodayString()
  try {
    const stored = await AsyncStorage.getItem(AI_CHAT_USAGE_KEY)
    if (!stored) return { date: today, count: 0 }
    const parsed = JSON.parse(stored) as AIChatUsage
    if (parsed.date !== today) return { date: today, count: 0 }
    return parsed
  } catch {
    return { date: today, count: 0 }
  }
}

export async function incrementAIChatUsage(): Promise<AIChatUsage> {
  const current = await getAIChatUsage()
  const next: AIChatUsage = { date: current.date, count: current.count + 1 }
  try {
    await AsyncStorage.setItem(AI_CHAT_USAGE_KEY, JSON.stringify(next))
  } catch {
    console.error('Failed to save AI chat usage')
  }
  return next
}

// ── 拍照翻譯每日用量（免費版限制；Pro 無限）────────────────────────────────────
const CAMERA_USAGE_KEY = 'camera_usage'

export const CAMERA_DAILY_LIMIT = 3

interface CameraUsage {
  date: string
  count: number
}

export async function getCameraUsage(): Promise<CameraUsage> {
  const today = getTodayString()
  try {
    const stored = await AsyncStorage.getItem(CAMERA_USAGE_KEY)
    if (!stored) return { date: today, count: 0 }
    const parsed = JSON.parse(stored) as CameraUsage
    if (parsed.date !== today) return { date: today, count: 0 }
    return parsed
  } catch {
    return { date: today, count: 0 }
  }
}

export async function incrementCameraUsage(): Promise<CameraUsage> {
  const current = await getCameraUsage()
  const next: CameraUsage = { date: current.date, count: current.count + 1 }
  try {
    await AsyncStorage.setItem(CAMERA_USAGE_KEY, JSON.stringify(next))
  } catch {
    console.error('Failed to save camera usage')
  }
  return next
}

export async function getAIExplainCached(key: string): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(AI_EXPLAIN_CACHE_KEY)
    if (!stored) return null
    const cache = JSON.parse(stored) as Record<string, string>
    return cache[key] ?? null
  } catch {
    return null
  }
}

export async function setAIExplainCached(key: string, value: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(AI_EXPLAIN_CACHE_KEY)
    const cache: Record<string, string> = stored ? JSON.parse(stored) : {}
    cache[key] = value
    const keys = Object.keys(cache)
    if (keys.length > AI_EXPLAIN_CACHE_MAX) {
      // FIFO eviction: drop oldest entries
      const trimmed: Record<string, string> = {}
      keys.slice(-AI_EXPLAIN_CACHE_MAX).forEach(k => { trimmed[k] = cache[k] })
      await AsyncStorage.setItem(AI_EXPLAIN_CACHE_KEY, JSON.stringify(trimmed))
    } else {
      await AsyncStorage.setItem(AI_EXPLAIN_CACHE_KEY, JSON.stringify(cache))
    }
  } catch (e) {
    console.error('Failed to cache AI explain', e)
  }
}

export async function loadFavorites(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(FAVORITES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export async function saveFavorites(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
  } catch {
    console.error('Failed to save favorites')
  }
}

export async function getLocale(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LOCALE_KEY)
  } catch {
    return null
  }
}

export async function setLocale(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCALE_KEY, code)
  } catch {
    console.error('Failed to save locale')
  }
}

export type GrammarStats = Record<string, { correct: number; total: number }>

export async function saveGrammarResult(id: string, isCorrect: boolean): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(GRAMMAR_PROGRESS_KEY)
    const stats: GrammarStats = stored ? JSON.parse(stored) : {}
    if (!stats[id]) stats[id] = { correct: 0, total: 0 }
    stats[id].total += 1
    if (isCorrect) stats[id].correct += 1
    await AsyncStorage.setItem(GRAMMAR_PROGRESS_KEY, JSON.stringify(stats))
  } catch {
    console.error('Failed to save grammar result')
  }
}

export async function loadGrammarStats(): Promise<GrammarStats> {
  try {
    const stored = await AsyncStorage.getItem(GRAMMAR_PROGRESS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export async function saveExamRecord(record: ExamRecord): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(EXAM_HISTORY_KEY)
    const history: ExamRecord[] = stored ? JSON.parse(stored) : []
    history.unshift(record)
    // 最多保留 30 筆
    await AsyncStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(history.slice(0, 30)))
  } catch {
    console.error('Failed to save exam record')
  }
}

export async function loadExamHistory(): Promise<ExamRecord[]> {
  try {
    const stored = await AsyncStorage.getItem(EXAM_HISTORY_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export async function clearExamHistory(): Promise<void> {
  await AsyncStorage.removeItem(EXAM_HISTORY_KEY)
}

const STORAGE_KEY = 'japanese_learner_progress'

const defaultProgress: UserProgress = {
  streak: 0,
  longestStreak: 0,
  lastStudyDate: '',
  totalWordsLearned: 0,
  categoryProgress: {},
  dailyHistory: [],
  srsCards: [],
  learnedIds: [],
  earnedBadges: [],
}

export async function loadProgress(): Promise<UserProgress> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...defaultProgress }
    return { ...defaultProgress, ...JSON.parse(stored) }
  } catch {
    return { ...defaultProgress }
  }
}

export async function saveProgress(progress: UserProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    console.error('Failed to save progress')
  }
}

export async function markWordLearned(id: string, category: string, totalInCategory: number): Promise<void> {
  const progress = await loadProgress()
  if (!progress.learnedIds.includes(id)) {
    progress.learnedIds.push(id)
    progress.totalWordsLearned += 1
    if (!progress.categoryProgress[category]) {
      progress.categoryProgress[category] = { learned: 0, total: totalInCategory }
    }
    progress.categoryProgress[category].learned += 1
    progress.categoryProgress[category].total = totalInCategory
  }
  const { newBadges } = updateStreak(progress)
  if (newBadges.length > 0) await armReviewPrompt()
  await saveProgress(progress)
}

export async function updateSRSCard(card: SRSCard): Promise<void> {
  const progress = await loadProgress()
  const idx = progress.srsCards.findIndex(c => c.id === card.id)
  if (idx >= 0) {
    progress.srsCards[idx] = card
  } else {
    progress.srsCards.push(card)
  }
  await saveProgress(progress)
}

export async function recordDailyActivity(
  newWords: number,
  reviewed: number,
  katakanaCorrect: number,
  katakanaTotal: number
): Promise<void> {
  const progress = await loadProgress()
  const today = getTodayString()
  const existing = progress.dailyHistory.find(d => d.date === today)
  if (existing) {
    existing.newWordsLearned += newWords
    existing.wordsReviewed += reviewed
    existing.katakanaCorrect += katakanaCorrect
    existing.katakanaTotal += katakanaTotal
  } else {
    progress.dailyHistory.push({ date: today, newWordsLearned: newWords, wordsReviewed: reviewed, katakanaCorrect, katakanaTotal })
  }
  if (progress.dailyHistory.length > 30) {
    progress.dailyHistory = progress.dailyHistory.slice(-30)
  }
  const { newBadges } = updateStreak(progress)
  if (newBadges.length > 0) await armReviewPrompt()
  await saveProgress(progress)
}

export interface StreakUpdateResult {
  /** Day-count thresholds the user just crossed this update (may be empty). */
  newBadges: number[]
  /** True when current streak set a new personal record. */
  newRecord: boolean
}

export function updateStreak(progress: UserProgress): StreakUpdateResult {
  const today = getTodayString()
  if (progress.lastStudyDate === today) return { newBadges: [], newRecord: false }
  const yesterday = getYesterdayString()
  progress.streak = progress.lastStudyDate === yesterday ? progress.streak + 1 : 1
  progress.lastStudyDate = today
  // Defensive default for users upgrading from older schema.
  if (typeof progress.longestStreak !== 'number') progress.longestStreak = 0
  if (!Array.isArray(progress.earnedBadges)) progress.earnedBadges = []
  const newRecord = progress.streak > progress.longestStreak
  if (newRecord) progress.longestStreak = progress.streak
  const newBadges: number[] = []
  for (const threshold of STREAK_BADGES) {
    if (progress.streak >= threshold && !progress.earnedBadges.includes(threshold)) {
      progress.earnedBadges.push(threshold)
      newBadges.push(threshold)
    }
  }
  return { newBadges, newRecord }
}

export async function resetProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY)
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getYesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}
