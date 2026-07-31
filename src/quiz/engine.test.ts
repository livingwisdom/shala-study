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

  describe('studying one pose', () => {
    it('keeps only questions about that pose', () => {
      const pool = buildPool({
        subsetId: 'fundamentals-beginner',
        poseId: 'padangusthasana',
      })
      expect(pool.length).toBeGreaterThan(10)
      for (const question of pool) {
        expect(question.poseIds, `${question.id} is not about the pose`).toContain(
          'padangusthasana',
        )
      }
    })

    it('does not over-select on a pose id that nests inside another', () => {
      // `padangusthasana` is a substring of `utthita-hasta-padangusthasana`, so
      // matching on the id rather than the declared poses quietly pulls in the
      // wrong block. This is why questions declare what they're about.
      const pool = buildPool({
        subsetId: 'fundamentals-beginner',
        poseId: 'padangusthasana',
      })
      expect(
        pool.some((question) => question.id.includes('utthita-hasta')),
      ).toBe(false)
    })

    it('includes adjacency from both sides', () => {
      // "What comes after Padangusthasana?" and "what comes before
      // Padahastasana?" are both about Padangusthasana.
      const ids = buildPool({
        subsetId: 'fundamentals-beginner',
        poseId: 'padangusthasana',
      }).map((question) => question.id)
      expect(ids).toContain('next:padangusthasana')
      expect(ids).toContain('prev:padangusthasana')
      // The pose before it is Surya Namaskara B, and "what comes after Surya
      // Namaskara B?" is equally a question about Padangusthasana.
      expect(ids).toContain('next:surya-namaskara-b')
    })

    it('drops questions belonging to no pose', () => {
      const ids = buildPool({
        subsetId: 'fundamentals-beginner',
        poseId: 'padangusthasana',
      }).map((question) => question.id)
      expect(ids).not.toContain('sanskrit-count:1')
      expect(ids.some((id) => id.startsWith('count:'))).toBe(false)
    })
  })

  it('declares which poses each question is about', () => {
    // Only the questions that genuinely belong to no pose may skip it.
    const global = ['sanskrit-count:', 'count:', 'first:', 'last:', 'bank:']
    for (const question of buildPool({ subsetId: 'full-primary' })) {
      if (global.some((prefix) => question.id.startsWith(prefix))) continue
      expect(
        question.poseIds?.length,
        `${question.id} declares no pose`,
      ).toBeGreaterThan(0)
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
