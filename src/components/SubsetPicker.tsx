// src/components/SubsetPicker.tsx -- JRS 2026-07-31
// The sequence and level chooser, shared by the home screen and the browser.

import {
  getGroup,
  getSubset,
  subsetsInGroup,
  topLevelChoices,
} from '../data/subsets'

interface Props {
  subsetId: string
  onSubsetChange: (id: string) => void
}

/**
 * One control in two places.
 *
 * Browsing the sequence and starting a session are the same choice, so they
 * shouldn't be two copies of the same markup that drift when a third sequence
 * arrives.
 */
export default function SubsetPicker({ subsetId, onSubsetChange }: Props) {
  const subset = getSubset(subsetId)
  // The top row stays pressed on the *group* while a level is selected, so
  // Fundamentals stays lit as you move between Beginner and Advanced.
  const selectedTop = subset?.group ?? subsetId
  const levels = subset?.group ? subsetsInGroup(subset.group) : []

  /** A group button selects its default level; a plain subset selects itself. */
  const chooseTop = (choiceId: string) =>
    getGroup(choiceId)?.defaultSubsetId ?? choiceId

  return (
    <div className="card">
      <div className="label">Sequence</div>
      <div className="segmented">
        {topLevelChoices().map((choice) => (
          <button
            key={choice.id}
            aria-pressed={choice.id === selectedTop}
            onClick={() => onSubsetChange(chooseTop(choice.id))}
          >
            {choice.name}
          </button>
        ))}
      </div>

      {/* Only groups have levels, so this row appears for Fundamentals and not
          for Half or Full Primary. */}
      {levels.length > 0 && (
        <>
          <div className="label level-label">Level</div>
          <div className="segmented">
            {levels.map((level) => (
              <button
                key={level.id}
                aria-pressed={level.id === subsetId}
                onClick={() => onSubsetChange(level.id)}
              >
                {level.name}
              </button>
            ))}
          </div>
        </>
      )}

      {subset && <p className="subtitle sequence-blurb">{subset.description}</p>}
    </div>
  )
}
