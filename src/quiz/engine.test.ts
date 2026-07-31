// src/quiz/engine.test.ts -- JRS 2026-07-28
// Tests: pool construction and topic filtering.

import { describe, expect, it } from 'vitest'
import { SUBSETS } from '../data/subsets'
import { buildPool, topicsInPool } from './engine'
import type { Topic } from './types'

describe('buildPool', () => {
  it('produces a substantial bank for every subset', () => {
    for (const subset of SUBSETS) {
      const pool = buildPool({ subsetId: subset.id })
      expect(pool.length, `${subset.name} is too small`).toBeGreaterThan(50)
    }
  })

  it('scales the bank with the size of the subset', () => {
    const full = buildPool({ subsetId: 'full-primary' }).length
    const half = buildPool({ subsetId: 'half-primary' }).length
    const fundamentals = buildPool({ subsetId: 'fundamentals-beginner' }).length
    expect(full).toBeGreaterThan(half)
    expect(half).toBeGreaterThan(fundamentals)
  })

  it('never asks the same question twice under two ids', () => {
    // Two generators both derived the rounds of Surya Namaskara A, one from the
    // sequence and one from the script, so it was asked twice and kept two
    // review histories. Identical prompt and answer is one fact.
    for (const subset of SUBSETS) {
      const seen = new Map<string, string>()
      for (const question of buildPool({ subsetId: subset.id })) {
        const fact = `${question.prompt} ${question.answer}`
        const previous = seen.get(fact)
        expect(
          previous,
          `${subset.name}: "${question.prompt}" asked as both ${previous} and ${question.id}`,
        ).toBeUndefined()
        seen.set(fact, question.id)
      }
    }
  })

  it('never emits an empty prompt or answer', () => {
    for (const question of buildPool({ subsetId: 'full-primary' })) {
      expect(question.prompt.trim()).not.toBe('')
      expect(question.answer.trim()).not.toBe('')
    }
  })

  it('excludes bank entries that have no answer yet', () => {
    // Unanswered prompts are studio-specific placeholders. Quizzing them would
    // mean showing a blank answer as if it were the truth.
    const pool = buildPool({ subsetId: 'full-primary' })
    const bankQuestions = pool.filter((q) => q.id.startsWith('bank:'))
    for (const question of bankQuestions) {
      expect(question.answer.trim().length).toBeGreaterThan(0)
    }
  })

  it('filters to the requested topics', () => {
    const topics: Topic[] = ['names']
    const pool = buildPool({ subsetId: 'full-primary', topics })
    expect(pool.length).toBeGreaterThan(0)
    for (const question of pool) expect(question.topic).toBe('names')
  })

  it('treats an empty topic list as "all topics"', () => {
    const all = buildPool({ subsetId: 'full-primary' })
    const empty = buildPool({ subsetId: 'full-primary', topics: [] })
    expect(empty.length).toBe(all.length)
  })

  it('falls back to the authored bank for an unknown subset rather than throwing', () => {
    // No poses means nothing to generate from, including the vinyasa questions.
    const pool = buildPool({ subsetId: 'does-not-exist' })
    expect(pool.every((q) => q.id.startsWith('bank:'))).toBe(true)
  })
})

describe('topicsInPool', () => {
  it('lists each topic once', () => {
    const topics = topicsInPool(buildPool({ subsetId: 'full-primary' }))
    expect(new Set(topics).size).toBe(topics.length)
    expect(topics).toContain('sequence-order')
    expect(topics).toContain('vinyasa')
  })
})
