// src/quiz/scheduler.test.ts -- JRS 2026-07-28
// Tests: Leitner promotion, due dates, session selection.

import { describe, expect, it } from 'vitest'
import { rngFor } from './random'
import {
  MAX_BOX,
  boxDistribution,
  boxIntervalLabel,
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

/** A fresh generator off a fixed seed, so a shuffled session is assertable. */
const rng = () => rngFor('test-seed')

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
    const session = selectSession(questions, progress, NOW, 10, rng())
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
    const session = selectSession(questions, progress, NOW, 10, rng())
    expect(session.map((q) => q.id)).toEqual(['b', 'c', 'd', 'a'])
  })

  it('excludes questions that are not due yet', () => {
    const progress: Progress = {
      a: { box: 5, lastSeen: NOW, correct: 5, incorrect: 0 },
      b: { box: 5, lastSeen: NOW, correct: 5, incorrect: 0 },
      c: { box: 5, lastSeen: NOW, correct: 5, incorrect: 0 },
      d: { box: 5, lastSeen: NOW, correct: 5, incorrect: 0 },
    }
    expect(selectSession(questions, progress, NOW, 10, rng())).toHaveLength(0)
  })

  it('respects the session limit', () => {
    expect(selectSession(questions, {}, NOW, 2, rng())).toHaveLength(2)
  })

  /**
   * The pool arrives in practice order, so taking the first 20 unseen means a
   * first session of nothing but Surya Namaskara A, in count order.
   */
  it('spreads a session across the pool rather than taking it in order', () => {
    const pool = Array.from({ length: 100 }, (_, i) =>
      question(`q${String(i).padStart(2, '0')}`),
    )
    const ids = selectSession(pool, {}, NOW, 20, rng()).map((q) => q.id)

    expect(ids).toHaveLength(20)
    expect(ids).not.toEqual(pool.slice(0, 20).map((q) => q.id))
    // Something from the back half proves it reaches past the opening poses.
    expect(ids.some((id) => Number(id.slice(1)) >= 50)).toBe(true)
    expect(new Set(ids).size).toBe(20)
  })

  it('gives the same order twice for the same seed', () => {
    const pool = Array.from({ length: 30 }, (_, i) => question(`q${i}`))
    const first = selectSession(pool, {}, NOW, 20, rngFor('seed')).map((q) => q.id)
    const second = selectSession(pool, {}, NOW, 20, rngFor('seed')).map((q) => q.id)
    expect(second).toEqual(first)
  })
})

describe('boxIntervalLabel', () => {
  it('says when the box comes back, in the interval table\'s own terms', () => {
    // Derived, not written out twice: shortening an interval must relabel the
    // chart rather than leave it quietly lying.
    expect(boxIntervalLabel(1)).toBe('again')
    expect(boxIntervalLabel(2)).toBe('1 day')
    expect(boxIntervalLabel(3)).toBe('3 days')
    expect(boxIntervalLabel(4)).toBe('1 wk')
    expect(boxIntervalLabel(MAX_BOX)).toBe('3 wks')
  })

  it('gives every box a label', () => {
    for (let box = 1; box <= MAX_BOX; box++) {
      expect(boxIntervalLabel(box).trim()).not.toBe('')
    }
  })
})

describe('boxDistribution', () => {
  it('counts unseen questions apart from the boxes', () => {
    const progress: Progress = {
      a: { box: 1, lastSeen: NOW, correct: 0, incorrect: 1 },
      b: { box: 3, lastSeen: NOW, correct: 2, incorrect: 0 },
    }
    const distribution = boxDistribution(['a', 'b', 'c', 'd'].map(question), progress)
    expect(distribution.unseen).toBe(2)
    expect(distribution.boxes[1]).toBe(1)
    expect(distribution.boxes[3]).toBe(1)
    expect(distribution.boxes[5]).toBe(0)
  })

  it('accounts for every question exactly once', () => {
    const progress: Progress = {
      a: { box: 2, lastSeen: NOW, correct: 1, incorrect: 0 },
      b: { box: MAX_BOX, lastSeen: NOW, correct: 4, incorrect: 0 },
    }
    const questions = ['a', 'b', 'c'].map(question)
    const { unseen, boxes } = boxDistribution(questions, progress)
    const counted = unseen + boxes.reduce((sum, n) => sum + n, 0)
    expect(counted).toBe(questions.length)
  })

  it('clamps a box value that came back out of range', () => {
    // localStorage is editable and survives version changes; an out-of-range
    // box must land somewhere rather than vanish from the total.
    const progress: Progress = {
      a: { box: 99, lastSeen: NOW, correct: 9, incorrect: 0 },
      b: { box: 0, lastSeen: NOW, correct: 0, incorrect: 0 },
    }
    const { unseen, boxes } = boxDistribution(['a', 'b'].map(question), progress)
    expect(unseen).toBe(0)
    expect(boxes[MAX_BOX]).toBe(1)
    expect(boxes[1]).toBe(1)
  })
})

describe('summarise', () => {
  it('counts unseen questions as due', () => {
    const stats = summarise(['a', 'b'].map(question), {}, NOW)
    expect(stats).toEqual({ total: 2, seen: 0, due: 2, reviewDue: 0, mastered: 0 })
  })

  it('counts top-box questions as mastered', () => {
    const progress: Progress = {
      a: { box: MAX_BOX, lastSeen: NOW, correct: 5, incorrect: 0 },
    }
    const stats = summarise(['a', 'b'].map(question), progress, NOW)
    expect(stats).toEqual({ total: 2, seen: 1, due: 1, reviewDue: 0, mastered: 1 })
  })

  it('keeps review separate from new, which the box row already shows', () => {
    const progress: Progress = {
      // Seen, box 1, last seen long enough ago to have come round again.
      a: { box: 1, lastSeen: NOW - 30 * DAY, correct: 0, incorrect: 1 },
      // Seen but not due for weeks.
      b: { box: MAX_BOX, lastSeen: NOW, correct: 5, incorrect: 0 },
    }
    const stats = summarise(['a', 'b', 'c'].map(question), progress, NOW)
    expect(stats.reviewDue).toBe(1)
    // Unseen 'c' still counts towards what a session can draw on.
    expect(stats.due).toBe(2)
  })
})
