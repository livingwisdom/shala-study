// src/storage/progress.ts -- JRS 2026-07-28
// localStorage persistence for review progress.

/**
 * Progress persistence.
 *
 * localStorage only -- no accounts, no backend, no sync. That's a deliberate
 * scope choice: it keeps the app a static file anyone can open from a shared
 * link, with nothing to sign into and nothing to pay for. The cost is that
 * progress is per-device, which is the right trade for a study aid.
 *
 * Every read is defensive. A corrupt or half-written value should cost you your
 * review history, not the ability to open the app the night before an exam.
 */

import type { Progress, ProgressRecord } from '../quiz/scheduler'

const STORAGE_KEY = 'shala-study:progress:v1'

function isRecord(value: unknown): value is ProgressRecord {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<ProgressRecord>
  return (
    typeof candidate.box === 'number' &&
    typeof candidate.lastSeen === 'number' &&
    typeof candidate.correct === 'number' &&
    typeof candidate.incorrect === 'number'
  )
}

export function loadProgress(): Progress {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}

    const result: Record<string, ProgressRecord> = {}
    for (const [id, value] of Object.entries(parsed)) {
      if (isRecord(value)) result[id] = value
    }
    return result
  } catch {
    return {}
  }
}

export function saveProgress(progress: Progress): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Private-browsing quota errors shouldn't interrupt a study session.
  }
}

export function clearProgress(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore.
  }
}
