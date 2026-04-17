import {
  createSRSCard,
  updateSRSCard,
  isDueForReview,
  getDaysUntilReview,
  getDueCards,
} from '../lib/srs'
import type { SRSCard } from '../types'

describe('createSRSCard', () => {
  it('建立預設卡片，nextReview 為現在', () => {
    const card = createSRSCard('v001', 'vocabulary')
    expect(card.id).toBe('v001')
    expect(card.type).toBe('vocabulary')
    expect(card.interval).toBe(1)
    expect(card.repetitions).toBe(0)
    expect(card.easeFactor).toBe(2.5)
    expect(new Date(card.nextReview).getTime()).toBeLessThanOrEqual(Date.now() + 1000)
  })
})

describe('updateSRSCard', () => {
  const baseCard: SRSCard = {
    id: 'v001',
    type: 'vocabulary',
    nextReview: new Date().toISOString(),
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
  }

  it('unknown → 重置，interval=1，明天複習', () => {
    const updated = updateSRSCard(baseCard, 'unknown')
    expect(updated.repetitions).toBe(0)
    expect(updated.interval).toBe(1)
    const daysUntil = getDaysUntilReview(updated)
    expect(daysUntil).toBe(1)
  })

  it('hard → 重置（quality < 3），interval=1', () => {
    const updated = updateSRSCard(baseCard, 'hard')
    expect(updated.repetitions).toBe(0)
    expect(updated.interval).toBe(1)
  })

  it('good（第一次）→ interval=1，repetitions+1', () => {
    const updated = updateSRSCard(baseCard, 'good')
    expect(updated.repetitions).toBe(1)
    expect(updated.interval).toBe(1)
  })

  it('good（第二次）→ interval=6', () => {
    const card1 = updateSRSCard(baseCard, 'good')
    const card2 = updateSRSCard(card1, 'good')
    expect(card2.repetitions).toBe(2)
    expect(card2.interval).toBe(6)
  })

  it('easy 多次後 interval 會持續增長', () => {
    let card = baseCard
    for (let i = 0; i < 5; i++) {
      card = updateSRSCard(card, 'easy')
    }
    expect(card.interval).toBeGreaterThan(6)
    expect(card.easeFactor).toBeGreaterThanOrEqual(2.5)
  })

  it('easeFactor 最小值不低於 1.3', () => {
    let card = baseCard
    for (let i = 0; i < 20; i++) {
      card = updateSRSCard(card, 'unknown')
    }
    expect(card.easeFactor).toBeGreaterThanOrEqual(1.3)
  })
})

describe('isDueForReview', () => {
  it('nextReview 在過去 → 已到期', () => {
    const card = createSRSCard('v001', 'vocabulary')
    const pastCard: SRSCard = { ...card, nextReview: new Date(Date.now() - 1000).toISOString() }
    expect(isDueForReview(pastCard)).toBe(true)
  })

  it('nextReview 在未來 → 未到期', () => {
    const card = createSRSCard('v001', 'vocabulary')
    const futureCard: SRSCard = { ...card, nextReview: new Date(Date.now() + 86400000).toISOString() }
    expect(isDueForReview(futureCard)).toBe(false)
  })
})

describe('getDueCards', () => {
  it('只回傳已到期的卡片', () => {
    const now = Date.now()
    const cards: SRSCard[] = [
      { id: 'a', type: 'vocabulary', nextReview: new Date(now - 1000).toISOString(), interval: 1, repetitions: 0, easeFactor: 2.5 },
      { id: 'b', type: 'vocabulary', nextReview: new Date(now + 86400000).toISOString(), interval: 6, repetitions: 1, easeFactor: 2.5 },
      { id: 'c', type: 'katakana', nextReview: new Date(now - 5000).toISOString(), interval: 1, repetitions: 0, easeFactor: 2.5 },
    ]
    const due = getDueCards(cards)
    expect(due).toHaveLength(2)
    expect(due.map(c => c.id)).toEqual(expect.arrayContaining(['a', 'c']))
  })
})
