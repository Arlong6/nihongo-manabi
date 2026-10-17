import AsyncStorage from '@react-native-async-storage/async-storage'
import type { UserProgress, DailyProgress, SRSCard, ExamRecord, JlptLevel } from '../types'
import { STREAK_BADGES, JLPT_LEVELS } from '../types'
import { armReviewPrompt } from './review'
import { track } from './analytics'

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

// ── 使用者級別 ────────────────────────────────────────────────────────────────
// onboarding 寫的是 'beginner' | 'n5' | 'n4'（1.6.x 以前），這裡統一映射成 JLPT 級別。
export const USER_LEVEL_KEY = 'user_level'
const LEVEL_PROMPT_DISMISSED_KEY = 'level_prompt_dismissed_until'
const LEGACY_LEVEL_MAP: Record<string, JlptLevel> = { beginner: 'N5', n5: 'N5', n4: 'N4' }

export async function getUserLevel(): Promise<JlptLevel> {
  try {
    const raw = await AsyncStorage.getItem(USER_LEVEL_KEY)
    if (!raw) return 'N5'
    if ((JLPT_LEVELS as readonly string[]).includes(raw)) return raw as JlptLevel
    return LEGACY_LEVEL_MAP[raw] ?? 'N5'
  } catch {
    return 'N5'
  }
}

export async function setUserLevel(level: JlptLevel): Promise<void> {
  try { await AsyncStorage.setItem(USER_LEVEL_KEY, level) } catch { console.error('Failed to save level') }
}

export async function getLevelPromptDismissedUntil(): Promise<string | null> {
  try { return await AsyncStorage.getItem(LEVEL_PROMPT_DISMISSED_KEY) } catch { return null }
}

export async function setLevelPromptDismissedUntil(date: string): Promise<void> {
  try { await AsyncStorage.setItem(LEVEL_PROMPT_DISMISSED_KEY, date) } catch { /* best-effort */ }
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
  streakFreezes: 0,
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

export async function markWordLearned(
  id: string, category: string, totalInCategory: number, opts: { isPro?: boolean; skipStreak?: boolean } = {},
): Promise<void> {
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
  // 課程內由 recordLessonResult 統一打卡，這裡跳過
  if (!opts.skipStreak) {
    const { newBadges } = updateStreak(progress, new Date(), opts)
    if (newBadges.length > 0) await armReviewPrompt()
  }
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
  katakanaTotal: number,
  opts: { isPro?: boolean } = {},
): Promise<StreakUpdateResult> {
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
  const result = updateStreak(progress, new Date(), opts)
  if (result.newBadges.length > 0) await armReviewPrompt()
  await saveProgress(progress)
  return result
}

export const MAX_STREAK_FREEZES = 2
export const FREEZE_EARN_EVERY = 7

export interface StreakUpdateResult {
  newBadges: number[]
  newRecord: boolean
  /** 這次打卡用掉一張凍結（或 Pro 免費延續）保住了連勝。 */
  freezeUsed: boolean
  /** 這次打卡剛好賺到一張凍結。 */
  freezeEarned: boolean
}

export function updateStreak(
  progress: UserProgress, now: Date = new Date(), opts: { isPro?: boolean } = {},
): StreakUpdateResult {
  const none: StreakUpdateResult = { newBadges: [], newRecord: false, freezeUsed: false, freezeEarned: false }
  const today = toLocalDateString(now)
  const yesterday = toLocalDateString(addDays(now, -1))
  const dayBeforeYesterday = toLocalDateString(addDays(now, -2))
  if (typeof progress.streakFreezes !== 'number') progress.streakFreezes = 0
  if (progress.lastStudyDate === today) return none

  // 舊資料（1.6.0 前）的日期是 UTC，最多比本地日期落後一天，第一次遇到時「前天」也視為連續。
  // 這條寬鬆路徑優先於凍結，不扣張數。
  const legacy = progress.dateSchema !== 'local'
  if (legacy) progress.dateSchema = 'local'

  let freezeUsed = false
  let isContinuing = progress.lastStudyDate === yesterday
  if (!isContinuing && progress.lastStudyDate === dayBeforeYesterday) {
    if (legacy) {
      isContinuing = true
    } else if (opts.isPro) {
      isContinuing = true; freezeUsed = true
    } else if (progress.streakFreezes > 0) {
      progress.streakFreezes -= 1; isContinuing = true; freezeUsed = true
    }
  }

  progress.streak = isContinuing ? progress.streak + 1 : 1
  progress.lastStudyDate = today
  if (typeof progress.longestStreak !== 'number') progress.longestStreak = 0
  if (!Array.isArray(progress.earnedBadges)) progress.earnedBadges = []
  const newRecord = progress.streak > progress.longestStreak
  if (newRecord) progress.longestStreak = progress.streak

  let freezeEarned = false
  if (progress.streak % FREEZE_EARN_EVERY === 0 && progress.streakFreezes < MAX_STREAK_FREEZES) {
    progress.streakFreezes += 1; freezeEarned = true
  }

  const newBadges: number[] = []
  for (const threshold of STREAK_BADGES) {
    if (progress.streak >= threshold && !progress.earnedBadges.includes(threshold)) {
      progress.earnedBadges.push(threshold); newBadges.push(threshold)
    }
  }
  return { newBadges, newRecord, freezeUsed, freezeEarned }
}

const LAST_LESSON_DATE_KEY = 'last_lesson_date'
const FREEZE_USED_DATE_KEY = 'freeze_used_date'

export interface LessonSummary {
  correct: number
  total: number
  newWords: number
  reviewed: number
  durationS: number
}

/** 課程完成：打卡 + 記當日統計 + 記最後完成日期（首頁判斷「今天完成了」用）。 */
export async function recordLessonResult(summary: LessonSummary, opts: { isPro?: boolean } = {}): Promise<StreakUpdateResult> {
  const before = await loadProgress()
  const result = await recordDailyActivity(summary.newWords, summary.reviewed, 0, 0, opts)
  try {
    const after = await loadProgress()
    // 連勝斷掉後重新從 1 開始（之前至少 2 天才算「掉了」）
    if (before.streak >= 2 && after.streak === 1) track('streak_lost', { streak_before: before.streak })
    if (result.freezeUsed) track('streak_freeze_used', { remaining: after.streakFreezes ?? 0 })
  } catch { /* analytics 是 best-effort */ }
  try {
    await AsyncStorage.setItem(LAST_LESSON_DATE_KEY, getTodayString())
    // 首頁要顯示「昨天用了一張凍結」，但 progress 沒存這件事，單獨記日期
    if (result.freezeUsed) await AsyncStorage.setItem(FREEZE_USED_DATE_KEY, getTodayString())
  } catch { /* best-effort */ }
  return result
}

export async function getLastLessonDate(): Promise<string | null> {
  try { return await AsyncStorage.getItem(LAST_LESSON_DATE_KEY) } catch { return null }
}

export async function getFreezeUsedDate(): Promise<string | null> {
  try { return await AsyncStorage.getItem(FREEZE_USED_DATE_KEY) } catch { return null }
}

export async function resetProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY)
  await AsyncStorage.multiRemove([LAST_LESSON_DATE_KEY, FREEZE_USED_DATE_KEY])
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
