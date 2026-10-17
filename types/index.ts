export interface Vocabulary {
  id: string
  japanese: string
  reading: string
  chinese: string
  english: string
  example: string
  exampleChinese?: string
  category: string
  level: 'daily' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
}

export interface KatakanaChar {
  katakana: string
  romaji: string
  hiragana: string
  similar?: string[]
}

export interface HiraganaChar {
  hiragana: string
  romaji: string
  katakana: string
  similar?: string[]
}

export interface Phrase {
  id: string
  japanese: string
  reading: string
  chinese: string
  english: string
  situation: string
  category: string
}

export type SRSRating = 'unknown' | 'hard' | 'good' | 'easy'

export interface SRSCard {
  id: string
  type: 'vocabulary' | 'katakana' | 'phrase'
  nextReview: string
  interval: number
  repetitions: number
  easeFactor: number
}

export interface ExamWrongItem {
  type: 'vocab' | 'grammar'
  prompt: string
  subPrompt?: string
  yourAnswer: string
  correctAnswer: string
  explanation: string
  point: string
}

export interface ExamRecord {
  id: string
  date: string
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  score: number
  total: number
  vocabScore: number
  vocabTotal: number
  grammarScore: number
  grammarTotal: number
  wrongItems: ExamWrongItem[]
}

export interface DailyProgress {
  date: string
  newWordsLearned: number
  wordsReviewed: number
  katakanaCorrect: number
  katakanaTotal: number
}

export interface UserProgress {
  streak: number
  longestStreak: number
  lastStudyDate: string
  totalWordsLearned: number
  categoryProgress: Record<string, { learned: number; total: number }>
  dailyHistory: DailyProgress[]
  srsCards: SRSCard[]
  learnedIds: string[]
  // Sorted list of milestone day-counts the user has reached at least once.
  // Used for badge gallery — once earned, never lost.
  earnedBadges: number[]
  // 'local' 表示日期字串（lastStudyDate、dailyHistory）已改用裝置本地時區。
  // 1.6.0 之前用 UTC 算「今天」，台灣要早上 8 點才換日；缺這個欄位代表舊資料，
  // updateStreak 會做一次寬鬆比對避免連勝被誤斷。
  dateSchema?: 'local'
  // 連勝凍結張數：每滿 7 天連勝 +1，上限 2；斷一天時自動用掉一張。舊資料缺欄位視為 0。
  streakFreezes?: number
}

// Milestone thresholds that unlock a badge when current streak first hits them.
export const STREAK_BADGES = [3, 7, 14, 30, 60, 100, 200, 365] as const

export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
export const JLPT_LEVELS: readonly JlptLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1']
