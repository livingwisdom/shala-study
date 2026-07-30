// src/data/subsets.test.ts -- JRS 2026-07-29
// Tests: subset filtering and sequence-data invariants.

import { describe, expect, it } from 'vitest'
import { POSES } from './sequence'
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

  it('takes Paschimottanasana A and B but not D in fundamentals', () => {
    // D belongs to Primary. C is in neither -- the shala's script skips it.
    const ids = resolve('fundamentals').map((pose) => pose.id)
    expect(ids).toContain('paschimottanasana-a')
    expect(ids).toContain('paschimottanasana-b')
    expect(ids).not.toContain('paschimottanasana-c')
    expect(ids).not.toContain('paschimottanasana-d')
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
