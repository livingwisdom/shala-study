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
  it('counts match the underlying data, minus the informal poses', () => {
    // Rest after headstand happens but isn't one of the poses you'd list.
    for (const section of ['standing', 'seated', 'finishing'] as const) {
      const expected = posesInSection(section).filter(
        (pose) => !pose.informal,
      ).length
      expect(find(`count:${section}`).answer).toBe(String(expected))
    }
  })

  it('steps over informal poses when asking what comes next', () => {
    // Balasana and Baddha Padmasana sit between them in the data; neither is
    // an answer anyone would give.
    expect(find('next:sirsasana-b').answer).toBe('Yoga Mudra')
    expect(find('prev:yoga-mudra').answer).toBe('Baddha Hasta Sirsasana B')
  })

  it('asks nothing at all about an informal pose', () => {
    for (const question of allQuestions) {
      expect(question.poseIds ?? [], question.id).not.toContain('balasana')
      expect(question.poseIds ?? [], question.id).not.toContain('baddha-padmasana')
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

describe('the shape of a block', () => {
  it('knows where a block ends and how long it runs', () => {
    expect(find('script-last:surya-namaskara-a').answer).toBe('nava (9)')
    expect(find('script-length:surya-namaskara-a').answer).toBe('9')
    expect(find('script-last:surya-namaskara-b').answer).toBe('saptadasha (17)')
  })
})

describe('cues read backwards', () => {
  it('asks which count a cue belongs to', () => {
    const question = allQuestions.find(
      (q) =>
        q.id.startsWith('script-cue-count:surya-namaskara-a') &&
        q.prompt.includes('hop or step back'),
    )
    expect(question?.answer).toBe('catvari (4)')
    // Reads as a sentence rather than "Pose -- question": the block name is
    // context, so it belongs in the sentence, not in front of it.
    expect(question?.prompt.startsWith('During Surya Namaskara A, on which')).toBe(
      true,
    )
  })

  it('skips cues the block says more than once', () => {
    // Utthita Hasta Padangusthasana says "fold forward" on four counts, so the
    // question would have four right answers and accept one.
    const repeated = allQuestions.filter(
      (q) =>
        q.id.startsWith('script-cue-count:utthita-hasta-padangusthasana') &&
        q.prompt.includes('fold forward'),
    )
    expect(repeated).toHaveLength(0)
  })

  it('offers other counts from the same block as the wrong answers', () => {
    const question = allQuestions.find((q) =>
      q.id.startsWith('script-cue-count:surya-namaskara-a'),
    )
    expect(question?.choices?.length).toBeGreaterThan(1)
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

describe('the shala\'s other names', () => {
  it('asks which pose an alias refers to', () => {
    expect(find('alias-of:parivrtta-trikonasana').answer).toBe('Parivrtta Trikonasana')
    expect(find('alias-of:parivrtta-trikonasana').prompt).toContain(
      'Utthita Trikonasana B',
    )
    expect(find('alias-of:parsvottanasana').prompt).toContain('Pyramid Pose')
  })

  it('offers the A/B counterpart as a wrong answer', () => {
    // The whole hazard of the A/B naming is confusing the two, so the pose it
    // is most easily mistaken for has to be on the list.
    expect(find('alias-of:parivrtta-trikonasana').choices).toContain(
      'Utthita Trikonasana',
    )
  })

  it('never asks with a name that contains the answer', () => {
    // "Utthita Trikonasana A is another name for which pose?" answers itself.
    for (const question of allQuestions) {
      if (!question.id.startsWith('alias-of:')) continue
      expect(
        question.prompt.includes(question.answer),
        `${question.id} gives itself away`,
      ).toBe(false)
    }
  })

  it('asks the other direction too, as free recall', () => {
    const recallQuestion = find('alias:parsvottanasana')
    expect(recallQuestion.answer).toBe('Pyramid Pose')
    expect(recallQuestion.choices).toBeUndefined()
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

describe('uncounted breaths', () => {
  it('asks the cue and the breath for a mid-block uncounted step', () => {
    // The count skips this breath, which is exactly why it gets lost.
    expect(find('script-uncounted-cue:prasarita-padottanasana-a:2').prompt).toBe(
      'Prasarita Padottanasana A -- what do you say on the uncounted inhale between dve (2) and trini (3)?',
    )
    expect(find('script-uncounted-breath:prasarita-padottanasana-a:2').answer).toBe(
      'inhale',
    )
  })

  it('locates a trailing uncounted step by the count before it', () => {
    expect(find('script-uncounted-cue:surya-namaskara-a:9').answer).toBe('samasthiti')
    expect(find('script-uncounted-cue:surya-namaskara-a:9').prompt).toContain(
      'after nava (9)',
    )
  })

  it('asks how many a block has', () => {
    expect(find('uncounted-count:prasarita-padottanasana-a').answer).toBe('3')
  })
})

describe('missing data', () => {
  it('generates no breath question where breaths are unrecorded', () => {
    // Parvatasana is the remaining case: the shala gave the shapes but not the
    // counts, so the questions stay absent rather than guessing.
    expect(allQuestions.find((q) => q.id === 'breaths:parvatasana-a')).toBeUndefined()
    expect(allQuestions.find((q) => q.id === 'breaths:parvatasana-b')).toBeUndefined()
  })

  it('asks the long holds the shala gave', () => {
    // Ten breaths each, and the seals agree with the script, which said so all
    // along while the seeded data said five.
    for (const poseId of [
      'salamba-sarvangasana',
      'yoga-mudra',
      'padmasana',
      'paschimottanasana-closing',
    ]) {
      expect(find(`breaths:${poseId}`).answer, poseId).toBe('10')
    }
  })

  it('asks the headstand holds, which the pacing sheet did record', () => {
    // 15 and 10 traditionally. Blank until the shala supplied them.
    expect(find('breaths:sirsasana-a').answer).toContain('15')
    expect(find('breaths:sirsasana-b').answer).toContain('10')
  })
})

describe('subset awareness', () => {
  it('answers adjacency relative to the subset being studied', () => {
    const fundamentals = getSubset('fundamentals-beginner')
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
    const fundamentals = getSubset('fundamentals-beginner')
    if (!fundamentals) throw new Error('missing fundamentals subset')
    const ids = new Set(
      generateQuestions(posesInSubset(fundamentals)).map((q) => q.id),
    )
    // Paschimottanasana C isn't taught here, so nothing should ask about it.
    expect(ids.has('gaze:paschimottanasana-c')).toBe(false)
    expect(ids.has('next:paschimottanasana-c')).toBe(false)
  })
})
