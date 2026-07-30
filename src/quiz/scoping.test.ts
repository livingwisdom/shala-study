// src/quiz/scoping.test.ts -- JRS 2026-07-29
// Tests: subset-scoped question ids never disagree on an answer.

import { describe, expect, it } from 'vitest'
import { SUBSETS, getSubset, posesInSubset } from '../data/subsets'
import { generateQuestions } from './generators'
import { buildPool } from './engine'

function poolFor(subsetId: string) {
  const subset = getSubset(subsetId)
  if (!subset) throw new Error(`No subset ${subsetId}`)
  return generateQuestions(posesInSubset(subset), {
    id: subset.id,
    name: subset.name,
  })
}

function byId(questions: ReturnType<typeof poolFor>) {
  return new Map(questions.map((question) => [question.id, question]))
}

const fundamentals = byId(poolFor('fundamentals'))
const full = byId(poolFor('full-primary'))
const half = byId(poolFor('half-primary'))

describe('subset scoping', () => {
  it('never lets two subsets disagree about the answer to one question id', () => {
    // This is the whole point. A shared id with different answers means both
    // sequences write to one review record, and the scheduler credits you for
    // an answer you were never asked to give.
    for (const [id, question] of fundamentals) {
      const other = full.get(id)
      if (!other) continue
      expect(other.answer, `"${id}" disagrees across subsets`).toBe(question.answer)
    }
    for (const [id, question] of half) {
      const other = full.get(id)
      if (!other) continue
      expect(other.answer, `"${id}" disagrees across subsets`).toBe(question.answer)
    }
  })

  it('scopes the id when the answer depends on the cut', () => {
    // Paschimottanasana B is followed by Purvottanasana in Fundamentals (which
    // takes A and B only) and by C in the full series. Same question id would
    // mean one review record for two different facts.
    expect(fundamentals.has('next:paschimottanasana-b')).toBe(false)
    expect(fundamentals.get('next:fundamentals:paschimottanasana-b')?.answer).toBe(
      'Purvottanasana',
    )
    expect(full.get('next:paschimottanasana-b')?.answer).toBe(
      'Paschimottanasana C',
    )
  })

  it('says which sequence it means when the answer depends on it', () => {
    const scopedQuestion = fundamentals.get('next:fundamentals:paschimottanasana-b')
    expect(scopedQuestion?.prompt).toContain('In Fundamentals')
  })

  it('leaves shared facts unscoped so progress carries across subsets', () => {
    // Padangusthasana is followed by Padahastasana in every sequence -- one
    // fact, one record. Re-keying it per subset would make you learn it thrice.
    for (const pool of [fundamentals, half, full]) {
      expect(pool.get('next:padangusthasana')?.answer).toBe('Padahastasana')
    }
    expect(fundamentals.has('next:fundamentals:padangusthasana')).toBe(false)
  })

  it('does not clutter unscoped prompts with a sequence name', () => {
    expect(fundamentals.get('next:padangusthasana')?.prompt).not.toContain(
      'In Fundamentals',
    )
  })

  it('scopes section counts, which shrink with the cut', () => {
    expect(fundamentals.has('count:seated')).toBe(false)
    expect(fundamentals.get('count:fundamentals:seated')?.prompt).toContain(
      'In Fundamentals',
    )
    expect(full.get('count:seated')).toBeDefined()
  })

  it('scopes section boundaries that move', () => {
    // Fundamentals ends the seated section at Janu Sirsasana A.
    expect(fundamentals.get('last:fundamentals:seated')?.answer).toBe(
      'Janu Sirsasana A',
    )
    expect(full.get('last:seated')?.answer).toBe('Setu Bandhasana')
  })

  it('leaves full primary as the unscoped baseline', () => {
    // Nothing differs from the full series when you are studying the full
    // series, so every id should be plain.
    for (const id of full.keys()) {
      expect(id).not.toContain(':full-primary:')
    }
  })

  it('holds across every pair of subsets through the real pool builder', () => {
    const pools = SUBSETS.map((subset) => byId(buildPool({ subsetId: subset.id })))
    for (const a of pools) {
      for (const b of pools) {
        if (a === b) continue
        for (const [id, question] of a) {
          const other = b.get(id)
          if (!other) continue
          expect(other.answer, `"${id}" disagrees across subsets`).toBe(
            question.answer,
          )
        }
      }
    }
  })
})
