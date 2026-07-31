// src/storage/preferences.ts -- JRS 2026-07-31
// Small UI preferences that outlive a session, kept apart from review progress.

/**
 * Preferences, stored beside progress but deliberately not with it.
 *
 * Losing a preference costs you one dismissed caption; losing progress costs
 * weeks of review history. Separate keys mean a corrupt preference can never
 * take the important one down with it.
 *
 * Reads are defensive for the same reason as `progress.ts`: whatever comes back
 * from localStorage is untrusted input.
 */

const KEY = 'ytt-study:prefs:v1'

interface Preferences {
  /** True once the box chart's explanation has been read and dismissed. */
  boxCaptionDismissed?: boolean
}

function read(): Preferences {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed as Preferences
  } catch {
    return {}
  }
}

function write(preferences: Preferences): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences))
  } catch {
    // Private browsing quota errors shouldn't interrupt a study session.
  }
}

export function boxCaptionDismissed(): boolean {
  return read().boxCaptionDismissed === true
}

export function setBoxCaptionDismissed(dismissed: boolean): void {
  write({ ...read(), boxCaptionDismissed: dismissed })
}
