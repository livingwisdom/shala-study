// src/quiz/generators.ts -- JRS 2026-07-29
// Derives quiz questions from the sequence and the teaching script.

/**
 * Question generators.
 *
 * Everything here is derived from the data, so the quiz bank can never drift
 * out of sync with the sequence or the script: fix a pose or a cue once and
 * every question about it is corrected.
 *
 * Generators take the resolved poses of whichever subset you're studying, so
 * "what comes after Janu Sirsasana A?" gives the right answer for Fundamentals
 * and for Full Primary without either being special-cased.
 *
 * A generator that can't produce a *discriminating* question returns nothing.
 * That matters: a question whose options are all correct, or where the data is
 * missing, teaches nothing and erodes trust in the rest of the bank.
 */

import type { Pose, SectionId } from '../data/types'
import { POSES, SECTIONS, getSection } from '../data/sequence'
import { resolveGaze } from '../data/gaze'
import {
  SANSKRIT_COUNT,
  resolveScript,
  scriptForPose,
  type PoseScript,
  type ScriptStep,
} from '../data/script'
import type { Question, Topic } from './types'
import { buildChoices, rngFor, shuffle } from './random'

const CHOICE_COUNT = 3

/**
 * Which sequence is being studied. Optional -- omit it and questions are phrased
 * and keyed as if against the full series.
 */
export interface SubsetContext {
  id: string
  name: string
}

/** Lowercase kebab, for putting an answer inside an id. */
function slug(answer: string): string {
  return answer
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Some facts change with the cut: what follows Paschimottanasana B is
 * Purvottanasana in Fundamentals Beginner and Paschimottanasana D in Primary.
 * Section counts and section boundaries move the same way.
 *
 * Those questions must be *phrased* differently, or they're unanswerable
 * without knowing which sequence is meant. They must also be *keyed* by
 * something finer than the plain id, or two sequences write to one review
 * record and the scheduler credits you for an answer you never gave.
 *
 * The key is the answer, not the sequence. Keying by sequence would split one
 * fact across every sequence that holds it: Intermediate and Advanced both
 * answer Yoga Mudra after Sirsasana B, and learning it once should count. What
 * you actually need to know separately is where the sequences *disagree*, and
 * that falls out of this automatically -- different answer, different record.
 *
 * Questions whose answer matches the full series keep the plain id, so the
 * ~600 facts that never change are one record each.
 */
function scoped(
  base: string,
  prompt: string,
  answer: string,
  differsFromFullSeries: boolean,
  context: SubsetContext | undefined,
): { id: string; prompt: string } {
  if (!differsFromFullSeries || !context) return { id: base, prompt }
  return {
    id: `${base}:${slug(answer)}`,
    prompt: `In ${context.name}, ${prompt.charAt(0).toLowerCase()}${prompt.slice(1)}`,
  }
}

/** The pose at `offset` from `poseId` in the complete series. */
function inFullSeries(poseId: string, offset: number): Pose | undefined {
  const index = POSES.findIndex((pose) => pose.id === poseId)
  if (index < 0) return undefined
  return POSES[index + offset]
}

/**
 * Poses near `index`, nearest first -- the most plausible wrong answers.
 *
 * `exclude` drops one position from the pool. Adjacency questions use it to
 * remove the pose named in the prompt: nothing follows or precedes itself, so
 * offering it is an option the reader can discard without knowing anything,
 * which makes the question easier and reads as a bug.
 */
function neighbours(
  poses: readonly Pose[],
  index: number,
  exclude?: number,
): string[] {
  const pool: string[] = []
  for (let distance = 1; distance < poses.length; distance++) {
    const beforeIndex = index - distance
    const afterIndex = index + distance
    const before = poses[beforeIndex]
    const after = poses[afterIndex]
    if (after && afterIndex !== exclude) pool.push(after.sanskrit)
    if (before && beforeIndex !== exclude) pool.push(before.sanskrit)
  }
  return pool
}

/**
 * A multiple-choice question -- unless the pool can't supply a single
 * distractor, in which case it degrades to free recall.
 *
 * The degradation matters: a "choice" of one option is not a question, it's the
 * answer with extra steps. This happens legitimately (Dandasana's script block
 * has exactly one counted step, so there is no other count to offer), so the
 * guard lives here rather than in every caller.
 */
function question(
  id: string,
  topic: Topic,
  prompt: string,
  answer: string,
  pool: readonly string[],
  explanation?: string,
): Question {
  const choices = buildChoices(answer, pool, CHOICE_COUNT, rngFor(id))
  return {
    id,
    topic,
    prompt,
    answer,
    ...(choices.length > 1 ? { choices } : {}),
    ...(explanation === undefined ? {} : { explanation }),
  }
}

/** A free-recall question -- no options, revealed and self-graded. */
function recall(
  id: string,
  topic: Topic,
  prompt: string,
  answer: string,
  explanation?: string,
): Question {
  return {
    id,
    topic,
    prompt,
    answer,
    ...(explanation === undefined ? {} : { explanation }),
  }
}

// ── Sequence-derived ────────────────────────────────────────────────────────

function nextPoseQuestions(
  poses: readonly Pose[],
  context?: SubsetContext,
): Question[] {
  const questions: Question[] = []
  for (let i = 0; i < poses.length - 1; i++) {
    const current = poses[i]
    const next = poses[i + 1]
    if (!current || !next) continue

    const differs = inFullSeries(current.id, 1)?.id !== next.id
    const { id, prompt } = scoped(
      `next:${current.id}`,
      `Which pose comes immediately after ${current.sanskrit}?`,
      next.sanskrit,
      differs,
      context,
    )

    questions.push(
      question(
        id,
        'sequence-order',
        prompt,
        next.sanskrit,
        neighbours(poses, i + 1, i),
        `${next.sanskrit} -- ${next.english}.`,
      ),
    )
  }
  return questions
}

function previousPoseQuestions(
  poses: readonly Pose[],
  context?: SubsetContext,
): Question[] {
  const questions: Question[] = []
  for (let i = 1; i < poses.length; i++) {
    const current = poses[i]
    const previous = poses[i - 1]
    if (!current || !previous) continue

    const differs = inFullSeries(current.id, -1)?.id !== previous.id
    const { id, prompt } = scoped(
      `prev:${current.id}`,
      `Which pose comes immediately before ${current.sanskrit}?`,
      previous.sanskrit,
      differs,
      context,
    )

    questions.push(
      question(
        id,
        'sequence-order',
        prompt,
        previous.sanskrit,
        neighbours(poses, i - 1, i),
        `${previous.sanskrit} -- ${previous.english}.`,
      ),
    )
  }
  return questions
}

function sectionCountQuestions(
  poses: readonly Pose[],
  context?: SubsetContext,
): Question[] {
  const questions: Question[] = []
  for (const section of SECTIONS) {
    const count = poses.filter((pose) => pose.section === section.id).length
    if (count === 0) continue

    const fullCount = POSES.filter((pose) => pose.section === section.id).length
    const { id, prompt } = scoped(
      `count:${section.id}`,
      `How many poses are in the ${section.name.toLowerCase()}?`,
      String(count),
      count !== fullCount,
      context,
    )

    const distractors = [count - 1, count + 1, count + 2, count - 2]
      .filter((n) => n > 0)
      .map(String)
    questions.push(
      question(
        id,
        'section-structure',
        prompt,
        String(count),
        distractors,
        'Counted as named asanas, not vinyasa positions.',
      ),
    )
  }
  return questions
}

function sectionBoundaryQuestions(
  poses: readonly Pose[],
  context?: SubsetContext,
): Question[] {
  const questions: Question[] = []
  const others = poses.map((pose) => pose.sanskrit)

  for (const section of SECTIONS) {
    const inSection = poses.filter((pose) => pose.section === section.id)
    const first = inSection[0]
    const last = inSection[inSection.length - 1]
    if (!first || !last) continue

    const fullSection = POSES.filter((pose) => pose.section === section.id)

    const firstScoped = scoped(
      `first:${section.id}`,
      `What is the first pose of the ${section.name.toLowerCase()}?`,
      first.sanskrit,
      fullSection[0]?.id !== first.id,
      context,
    )
    questions.push(
      question(
        firstScoped.id,
        'section-structure',
        firstScoped.prompt,
        first.sanskrit,
        shuffle(others, rngFor(`first-pool:${section.id}`)),
      ),
    )

    // A one-pose section would make both questions the same question.
    if (inSection.length > 1) {
      const lastScoped = scoped(
        `last:${section.id}`,
        `What is the last pose of the ${section.name.toLowerCase()}?`,
        last.sanskrit,
        fullSection[fullSection.length - 1]?.id !== last.id,
        context,
      )
      questions.push(
        question(
          lastScoped.id,
          'section-structure',
          lastScoped.prompt,
          last.sanskrit,
          shuffle(others, rngFor(`last-pool:${section.id}`)),
        ),
      )
    }
  }
  return questions
}

function poseSectionQuestions(poses: readonly Pose[]): Question[] {
  const sectionNames = SECTIONS.map((section) => section.name)
  return poses.flatMap((pose) => {
    const section = getSection(pose.section)
    if (!section) return []
    return [
      question(
        `section-of:${pose.id}`,
        'section-structure',
        `Which section does ${pose.sanskrit} belong to?`,
        section.name,
        sectionNames,
      ),
    ]
  })
}

function nameQuestions(poses: readonly Pose[]): Question[] {
  const sanskritPool = poses.map((pose) => pose.sanskrit)
  const englishPool = poses.map((pose) => pose.english)

  return poses.flatMap((pose) => [
    question(
      `en-of:${pose.id}`,
      'names',
      `What is the English name for ${pose.sanskrit}?`,
      pose.english,
      shuffle(englishPool, rngFor(`en-pool:${pose.id}`)),
    ),
    question(
      `sa-of:${pose.id}`,
      'names',
      `What is the Sanskrit name for ${pose.english}?`,
      pose.sanskrit,
      shuffle(sanskritPool, rngFor(`sa-pool:${pose.id}`)),
    ),
  ])
}

/**
 * Gaze, preferring the shala's script over the seeded traditional drishti.
 *
 * Script-sourced answers are stated in the shala's own words and are not
 * flagged; seeded ones carry `unverified` so you always know which you're
 * looking at. Poses whose gaze is genuinely unknown generate nothing.
 *
 * Seeded answers describe the pose itself, so they keep the plain wording --
 * there are no counted steps to hold in the first place.
 */
function gazeQuestions(poses: readonly Pose[]): Question[] {
  const wordings = new Set<string>()
  for (const pose of poses) {
    const resolved = resolveGaze(pose.id)
    if (resolved.source === 'script') wordings.add(resolved.wording)
  }
  const scriptPool = [...wordings]

  return poses.flatMap((pose) => {
    const resolved = resolveGaze(pose.id)
    if (resolved.source === 'unknown' || resolved.source === 'none') return []

    // A pose that changes gaze partway through has no single right answer.
    if (resolved.all.length > 1) return []

    const pool =
      resolved.source === 'script'
        ? shuffle(scriptPool, rngFor(`gaze-pool:${pose.id}`))
        : shuffle(
            ['Nose', 'Third eye / between the eyebrows', 'Navel', 'Hand', 'Toes'],
            rngFor(`gaze-pool:${pose.id}`),
          )

    // Script gazes are read off held steps only, so the prompt has to say so:
    // "the gaze in Surya Namaskara A" has no answer -- nine vinyasas look at
    // three different things -- while the gaze in its held position does.
    const prompt =
      resolved.source === 'script'
        ? `In ${pose.sanskrit}, where is the gaze in the held position?`
        : `Where is the gaze in ${pose.sanskrit}?`

    const base = question(
      `gaze:${pose.id}`,
      'drishti',
      prompt,
      resolved.wording,
      pool,
      resolved.drishti ? `Traditionally: ${resolved.drishti}.` : undefined,
    )

    return [resolved.source === 'seeded' ? { ...base, unverified: true } : base]
  })
}

function breathCountQuestions(poses: readonly Pose[]): Question[] {
  return poses.flatMap((pose) => {
    if (pose.breaths === undefined) return []
    return [
      question(
        `breaths:${pose.id}`,
        'section-structure',
        `How many breaths is ${pose.sanskrit} held for?`,
        String(pose.breaths),
        ['5', '8', '10', '3', '1'],
      ),
    ]
  })
}

function repetitionQuestions(poses: readonly Pose[]): Question[] {
  return poses.flatMap((pose) => {
    if (pose.repetitions === undefined) return []
    // The script states rounds for the blocks it teaches, and the script wins.
    // Asking from both sources produced one question under two ids, which is
    // two review records for one fact.
    if (scriptForPose(pose.id)?.rounds !== undefined) return []
    return [
      question(
        `rounds:${pose.id}`,
        'section-structure',
        `How many rounds of ${pose.sanskrit} does the shala teach?`,
        String(pose.repetitions),
        ['3', '5', '1', '2'],
      ),
    ]
  })
}

// ── Script-derived ──────────────────────────────────────────────────────────

/**
 * The script blocks covering any of the given poses, with each group's movable
 * exit attached to the last block present -- so Fundamentals drills the exit
 * after Paschimottanasana B, and Primary drills it after D.
 */
function blocksFor(poses: readonly Pose[]): PoseScript[] {
  return resolveScript(poses.map((pose) => pose.id))
}

function countedSteps(block: PoseScript): ScriptStep[] {
  return block.steps.filter((step) => step.count !== null)
}

/**
 * The counted method: which vinyasa is held, what's said on each count, and
 * whether it's an inhale or an exhale.
 */
function scriptQuestions(poses: readonly Pose[]): Question[] {
  const blocks = blocksFor(poses)
  if (blocks.length === 0) return []

  const questions: Question[] = []

  for (const block of blocks) {
    const counted = countedSteps(block)
    const held = block.steps.filter((step) => step.hold)

    // Which count is held -- the heart of "what are the held positions?"
    if (held.length === 1) {
      const step = held[0]
      if (step && step.count !== null) {
        const word = SANSKRIT_COUNT[step.count - 1] ?? String(step.count)
        questions.push(
          question(
            `script-held:${block.id}`,
            'held-positions',
            `In ${block.title}, which count is held?`,
            `${word} (${step.count})`,
            counted
              .filter((other) => other.count !== step.count)
              .map(
                (other) =>
                  `${SANSKRIT_COUNT[(other.count ?? 1) - 1] ?? other.count} (${other.count})`,
              ),
            `${step.cue}${step.hold ? ` -- held ${step.hold.breaths} breaths.` : ''}`,
          ),
        )
      }
    }

    // How long the hold is.
    const firstHold = held[0]?.hold
    if (firstHold) {
      questions.push(
        question(
          `script-hold-breaths:${block.id}`,
          'held-positions',
          `How many breaths is the held position in ${block.title}?`,
          String(firstHold.breaths),
          ['5', '10', '8', '3'],
        ),
      )
    }

    // Rounds, where the script states them.
    if (block.rounds !== undefined) {
      questions.push(
        question(
          `script-rounds:${block.id}`,
          'section-structure',
          `How many rounds of ${block.title} does the shala teach?`,
          String(block.rounds),
          ['3', '5', '1', '2'],
        ),
      )
    }

    // Which count the block starts on -- the running count continues across
    // poses, so this is genuinely easy to lose track of while leading.
    const firstCount = counted[0]?.count
    if (firstCount !== undefined && firstCount !== null) {
      const word = SANSKRIT_COUNT[firstCount - 1] ?? String(firstCount)
      questions.push(
        question(
          `script-start:${block.id}`,
          'vinyasa',
          `Which count does ${block.title} begin on?`,
          `${word} (${firstCount})`,
          SANSKRIT_COUNT.slice(0, 20).map(
            (numeral, index) => `${numeral} (${index + 1})`,
          ),
        ),
      )
    }

    // The step index is part of every id below because a count can legitimately
    // repeat within a block -- Urdhva Dhanurasana runs 9/10 three times for the
    // three backbends, and the closing seals reuse dasha. Keying on the count
    // alone would collapse those into one question and merge their histories.
    /*
     * A count can repeat within a block, and when it does it usually carries
     * the same cue and the same breath: Urdhva Dhanurasana runs 9/10 three
     * times for the three backbends, saying the same words each time. Asking
     * three times keeps three review histories for one fact.
     *
     * So a question is emitted once per distinct count-and-answer. A repeat
     * that says something *different* still gets its own question, because the
     * answer differs and that is a fact of its own -- which is also why the
     * step index stays in the id.
     */
    const asked = new Set<string>()

    for (const [index, step] of counted.entries()) {
      const count = step.count
      if (count === null) continue
      const word = SANSKRIT_COUNT[count - 1] ?? String(count)
      const stepKey = `${block.id}:${index}:${count}`

      // Free recall: say the cue. This is the one that actually rehearses
      // teaching, so it's self-graded rather than multiple choice.
      if (step.cue.trim().length > 0 && !asked.has(`cue:${count}:${step.cue}`)) {
        asked.add(`cue:${count}:${step.cue}`)
        questions.push(
          recall(
            `script-cue:${stepKey}`,
            'cues',
            `${block.title} -- what do you say on ${word} (${count})?`,
            step.cue,
            [
              step.breath,
              step.gaze ? `gaze ${step.gaze}` : null,
              step.hold ? `held ${step.hold.breaths} breaths` : null,
            ]
              .filter(Boolean)
              .join(' · '),
          ),
        )
      }

      if (!asked.has(`breath:${count}:${step.breath}`)) {
        asked.add(`breath:${count}:${step.breath}`)
        questions.push(
          question(
            `script-breath:${stepKey}`,
            'vinyasa',
            `${block.title} -- is ${word} (${count}) an inhale or an exhale?`,
            step.breath,
            ['inhale', 'exhale'],
            step.cue,
          ),
        )
      }

      // Adaptations: the modifications offered for each held pose.
      const adaptation = step.adaptations?.join(' / ')
      if (adaptation && !asked.has(`adaptation:${count}:${adaptation}`)) {
        asked.add(`adaptation:${count}:${adaptation}`)
        questions.push(
          recall(
            `script-adaptation:${stepKey}`,
            'adaptations',
            `${block.title} -- what adaptation do you offer on ${word} (${count})?`,
            adaptation,
            step.cue,
          ),
        )
      }
    }
  }

  // The counting itself, in the shala's spellings.
  for (const [index, word] of SANSKRIT_COUNT.entries()) {
    questions.push(
      question(
        `sanskrit-count:${index + 1}`,
        'vinyasa',
        `What is the Sanskrit count for ${index + 1}?`,
        word,
        shuffle(SANSKRIT_COUNT, rngFor(`count-pool:${index}`)),
      ),
    )
  }

  return questions
}

/**
 * One level of a group of variations, for the questions that compare them.
 *
 * Passed in rather than imported so the generators keep depending only on the
 * sequence and the script.
 */
export interface LevelSet {
  name: string
  poseIds: ReadonlySet<string>
}

/**
 * Which level of a variation first teaches each pose.
 *
 * This is the question the levels actually raise. Whether Yoga Mudra follows
 * Sirsasana B is one fact shared by two levels, and drilling it twice teaches
 * nothing; *which class you'd meet a pose in* is the thing you'd be caught out
 * by, and no per-pose question asks it.
 *
 * Keyed by pose alone. The answer doesn't depend on which level you're
 * studying, so studying Advanced and studying Beginner build one history.
 */
function levelIntroductionQuestions(levels: readonly LevelSet[]): Question[] {
  if (levels.length < 2) return []

  const names = levels.map((level) => level.name)
  const seen = new Set<string>()
  const questions: Question[] = []

  for (const level of levels) {
    for (const poseId of level.poseIds) {
      if (seen.has(poseId)) continue
      seen.add(poseId)
      const pose = POSES.find((candidate) => candidate.id === poseId)
      if (!pose) continue

      questions.push(
        question(
          `level-of:${poseId}`,
          'section-structure',
          `Which level first teaches ${pose.sanskrit}?`,
          level.name,
          names,
        ),
      )
    }
  }

  return questions
}

/**
 * Every question derivable from the given poses.
 *
 * Pass `context` when generating for a named subset so the questions whose
 * answers depend on the cut get scoped ids and prompts. Pass `levels` when the
 * subset is one of a group of variations, for the questions that compare them.
 */
export function generateQuestions(
  poses: readonly Pose[],
  context?: SubsetContext,
  levels: readonly LevelSet[] = [],
): Question[] {
  return [
    ...levelIntroductionQuestions(levels),
    ...nextPoseQuestions(poses, context),
    ...previousPoseQuestions(poses, context),
    ...sectionCountQuestions(poses, context),
    ...sectionBoundaryQuestions(poses, context),
    ...poseSectionQuestions(poses),
    ...nameQuestions(poses),
    ...gazeQuestions(poses),
    ...breathCountQuestions(poses),
    ...repetitionQuestions(poses),
    ...scriptQuestions(poses),
  ]
}

export type { SectionId }
