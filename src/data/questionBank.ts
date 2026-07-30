// src/data/questionBank.ts -- JRS 2026-07-28
// Hand-authored questions that can't be derived from the sequence.

/**
 * Hand-authored questions: the things that can't be derived from the sequence.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MOST ANSWERS HERE ARE DELIBERATELY BLANK.
 *
 * Room setup, mat layout, what you ask students, what you may assume, and the
 * pregnancy and menstruation guidance are all *the shala's* answers -- they vary
 * between studios and lineages, and they're exactly what you'll be examined on.
 * An invented answer here would be worse than no answer: you'd memorise it,
 * repeat it in an exam, and eventually teach it to a student.
 *
 * So the prompts are written out and the answers are left empty. Fill them from
 * your training notes. An entry with an empty `answer` is skipped by the quiz
 * and listed under "Needs answers" in the app until you complete it.
 *
 * Add your past quiz questions here too -- those are the highest-signal items in
 * the whole app, because they're the actual assessment format.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Topic } from '../quiz/types'

export interface BankEntry {
  id: string
  topic: Topic
  prompt: string
  /** Empty string means "not yet filled in". Never guess. */
  answer: string
  explanation?: string
  /** Set when the answer is seeded from general sources, not the shala's. */
  unverified?: boolean
}

export const QUESTION_BANK: readonly BankEntry[] = [
  // ── Opening and closing ───────────────────────────────────────────────────
  {
    id: 'opening-chant-text',
    topic: 'studio',
    prompt: 'What is the opening invocation?',
    answer:
      'Vande gurūṇāṃ caraṇāravinde / sandarśita svātma sukhāva bodhe / niḥ śreyase jāṅgalikāyamāne / saṃsāra hālāhala moha śāntyai // Ābāhu puruṣākāraṃ / śaṅkhacakrāsi dhāriṇam / sahasra śirasaṃ śvetaṃ / praṇamāmi patañjalim //',
    explanation:
      'Standard Ashtanga opening invocation to Patanjali. Check the shala’s transliteration and how much of it you are expected to recite.',
    unverified: true,
  },
  {
    id: 'closing-chant-text',
    topic: 'studio',
    prompt: 'What is the closing invocation (Mangala Mantra)?',
    answer:
      'Svasti prajābhyaḥ paripālayantāṃ / nyāyena mārgeṇa mahīṃ mahīśāḥ / go-brāhmaṇebhyaḥ śubham astu nityaṃ / lokāḥ samastāḥ sukhino bhavantu //',
    explanation: 'Check the shala’s transliteration and translation.',
    unverified: true,
  },
  {
    id: 'room-opening-ritual',
    topic: 'studio',
    prompt:
      'What is the full sequence of things you do to open the room, before the first student arrives?',
    answer: '',
  },
  {
    id: 'room-closing-ritual',
    topic: 'studio',
    prompt: 'What is the full sequence of things you do to close the room?',
    answer: '',
  },
  {
    id: 'opening-chant-cue',
    topic: 'teaching',
    prompt: 'How do you cue students into the opening chant?',
    answer: '',
  },

  // ── Mat layout ────────────────────────────────────────────────────────────
  {
    id: 'mat-layout',
    topic: 'studio',
    prompt: 'How are mats laid out in the room, and why that way?',
    answer: '',
  },
  {
    id: 'mat-spacing',
    topic: 'studio',
    prompt: 'How much space goes between mats, and how do you fit a full room?',
    answer: '',
  },
  {
    id: 'mat-orientation',
    topic: 'studio',
    prompt: 'Which way do mats face, and where does the teacher stand?',
    answer: '',
  },
  {
    id: 'late-arrival-placement',
    topic: 'studio',
    prompt: 'Where do you place a student who arrives after class has started?',
    answer: '',
  },

  // ── What to ask students ──────────────────────────────────────────────────
  {
    id: 'new-student-questions',
    topic: 'teaching',
    prompt: 'What do you ask a student you have not met before, and in what order?',
    answer: '',
  },
  {
    id: 'injury-intake',
    topic: 'teaching',
    prompt: 'What do you ask about injuries, and what do you do with the answer?',
    answer: '',
  },
  {
    id: 'first-timer-brief',
    topic: 'teaching',
    prompt:
      'What do you tell a first-time student before class starts, and what do you deliberately leave out?',
    answer: '',
  },
  {
    id: 'consent-to-adjust',
    topic: 'teaching',
    prompt: 'How do you ask for consent to give a hands-on adjustment?',
    answer: '',
  },

  // ── What to assume, and what not to ───────────────────────────────────────
  {
    id: 'assumptions-safe',
    topic: 'teaching',
    prompt: 'What may you safely assume about a student in the room?',
    answer: '',
  },
  {
    id: 'assumptions-unsafe',
    topic: 'teaching',
    prompt:
      'What must you never assume about a student -- about their body, experience, or history?',
    answer: '',
  },
  {
    id: 'scope-of-practice',
    topic: 'teaching',
    prompt:
      'Where is the line between teaching yoga and giving medical advice, and what do you say when a student asks you to cross it?',
    answer: '',
  },

  // ── Pregnancy ─────────────────────────────────────────────────────────────
  // Health guidance. The shala's answers only -- do not fill these from the web.
  {
    id: 'pregnancy-first-trimester',
    topic: 'contraindications',
    prompt: 'What is the shala’s guidance for a student in the first trimester?',
    answer: '',
  },
  {
    id: 'pregnancy-later-trimesters',
    topic: 'contraindications',
    prompt:
      'What is the guidance for the second and third trimesters, and what changes?',
    answer: '',
  },
  {
    id: 'pregnancy-poses-omitted',
    topic: 'contraindications',
    prompt: 'Which poses are omitted or modified during pregnancy?',
    answer: '',
  },
  {
    id: 'pregnancy-disclosure',
    topic: 'contraindications',
    prompt:
      'What do you do if you suspect a student is pregnant but they have not told you?',
    answer: '',
  },
  {
    id: 'postpartum-return',
    topic: 'contraindications',
    prompt: 'What is the guidance for a student returning to practice postpartum?',
    answer: '',
  },

  // ── Menstruation ──────────────────────────────────────────────────────────
  {
    id: 'menstruation-guidance',
    topic: 'contraindications',
    prompt:
      'What is the shala’s guidance for practising during menstruation (ladies’ holiday)?',
    answer: '',
  },
  {
    id: 'menstruation-poses-omitted',
    topic: 'contraindications',
    prompt: 'Which poses are traditionally omitted during menstruation, and why?',
    answer: '',
  },
  {
    id: 'menstruation-how-to-address',
    topic: 'contraindications',
    prompt:
      'How do you raise or respond to this with a student without singling them out?',
    answer: '',
  },

  // ── General contraindications ─────────────────────────────────────────────
  {
    id: 'inversion-contraindications',
    topic: 'contraindications',
    prompt:
      'Who should not invert, and what do you offer them instead during the finishing sequence?',
    answer: '',
  },
  {
    id: 'injury-modifications',
    topic: 'contraindications',
    prompt:
      'What are the standard modifications for a knee injury, a shoulder injury, and a low-back injury?',
    answer: '',
  },

  // ── Past quiz questions ───────────────────────────────────────────────────
  // Add real questions from the training here. Highest-value items in the app:
  // they tell you the actual format and depth you'll be assessed at.
  {
    id: 'past-quiz-example',
    topic: 'teaching',
    prompt:
      'EXAMPLE -- replace with a real question from a past quiz, or delete this entry.',
    answer: '',
  },
]

/** Entries ready to be quizzed. */
export function answeredEntries(): readonly BankEntry[] {
  return QUESTION_BANK.filter((entry) => entry.answer.trim().length > 0)
}

/** Entries still waiting on content from the training materials. */
export function unansweredEntries(): readonly BankEntry[] {
  return QUESTION_BANK.filter((entry) => entry.answer.trim().length === 0)
}
