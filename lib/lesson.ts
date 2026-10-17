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
}

export function composeLesson({ progress, level, grammarStats, today, rng = Math.random }: ComposeInput): LessonItem[] {
  const pool = levelPool(level)
  const byId = new Map(pool.map(v => [v.id, v]))
  const learned = new Set(progress.learnedIds)
  const used = new Set<string>()
  const items: LessonItem[] = []

  // 1. SRS 到期複習，最早到期優先，最多 MAX_REVIEW（只取本級別池內的單字）
  for (const card of sortByDueDate(getDueCards(progress.srsCards))) {
    if (items.length >= MAX_REVIEW) break
    const v = byId.get(card.id)
    if (!v || used.has(v.id)) continue
    used.add(v.id)
    items.push({ question: vocabQuestion(v, pool, rng), role: 'review', vocabId: v.id })
  }

  // 2. 新單字 NEW_WORDS，依資料順序取未學的前幾個（可重現）
  const unlearned = pool.filter(v => !learned.has(v.id) && !used.has(v.id))
  for (const v of unlearned.slice(0, NEW_WORDS)) {
    used.add(v.id)
    items.push({ question: vocabQuestion(v, pool, rng), role: 'new', vocabId: v.id })
  }

  // 3. 文法 1 題：本級別中答錯率最高者（未作答過的算 0 錯誤率），同率取資料順序
  const grammarPool = grammarQuestions.filter(g => g.level === level)
  if (grammarPool.length > 0) {
    const errorRate = (id: string) => {
      const s = grammarStats[id]
      return s && s.total > 0 ? 1 - s.correct / s.total : 0
    }
    const pick = [...grammarPool].sort((a, b) => errorRate(b.id) - errorRate(a.id))[0]
    items.push({ question: grammarQuestion(pick, rng), role: 'grammar' })
  }

  // 4. 漢字或聽力 1 題，依日期奇偶輪替，從已學或池中單字取
  const dayNum = parseInt(today.replace(/-/g, ''), 10)
  const extraSource = shuffle(pool.filter(v => !used.has(v.id)), rng)
  if (dayNum % 2 === 0) {
    const v = extraSource.find(x => hasKanji(x.japanese))
    if (v) { used.add(v.id); items.push({ question: kanjiQuestion(v, pool, rng), role: 'extra', vocabId: v.id }) }
  } else {
    const v = extraSource[0]
    if (v) { used.add(v.id); items.push({ question: listeningQuestion(v, pool, rng), role: 'extra', vocabId: v.id }) }
  }

  // 補位：先用剩餘新單字，再用已學單字隨機複習，直到 LESSON_SIZE
  const fillers = [
    ...unlearned.filter(v => !used.has(v.id)),
    ...shuffle(pool.filter(v => learned.has(v.id) && !used.has(v.id)), rng),
  ]
  // 補位的未學單字標 'extra'（spec 的「新單字」固定 3 個），已學單字標 'review'
  for (const v of fillers) {
    if (items.length >= LESSON_SIZE) break
    used.add(v.id)
    const role: LessonItem['role'] = learned.has(v.id) ? 'review' : 'extra'
    items.push({ question: vocabQuestion(v, pool, rng), role, vocabId: v.id })
  }

  return items.slice(0, LESSON_SIZE)
}
