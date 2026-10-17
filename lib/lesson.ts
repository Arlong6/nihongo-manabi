// lib/lesson.ts
import type { UserProgress, Vocabulary, JlptLevel } from '../types'
import { allVocabulary } from '../data/vocabulary'
import { grammarQuestions } from '../data/grammar'
import type { GrammarStats } from './storage'
import { getDueCards, sortByDueDate } from './srs'
import { vocabQuestion, kanjiQuestion, grammarQuestion, listeningQuestion, hasKanji, shuffle } from './quiz'
import type { QuizQuestion } from './quiz'

export const LESSON_SIZE = 10
export const MAX_REVIEW = 5
export const NEW_WORDS = 3

export interface LessonItem {
  question: QuizQuestion
  role: 'review' | 'new' | 'grammar' | 'extra'
  vocabId?: string
}

/** 級別單字池。主題單字（level 'daily'）視為 N5 池的一部分。 */
export function levelPool(level: JlptLevel, vocab: Vocabulary[] = allVocabulary): Vocabulary[] {
  return vocab.filter(v => v.level === level || (level === 'N5' && v.level === 'daily'))
}

export function levelMasteryRatio(progress: UserProgress, level: JlptLevel): number {
  const pool = levelPool(level)
  if (pool.length === 0) return 0
  const learned = new Set(progress.learnedIds)
  return pool.filter(v => learned.has(v.id)).length / pool.length
}

interface ComposeInput {
  progress: UserProgress
  level: JlptLevel
  grammarStats: GrammarStats
  today: string           // YYYY-MM-DD，決定 extra 題型
  rng?: () => number
  vocab?: Vocabulary[]    // 測試用，預設 allVocabulary
}

export function composeLesson({ progress, level, grammarStats, today, rng = Math.random, vocab }: ComposeInput): LessonItem[] {
  const pool = levelPool(level, vocab)
  const byId = new Map(pool.map(v => [v.id, v]))
  const learned = new Set(progress.learnedIds)
  const used = new Set<string>()
  const usedJa = new Set<string>()   // 資料中同字不同 id，避免同一堂課出現相同題目
  const take = (v: Vocabulary) => {
    if (used.has(v.id) || usedJa.has(v.japanese)) return false
    used.add(v.id); usedJa.add(v.japanese)
    return true
  }
  const items: LessonItem[] = []

  // 1. SRS 到期複習，最早到期優先，最多 MAX_REVIEW（只取本級別池內的單字）
  for (const card of sortByDueDate(getDueCards(progress.srsCards))) {
    if (items.length >= MAX_REVIEW) break
    const v = byId.get(card.id)
    if (!v || !take(v)) continue
    items.push({ question: vocabQuestion(v, pool, rng), role: 'review', vocabId: v.id })
  }

  // 2. 新單字 NEW_WORDS，依資料順序取未學的前幾個（可重現）
  const unlearned = pool.filter(v => !learned.has(v.id))
  let newCount = 0
  for (const v of unlearned) {
    if (newCount >= NEW_WORDS) break
    if (!take(v)) continue
    newCount++
    items.push({ question: vocabQuestion(v, pool, rng), role: 'new', vocabId: v.id })
  }

  // 3. 文法 1 題：本級別中答錯率最高者；同率時未作答/作答少者優先，仍同率由 rng 決定
  const grammarPool = grammarQuestions.filter(g => g.level === level)
  if (grammarPool.length > 0) {
    const errorRate = (id: string) => {
      const s = grammarStats[id]
      return s && s.total > 0 ? 1 - s.correct / s.total : 0
    }
    const attempts = (id: string) => grammarStats[id]?.total ?? 0
    // 先洗牌再穩定排序：錯誤率高優先，其次作答次數少（未見過者先），其餘以 rng 打散
    const pick = shuffle(grammarPool, rng).sort((a, b) =>
      errorRate(b.id) - errorRate(a.id) || attempts(a.id) - attempts(b.id))[0]
    items.push({ question: grammarQuestion(pick, rng), role: 'grammar' })
  }

  // 4. 漢字或聽力 1 題，依日期奇偶輪替，從已學或池中單字取
  const dayNum = parseInt(today.replace(/-/g, ''), 10)
  const extraSource = shuffle(pool.filter(v => !used.has(v.id) && !usedJa.has(v.japanese)), rng)
  if (dayNum % 2 === 0) {
    const v = extraSource.find(x => hasKanji(x.japanese))
    if (v && take(v)) { items.push({ question: kanjiQuestion(v, pool, rng), role: 'extra', vocabId: v.id }) }
  } else {
    const v = extraSource[0]
    if (v && take(v)) { items.push({ question: listeningQuestion(v, pool, rng), role: 'extra', vocabId: v.id }) }
  }

  // 補位：先用剩餘新單字，再用已學單字隨機複習，直到 LESSON_SIZE
  const fillers = [
    ...unlearned,
    ...shuffle(pool.filter(v => learned.has(v.id)), rng),
  ]
  // 補位的未學單字標 'extra'（spec 的「新單字」固定 3 個），已學單字標 'review'
  for (const v of fillers) {
    if (items.length >= LESSON_SIZE) break
    if (!take(v)) continue
    const role: LessonItem['role'] = learned.has(v.id) ? 'review' : 'extra'
    items.push({ question: vocabQuestion(v, pool, rng), role, vocabId: v.id })
  }

  return items.slice(0, LESSON_SIZE)
}
