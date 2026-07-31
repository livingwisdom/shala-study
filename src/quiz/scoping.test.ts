// src/quiz/scoping.test.ts -- JRS 2026-07-29
// Tests: subset-scoped question ids never disagree on an answer.

import { describe, expect, it } from 'vitest'
import { SUBSETS, getSubset, posesInSubset, questionContext } from '../data/subsets'
import { generateQuestions } from './generators'
import { buildPool } from './engine'

function poolFor(subsetId: string) {
  const subset = getSubset(subsetId)
  if (!subset) throw new Error(`No subset ${subsetId}`)
  return generateQuestions(posesInSubset(subset), questionContext(subset))
}

function byId(questions: ReturnType<typeof poolFor>) {
  return new Map(questions.map((question) => [question.id, question]))
}

const fundamentals = byId(poolFor('fundamentals-beginner'))
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

  it('keys by the answer when it depends on the cut', () => {
    // Paschimottanasana B is followed by Purvottanasana in Beginner (which
    // takes A and B only) and by C in the full series. One id for both would
    // mean one review record for two different facts.
    expect(fundamentals.has('next:paschimottanasana-b')).toBe(false)
    expect(
      fundamentals.get('next:paschimottanasana-b:purvottanasana')?.answer,
    ).toBe('Purvottanasana')
    expect(full.get('next:paschimottanasana-b')?.answer).toBe(
      'Paschimottanasana C',
    )
  })

  it('says which sequence it means when the answer depends on it', () => {
    const scopedQuestion = fundamentals.get(
      'next:paschimottanasana-b:purvottanasana',
    )
    expect(scopedQuestion?.prompt).toContain('In Fundamentals')
  })

  it('shares one record between sequences that agree but differ from primary', () => {
    // Intermediate and Advanced both follow Paschimottanasana B with D, where
    // the full series has C. That is one fact learned once, not twice: keying
    // by sequence rather than by answer would split it in two.
    const intermediate = byId(poolFor('fundamentals-intermediate'))
    const advanced = byId(poolFor('fundamentals-advanced'))
    const id = 'next:paschimottanasana-b:paschimottanasana-d'

    expect(intermediate.get(id)?.answer).toBe('Paschimottanasana D')
    expect(advanced.get(id)?.answer).toBe('Paschimottanasana D')
    expect(full.has(id)).toBe(false)
  })

  it('shares a fact the informal poses used to split', () => {
    // Every sequence answers Yoga Mudra after the headstand now that Balasana
    // and Baddha Padmasana generate nothing. It was split three ways when the
    // full series answered with a pose the shala never names.
    const intermediate = byId(poolFor('fundamentals-intermediate'))
    for (const pool of [intermediate, full]) {
      expect(pool.get('next:sirsasana-b')?.answer).toBe('Yoga Mudra')
    }
  })

  it('still separates sequences that genuinely disagree', () => {
    // Beginner goes to the backbend after Janu Sirsasana A; Intermediate goes
    // on to Janu Sirsasana B, which is also what the full series does.
    const intermediate = byId(poolFor('fundamentals-intermediate'))
    expect(
      fundamentals.get('next:janu-sirsasana-a:urdhva-dhanurasana')?.answer,
    ).toBe('Urdhva Dhanurasana')
    expect(intermediate.get('next:janu-sirsasana-a')?.answer).toBe(
      'Janu Sirsasana B',
    )
  })

  it('scopes a block whose end moves with the group exit', () => {
    // Paschimottanasana B carries the group's exit vinyasa when D isn't in the
    // sequence, so the same block genuinely ends in two different places.
    expect(
      fundamentals.get('script-last:paschimottanasana-b:caturdasha-14')?.answer,
    ).toBe('caturdasha (14)')
    expect(full.get('script-last:paschimottanasana-b')?.answer).toBe('dasha (10)')
  })

  it('leaves shared facts unscoped so progress carries across subsets', () => {
    // Padangusthasana is followed by Padahastasana in every sequence -- one
    // fact, one record. Re-keying it per subset would make you learn it thrice.
    for (const pool of [fundamentals, half, full]) {
      expect(pool.get('next:padangusthasana')?.answer).toBe('Padahastasana')
    }
    expect(fundamentals.has('next:padangusthasana:padahastasana')).toBe(false)
  })

  it('does not clutter unscoped prompts with a sequence name', () => {
    expect(fundamentals.get('next:padangusthasana')?.prompt).not.toContain(
      'In Fundamentals',
    )
  })

  it('scopes section counts, which shrink with the cut', () => {
    expect(fundamentals.has('count:seated')).toBe(false)
    expect(fundamentals.get('count:seated:7')?.prompt).toContain('In Fundamentals')
    expect(full.get('count:seated')).toBeDefined()
  })

  it('scopes section boundaries that move', () => {
    // Beginner ends the seated section at Janu Sirsasana A.
    expect(fundamentals.get('last:seated:janu-sirsasana-a')?.answer).toBe(
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

  describe('which level teaches a pose', () => {
    const beginnerPool = byId(buildPool({ subsetId: 'fundamentals-beginner' }))
    const advancedPool = byId(buildPool({ subsetId: 'fundamentals-advanced' }))

    it('answers with the first level that includes it', () => {
      // Always the qualified name: a bare "Intermediate" reads as Second
      // Series to an Ashtangi, not as the middle Fundamentals level.
      expect(beginnerPool.get('level-of:padangusthasana')?.answer).toBe(
        'Fundamentals (Beginner)',
      )
      expect(beginnerPool.get('level-of:salamba-sarvangasana')?.answer).toBe(
        'Fundamentals (Intermediate)',
      )
      expect(beginnerPool.get('level-of:marichyasana-a')?.answer).toBe(
        'Fundamentals (Advanced)',
      )
    })

    it('asks about the whole group, not just the level being studied', () => {
      // Studying Beginner should still tell you what Advanced adds -- that is
      // the boundary a teacher gets caught by.
      expect(beginnerPool.has('level-of:uttana-padasana')).toBe(true)
    })

    it('keys by pose, so every level builds one history', () => {
      const id = 'level-of:karnapidasana'
      expect(beginnerPool.get(id)?.answer).toBe('Fundamentals (Intermediate)')
      expect(advancedPool.get(id)?.answer).toBe('Fundamentals (Intermediate)')
    })

    it('stays out of sequences that have no levels', () => {
      const fullPool = byId(buildPool({ subsetId: 'full-primary' }))
      expect([...fullPool.keys()].some((id) => id.startsWith('level-of:'))).toBe(
        false,
      )
    })
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
