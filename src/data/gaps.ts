// src/data/gaps.ts -- JRS 2026-08-01
// What the app knows it doesn't know, counted once for everyone who asks.

import { unansweredEntries } from './questionBank'
import { scriptedPosesWithUnknownGaze } from './gaze'
import { corrections, sourceIssues } from './script'

/**
 * The open gaps, from all three sources at once.
 *
 * They were being counted in two places and disagreed: the home screen's badge
 * counted unanswered prompts only, while the view it opened counted those plus
 * unknown gaze and the document's contradictions. Tapping a button marked 25
 * and landing on 36 reads as a bug in the data rather than a difference of
 * definition, so there is now one definition.
 */
export function openGaps() {
  return {
    /** Authored prompts with no answer yet. */
    unanswered: unansweredEntries(),
    /** Poses the script teaches but leaves the gaze open on. */
    unknownGaze: scriptedPosesWithUnknownGaze(),
    /** Places the source document contradicts itself. */
    issues: sourceIssues(),
    /**
     * Spellings already corrected here. Listed so the divergence stays visible,
     * but not counted: the work outstanding is in the document, not the app.
     */
    corrections: corrections(),
  }
}

/** How many gaps are outstanding, for the badge. */
export function openGapCount(): number {
  const gaps = openGaps()
  return gaps.unanswered.length + gaps.unknownGaze.length + gaps.issues.length
}
