// src/App.tsx -- JRS 2026-07-29
// Top-level view routing and progress state.

import { useCallback, useMemo, useState } from 'react'
import Home from './components/Home'
import QuizView from './components/QuizView'
import SequenceBrowser from './components/SequenceBrowser'
import ScriptView from './components/ScriptView'
import NeedsAnswers from './components/NeedsAnswers'
import { getPose } from './data/sequence'
import { getSubset, subsetLabel } from './data/subsets'
import { buildPool } from './quiz/engine'
import { rngFor } from './quiz/random'
import {
  grade,
  padSession,
  selectSession,
  type Progress,
} from './quiz/scheduler'
import type { Topic } from './quiz/types'
import { clearProgress, loadProgress, saveProgress } from './storage/progress'

type View = 'home' | 'quiz' | 'browse' | 'script' | 'gaps'

/**
 * Session length. Twenty is about ten minutes of study -- short enough to do
 * between things, which is when this actually gets used.
 */
const SESSION_LIMIT = 20

export default function App() {
  const [view, setView] = useState<View>('home')
  // Always a leaf subset, never a group: picking Fundamentals selects one of
  // its levels, so there is one piece of state here rather than two to keep in
  // step with each other.
  const [subsetId, setSubsetId] = useState('fundamentals-beginner')
  const [topics, setTopics] = useState<readonly Topic[]>([])
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [session, setSession] = useState<readonly string[]>([])
  // Set by tapping a pose in the browser; cleared when the session ends, so a
  // narrowed pool can't quietly persist into the next sitting.
  const [focusPoseId, setFocusPoseId] = useState<string | null>(null)

  const pool = useMemo(
    () => buildPool({ subsetId, topics, ...(focusPoseId ? { poseId: focusPoseId } : {}) }),
    [subsetId, topics, focusPoseId],
  )

  // Named the same way the question prompts name it, so the header and a
  // scoped prompt never disagree about what you are studying.
  const subset = getSubset(subsetId)
  const focusPose = focusPoseId === null ? undefined : getPose(focusPoseId)
  const sequenceName = [subset ? subsetLabel(subset) : '', focusPose?.sanskrit]
    .filter(Boolean)
    .join(' · ')

  const sessionQuestions = useMemo(() => {
    const byId = new Map(pool.map((question) => [question.id, question]))
    return session.flatMap((id) => {
      const question = byId.get(id)
      return question ? [question] : []
    })
  }, [pool, session])

  const startSession = useCallback(
    (poseId?: string) => {
      // Seeded from the start time so each session shuffles differently, while
      // the picked ids are frozen in state -- a re-render can't reorder a
      // session you're partway through.
      const now = Date.now()
      const rng = rngFor(`session:${now}`)
      const available = poseId
        ? buildPool({ subsetId, topics, poseId })
        : pool

      const due = selectSession(available, progress, now, SESSION_LIMIT, rng)
      // Focused study pads with what isn't due yet: you picked this pose on
      // purpose, and "nothing due for it" answers the wrong question.
      const picked = poseId
        ? padSession(due, available, SESSION_LIMIT, rngFor(`pad:${now}`))
        : due

      if (picked.length === 0) return
      setFocusPoseId(poseId ?? null)
      setSession(picked.map((question) => question.id))
      setView('quiz')
    },
    [pool, progress, subsetId, topics],
  )

  const recordAnswer = useCallback((questionId: string, correct: boolean) => {
    setProgress((current) => {
      const next = {
        ...current,
        [questionId]: grade(current[questionId], correct, Date.now()),
      }
      saveProgress(next)
      return next
    })
  }, [])

  const resetProgress = useCallback(() => {
    clearProgress()
    setProgress({})
  }, [])

  if (view === 'quiz') {
    return (
      <QuizView
        questions={sessionQuestions}
        sequenceName={sequenceName}
        onAnswer={recordAnswer}
        onExit={() => {
          setFocusPoseId(null)
          setView('home')
        }}
      />
    )
  }

  if (view === 'browse') {
    return (
      <SequenceBrowser
        subsetId={subsetId}
        onFocusPose={(poseId) => startSession(poseId)}
        onExit={() => setView('home')}
      />
    )
  }

  if (view === 'script') {
    return <ScriptView onExit={() => setView('home')} />
  }

  if (view === 'gaps') {
    return <NeedsAnswers onExit={() => setView('home')} />
  }

  return (
    <Home
      subsetId={subsetId}
      onSubsetChange={setSubsetId}
      topics={topics}
      onTopicsChange={setTopics}
      pool={pool}
      progress={progress}
      onStart={startSession}
      onBrowse={() => setView('browse')}
      onShowScript={() => setView('script')}
      onShowGaps={() => setView('gaps')}
      onReset={resetProgress}
    />
  )
}
