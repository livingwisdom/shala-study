// src/components/ScriptView.tsx -- JRS 2026-07-29
// Teleprompter view of the teaching script.

import { useState } from 'react'
import { SANSKRIT_COUNT, fullScript } from '../data/script'

interface Props {
  onExit: () => void
}

/**
 * Teleprompter view of the shala's script.
 *
 * Sized to be read at arm's length while standing, because the point is to
 * lead from it, not to study it sitting down. Cues stay verbatim; the count,
 * breath, gaze and hold are pulled out so the eye can find them mid-sentence.
 */
export default function ScriptView({ onExit }: Props) {
  const [large, setLarge] = useState(true)
  const script = fullScript()

  return (
    <>
      <div className="header">
        <div>
          <h1>Teaching script</h1>
          <p className="subtitle">{script.length} blocks</p>
        </div>
        <div className="row">
          <button className="btn-ghost chip" onClick={() => setLarge((v) => !v)}>
            {large ? 'Smaller' : 'Larger'}
          </button>
          <button className="btn-ghost chip" onClick={onExit}>
            Back
          </button>
        </div>
      </div>

      <div className={large ? 'script script-large' : 'script'}>
        {script.map((block) => (
          <div className="card" key={block.id}>
            <h2>{block.title}</h2>
            {block.rounds !== undefined && (
              <p className="subtitle">{block.rounds} rounds</p>
            )}
            {block.teacherNote && (
              <p className="subtitle">({block.teacherNote})</p>
            )}

            <ol className="script-steps">
              {block.steps.map((step, index) => {
                const word =
                  step.count === null
                    ? '--'
                    : (SANSKRIT_COUNT[step.count - 1] ?? String(step.count))
                return (
                  <li className="script-step" key={`${block.id}-${index}`}>
                    <div className="script-count">
                      <span className="script-numeral">{word}</span>
                      <span className="script-breath">{step.breath}</span>
                    </div>
                    <div className="script-body">
                      <div className="script-cue">{step.cue || '--'}</div>
                      {step.gaze && (
                        <div className="script-gaze">gaze {step.gaze}</div>
                      )}
                      {step.gazeUnknown && (
                        <div className="script-gaze script-gap">gaze not recorded</div>
                      )}
                      {step.hold && (
                        <div className="script-hold">
                          hold {step.hold.breaths}
                          {step.hold.note ? ` -- ${step.hold.note}` : ''}
                        </div>
                      )}
                      {step.adaptations?.map((adaptation) => (
                        <div className="script-adaptation" key={adaptation}>
                          [{adaptation}]
                        </div>
                      ))}
                      {step.sourceIssue && (
                        <div className="script-issue">⚠ {step.sourceIssue}</div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </div>
    </>
  )
}
