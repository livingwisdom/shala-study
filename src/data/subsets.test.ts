// src/data/subsets.test.ts -- JRS 2026-07-29
// Tests: subset filtering and sequence-data invariants.

import { describe, expect, it } from 'vitest'
import { POSES, getPose } from './sequence'
import { SUBSETS, getSubset, posesInSubset } from './subsets'

function resolve(id: string) {
  const subset = getSubset(id)
  if (!subset) throw new Error(`No subset ${id}`)
  return posesInSubset(subset)
}

describe('subsets', () => {
  it('reference only real poses', () => {
    const ids = new Set(POSES.map((pose) => pose.id))
    for (const subset of SUBSETS) {
      if (subset.poseIds === 'all') continue
      for (const id of subset.poseIds) {
        expect(ids, `${subset.id} references unknown pose "${id}"`).toContain(id)
      }
    }
  })

  it('always resolve in canonical practice order', () => {
    // Subsets are filters, so no matter how the id list is written the poses
    // must come back in the order they are practised.
    for (const subset of SUBSETS) {
      const poses = posesInSubset(subset)
      const indices = poses.map((pose) => pose.index)
      expect(indices).toEqual([...indices].sort((a, b) => a - b))
    }
  })

  it('takes Paschimottanasana A and B but not D at beginner level', () => {
    // D arrives at intermediate. C is in no Fundamentals level at all.
    const ids = resolve('fundamentals-beginner').map((pose) => pose.id)
    expect(ids).toContain('paschimottanasana-a')
    expect(ids).toContain('paschimottanasana-b')
    expect(ids).not.toContain('paschimottanasana-c')
    expect(ids).not.toContain('paschimottanasana-d')
  })

  describe('fundamentals levels', () => {
    const beginner = resolve('fundamentals-beginner').map((pose) => pose.id)
    const intermediate = resolve('fundamentals-intermediate').map((pose) => pose.id)
    const advanced = resolve('fundamentals-advanced').map((pose) => pose.id)

    it('nest, each level containing the one below it', () => {
      // The pacing sheet describes growth, not three separate classes. If this
      // fails, a level has been edited in isolation and they have drifted.
      for (const id of beginner) expect(intermediate).toContain(id)
      for (const id of intermediate) expect(advanced).toContain(id)
    })

    it('grow only where the sheet says they do', () => {
      expect(intermediate).toContain('paschimottanasana-d')
      expect(intermediate).toContain('janu-sirsasana-c')
      expect(beginner).not.toContain('janu-sirsasana-b')

      expect(advanced).toContain('marichyasana-b')
      expect(intermediate).not.toContain('marichyasana-a')
    })

    it('add the inversions at intermediate and the rest at advanced', () => {
      expect(beginner).not.toContain('salamba-sarvangasana')
      expect(intermediate).toContain('salamba-sarvangasana')
      expect(intermediate).toContain('sirsasana-a')
      expect(intermediate).toContain('sirsasana-b')

      expect(intermediate).not.toContain('matsyasana')
      expect(advanced).toContain('matsyasana')
      expect(advanced).toContain('uttana-padasana')
    })

    it('share one standing sequence', () => {
      const standing = (ids: string[]) =>
        ids.filter((id) => getPose(id)?.section === 'standing')
      expect(standing(intermediate)).toEqual(standing(beginner))
      expect(standing(advanced)).toEqual(standing(beginner))
    })

    it('close with the seals at every level', () => {
      for (const ids of [beginner, intermediate, advanced]) {
        expect(ids).toContain('yoga-mudra')
        expect(ids).toContain('padmasana')
        expect(ids).toContain('utplutih')
      }
    })
  })

  it('keeps Paschimottanasana D in full primary', () => {
    expect(resolve('full-primary').map((pose) => pose.id)).toContain(
      'paschimottanasana-d',
    )
  })

  it('cuts half primary after Navasana', () => {
    const poses = resolve('half-primary')
    const ids = poses.map((pose) => pose.id)
    expect(ids).toContain('navasana')
    expect(ids).not.toContain('bhujapidasana')
    expect(ids).not.toContain('supta-kurmasana')
    expect(ids).toContain('urdhva-dhanurasana')
  })

  it('keeps full primary complete', () => {
    expect(resolve('full-primary')).toHaveLength(POSES.length)
  })

  it('makes half primary shorter than full', () => {
    expect(resolve('half-primary').length).toBeLessThan(POSES.length)
  })
})

describe('sequence data', () => {
  it('has unique pose ids', () => {
    const ids = POSES.map((pose) => pose.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('indexes poses contiguously from zero', () => {
    POSES.forEach((pose, position) => {
      expect(pose.index).toBe(position)
    })
  })

  it('groups sections contiguously', () => {
    // "First pose of the seated sequence" is only meaningful if a section is
    // one unbroken run.
    const seen = new Set<string>()
    let current: string | undefined
    for (const pose of POSES) {
      if (pose.section !== current) {
        expect(seen.has(pose.section), `${pose.section} is split`).toBe(false)
        if (current) seen.add(current)
        current = pose.section
      }
    }
  })
})
