// src/conventions.test.ts -- JRS 2026-07-29
// Tests: house style rules from the global CLAUDE.md that are worth enforcing.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Style rules are easy to state and easy to forget. These two are mechanical
 * enough to check, so they're checked -- a convention nothing enforces drifts
 * back within a few edits.
 */

const SRC = new URL('.', import.meta.url).pathname

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx|css)$/.test(entry) ? [path] : []
  })
}

const FILES = sourceFiles(SRC)

describe('house style', () => {
  it('finds source files to check', () => {
    // Guards against the walker silently matching nothing and the suite
    // reporting a clean pass over an empty set.
    expect(FILES.length).toBeGreaterThan(20)
  })

  it('uses -- rather than an em or en dash', () => {
    // Built from escapes so this file doesn't trip its own check.
    const fancyDash = new RegExp('[\\u2014\\u2013]')
    const offenders = FILES.filter((path) =>
      fancyDash.test(readFileSync(path, 'utf8')),
    ).map((path) => path.replace(SRC, ''))
    expect(offenders).toEqual([])
  })

  it('never double-spaces after a sentence', () => {
    const offenders = FILES.filter((path) =>
      /[.?!] {2}(?!\s)/.test(readFileSync(path, 'utf8')),
    ).map((path) => path.replace(SRC, ''))
    expect(offenders).toEqual([])
  })

  it('gives every source file a header naming it and dating it', () => {
    const offenders = FILES.filter((path) => {
      if (path.endsWith('.css')) return false
      const first = readFileSync(path, 'utf8').split('\n')[0] ?? ''
      return !/^\/\/ \S+ -- JRS \d{4}-\d{2}-\d{2}$/.test(first)
    }).map((path) => path.replace(SRC, ''))
    expect(offenders).toEqual([])
  })
})
