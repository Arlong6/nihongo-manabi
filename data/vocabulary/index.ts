import { foodVocabulary } from './food'
import { transportVocabulary } from './transport'
import { shoppingVocabulary } from './shopping'
import { dailyVocabulary } from './daily'
import { weatherVocabulary } from './weather'
import { familyVocabulary } from './family'
import { workVocabulary } from './work'
import { n5Vocabulary } from './n5'
import { n4Vocabulary } from './n4'
import { n3Vocabulary } from './n3'
import { n2Vocabulary } from './n2'
import { n1Vocabulary } from './n1'
import type { Vocabulary } from '../types'

export {
  foodVocabulary, transportVocabulary, shoppingVocabulary, dailyVocabulary,
  weatherVocabulary, familyVocabulary, workVocabulary, n5Vocabulary, n4Vocabulary,
  n3Vocabulary, n2Vocabulary, n1Vocabulary,
}

export const allVocabulary: Vocabulary[] = [
  ...dailyVocabulary,
  ...foodVocabulary,
  ...transportVocabulary,
  ...shoppingVocabulary,
  ...weatherVocabulary,
  ...familyVocabulary,
  ...workVocabulary,
  ...n5Vocabulary,
  ...n4Vocabulary,
  ...n3Vocabulary,
  ...n2Vocabulary,
  ...n1Vocabulary,
]

export const categoryInfo: Record<string, { label: string; emoji: string; description: string }> = {
  greeting:  { label: '打招呼',  emoji: '👋', description: '日常問候語' },
  number:    { label: '數字',    emoji: '🔢', description: '數字與計數' },
  time:      { label: '時間',    emoji: '⏰', description: '時間相關詞彙' },
  food:      { label: '食べ物',  emoji: '🍜', description: '食物與飲料' },
  transport: { label: '交通',    emoji: '🚃', description: '交通與移動' },
  shopping:  { label: '買い物',  emoji: '🛒', description: '購物與消費' },
  weather:   { label: '天気',    emoji: '☀️', description: '天氣與四季' },
  family:    { label: '家族',    emoji: '👨‍👩‍👧', description: '家人稱謂' },
  work:      { label: '仕事',    emoji: '🏢', description: '職場用語' },
  color:     { label: '色',      emoji: '🎨', description: '顏色' },
  body:      { label: '体',      emoji: '🧍', description: '身體部位' },
  place:     { label: '場所',    emoji: '📍', description: '地點' },
  adjective:  { label: '形容詞',  emoji: '✨', description: '形容詞' },
  verb:       { label: '動詞',    emoji: '⚡', description: 'N4 動詞' },
  noun:       { label: '名詞',    emoji: '📝', description: 'N4 名詞' },
  adverb:     { label: '副詞',    emoji: '💡', description: '副詞' },
  expression: { label: '慣用語',  emoji: '💬', description: '慣用語・表達' },
}

export function getVocabularyByLevel(level: 'beginner' | 'n5' | 'n4'): Vocabulary[] {
  if (level === 'beginner') return allVocabulary.filter(v => v.level === 'daily' || v.level === 'N5')
  if (level === 'n5') return allVocabulary.filter(v => v.level === 'N5' || v.level === 'daily')
  // n4 = 全部，含 N3/N2
  return allVocabulary
}

export function getVocabularyByCategory(category: string): Vocabulary[] {
  return allVocabulary.filter(v => v.category === category)
}

export function getVocabularyById(id: string): Vocabulary | undefined {
  return allVocabulary.find(v => v.id === id)
}
