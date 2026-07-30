// src/quiz/generators.test.ts -- JRS 2026-07-29
// Tests: question generation from sequence and script.

import { describe, expect, it } from 'vitest'
import { POSES, posesInSection } from '../data/sequence'
import { getSubset, posesInSubset } from '../data/subsets'
import { SANSKRIT_COUNT } from '../data/script'
import { generateQuestions } from './generators'

const allQuestions = generateQuestions(POSES)

function find(id: string) {
  const question = allQuestions.find((q) => q.id === id)
  if (!question) throw new Error(`No question with id ${id}`)
  return question
}

describe('question ids', () => {
  it('are unique', () => {
    // Progress records key off question ids. A collision would silently make
    // two questions share a review history.
    const ids = allQuestions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('are stable across regeneration', () => {
    const second = generateQuestions(POSES)
    expect(second.map((q) => q.id)).toEqual(allQuestions.map((q) => q.id))
  })
})

describe('choices', () => {
  it('always contain the answer', () => {
    for (const question of allQuestions) {
      if (!question.choices) continue
      expect(question.choices).toContain(question.answer)
    }
  })

  it('contain no duplicates', () => {
    for (const question of allQuestions) {
      if (!question.choices) continue
      expect(new Set(question.choices).size).toBe(question.choices.length)
    }
  })

  it('are ordered deterministically', () => {
    const again = generateQuestions(POSES)
    for (const question of allQuestions) {
      const match = again.find((q) => q.id === question.id)
      expect(match?.choices).toEqual(question.choices)
    }
  })

  it('offer more than one option', () => {
    for (const question of allQuestions) {
      if (!question.choices) continue
      expect(question.choices.length).toBeGreaterThan(1)
    }
  })
})

describe('adjacency', () => {
  it('answers "what comes after" from the sequence', () => {
    expect(find('next:padangusthasana').answer).toBe('Padahastasana')
    expect(find('next:utthita-trikonasana').answer).toBe('Parivrtta Trikonasana')
  })

  it('answers "what comes before" from the sequence', () => {
    expect(find('prev:padahastasana').answer).toBe('Padangusthasana')
    expect(find('prev:navasana').answer).toBe('Marichyasana D')
  })

  it('never offers the pose named in the prompt as an option', () => {
    // Nothing follows or precedes itself. Offering the subject is an option the
    // reader can discard without knowing anything, which makes the question
    // easier than it looks and reads as a bug.
    for (const question of allQuestions) {
      if (!question.id.startsWith('next:') && !question.id.startsWith('prev:')) {
        continue
      }
      const subject = POSES.find((pose) => pose.id === question.id.split(':')[1])
      if (!subject || !question.choices) continue
      expect(
        question.choices,
        `${question.id} offers its own subject`,
      ).not.toContain(subject.sanskrit)
    }
  })

  it('still offers a full set of options after excluding the subject', () => {
    // The exclusion must not quietly shrink adjacency questions to two options.
    const adjacency = allQuestions.filter(
      (q) => q.id.startsWith('next:') || q.id.startsWith('prev:'),
    )
    expect(adjacency.length).toBeGreaterThan(0)
    for (const question of adjacency) {
      expect(question.choices?.length, `${question.id} lost options`).toBe(4)
    }
  })

  it('generates no "next" for the final pose', () => {
    const last = POSES[POSES.length - 1]
    expect(allQuestions.find((q) => q.id === `next:${last?.id}`)).toBeUndefined()
  })

  it('generates no "previous" for the first pose', () => {
    const first = POSES[0]
    expect(allQuestions.find((q) => q.id === `prev:${first?.id}`)).toBeUndefined()
  })
})

describe('section structure', () => {
  it('counts match the underlying data', () => {
    for (const section of ['standing', 'seated', 'finishing'] as const) {
      const expected = posesInSection(section).length
      expect(find(`count:${section}`).answer).toBe(String(expected))
    }
  })

  it('never offers a non-positive count as a distractor', () => {
    for (const question of allQuestions) {
      if (!question.id.startsWith('count:') || !question.choices) continue
      for (const choice of question.choices) {
        expect(Number(choice)).toBeGreaterThan(0)
      }
    }
  })

  it('identifies section boundaries', () => {
    expect(find('first:standing').answer).toBe('Padangusthasana')
    expect(find('last:standing').answer).toBe('Virabhadrasana B')
    expect(find('first:seated').answer).toBe('Dandasana')
    expect(find('last:seated').answer).toBe('Setu Bandhasana')
  })
})

describe('the counted method', () => {
  it('knows which count is held in each salutation', () => {
    // Only the downward dog is held; every other position passes on one breath.
    expect(find('script-held:surya-namaskara-a').answer).toBe('sat (6)')
    expect(find('script-held:surya-namaskara-b').answer).toBe('caturdasha (14)')
  })

  it('knows how long the hold is', () => {
    expect(find('script-hold-breaths:surya-namaskara-a').answer).toBe('5')
    expect(find('script-hold-breaths:paschimottanasana-closing').answer).toBe('10')
  })

  it('knows the rounds the shala teaches', () => {
    // Three rounds of B here, not the five you'll find in most books.
    expect(find('script-rounds:surya-namaskara-a').answer).toBe('5')
    expect(find('script-rounds:surya-namaskara-b').answer).toBe('3')
  })

  it('knows where the running count picks up', () => {
    expect(find('script-start:surya-namaskara-a').answer).toBe('ekam (1)')
    expect(find('script-start:dandasana').answer).toBe('sapta (7)')
    expect(find('script-start:parivrtta-trikonasana').answer).toBe('dve (2)')
  })

  it('uses the corrected Sanskrit ordinals', () => {
    expect(find('sanskrit-count:2').answer).toBe('dve')
    expect(find('sanskrit-count:4').answer).toBe('catvari')
    expect(find('sanskrit-count:12').answer).toBe('dvadasha')
    expect(find('sanskrit-count:20').answer).toBe('vimshatih')
  })

  it('covers every ordinal the script uses', () => {
    for (let n = 1; n <= SANSKRIT_COUNT.length; n++) {
      expect(find(`sanskrit-count:${n}`).answer).toBe(SANSKRIT_COUNT[n - 1])
    }
  })

  it('asks the breath for each counted step', () => {
    expect(find('script-breath:surya-namaskara-a:3:4').answer).toBe('exhale')
    expect(find('script-breath:surya-namaskara-a:4:5').answer).toBe('inhale')
  })
})

describe('cues and adaptations', () => {
  it('asks cues as free recall rather than multiple choice', () => {
    // Picking a cue off a list isn't the skill; producing it is.
    const cue = find('script-cue:surya-namaskara-a:0:1')
    expect(cue.choices).toBeUndefined()
    expect(cue.answer).toContain('hands up')
  })

  it('quizzes the adaptations offered for held poses', () => {
    const adaptation = allQuestions.find((q) =>
      q.id.startsWith('script-adaptation:utthita-hasta-padangusthasana'),
    )
    expect(adaptation).toBeDefined()
    expect(adaptation?.answer).toContain('strap')
  })
})

describe('gaze', () => {
  it('prefers the shala’s wording over the traditional drishti', () => {
    // The script says "belly" for downward dog, where books say the nose.
    expect(find('gaze:parsvottanasana').answer).toBe('belly')
    expect(find('gaze:utkatasana').answer).toBe('thumbs')
  })

  it('does not flag script-sourced gaze as unverified', () => {
    expect(find('gaze:parsvottanasana').unverified).toBeUndefined()
  })

  it('asks about the held position, since transitional gazes are excluded', () => {
    // Surya Namaskara A looks at three different things across nine vinyasas.
    // Only the held downward dog has an answer, so the prompt must say which.
    expect(find('gaze:surya-namaskara-a').prompt).toBe(
      'In Surya Namaskara A, where is the gaze in the held position?',
    )
    expect(find('gaze:surya-namaskara-a').answer).toBe('belly')
  })

  it('keeps the plain wording for seeded gaze, which has no counted steps', () => {
    expect(find('gaze:marichyasana-c').prompt).toBe(
      'Where is the gaze in Marichyasana C?',
    )
  })

  it('flags seeded gaze as unverified', () => {
    // Poses the script doesn't cover fall back to traditional values.
    const seeded = find('gaze:marichyasana-c')
    expect(seeded.unverified).toBe(true)
  })

  it('generates nothing where the script records no gaze', () => {
    // The script writes "(gaze ?)" for these -- a real gap, not a default.
    expect(allQuestions.find((q) => q.id === 'gaze:janu-sirsasana-a')).toBeUndefined()
    expect(
      allQuestions.find((q) => q.id === 'gaze:trianga-mukha-ekapada-paschimottanasana'),
    ).toBeUndefined()
  })
})

describe('missing data', () => {
  it('generates no breath question where breaths are unrecorded', () => {
    // Shoulderstand and headstand hold for a teacher-dependent count, so the
    // data leaves them blank rather than asserting a number.
    expect(
      allQuestions.find((q) => q.id === 'breaths:salamba-sarvangasana'),
    ).toBeUndefined()
    expect(allQuestions.find((q) => q.id === 'breaths:sirsasana')).toBeUndefined()
  })
})

describe('subset awareness', () => {
  it('answers adjacency relative to the subset being studied', () => {
    const fundamentals = getSubset('fundamentals')
    if (!fundamentals) throw new Error('missing fundamentals subset')
    const questions = generateQuestions(posesInSubset(fundamentals))

    // Fundamentals stops after Janu Sirsasana A and goes to the backbend.
    const afterJanu = questions.find((q) => q.id === 'next:janu-sirsasana-a')
    expect(afterJanu?.answer).toBe('Urdhva Dhanurasana')
  })

  it('keeps full primary intact for comparison', () => {
    expect(find('next:janu-sirsasana-a').answer).toBe('Janu Sirsasana B')
  })

  it('omits script questions for poses outside the subset', () => {
    const fundamentals = getSubset('fundamentals')
    if (!fundamentals) throw new Error('missing fundamentals subset')
    const ids = new Set(
      generateQuestions(posesInSubset(fundamentals)).map((q) => q.id),
    )
    // Paschimottanasana C isn't taught here, so nothing should ask about it.
    expect(ids.has('gaze:paschimottanasana-c')).toBe(false)
    expect(ids.has('next:paschimottanasana-c')).toBe(false)
  })
})
