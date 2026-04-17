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
  lastStudyDate: string
  totalWordsLearned: number
  categoryProgress: Record<string, { learned: number; total: number }>
  dailyHistory: DailyProgress[]
  srsCards: SRSCard[]
  learnedIds: string[]
}
