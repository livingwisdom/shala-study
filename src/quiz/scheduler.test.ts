// src/quiz/scheduler.test.ts -- JRS 2026-07-28
// Tests: Leitner promotion, due dates, session selection.

import { describe, expect, it } from 'vitest'
import {
  MAX_BOX,
  grade,
  isDue,
  newRecord,
  selectSession,
  summarise,
  type Progress,
} from './scheduler'
import type { Question } from './types'

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_700_000_000_000

function question(id: string): Question {
  return { id, topic: 'sequence-order', prompt: id, answer: 'a' }
}

describe('grade', () => {
  it('promotes one box on a correct answer', () => {
    expect(grade(newRecord(NOW), true, NOW).box).toBe(2)
  })

  it('drops straight to box 1 on a miss, not down one step', () => {
    const known = { box: 4, lastSeen: NOW, correct: 3, incorrect: 0 }
    expect(grade(known, false, NOW).box).toBe(1)
  })

  it('caps promotion at the top box', () => {
    const top = { box: MAX_BOX, lastSeen: NOW, correct: 9, incorrect: 0 }
    expect(grade(top, true, NOW).box).toBe(MAX_BOX)
  })

  it('creates a record for a question never seen before', () => {
    const record = grade(undefined, true, NOW)
    expect(record.box).toBe(2)
    expect(record.correct).toBe(1)
  })

  it('tallies both outcomes', () => {
    let record = grade(undefined, true, NOW)
    record = grade(record, false, NOW)
    record = grade(record, true, NOW)
    expect(record.correct).toBe(2)
    expect(record.incorrect).toBe(1)
  })
})

describe('isDue', () => {
  it('treats an unseen question as due', () => {
    expect(isDue(undefined, NOW)).toBe(true)
  })

  it('keeps box 1 due immediately', () => {
    expect(isDue({ box: 1, lastSeen: NOW, correct: 0, incorrect: 1 }, NOW)).toBe(true)
  })

  it('holds box 3 for three days', () => {
    const record = { box: 3, lastSeen: NOW, correct: 2, incorrect: 0 }
    expect(isDue(record, NOW + 2 * DAY)).toBe(false)
    expect(isDue(record, NOW + 3 * DAY)).toBe(true)
  })

  it('holds the top box for three weeks', () => {
    const record = { box: MAX_BOX, lastSeen: NOW, correct: 5, incorrect: 0 }
    expect(isDue(record, NOW + 20 * DAY)).toBe(false)
    expect(isDue(record, NOW + 21 * DAY)).toBe(true)
  })
})

describe('selectSession', () => {
  const questions = ['a', 'b', 'c', 'd'].map(question)

  it('puts unseen questions first', () => {
    const progress: Progress = {
      a: { box: 1, lastSeen: NOW - DAY, correct: 0, incorrect: 1 },
    }
    const session = selectSession(questions, progress, NOW, 10)
    expect(session[0]?.id).not.toBe('a')
    expect(session).toHaveLength(4)
  })

  it('orders due questions worst-known first', () => {
    const progress: Progress = {
      a: { box: 4, lastSeen: NOW - 30 * DAY, correct: 4, incorrect: 0 },
      b: { box: 1, lastSeen: NOW - 30 * DAY, correct: 0, incorrect: 3 },
      c: { box: 2, lastSeen: NOW - 30 * DAY, correct: 1, incorrect: 1 },
      d: { box: 3, lastSeen: NOW - 30 * DAY, correct: 2, incorrect: 1 },
    }
    const session = selectSession(questions, progress, NOW, 10)
    expect(session.map((q) => q.id)).toEqual(['b', 'c', 'd', 'a'])
  })

  it('excludes questions that are not due yet', () => {
    const progress: Progress = {
      a: { box: 5, lastSeen: NOW, correct: 5, incorrect: 0 },
      b: { box: 5, lastSeen: NOW, correct: 5, incorrect: 0 },
      c: { box: 5, lastSeen: NOW, correct: 5, incorrect: 0 },
      d: { box: 5, lastSeen: NOW, correct: 5, incorrect: 0 },
    }
    expect(selectSession(questions, progress, NOW, 10)).toHaveLength(0)
  })

  it('respects the session limit', () => {
    expect(selectSession(questions, {}, NOW, 2)).toHaveLength(2)
  })
})

describe('summarise', () => {
  it('counts unseen questions as due', () => {
    const stats = summarise(['a', 'b'].map(question), {}, NOW)
    expect(stats).toEqual({ total: 2, seen: 0, due: 2, mastered: 0 })
  })

  it('counts top-box questions as mastered', () => {
    const progress: Progress = {
      a: { box: MAX_BOX, lastSeen: NOW, correct: 5, incorrect: 0 },
    }
    const stats = summarise(['a', 'b'].map(question), progress, NOW)
    expect(stats).toEqual({ total: 2, seen: 1, due: 1, mastered: 1 })
  })
})
