import type { Vocabulary } from '../../types'
import type { GrammarQuestion } from '../../data/grammar'
import { shuffle } from './shuffle'
import { pickDistractors } from './options'

export interface QuizQuestion {
  id: string
  kind: 'vocab' | 'kanji' | 'grammar' | 'listening'
  prompt: string
  audioText?: string
  options: string[]
  answer: string
  explanation?: string
}

export function hasKanji(text: string): boolean {
  return /[一-鿿㐀-䶿]/.test(text)
}

export function vocabQuestion(v: Vocabulary, pool: Vocabulary[], rng: () => number = Math.random): QuizQuestion {
  const distractors = pickDistractors(pool, v, 3, x => x.chinese, rng).map(x => x.chinese)
  return {
    id: v.id, kind: 'vocab', prompt: v.japanese,
    options: shuffle([v.chinese, ...distractors], rng), answer: v.chinese,
    explanation: `${v.reading}・${v.example}`,
  }
}

export function kanjiQuestion(v: Vocabulary, pool: Vocabulary[], rng: () => number = Math.random): QuizQuestion {
  const kanjiPool = pool.filter(x => hasKanji(x.japanese))
  const distractors = pickDistractors(kanjiPool, v, 3, x => x.reading, rng).map(x => x.reading)
  return {
    id: v.id, kind: 'kanji', prompt: v.japanese,
    options: shuffle([v.reading, ...distractors], rng), answer: v.reading,
    explanation: v.chinese,
  }
}

export function grammarQuestion(g: GrammarQuestion, rng: () => number = Math.random): QuizQuestion {
  return {
    id: g.id, kind: 'grammar', prompt: g.sentence,
    options: shuffle(g.options, rng), answer: g.answer, explanation: g.explanation,
  }
}

export function listeningQuestion(v: Vocabulary, pool: Vocabulary[], rng: () => number = Math.random): QuizQuestion {
  const distractors = pickDistractors(pool, v, 3, x => x.japanese, rng).map(x => x.japanese)
  return {
    id: v.id, kind: 'listening', prompt: '', audioText: v.japanese,
    options: shuffle([v.japanese, ...distractors], rng), answer: v.japanese,
    explanation: v.chinese,
  }
}
