import { shuffle } from './shuffle'

/** 從 pool 挑 n 個干擾項：排除正解、依 key 去重。池子不足就回能給的數量。 */
export function pickDistractors<T>(
  pool: T[], correct: T, n: number, key: (x: T) => string, rng: () => number = Math.random,
): T[] {
  const correctKey = key(correct)
  const seen = new Set<string>([correctKey])
  const out: T[] = []
  for (const item of shuffle(pool, rng)) {
    const k = key(item)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(item)
    if (out.length === n) break
  }
  return out
}
