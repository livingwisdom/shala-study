// src/components/NeedsAnswers.tsx -- JRS 2026-07-29
// Open gaps: unanswered prompts, unknown gaze, source contradictions.

import { unansweredEntries } from '../data/questionBank'
import { scriptedPosesWithUnknownGaze } from '../data/gaze'
import { SOURCE_SPELLINGS, corrections, sourceIssues } from '../data/script'
import { getPose } from '../data/sequence'
import { TOPIC_LABELS, type Topic } from '../quiz/types'

interface Props {
  onExit: () => void
}

/**
 * Everything the app knows it doesn't know.
 *
 * Three kinds of gap, deliberately shown together: prompts with no answer yet,
 * poses whose gaze the script leaves open, and places the source document
 * contradicts itself. All three are questions to take back to the shala, and
 * all three are invisible unless something surfaces them.
 */
export default function NeedsAnswers({ onExit }: Props) {
  const entries = unansweredEntries()
  const gazeGaps = scriptedPosesWithUnknownGaze()
  const issues = sourceIssues()
  const fixed = corrections()

  const byTopic = new Map<Topic, typeof entries>()
  for (const entry of entries) {
    byTopic.set(entry.topic, [...(byTopic.get(entry.topic) ?? []), entry])
  }

  // Corrections aren't "open" -- they're already applied here -- so they're
  // listed but not counted as outstanding work.
  const total = entries.length + gazeGaps.length + issues.length

  return (
    <>
      <div className="header">
        <div>
          <h1>Needs answers</h1>
          <p className="subtitle">{total} open items</p>
        </div>
        <button className="btn-ghost chip" onClick={onExit}>
          Back
        </button>
      </div>

      {gazeGaps.length > 0 && (
        <div className="card">
          <h2>Gaze not recorded</h2>
          <p className="subtitle">
            The script marks these “(gaze ?)” or leaves the held step blank.
          </p>
          <ul className="pose-list">
            {gazeGaps.map((poseId) => (
              <li className="pose-item" key={poseId}>
                <span>{getPose(poseId)?.sanskrit ?? poseId}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {issues.length > 0 && (
        <div className="card">
          <h2>Contradictions in the script</h2>
          <p className="subtitle">
            Left as written rather than corrected -- worth raising with whoever
            maintains the document.
          </p>
          <ul className="pose-list">
            {issues.map(({ block, step }) => (
              <li className="pose-item" key={`${block.id}-${step.count}`}>
                <span>
                  <span className="pose-sanskrit">{block.title}</span>
                  <div className="pose-meta">{step.sourceIssue}</div>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fixed.length > 0 && (
        <div className="card">
          <h2>Cues corrected here</h2>
          <p className="subtitle">
            Fixed in the app but not in your document -- worth updating there too.
          </p>
          <ul className="pose-list">
            {fixed.map(({ block, step }) => (
              <li className="pose-item" key={`${block.id}-${step.count}-fix`}>
                <span>
                  <span className="pose-sanskrit">{block.title}</span>
                  <div className="pose-meta">
                    <s>{step.correctedFrom}</s> → {step.cue}
                  </div>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {entries.length > 0 && (
        <>
          <div className="notice">
            These come from the shala, not from a book. Fill them in{' '}
            <code>src/data/questionBank.ts</code> and they join the quiz
            automatically.
          </div>

          {[...byTopic.entries()].map(([topic, topicEntries]) => (
            <div className="card" key={topic}>
              <h2>{TOPIC_LABELS[topic]}</h2>
              <ul className="pose-list">
                {topicEntries.map((entry) => (
                  <li className="pose-item" key={entry.id}>
                    <span>{entry.prompt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      <div className="card">
        <h2>Spelling corrected from the source</h2>
        <p className="subtitle">
          Applied here but not in your document. If the shala&rsquo;s handout uses
          the original, learn that one.
        </p>
        <ul className="pose-list">
          {SOURCE_SPELLINGS.map((entry) => (
            <li className="pose-item" key={entry.asWritten}>
              <span>
                <span className="pose-sanskrit">
                  {entry.asWritten} → {entry.corrected}
                </span>
                <div className="pose-meta">{entry.why}</div>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
