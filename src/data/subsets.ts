// src/data/subsets.ts -- JRS 2026-07-29
// Fundamentals, Half Primary and Full Primary as filters over the series.

/**
 * Named subsets of the primary series -- the things you'd actually be asked to
 * lead. Each is a filter over `POSES`, never a reordering of it.
 */

import type { Pose, Subset } from './types'
import { POSES } from './sequence'
import { scriptedPoseIds } from './script'

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

/**
 * Fundamentals: derived directly from the shala's teaching script.
 *
 * This is the *bare minimum* version -- the set the script currently covers. It
 * grows at two points, and only these two:
 *
 *   1. SEATED -- after Janu Sirsasana A and before Navasana. Marichyasana A-D
 *      and Navasana itself are the obvious candidates.
 *   2. FINISHING -- the closing currently runs Urdhva Dhanurasana, a closing
 *      Paschimottanasana, then the three seals. Shoulderstand through headstand
 *      would slot in ahead of the seals.
 *
 * To expand, add ids to the arrays below. Order is irrelevant -- `posesInSubset`
 * always returns poses in canonical practice order -- so an id in the wrong
 * place still lands in the right spot in the sequence.
 */
const FUNDAMENTALS_SEATED_ADDITIONS: readonly string[] = [
  // e.g. 'marichyasana-a', 'marichyasana-c', 'navasana'
]

const FUNDAMENTALS_FINISHING_ADDITIONS: readonly string[] = [
  // e.g. 'salamba-sarvangasana', 'halasana', 'matsyasana', 'sirsasana'
]

/**
 * Poses the script writes out but Fundamentals doesn't lead.
 *
 * Paschimottanasana D belongs to Primary; Fundamentals takes A and B only.
 * The exit vinyasa follows automatically -- it's a group exit in `script.ts`,
 * attached to whichever variation is last, so dropping D moves the exit onto B
 * rather than losing it.
 */
const FUNDAMENTALS_EXCLUSIONS = new Set(['paschimottanasana-d'])

const FUNDAMENTALS_POSE_IDS: readonly string[] = [
  ...scriptedPoseIds(),
  ...FUNDAMENTALS_SEATED_ADDITIONS,
  ...FUNDAMENTALS_FINISHING_ADDITIONS,
].filter((poseId) => !FUNDAMENTALS_EXCLUSIONS.has(poseId))

export const SUBSETS: readonly Subset[] = [
  {
    id: 'fundamentals',
    name: 'Fundamentals',
    description: 'The shala’s teaching script -- the bare minimum set.',
    poseIds: FUNDAMENTALS_POSE_IDS,
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

const SUBSETS_BY_ID = new Map(SUBSETS.map((subset) => [subset.id, subset]))

export function getSubset(id: string): Subset | undefined {
  return SUBSETS_BY_ID.get(id)
}

/**
 * Resolves a subset to its poses, in canonical practice order.
 *
 * Unknown ids in `poseIds` are ignored rather than throwing -- a typo while
 * editing the fundamentals list should drop one pose, not break the app mid-study.
 */
export function posesInSubset(subset: Subset): readonly Pose[] {
  if (subset.poseIds === 'all') return POSES
  const included = new Set(subset.poseIds)
  return POSES.filter((pose) => included.has(pose.id))
}
