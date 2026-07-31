// src/quiz/types.ts -- JRS 2026-07-29
// Question and topic types shared by generated and authored questions.

/** Question shape shared by generated and hand-authored questions. */

export type Topic =
  | 'sequence-order'
  | 'section-structure'
  | 'names'
  | 'drishti'
  | 'vinyasa'
  | 'held-positions'
  | 'cues'
  | 'adaptations'
  | 'teaching'
  | 'contraindications'
  | 'studio'

export const TOPIC_LABELS: Record<Topic, string> = {
  'sequence-order': 'Order & adjacency',
  'section-structure': 'Section structure',
  names: 'Sanskrit & English names',
  drishti: 'Gaze',
  vinyasa: 'Counting & breath',
  'held-positions': 'Held positions',
  cues: 'Cues -- what you say',
  adaptations: 'Adaptations',
  teaching: 'Teaching & studio practice',
  contraindications: 'Modifications & contraindications',
  studio: 'Shala trivia',
}

export interface Question {
  /**
   * Stable across app reloads and data edits that don't change the question
   * itself -- progress records key off this, so a churning id resets your history.
   */
  id: string
  topic: Topic
  prompt: string
  /** The canonical correct answer. */
  answer: string
  /**
   * Multiple-choice options including the answer. When absent, the UI falls
   * back to reveal-and-self-grade.
   */
  choices?: readonly string[]
  explanation?: string
  /**
   * Set when the underlying content still needs checking against the shala's
   * materials. Surfaced in the UI so you never study an unverified answer
   * without knowing it.
   */
  unverified?: boolean
  /**
   * Which poses the question is about, for studying one pose at a time.
   *
   * Declared by the generator rather than parsed back out of the id: an id
   * names one pose while a question may be about two ("what comes after
   * Padangusthasana?" is equally about Padahastasana), and pose ids nest --
   * `padangusthasana` is a substring of `utthita-hasta-padangusthasana`, so
   * matching on the id quietly over-selects.
   *
   * Absent on questions belonging to no particular pose: the Sanskrit
   * numerals, section counts, the authored bank.
   */
  poseIds?: readonly string[]
}
