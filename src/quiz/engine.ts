// src/quiz/engine.ts -- JRS 2026-07-29
// Builds the question pool for a given subset and topic filter.

/**
 * Composes the question pool: generated sequence questions plus answered
 * entries from the hand-authored bank.
 */

import { answeredEntries } from '../data/questionBank'
import { getSubset, posesInSubset, questionContext } from '../data/subsets'
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
}

export function buildPool(options: PoolOptions): Question[] {
  const subset = getSubset(options.subsetId)
  const poses = subset ? posesInSubset(subset) : []

  const context = subset ? questionContext(subset) : undefined
  const all = [...generateQuestions(poses, context), ...bankQuestions()]

  const topics = options.topics
  if (!topics || topics.length === 0) return all

  const wanted = new Set(topics)
  return all.filter((question) => wanted.has(question.topic))
}

/** Topics actually present in a pool, for building the filter UI. */
export function topicsInPool(questions: readonly Question[]): Topic[] {
  const seen = new Set<Topic>()
  for (const question of questions) seen.add(question.topic)
  return [...seen]
}
