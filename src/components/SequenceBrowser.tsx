// src/components/SequenceBrowser.tsx -- JRS 2026-07-29
// Reference list of poses grouped by section.

import { SECTIONS } from '../data/sequence'
import { getSubset, posesInSubset } from '../data/subsets'
import { resolveGaze } from '../data/gaze'

interface Props {
  subsetId: string
  onExit: () => void
}

export default function SequenceBrowser({ subsetId, onExit }: Props) {
  const subset = getSubset(subsetId)
  const poses = subset ? posesInSubset(subset) : []

  return (
    <>
      <div className="header">
        <div>
          <h1>{subset?.name ?? 'Sequence'}</h1>
          <p className="subtitle">{poses.length} poses</p>
        </div>
        <button className="btn-ghost chip" onClick={onExit}>
          Back
        </button>
      </div>

      {SECTIONS.map((section) => {
        const inSection = poses.filter((pose) => pose.section === section.id)
        if (inSection.length === 0) return null

        return (
          <div className="card" key={section.id}>
            <h2>{section.name}</h2>
            <p className="subtitle">{inSection.length} poses</p>
            <ul className="pose-list">
              {inSection.map((pose, position) => {
                const gaze = resolveGaze(pose.id)
                return (
                  <li className="pose-item" key={pose.id}>
                    <span className="pose-num">{position + 1}</span>
                    <span>
                      <span className="pose-sanskrit">{pose.sanskrit}</span>
                      <span className="pose-meta"> · {pose.english}</span>
                      <div className="pose-meta">
                        {[
                          pose.breaths !== undefined && `${pose.breaths} breaths`,
                          pose.repetitions !== undefined &&
                            `${pose.repetitions} rounds`,
                          pose.bothSides && 'both sides',
                          gaze.source === 'script' && `gaze ${gaze.wording}`,
                          gaze.source === 'seeded' &&
                            `gaze ${gaze.wording.toLowerCase()} (unverified)`,
                          gaze.source === 'unknown' && 'gaze not recorded',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                      {pose.notes && <div className="pose-meta">{pose.notes}</div>}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </>
  )
}
