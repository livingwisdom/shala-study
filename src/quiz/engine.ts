// src/quiz/engine.ts -- JRS 2026-07-29
// Builds the question pool for a given subset and topic filter.

/**
 * Composes the question pool: generated sequence questions plus answered
 * entries from the hand-authored bank.
 */

import { answeredEntries } from '../data/questionBank'
import {
  getSubset,
  posesInSubset,
  questionContext,
  subsetLabel,
  subsetsInGroup,
} from '../data/subsets'
import { generateQuestions } from './generators'
import type { Question, Topic } from './types'

/** Bank entries become questions only once they have an answer. */
function bankQuestions(): Question[] {
  return answeredEntries().map((entry) => ({
    id: `bank:${entry.id}`,
    topic: entry.topic,
    prompt: entry.prompt,
    answer: entry.answer,
    ...(entry.explanation === undefined ? {} : { explanation: entry.explanation }),
    ...(entry.unverified ? { unverified: true } : {}),
  }))
}

export interface PoolOptions {
  subsetId: string
  /** When empty or omitted, all topics are included. */
  topics?: readonly Topic[]
  /**
   * Narrow to one pose, for studying it on its own. Questions belonging to no
   * particular pose -- the Sanskrit numerals, section counts, the bank -- drop
   * out, which is the point: they aren't about the pose you picked.
   */
  poseId?: string
}

export function buildPool(options: PoolOptions): Question[] {
  const subset = getSubset(options.subsetId)
  const poses = subset ? posesInSubset(subset) : []

  // Studying one level of a group also asks about the group: which level a
  // pose first appears in is knowledge no single-sequence question covers.
  const levels =
    subset?.group === undefined
      ? []
      : subsetsInGroup(subset.group).map((level) => ({
          // The full name, not the short one: an answer of "Intermediate"
          // reads as Second Series outside the Level picker.
          name: subsetLabel(level),
          poseIds: new Set(posesInSubset(level).map((pose) => pose.id)),
        }))

  const context = subset ? questionContext(subset) : undefined
  const all = [...generateQuestions(poses, context, levels), ...bankQuestions()]

  const focused =
    options.poseId === undefined
      ? all
      : all.filter((question) => question.poseIds?.includes(options.poseId as string))

  const topics = options.topics
  if (!topics || topics.length === 0) return focused

  const wanted = new Set(topics)
  return focused.filter((question) => wanted.has(question.topic))
}

/** Topics actually present in a pool, for building the filter UI. */
export function topicsInPool(questions: readonly Question[]): Topic[] {
  const seen = new Set<Topic>()
  for (const question of questions) seen.add(question.topic)
  return [...seen]
}
