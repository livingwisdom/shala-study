// src/components/BoxBar.tsx -- JRS 2026-07-30
// Stacked bar and legend showing how the pool sits across the Leitner boxes.

import { MAX_BOX, boxIntervalLabel, type BoxDistribution } from '../quiz/scheduler'

/**
 * An ordinal ramp -- one hue, five steps -- because the boxes are one axis from
 * "just missed" to "known", not five unrelated categories. The steps live in
 * the stylesheet so light and dark can each be stepped against their own
 * surface; unseen sits outside the ramp in neutral, since "not started" isn't
 * a point on it.
 */
const BOX_COLORS = [
  'var(--box-1)',
  'var(--box-2)',
  'var(--box-3)',
  'var(--box-4)',
  'var(--box-5)',
] as const
const UNSEEN_COLOR = 'var(--box-unseen)'

interface Cell {
  key: string
  label: string
  /** Hover text, where the box number is still worth having. */
  title: string
  count: number
  color: string
}

/**
 * Best known first, unstarted last.
 *
 * This reads as a progress bar: the pile you haven't touched sits on the right
 * and retreats as you work, while what you know fills in from the left. New on
 * the left was the opposite -- a bar that looks full before you have answered
 * anything.
 *
 * The boxes descend so the whole strip is one gradient, deepest at the left
 * through to the neutral New. Ascending them would put box 5 next to New, the
 * best known against the least.
 */
function cells(distribution: BoxDistribution): Cell[] {
  return [
    ...Array.from({ length: MAX_BOX }, (_, index) => {
      const box = MAX_BOX - index
      return {
        key: `box-${box}`,
        // When it comes back, not which box it sits in. "3" tells you nothing
        // you didn't already know from its position in the row.
        label: boxIntervalLabel(box),
        title: `Box ${box}`,
        count: distribution.boxes[box] ?? 0,
        color: BOX_COLORS[box - 1] ?? UNSEEN_COLOR,
      }
    }),
    {
      key: 'new',
      label: 'new',
      title: 'Not yet seen',
      count: distribution.unseen,
      color: UNSEEN_COLOR,
    },
  ]
}

export default function BoxBar({ distribution }: { distribution: BoxDistribution }) {
  const all = cells(distribution)
  const total = all.reduce((sum, cell) => sum + cell.count, 0)
  if (total === 0) return null

  return (
    <div className="boxes">
      {/* The legend below carries the same numbers, so the bar itself is
          decorative to a screen reader rather than a wall of empty spans. */}
      <div className="box-bar" aria-hidden="true">
        {all
          .filter((cell) => cell.count > 0)
          .map((cell) => (
            <span
              key={cell.key}
              className="box-seg"
              style={{ flexGrow: cell.count, background: cell.color }}
              title={`${cell.title}: ${cell.count}`}
            />
          ))}
      </div>

      <ul className="box-legend">
        {all.map((cell) => (
          <li key={cell.key}>
            <span className="box-dot" style={{ background: cell.color }} />
            <span className="box-count">{cell.count}</span>
            <span className="box-label">{cell.label}</span>
          </li>
        ))}
      </ul>

      <p className="subtitle box-caption">
        Labels are when a question comes back. New ones start on the right;
        each right answer moves one a box left, and further out.
      </p>
    </div>
  )
}
