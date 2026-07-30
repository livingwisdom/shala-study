// src/App.tsx -- JRS 2026-07-29
// Top-level view routing and progress state.

import { useCallback, useMemo, useState } from 'react'
import Home from './components/Home'
import QuizView from './components/QuizView'
import SequenceBrowser from './components/SequenceBrowser'
import ScriptView from './components/ScriptView'
import NeedsAnswers from './components/NeedsAnswers'
import { buildPool } from './quiz/engine'
import { grade, selectSession, type Progress } from './quiz/scheduler'
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
  const [subsetId, setSubsetId] = useState('fundamentals')
  const [topics, setTopics] = useState<readonly Topic[]>([])
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [session, setSession] = useState<readonly string[]>([])

  const pool = useMemo(() => buildPool({ subsetId, topics }), [subsetId, topics])

  const sessionQuestions = useMemo(() => {
    const byId = new Map(pool.map((question) => [question.id, question]))
    return session.flatMap((id) => {
      const question = byId.get(id)
      return question ? [question] : []
    })
  }, [pool, session])

  const startSession = useCallback(() => {
    const picked = selectSession(pool, progress, Date.now(), SESSION_LIMIT)
    if (picked.length === 0) return
    setSession(picked.map((question) => question.id))
    setView('quiz')
  }, [pool, progress])

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
        onAnswer={recordAnswer}
        onExit={() => setView('home')}
      />
    )
  }

  if (view === 'browse') {
    return <SequenceBrowser subsetId={subsetId} onExit={() => setView('home')} />
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
