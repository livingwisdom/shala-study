// src/components/BoxBar.tsx -- JRS 2026-07-30
// Stacked bar and legend showing how the pool sits across the Leitner boxes.

import { MAX_BOX, type BoxDistribution } from '../quiz/scheduler'

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
  count: number
  color: string
}

function cells(distribution: BoxDistribution): Cell[] {
  return [
    { key: 'new', label: 'New', count: distribution.unseen, color: UNSEEN_COLOR },
    ...Array.from({ length: MAX_BOX }, (_, index) => {
      const box = index + 1
      return {
        key: `box-${box}`,
        label: String(box),
        count: distribution.boxes[box] ?? 0,
        color: BOX_COLORS[index] ?? UNSEEN_COLOR,
      }
    }),
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
              title={`${cell.label}: ${cell.count}`}
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
        Box 1 is just missed, {MAX_BOX} is known. Each right answer moves a
        question one box right and pushes it further out.
      </p>
    </div>
  )
}
