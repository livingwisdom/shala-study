// src/components/QuizView.tsx -- JRS 2026-07-28
// Quiz session: multiple choice and free-recall answering.

import { useState } from 'react'
import type { Question } from '../quiz/types'

interface Props {
  questions: readonly Question[]
  onAnswer: (questionId: string, correct: boolean) => void
  onExit: () => void
}

export default function QuizView({ questions, onAnswer, onExit }: Props) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)

  const question = questions[index]

  if (!question) {
    return (
      <>
        <h1>Session complete</h1>
        <p className="subtitle">
          {score} of {questions.length} correct.
        </p>
        <button className="btn-primary" onClick={onExit} style={{ marginTop: '1rem' }}>
          Back
        </button>
      </>
    )
  }

  const answered = selected !== null || revealed

  const advance = () => {
    setIndex((current) => current + 1)
    setSelected(null)
    setRevealed(false)
  }

  const submitChoice = (choice: string) => {
    if (answered) return
    const correct = choice === question.answer
    setSelected(choice)
    if (correct) setScore((current) => current + 1)
    onAnswer(question.id, correct)
  }

  // Self-graded path, for authored questions with no multiple-choice options.
  const selfGrade = (correct: boolean) => {
    if (correct) setScore((current) => current + 1)
    onAnswer(question.id, correct)
    advance()
  }

  const choiceClass = (choice: string) => {
    if (!answered) return 'choice'
    if (choice === question.answer) return 'choice correct'
    if (choice === selected) return 'choice incorrect'
    return 'choice'
  }

  return (
    <>
      <div className="progress-bar">
        <div style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      <div className="header">
        <p className="subtitle">
          {index + 1} of {questions.length}
        </p>
        <button className="btn-ghost chip" onClick={onExit}>
          Exit
        </button>
      </div>

      {question.unverified && (
        <span className="flag">Unverified -- check against the shala&rsquo;s materials</span>
      )}

      <p className="prompt">{question.prompt}</p>

      {question.choices ? (
        <>
          <div className="stack">
            {question.choices.map((choice) => (
              <button
                key={choice}
                className={choiceClass(choice)}
                onClick={() => submitChoice(choice)}
                disabled={answered}
              >
                {choice}
              </button>
            ))}
          </div>

          {answered && (
            <>
              <div className="feedback">
                <div
                  className={`verdict ${selected === question.answer ? 'right' : 'wrong'}`}
                >
                  {selected === question.answer ? 'Correct' : 'Not quite'}
                </div>
                {question.explanation ?? question.answer}
              </div>
              <button
                className="btn-primary"
                onClick={advance}
                style={{ marginTop: '1rem' }}
              >
                Next
              </button>
            </>
          )}
        </>
      ) : (
        <>
          {revealed ? (
            <>
              <div className="answer-reveal">{question.answer}</div>
              {question.explanation && (
                <p className="subtitle">{question.explanation}</p>
              )}
              <div className="row" style={{ marginTop: '1rem' }}>
                <button style={{ flex: 1 }} onClick={() => selfGrade(false)}>
                  Missed it
                </button>
                <button style={{ flex: 1 }} onClick={() => selfGrade(true)}>
                  Got it
                </button>
              </div>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setRevealed(true)}>
              Show answer
            </button>
          )}
        </>
      )}
    </>
  )
}
