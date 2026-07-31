// src/components/SequenceBrowser.tsx -- JRS 2026-07-29
// Reference list of poses grouped by section.

import { SECTIONS } from '../data/sequence'
import { getSubset, posesInSubset, subsetLabel } from '../data/subsets'
import { resolveGaze } from '../data/gaze'
import SubsetPicker from './SubsetPicker'

interface Props {
  subsetId: string
  onSubsetChange: (id: string) => void
  /** Study this pose on its own. */
  onFocusPose: (poseId: string) => void
  onExit: () => void
}

export default function SequenceBrowser({
  subsetId,
  onSubsetChange,
  onFocusPose,
  onExit,
}: Props) {
  const subset = getSubset(subsetId)
  const poses = subset ? posesInSubset(subset) : []

  return (
    <>
      <div className="header">
        {/* Names the view, so the row isn't a lone button against empty space
            once the sequence title moves down to head the list. */}
        <div className="label view-label">Browse sequence</div>
        <button className="btn-ghost chip" onClick={onExit}>
          Back
        </button>
      </div>

      {/* Switch sequence without going back: the list is the thing you're
          comparing, so the choice belongs on this page too. */}
      <SubsetPicker subsetId={subsetId} onSubsetChange={onSubsetChange} />

      {/* The title names what the picker just selected, so it reads as the
          heading of the list below rather than of the page above. */}
      <div className="browse-title">
        <h1>{subset ? subsetLabel(subset) : 'Sequence'}</h1>
        <p className="subtitle">
          {poses.length} poses -- tap one to study it on its own
        </p>
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
                    {/* The whole row is the target: a separate "study" button
                        would be a small tap area next to a large dead one. */}
                    <button
                      className="pose-row"
                      onClick={() => onFocusPose(pose.id)}
                    >
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
                    </button>
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
