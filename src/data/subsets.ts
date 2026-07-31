// src/data/subsets.ts -- JRS 2026-07-31
// The Fundamentals levels, Half Primary and Full Primary as filters over the series.

/**
 * Named subsets of the primary series -- the things you'd actually be asked to
 * lead. Each is a filter over `POSES`, never a reordering of it.
 *
 * Fundamentals is three subsets rather than one, transcribed from the shala's
 * 60 minute class pacing sheet. They are variations of a single class, so they
 * share a group and the picker nests them under one Fundamentals button.
 *
 * The levels are written additively -- Intermediate is Beginner plus a few
 * poses, Advanced is Intermediate plus a few more -- because that is what the
 * pacing sheet describes. Three hand-copied lists would drift apart on the
 * first edit.
 */

import type { Pose, Subset, SubsetGroup } from './types'
import { POSES } from './sequence'

/**
 * Half Primary: the standard cut is everything through Navasana, then straight
 * into the finishing sequence, skipping Bhujapidasana through Setu Bandhasana.
 */
const HALF_PRIMARY_SKIPS = new Set([
  'bhujapidasana',
  'kurmasana',
  'supta-kurmasana',
  'garbha-pindasana',
  'kukkutasana',
  'baddha-konasana',
  'upavistha-konasana',
  'supta-konasana',
  'supta-padangusthasana',
  'ubhaya-padangusthasana',
  'urdhva-mukha-paschimottanasana',
  'setu-bandhasana',
])

/** Sun salutations and standing are identical at every level. */
const SUN_SALUTATIONS: readonly string[] = [
  'samasthiti',
  'surya-namaskara-a',
  'surya-namaskara-b',
]

const STANDING: readonly string[] = [
  'padangusthasana',
  'padahastasana',
  'utthita-trikonasana',
  'parivrtta-trikonasana',
  'utthita-parsvakonasana',
  'parivrtta-parsvakonasana',
  'prasarita-padottanasana-a',
  'prasarita-padottanasana-b',
  'prasarita-padottanasana-c',
  'prasarita-padottanasana-d',
  'parsvottanasana',
  'utthita-hasta-padangusthasana',
  'ardha-baddha-padmottanasana',
  'utkatasana',
  'virabhadrasana-a',
  'virabhadrasana-b',
]

const BEGINNER_SEATED: readonly string[] = [
  'dandasana',
  'paschimottanasana-a',
  'paschimottanasana-b',
  'purvottanasana',
  'ardha-baddha-padma-paschimottanasana',
  'trianga-mukha-ekapada-paschimottanasana',
  'janu-sirsasana-a',
]

const INTERMEDIATE_SEATED: readonly string[] = [
  ...BEGINNER_SEATED,
  'paschimottanasana-d',
  'janu-sirsasana-b',
  'janu-sirsasana-c',
]

const ADVANCED_SEATED: readonly string[] = [
  ...INTERMEDIATE_SEATED,
  'marichyasana-a',
  'marichyasana-b',
]

/** Backbends, a closing forward fold, then the seals. */
const BEGINNER_CLOSING: readonly string[] = [
  'urdhva-dhanurasana',
  'paschimottanasana-closing',
  'yoga-mudra',
  'padmasana',
  'utplutih',
]

/** Adds the inversions and Manju's seated shoulder stretches. */
const INTERMEDIATE_CLOSING: readonly string[] = [
  ...BEGINNER_CLOSING,
  'salamba-sarvangasana',
  'halasana',
  'karnapidasana',
  'sirsasana-a',
  'sirsasana-b',
  'parvatasana-a',
  'parvatasana-b',
]

/** Adds the rest of the finishing sequence, between Karnapidasana and headstand. */
const ADVANCED_CLOSING: readonly string[] = [
  ...INTERMEDIATE_CLOSING,
  'urdhva-padmasana',
  'pindasana',
  'matsyasana',
  'uttana-padasana',
]

const FUNDAMENTALS_GROUP = 'fundamentals'

/**
 * Every level says it is an example rather than a rule, because that is how the
 * pacing sheet presents them: a 60 minute plan you bend to the class in front
 * of you and the time on the clock.
 */
export const SUBSETS: readonly Subset[] = [
  {
    id: 'fundamentals-beginner',
    name: 'Beginner',
    group: FUNDAMENTALS_GROUP,
    description:
      'Seated stops at Janu Sirsasana A, and the closing goes straight to the seals. An example class -- adapt it to the room and the time.',
    poseIds: [
      ...SUN_SALUTATIONS,
      ...STANDING,
      ...BEGINNER_SEATED,
      ...BEGINNER_CLOSING,
    ],
  },
  {
    id: 'fundamentals-intermediate',
    name: 'Intermediate',
    group: FUNDAMENTALS_GROUP,
    description:
      'Adds Paschimottanasana D, Janu Sirsasana B and C, and the inversions through headstand. An example class -- adapt it to the room and the time.',
    poseIds: [
      ...SUN_SALUTATIONS,
      ...STANDING,
      ...INTERMEDIATE_SEATED,
      ...INTERMEDIATE_CLOSING,
    ],
  },
  {
    id: 'fundamentals-advanced',
    name: 'Advanced',
    group: FUNDAMENTALS_GROUP,
    description:
      'Adds Marichyasana A and B, and the full finishing sequence. An example class -- adapt it to the room and the time.',
    poseIds: [
      ...SUN_SALUTATIONS,
      ...STANDING,
      ...ADVANCED_SEATED,
      ...ADVANCED_CLOSING,
    ],
  },
  {
    id: 'half-primary',
    name: 'Half Primary',
    description: 'Through Navasana, then the finishing sequence.',
    poseIds: POSES.filter((pose) => !HALF_PRIMARY_SKIPS.has(pose.id)).map(
      (pose) => pose.id,
    ),
  },
  {
    id: 'full-primary',
    name: 'Full Primary',
    description: 'The complete Yoga Chikitsa sequence.',
    poseIds: 'all',
  },
]

export const SUBSET_GROUPS: readonly SubsetGroup[] = [
  {
    id: FUNDAMENTALS_GROUP,
    name: 'Fundamentals',
    defaultSubsetId: 'fundamentals-beginner',
  },
]

const SUBSETS_BY_ID = new Map(SUBSETS.map((subset) => [subset.id, subset]))

export function getSubset(id: string): Subset | undefined {
  return SUBSETS_BY_ID.get(id)
}

export function getGroup(id: string): SubsetGroup | undefined {
  return SUBSET_GROUPS.find((group) => group.id === id)
}

/**
 * How a subset is named inside a question prompt.
 *
 * Grouped subsets get their group back: "In Beginner, what comes after Janu
 * Sirsasana A?" doesn't say beginner *what*, while "In Fundamentals (Beginner)"
 * does. The picker still shows the short name, where the group is the button
 * you just pressed.
 */
export function subsetLabel(subset: Subset): string {
  const group = subset.group === undefined ? undefined : getGroup(subset.group)
  return group ? `${group.name} (${subset.name})` : subset.name
}

/**
 * What the generators need to scope a question to a sequence. One helper so
 * that callers can't quietly build it a second way and disagree about the name.
 */
export function questionContext(subset: Subset): { id: string; name: string } {
  return { id: subset.id, name: subsetLabel(subset) }
}

/** The subsets belonging to a group, in declaration order. */
export function subsetsInGroup(groupId: string): readonly Subset[] {
  return SUBSETS.filter((subset) => subset.group === groupId)
}

/**
 * What the picker's top row offers: one entry per group, then every ungrouped
 * subset, in declaration order. Five peers won't fit a phone; three will.
 */
export function topLevelChoices(): readonly { id: string; name: string }[] {
  const seen = new Set<string>()
  const choices: { id: string; name: string }[] = []

  for (const subset of SUBSETS) {
    if (subset.group === undefined) {
      choices.push({ id: subset.id, name: subset.name })
      continue
    }
    if (seen.has(subset.group)) continue
    seen.add(subset.group)
    const group = getGroup(subset.group)
    if (group) choices.push({ id: group.id, name: group.name })
  }

  return choices
}

/**
 * Resolves a subset to its poses, in canonical practice order.
 *
 * Unknown ids in `poseIds` are ignored rather than throwing -- a typo while
 * editing a level list should drop one pose, not break the app mid-study.
 */
export function posesInSubset(subset: Subset): readonly Pose[] {
  if (subset.poseIds === 'all') return POSES
  const included = new Set(subset.poseIds)
  return POSES.filter((pose) => included.has(pose.id))
}
