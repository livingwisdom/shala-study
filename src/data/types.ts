// src/data/types.ts -- JRS 2026-07-28
// Core domain types for the primary series.

/**
 * Core domain types for the Ashtanga primary series.
 *
 * DATA ACCURACY RULE: every field here is something you could be quizzed on.
 * A missing field renders as "not recorded" and generates no question. A *wrong*
 * field silently teaches you the wrong answer. So when you don't know a value
 * from the shala's materials, leave it `undefined` -- never guess.
 */

/**
 * Sections of the practice, in the order they occur.
 *
 * The opening and closing chants deliberately live in the authored question
 * bank rather than here: they aren't poses, and counting them would corrupt
 * every "how many poses are in X?" answer.
 */
export type SectionId =
  | 'surya-namaskara'
  | 'standing'
  | 'seated'
  | 'finishing'

export interface Section {
  id: SectionId
  /** Display name, e.g. "Standing Sequence". */
  name: string
  /** Short description shown in the sequence browser. */
  blurb?: string
}

/**
 * The nine traditional drishti (gaze points).
 *
 * Drishti assignments vary between lineages more than pose order does -- verify
 * these against the shala's sheet before trusting them for an exam.
 */
export type Drishti =
  | 'nasagrai'
  | 'broomadhya'
  | 'nabhi-chakra'
  | 'hastagrai'
  | 'padhayoragrai'
  | 'parsva'
  | 'angustha-ma-dyai'
  | 'urdhva'

export const DRISHTI_LABELS: Record<Drishti, string> = {
  nasagrai: 'Nose',
  broomadhya: 'Third eye / between the eyebrows',
  'nabhi-chakra': 'Navel',
  hastagrai: 'Hand',
  padhayoragrai: 'Toes',
  parsva: 'Side (far right or far left)',
  'angustha-ma-dyai': 'Thumbs',
  urdhva: 'Up to the sky',
}

/**
 * Whether a pose is held for breaths or passed through as part of a vinyasa.
 * This is the distinction behind "what are the held positions?" -- one of the
 * things a teacher has to know cold in order to count a class.
 */
export type Hold = 'held' | 'transitional'

export interface Pose {
  /** Stable kebab-case id. Referenced by subsets and progress records. */
  id: string
  /** Sanskrit name, as the shala writes it. */
  sanskrit: string
  /** Common English name. */
  english: string
  /**
   * Other names the shala uses for the same pose, both spoken in the room.
   *
   * An alias, not a second pose: Parivrtta Trikonasana and Utthita Trikonasana
   * B are one posture with one id and one review history. Splitting them would
   * split your progress on a pose you know perfectly well under either name.
   */
  alsoCalled?: readonly string[]
  section: SectionId
  /** Position within the whole practice. Assigned by `buildSequence`. */
  index: number
  hold: Hold
  /** Breaths held. Omit for transitional poses and where the count varies. */
  breaths?: number
  /** Whether the pose is done on both sides. */
  bothSides?: boolean
  /** Number of repetitions, where the pose repeats (e.g. Navasana x5). */
  repetitions?: number
  drishti?: Drishti
  /**
   * Traditional vinyasa count for entering the pose.
   *
   * Deliberately sparse: counts vary between lineages and teachers, and a wrong
   * count is worse than no count. Fill from the shala's sheet.
   */
  vinyasaCount?: number
  /** Free-form note shown in the sequence browser. */
  notes?: string
}

/**
 * A named subset of the full series -- what you'd actually be asked to lead.
 *
 * Subsets are *filters* over the one canonical sequence rather than separate
 * sequences, so correcting a pose fixes it everywhere at once.
 */
export interface Subset {
  id: string
  name: string
  description: string
  /**
   * Pose ids included, or 'all'. Order always comes from the canonical
   * sequence, never from the order of ids here.
   */
  poseIds: readonly string[] | 'all'
  /** True when the contents still need checking against the shala's materials. */
  needsVerification?: boolean
  /**
   * Group id, for subsets that are variations of one thing.
   *
   * The three Fundamentals levels share a group so the picker can nest them:
   * one button for Fundamentals, then a level underneath, rather than five
   * peers in a row that don't fit a phone.
   */
  group?: string
}

/** A named family of subsets, shown as one choice in the picker. */
export interface SubsetGroup {
  id: string
  name: string
  /** Which of its subsets is selected when the group is first chosen. */
  defaultSubsetId: string
}
