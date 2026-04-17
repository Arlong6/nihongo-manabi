import type { SRSCard, SRSRating } from '../types'

/**
 * SM-2 Spaced Repetition Algorithm
 * 根據評分動態調整 easeFactor 和 interval
 *
 * Rating mapping:
 *   unknown → quality 0（完全不會）
 *   hard    → quality 2（很費力才想起來）
 *   good    → quality 4（有點費力但想起來了）
 *   easy    → quality 5（輕鬆記住）
 */

const QUALITY: Record<SRSRating, number> = {
  unknown: 0,
  hard: 2,
  good: 4,
  easy: 5,
}

export function createSRSCard(id: string, type: SRSCard['type']): SRSCard {
  return {
    id,
    type,
    nextReview: new Date().toISOString(),
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
  }
}

export function updateSRSCard(card: SRSCard, rating: SRSRating): SRSCard {
  const q = QUALITY[rating]

  // 答錯就重置
  if (q < 3) {
    return {
      ...card,
      repetitions: 0,
      interval: 1,
      nextReview: addDays(1),
    }
  }

  // SM-2 公式
  const newEF = Math.max(
    1.3,
    card.easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  )

  let newInterval: number
  if (card.repetitions === 0) {
    newInterval = 1
  } else if (card.repetitions === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(card.interval * newEF)
  }

  return {
    ...card,
    repetitions: card.repetitions + 1,
    interval: newInterval,
    easeFactor: Math.round(newEF * 100) / 100,
    nextReview: addDays(newInterval),
  }
}

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export function isDueForReview(card: SRSCard): boolean {
  return new Date(card.nextReview) <= new Date()
}

export function getDaysUntilReview(card: SRSCard): number {
  const diffMs = new Date(card.nextReview).getTime() - Date.now()
  return Math.max(0, Math.ceil(diffMs / 86400000))
}

export function getDueCards(cards: SRSCard[]): SRSCard[] {
  return cards.filter(isDueForReview)
}

export function sortByDueDate(cards: SRSCard[]): SRSCard[] {
  return [...cards].sort(
    (a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime()
  )
}

export function getRatingLabel(rating: SRSRating): string {
  return { unknown: '不會', hard: '有點記得', good: '記得', easy: '很熟' }[rating]
}

export function getRatingNextReview(rating: SRSRating): string {
  return { unknown: '明天', hard: '2天後', good: '6天後', easy: '14天後' }[rating]
}
