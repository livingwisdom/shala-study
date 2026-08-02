// src/components/Home.tsx -- JRS 2026-07-29
// Home screen: sequence picker, progress summary, topic filters.

import { useMemo } from 'react'
import { getSubset } from '../data/subsets'
import { unansweredEntries } from '../data/questionBank'
import { topicsInPool } from '../quiz/engine'
import { boxDistribution, summarise, type Progress } from '../quiz/scheduler'
import BoxBar from './BoxBar'
import SubsetPicker from './SubsetPicker'
import { TOPIC_LABELS, type Question, type Topic } from '../quiz/types'

interface Props {
  subsetId: string
  onSubsetChange: (id: string) => void
  topics: readonly Topic[]
  onTopicsChange: (topics: readonly Topic[]) => void
  pool: readonly Question[]
  progress: Progress
  onStart: () => void
  onBrowse: () => void
  onShowScript: () => void
  onShowGaps: () => void
  onReset: () => void
}

export default function Home({
  subsetId,
  onSubsetChange,
  topics,
  onTopicsChange,
  pool,
  progress,
  onStart,
  onBrowse,
  onShowScript,
  onShowGaps,
  onReset,
}: Props) {
  const subset = getSubset(subsetId)
  const stats = useMemo(
    () => summarise(pool, progress, Date.now()),
    [pool, progress],
  )
  const distribution = useMemo(() => boxDistribution(pool, progress), [pool, progress])

  // Topics are computed from the *unfiltered* pool so the filter chips don't
  // vanish as you narrow the selection and strand you with no way back.
  const availableTopics = useMemo(() => topicsInPool(pool), [pool])
  const gapCount = unansweredEntries().length

  const toggleTopic = (topic: Topic) => {
    onTopicsChange(
      topics.includes(topic)
        ? topics.filter((t) => t !== topic)
        : [...topics, topic],
    )
  }

  return (
    <>
      <header className="header">
        <div className="masthead">
          {/* Same file the browser tab uses, so the mark has one source.
              BASE_URL keeps it correct under the Pages subdirectory. */}
          <img
            className="mark"
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            width="44"
            height="44"
          />
          <div>
            <h1>ytt study</h1>
            <p className="subtitle">ashtanga primary series</p>
          </div>
        </div>
      </header>

      <SubsetPicker subsetId={subsetId} onSubsetChange={onSubsetChange} />

      {subset?.needsVerification && (
        <div className="notice">
          The <strong>{subset.name}</strong> list is a placeholder guess, not the
          shala&rsquo;s. Check it against your training materials and edit{' '}
          <code>src/data/subsets.ts</code>.
        </div>
      )}

      <div className="card">
        <div className="label">Topics {topics.length === 0 && '(all)'}</div>
        <div className="row">
          {availableTopics.map((topic) => (
            <button
              key={topic}
              className="chip"
              aria-pressed={topics.includes(topic)}
              onClick={() => toggleTopic(topic)}
            >
              {TOPIC_LABELS[topic]}
            </button>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={onStart} disabled={stats.due === 0}>
        {stats.due === 0 ? 'Nothing due -- come back later' : `Study ${Math.min(stats.due, 20)} questions`}
      </button>

      <div className="row" style={{ marginTop: '1rem' }}>
        <button className="btn-ghost" onClick={onShowScript}>
          Teaching script
        </button>
        <button className="btn-ghost" onClick={onBrowse}>
          Browse sequence
        </button>
        <button className="btn-ghost" onClick={onShowGaps}>
          Needs answers{gapCount > 0 && ` (${gapCount})`}
        </button>
      </div>

      {/* Below the button on purpose. What you can do fits above the fold, and
          measuring how you're doing waits until you've scrolled for it. */}
      <div className="card progress-card">
        <div className="label">Progress</div>
        <div className="stats">
          <div>
            {/* Reviews only. The count of new questions is right below in the
                box row, and showing it twice read as a mistake. */}
            <div className="stat-value">{stats.reviewDue}</div>
            <div className="stat-label">Review</div>
          </div>
          <div>
            <div className="stat-value">{stats.seen}</div>
            <div className="stat-label">Seen</div>
          </div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
        <BoxBar distribution={distribution} />
      </div>

      {/* Last, and on its own: it throws away every review record, so it
          shouldn't sit in a row of harmless navigation. */}
      <button className="btn-ghost" onClick={onReset}>
        Reset progress
      </button>
    </>
  )
}
