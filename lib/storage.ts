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

// ── 每日用量（免費版限制；Pro 無限）──────────────────────────────────────────
// count：今天用掉幾次。bonus：今天靠看激勵廣告多換到幾次（每天最多 DAILY_BONUS_CAP）。
// 額度用完的判斷是 count >= limit + bonus，兩個功能各自獨立計算，隔天歸零。
export const DAILY_BONUS_CAP = 3

export interface DailyUsage {
  date: string
  count: number
  bonus: number
}

function emptyUsage(date: string): DailyUsage {
  return { date, count: 0, bonus: 0 }
}

async function readUsage(key: string): Promise<DailyUsage> {
  const today = getTodayString()
  try {
    const stored = await AsyncStorage.getItem(key)
    if (!stored) return emptyUsage(today)
    const parsed = JSON.parse(stored) as Partial<DailyUsage>
    if (parsed.date !== today) return emptyUsage(today)
    return { date: today, count: parsed.count ?? 0, bonus: parsed.bonus ?? 0 }
  } catch {
    return emptyUsage(today)
  }
}

async function writeUsage(key: string, usage: DailyUsage): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(usage))
  } catch {
    console.error(`Failed to save usage for ${key}`)
  }
}

export function isUsageExhausted(usage: DailyUsage, limit: number): boolean {
  return usage.count >= limit + usage.bonus
}

export function usageRemaining(usage: DailyUsage, limit: number): number {
  return Math.max(0, limit + usage.bonus - usage.count)
}

export function canGrantBonus(usage: DailyUsage): boolean {
  return usage.bonus < DAILY_BONUS_CAP
}

/** 看完激勵廣告後 +1；達到每日上限則不加並回傳 null。 */
async function grantBonus(key: string): Promise<DailyUsage | null> {
  const current = await readUsage(key)
  if (!canGrantBonus(current)) return null
  const next = { ...current, bonus: current.bonus + 1 }
  await writeUsage(key, next)
  return next
}

async function incrementUsage(key: string): Promise<DailyUsage> {
  const current = await readUsage(key)
  const next = { ...current, count: current.count + 1 }
  await writeUsage(key, next)
  return next
}

export function getAIChatUsage(): Promise<DailyUsage> {
  return readUsage(AI_CHAT_USAGE_KEY)
}

export function incrementAIChatUsage(): Promise<DailyUsage> {
  return incrementUsage(AI_CHAT_USAGE_KEY)
}

export function grantAIChatBonus(): Promise<DailyUsage | null> {
  return grantBonus(AI_CHAT_USAGE_KEY)
}

const CAMERA_USAGE_KEY = 'camera_usage'

export const CAMERA_DAILY_LIMIT = 3

export function getCameraUsage(): Promise<DailyUsage> {
  return readUsage(CAMERA_USAGE_KEY)
}

export function incrementCameraUsage(): Promise<DailyUsage> {
  return incrementUsage(CAMERA_USAGE_KEY)
}

export function grantCameraBonus(): Promise<DailyUsage | null> {
  return grantBonus(CAMERA_USAGE_KEY)
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

export function updateStreak(progress: UserProgress, now: Date = new Date()): StreakUpdateResult {
  const today = toLocalDateString(now)
  const yesterday = toLocalDateString(addDays(now, -1))
  // 舊資料（1.6.0 前）的日期是 UTC，最多比本地日期落後一天：
  // 昨天讀的可能存成前天、今天讀的可能存成昨天。所以第一次遇到舊資料時，
  // 「前天」也視為連續，之後就標成 local、恢復嚴格比對。
  const legacy = progress.dateSchema !== 'local'
  const dayBeforeYesterday = toLocalDateString(addDays(now, -2))
  const isContinuing = progress.lastStudyDate === yesterday
    || (legacy && progress.lastStudyDate === dayBeforeYesterday)
  if (legacy) progress.dateSchema = 'local'
  if (progress.lastStudyDate === today) return { newBadges: [], newRecord: false }
  progress.streak = isContinuing ? progress.streak + 1 : 1
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

/** 裝置本地時區的 YYYY-MM-DD。全 App 的「今天」都要走這裡，不要用 toISOString（那是 UTC）。 */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, delta: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + delta)
  return next
}

export function getTodayString(): string {
  return toLocalDateString(new Date())
}

export function getYesterdayString(): string {
  return toLocalDateString(addDays(new Date(), -1))
}
