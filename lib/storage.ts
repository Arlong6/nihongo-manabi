import AsyncStorage from '@react-native-async-storage/async-storage'
import type { UserProgress, DailyProgress, SRSCard, ExamRecord } from '../types'

const EXAM_HISTORY_KEY = 'jlpt_exam_history'
const GRAMMAR_PROGRESS_KEY = 'grammar_progress'
const LOCALE_KEY = 'app_locale'
const FAVORITES_KEY = 'vocab_favorites'
const AI_CHAT_USAGE_KEY = 'ai_chat_usage'

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
  lastStudyDate: '',
  totalWordsLearned: 0,
  categoryProgress: {},
  dailyHistory: [],
  srsCards: [],
  learnedIds: [],
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
  updateStreak(progress)
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
  updateStreak(progress)
  await saveProgress(progress)
}

export function updateStreak(progress: UserProgress): void {
  const today = getTodayString()
  if (progress.lastStudyDate === today) return
  const yesterday = getYesterdayString()
  progress.streak = progress.lastStudyDate === yesterday ? progress.streak + 1 : 1
  progress.lastStudyDate = today
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
