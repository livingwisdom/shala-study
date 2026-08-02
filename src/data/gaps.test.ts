// src/data/gaps.test.ts -- JRS 2026-08-01
// Tests: one definition of an open gap, for the badge and the view alike.

import { describe, expect, it } from 'vitest'
import { openGapCount, openGaps } from './gaps'

describe('open gaps', () => {
  it('counts every kind of gap, not just the unanswered prompts', () => {
    // The badge used to count only these, so it read 25 and opened a view
    // saying 36.
    const gaps = openGaps()
    expect(openGapCount()).toBeGreaterThan(gaps.unanswered.length)
    expect(openGapCount()).toBe(
      gaps.unanswered.length + gaps.unknownGaze.length + gaps.issues.length,
    )
  })

  it('leaves corrections out of the count', () => {
    // Already fixed here; what's outstanding is in the document, not the app.
    const gaps = openGaps()
    expect(gaps.corrections.length).toBeGreaterThan(0)
    expect(openGapCount()).toBeLessThan(
      gaps.unanswered.length +
        gaps.unknownGaze.length +
        gaps.issues.length +
        gaps.corrections.length,
    )
  })

  it('finds gaps of all three kinds today', () => {
    // If any of these hits zero the shala has answered something, and the
    // README's claim about what's missing needs revisiting.
    const gaps = openGaps()
    expect(gaps.unanswered.length).toBeGreaterThan(0)
    expect(gaps.unknownGaze.length).toBeGreaterThan(0)
    expect(gaps.issues.length).toBeGreaterThan(0)
  })
})
