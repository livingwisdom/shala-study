// src/data/gaze.ts -- JRS 2026-07-29
// Gaze resolution: the script wins over the seeded traditional drishti.

/**
 * Gaze resolution.
 *
 * Two sources disagree, and the precedence matters:
 *
 *   1. The shala's teaching script -- authoritative, in the shala's own wording
 *      ("gaze belly", "gaze thumbs").
 *   2. The seeded traditional drishti in `sequence.ts` -- a reasonable default
 *      for poses the script doesn't cover, but flagged unverified.
 *
 * The script disagrees with the traditional values more often than you'd
 * expect: downward dog is "belly" here, not the nose; Parsvottanasana is
 * "belly", not the toes; Utkatasana and Virabhadrasana A are "thumbs", not up.
 * That's exactly why `sequence.ts` values are never used when a script gaze
 * exists.
 */

import { getPose } from './sequence'
import { scriptForPose, scriptedPoseIds, type PoseScript } from './script'
import { DRISHTI_LABELS } from './types'

/** How the shala's wording lines up with the traditional nine drishti. */
export const GAZE_TO_DRISHTI: Record<string, string> = {
  thumbs: 'angustha ma dyai',
  thumb: 'angustha ma dyai',
  nose: 'nasagrai',
  belly: 'nabhi chakra',
  toe: 'padhayoragrai',
  toes: 'padhayoragrai',
  hand: 'hastagrai',
  'left fingertips': 'hastagrai',
  'right fingertips': 'hastagrai',
  'left side': 'parsva',
  'right side': 'parsva',
}

export type GazeSource = 'script' | 'seeded' | 'unknown' | 'none'

export interface ResolvedGaze {
  /** Display wording. Empty when nothing is known. */
  wording: string
  source: GazeSource
  /** Traditional drishti name, where the wording maps to one. */
  drishti?: string
  /** Distinct gazes when a pose changes gaze partway through. */
  all: readonly string[]
}

/** Distinct gazes recorded on the held steps of a script block. */
function gazesOnHeldSteps(block: PoseScript): {
  gazes: string[]
  unknown: boolean
} {
  const gazes: string[] = []
  let unknown = false
  for (const step of block.steps) {
    if (step.gazeUnknown) unknown = true
    if (!step.gaze) continue
    // Only held steps define the gaze *of the pose*; transitional gazes belong
    // to the vinyasa passing through.
    if (!step.hold) continue
    if (!gazes.includes(step.gaze)) gazes.push(step.gaze)
  }
  return { gazes, unknown }
}

export function resolveGaze(poseId: string): ResolvedGaze {
  const block = scriptForPose(poseId)

  if (block) {
    const { gazes, unknown } = gazesOnHeldSteps(block)
    const first = gazes[0]
    if (first) {
      const drishti = GAZE_TO_DRISHTI[first]
      return {
        wording: first,
        source: 'script',
        all: gazes,
        ...(drishti === undefined ? {} : { drishti }),
      }
    }
    if (unknown) return { wording: '', source: 'unknown', all: [] }
    // In the script but with no gaze recorded on the held step.
    return { wording: '', source: 'none', all: [] }
  }

  const pose = getPose(poseId)
  if (pose?.drishti) {
    return {
      wording: DRISHTI_LABELS[pose.drishti],
      source: 'seeded',
      drishti: pose.drishti,
      all: [DRISHTI_LABELS[pose.drishti]],
    }
  }

  return { wording: '', source: 'none', all: [] }
}

/**
 * Poses the script teaches but whose gaze it doesn't pin down -- either it
 * writes "(gaze ?)" or the held step records none at all.
 *
 * Scoped to scripted poses on purpose: an unrecorded gaze on a pose the shala
 * doesn't teach isn't a gap, it's just out of scope. These are the ones worth
 * taking back to the shala, so they surface in the app's gap list.
 */
export function scriptedPosesWithUnknownGaze(): string[] {
  return scriptedPoseIds().filter((poseId) => {
    const source = resolveGaze(poseId).source
    return source === 'unknown' || source === 'none'
  })
}
