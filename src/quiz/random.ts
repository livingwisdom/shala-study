// src/quiz/random.ts -- JRS 2026-07-28
// Seeded PRNG so choice order is deterministic per question.

/**
 * Deterministic randomness.
 *
 * Choice order is derived from the question id rather than Math.random so that
 * a given question always renders its options in the same order. Without this,
 * re-reading a question you just missed would shuffle the options and you'd
 * end up memorising positions instead of answers -- and the generator tests
 * would be unwritable.
 */

/** FNV-1a. Small, fast, good enough to seed a PRNG from a string id. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export type Rng = () => number

/** mulberry32 -- compact, well-distributed, seedable. */
export function makeRng(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rngFor(seed: string): Rng {
  return makeRng(hashString(seed))
}

/** Fisher-Yates against a supplied Rng. Returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const a = result[i]
    const b = result[j]
    if (a !== undefined && b !== undefined) {
      result[i] = b
      result[j] = a
    }
  }
  return result
}

/**
 * Builds a shuffled choice list: the answer plus up to `count` distractors
 * drawn from `pool`.
 *
 * Distractors are preferred from the front of `pool`, so callers pass
 * near-neighbours first -- a "what comes next?" question is only worth
 * answering if the wrong options are also plausible.
 */
export function buildChoices(
  answer: string,
  pool: readonly string[],
  count: number,
  rng: Rng,
): string[] {
  const distractors: string[] = []
  for (const candidate of pool) {
    if (distractors.length >= count) break
    if (candidate === answer) continue
    if (distractors.includes(candidate)) continue
    distractors.push(candidate)
  }
  return shuffle([answer, ...distractors], rng)
}
