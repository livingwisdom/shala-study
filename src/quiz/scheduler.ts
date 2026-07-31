// src/quiz/scheduler.ts -- JRS 2026-07-28
// Leitner spaced repetition over the question pool.

/**
 * Leitner-box spaced repetition.
 *
 * Chosen over SM-2 deliberately: SM-2's ease factors need a graded self-report
 * ("how hard was that?") on every card, which is friction you won't tolerate
 * while cramming on a bus. Leitner needs only right/wrong, and for a fixed
 * exam-shaped body of material a few weeks out, the two perform about the same.
 *
 * Every function here takes `now` explicitly rather than reading the clock, so
 * the scheduling rules are testable without faking timers.
 */

import type { Rng } from './random'
import { shuffle } from './random'
import type { Question } from './types'

export const MAX_BOX = 5

/**
 * Days to wait before a question in each box comes back.
 * Index 0 is unused; boxes are 1-indexed to match how they're talked about.
 */
const BOX_INTERVAL_DAYS = [0, 0, 1, 3, 7, 21] as const

/**
 * What a box means, in the terms that matter while studying: when the question
 * comes back.
 *
 * Derived from the table above rather than written out again, so shortening an
 * interval relabels the chart instead of quietly making it lie.
 */
export function boxIntervalLabel(box: number): string {
  const days = BOX_INTERVAL_DAYS[box] ?? 0
  if (days === 0) return 'again'
  if (days === 1) return '1 day'
  if (days < 7) return `${days} days`
  // Abbreviated because these are chart labels in a six-column row on a phone:
  // "3 weeks" wraps and knocks the row out of alignment.
  const weeks = days / 7
  return weeks === 1 ? '1 wk' : `${weeks} wks`
}

const DAY_MS = 24 * 60 * 60 * 1000

export interface ProgressRecord {
  /** 1 (just missed) through MAX_BOX (well known). */
  box: number
  /** Epoch ms of the last answer. */
  lastSeen: number
  correct: number
  incorrect: number
}

export type Progress = Readonly<Record<string, ProgressRecord>>

export function newRecord(now: number): ProgressRecord {
  return { box: 1, lastSeen: now, correct: 0, incorrect: 0 }
}

/**
 * Applies an answer.
 *
 * Correct promotes one box; incorrect drops straight back to box 1 rather than
 * demoting by one. If you've forgotten it, you've forgotten it -- easing it back
 * in gradually just means seeing it too late again.
 */
export function grade(
  record: ProgressRecord | undefined,
  correct: boolean,
  now: number,
): ProgressRecord {
  const base = record ?? newRecord(now)
  return {
    box: correct ? Math.min(base.box + 1, MAX_BOX) : 1,
    lastSeen: now,
    correct: base.correct + (correct ? 1 : 0),
    incorrect: base.incorrect + (correct ? 0 : 1),
  }
}

/** Whether enough time has passed for this question to come back. */
export function isDue(record: ProgressRecord | undefined, now: number): boolean {
  if (!record) return true
  const days = BOX_INTERVAL_DAYS[record.box] ?? 0
  return now - record.lastSeen >= days * DAY_MS
}

/** Milliseconds until due, or 0 if due now. */
export function timeUntilDue(record: ProgressRecord | undefined, now: number): number {
  if (!record) return 0
  const days = BOX_INTERVAL_DAYS[record.box] ?? 0
  return Math.max(0, record.lastSeen + days * DAY_MS - now)
}

/**
 * Orders a session.
 *
 * Unseen questions come first so a new topic doesn't stay buried behind review,
 * then due questions worst-known-first. Nothing that isn't due is included --
 * if you've cleared the queue, the app should tell you so rather than padding
 * the session with questions you already know.
 *
 * The unseen block is shuffled because the pool arrives in practice order.
 * Unshuffled, a first session is twenty consecutive counts of Surya Namaskara A
 * and nothing else, and "what comes after dve?" is answerable from the question
 * before it rather than from memory. `rng` is a parameter for the same reason
 * `now` is: the caller owns the nondeterminism, so tests can pin it.
 */
export function selectSession(
  questions: readonly Question[],
  progress: Progress,
  now: number,
  limit: number,
  rng: Rng,
): Question[] {
  const unseen: Question[] = []
  const due: Question[] = []

  for (const question of questions) {
    const record = progress[question.id]
    if (!record) unseen.push(question)
    else if (isDue(record, now)) due.push(question)
  }

  due.sort((a, b) => {
    const recordA = progress[a.id]
    const recordB = progress[b.id]
    const boxDiff = (recordA?.box ?? 1) - (recordB?.box ?? 1)
    if (boxDiff !== 0) return boxDiff
    return (recordA?.lastSeen ?? 0) - (recordB?.lastSeen ?? 0)
  })

  return [...shuffle(unseen, rng), ...due].slice(0, limit)
}

export interface BoxDistribution {
  /** Never answered. */
  unseen: number
  /** Index 0 is unused; boxes are 1-indexed, matching BOX_INTERVAL_DAYS. */
  boxes: readonly number[]
}

/**
 * Counts questions per box.
 *
 * The lone "mastered" number can't move within a sitting -- box 5 is four
 * correct answers and eleven days away, and a correct answer isn't due again
 * for a day, so nothing can be promoted twice in one session. The distribution
 * shows the same progress at a resolution where one right answer is visible.
 */
export function boxDistribution(
  questions: readonly Question[],
  progress: Progress,
): BoxDistribution {
  const boxes = new Array<number>(MAX_BOX + 1).fill(0)
  let unseen = 0

  for (const question of questions) {
    const record = progress[question.id]
    if (!record) {
      unseen++
      continue
    }
    // Clamped because these records come back from localStorage, where an old
    // or hand-edited value could sit outside the range.
    const box = Math.min(Math.max(record.box, 1), MAX_BOX)
    boxes[box] = (boxes[box] ?? 0) + 1
  }

  return { unseen, boxes }
}

/**
 * Fills a session out to `limit` with questions that aren't due yet.
 *
 * For focused study only. You reach for one pose deliberately -- "I keep losing
 * Marichyasana C" -- and "nothing due for that pose" is a useless answer to it.
 * What's due still comes first; the rest is padding, shuffled so a short pose
 * doesn't ask the same tail in the same order every time.
 */
export function padSession(
  picked: readonly Question[],
  available: readonly Question[],
  limit: number,
  rng: Rng,
): Question[] {
  if (picked.length >= limit) return [...picked]
  const taken = new Set(picked.map((question) => question.id))
  const rest = shuffle(
    available.filter((question) => !taken.has(question.id)),
    rng,
  )
  return [...picked, ...rest.slice(0, limit - picked.length)]
}

export interface ProgressSummary {
  total: number
  seen: number
  /** Everything a session can draw on: unseen plus review that has come round. */
  due: number
  /**
   * Due for review only, excluding the never seen.
   *
   * Separate from `due` because they answer different questions. A session
   * needs "how much could I study", but on screen that number sits next to the
   * count of new questions and reads as a duplicate of it.
   */
  reviewDue: number
  /** Questions sitting in the top box. */
  mastered: number
}

export function summarise(
  questions: readonly Question[],
  progress: Progress,
  now: number,
): ProgressSummary {
  let seen = 0
  let due = 0
  let reviewDue = 0
  let mastered = 0

  for (const question of questions) {
    const record = progress[question.id]
    if (record) {
      seen++
      if (record.box >= MAX_BOX) mastered++
      if (isDue(record, now)) {
        due++
        reviewDue++
      }
    } else {
      due++
    }
  }

  return { total: questions.length, seen, due, reviewDue, mastered }
}
