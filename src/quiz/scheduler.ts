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

import type { Question } from './types'

export const MAX_BOX = 5

/**
 * Days to wait before a question in each box comes back.
 * Index 0 is unused; boxes are 1-indexed to match how they're talked about.
 */
const BOX_INTERVAL_DAYS = [0, 0, 1, 3, 7, 21] as const

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
 */
export function selectSession(
  questions: readonly Question[],
  progress: Progress,
  now: number,
  limit: number,
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

  return [...unseen, ...due].slice(0, limit)
}

export interface ProgressSummary {
  total: number
  seen: number
  due: number
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
  let mastered = 0

  for (const question of questions) {
    const record = progress[question.id]
    if (record) {
      seen++
      if (record.box >= MAX_BOX) mastered++
      if (isDue(record, now)) due++
    } else {
      due++
    }
  }

  return { total: questions.length, seen, due, mastered }
}
