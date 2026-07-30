// src/data/script.test.ts -- JRS 2026-07-29
// Tests: script integrity, movable group exits, source divergence.

import { describe, expect, it } from 'vitest'
import { POSES } from './sequence'
import {
  SANSKRIT_COUNT,
  TEACHING_SCRIPT,
  corrections,
  getScriptBlock,
  resolveScript,
  scriptedPoseIds,
  sourceIssues,
} from './script'

describe('script integrity', () => {
  it('references only real poses', () => {
    const ids = new Set(POSES.map((pose) => pose.id))
    for (const block of TEACHING_SCRIPT) {
      for (const poseId of block.poseIds) {
        expect(ids, `${block.id} references unknown pose "${poseId}"`).toContain(
          poseId,
        )
      }
    }
  })

  it('has a unique id per block', () => {
    const ids = TEACHING_SCRIPT.map((block) => block.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('never counts past the ordinals we can name', () => {
    for (const block of TEACHING_SCRIPT) {
      for (const step of block.steps) {
        if (step.count === null) continue
        expect(step.count).toBeGreaterThan(0)
        expect(
          step.count,
          `${block.id} counts to ${step.count}, beyond SANSKRIT_COUNT`,
        ).toBeLessThanOrEqual(SANSKRIT_COUNT.length)
      }
    }
  })

  it('covers each scripted pose exactly once', () => {
    const ids = scriptedPoseIds()
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('the movable paschimottanasana exit', () => {
  const exitCue = 'cross legs, plant hands, press lift up'

  function blockFrom(blocks: ReturnType<typeof resolveScript>, id: string) {
    const block = blocks.find((candidate) => candidate.id === id)
    if (!block) throw new Error(`No block ${id}`)
    return block
  }

  it('follows B when D is not being led', () => {
    // Fundamentals takes A and B only. The exit still happens -- after B.
    const blocks = resolveScript(['paschimottanasana-a', 'paschimottanasana-b'])
    const b = blockFrom(blocks, 'paschimottanasana-b')
    expect(b.steps.map((step) => step.cue)).toContain(exitCue)
    expect(b.steps.at(-1)?.cue).toBe('downward facing dog')
  })

  it('follows D when D is being led', () => {
    const blocks = resolveScript([
      'paschimottanasana-a',
      'paschimottanasana-b',
      'paschimottanasana-d',
    ])
    const d = blockFrom(blocks, 'paschimottanasana-d')
    expect(d.steps.map((step) => step.cue)).toContain(exitCue)
  })

  it('never puts an exit in the middle of the group', () => {
    // A jump-back between A and B would be wrong in the room.
    const blocks = resolveScript([
      'paschimottanasana-a',
      'paschimottanasana-b',
      'paschimottanasana-d',
    ])
    for (const id of ['paschimottanasana-a', 'paschimottanasana-b']) {
      expect(blockFrom(blocks, id).steps.map((step) => step.cue)).not.toContain(
        exitCue,
      )
    }
  })

  it('attaches the group exit exactly once', () => {
    // Scoped to the group: the closing Paschimottanasana and the three seals
    // have their own 11-14 exits written inline, which is correct and separate.
    const blocks = resolveScript(scriptedPoseIds())
    const inGroup = blocks.filter((block) => block.group === 'paschimottanasana')
    const withExit = inGroup.filter((block) =>
      block.steps.some((step) => step.cue === exitCue),
    )
    expect(inGroup.map((block) => block.id)).toEqual([
      'paschimottanasana-a',
      'paschimottanasana-b',
      'paschimottanasana-d',
    ])
    expect(withExit.map((block) => block.id)).toEqual(['paschimottanasana-d'])
  })

  it('numbers the exit 11-14 whichever variation it follows', () => {
    // A, B and D all use counts 8-10, so the exit never needs renumbering.
    for (const poses of [
      ['paschimottanasana-a', 'paschimottanasana-b'],
      ['paschimottanasana-a', 'paschimottanasana-b', 'paschimottanasana-d'],
    ]) {
      const blocks = resolveScript(poses)
      const last = blocks.at(-1)
      const exitCounts = last?.steps.slice(-4).map((step) => step.count)
      expect(exitCounts).toEqual([11, 12, 13, 14])
    }
  })
})

describe('divergence from the source document', () => {
  it('records the cue corrections rather than applying them silently', () => {
    const fixed = corrections()
    expect(fixed).toHaveLength(2)

    const trikonasana = fixed.find((c) => c.block.id === 'utthita-trikonasana')
    expect(trikonasana?.step.cue).toBe('left hand grabs big toe')
    expect(trikonasana?.step.correctedFrom).toBe('left foot grabs big toe')

    const padmottanasana = fixed.find(
      (c) => c.block.id === 'ardha-baddha-padmottanasana',
    )
    expect(padmottanasana?.step.cue).toBe('left foot down')
    expect(padmottanasana?.step.correctedFrom).toBe('right foot down')
  })

  it('leaves the duplicated closing count as written', () => {
    // Deliberately not corrected: padmasana and utplutih share dasha in the
    // source, and that's the document's call to make, not this file's.
    const issues = sourceIssues()
    expect(issues).toHaveLength(1)
    expect(issues[0]?.block.id).toBe('closing-three-seals')

    const seals = getScriptBlock('closing-three-seals')
    const tens = seals?.steps.filter((step) => step.count === 10) ?? []
    expect(tens).toHaveLength(2)
  })

  it('keeps every correction traceable to what the doc says', () => {
    for (const { step } of corrections()) {
      expect(step.correctedFrom).toBeTruthy()
      expect(step.correctedFrom).not.toBe(step.cue)
    }
  })

  describe('title casing', () => {
    // The document writes titles lowercase and sequence.ts writes them capped,
    // so questions built from the two sources disagreed about the same pose.
    it('capitalises block titles, single letters included', () => {
      expect(getScriptBlock('surya-namaskara-a')?.title).toBe('Surya Namaskara A')
      expect(getScriptBlock('paschimottanasana-a')?.title).toBe('Paschimottanasana A')
    })

    it('leaves a parenthetical note alone, since it is not part of the name', () => {
      expect(getScriptBlock('utkatasana')?.title).toBe('Utkatasana (through vinyasa)')
    })

    it('capitalises every title', () => {
      for (const block of TEACHING_SCRIPT) {
        expect(block.title[0]).toBe(block.title[0]?.toUpperCase())
      }
    })
  })
})
