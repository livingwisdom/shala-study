# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Inherited conventions

`/Users/tao/CLAUDE.md` sits directly above this project and is loaded as a
parent-directory file, so its rules already apply. Read it. This file overrides
it where they conflict; nothing here currently does.

Three of its rules are enforced mechanically in `src/conventions.test.ts`,
because a convention nothing checks drifts back within a few edits:

- **`--`, never an em or en dash.** Everywhere: prose, comments, and strings the
  UI renders (the teleprompter prints `--` for uncounted steps).
- **Single space after a sentence.**
- **Every source file opens with `// <path> -- JRS <date>` and a one-line
  summary.** New files need this or the suite fails.

Its C-specific rules (brace-always, single exit, parameter objects, define
before use) are marked `(C code)` there and are not applied to this TypeScript.
`question()` in `src/quiz/generators.ts` does take six positional parameters,
four of them strings, which is the hazard the parameter-object rule guards
against -- left as-is deliberately, but it is the one place worth revisiting if
it ever grows a seventh.

## What this is

A study aid for Ashtanga yoga teacher training -- a quiz app for memorising the
primary series, the counted vinyasa, and the teaching knowledge examined
alongside it. Built as an installable PWA so it can be shared with a cohort by
URL and used offline in the studio, on iOS and Android alike.

## Commands

```bash
npm run dev          # dev server at localhost:5173
npm run build        # typecheck (tsc -b) then production build to dist/
npm run preview      # serve the built output, incl. the service worker
npm test             # vitest, single run
npm run test:watch   # vitest in watch mode
npm run typecheck    # types only, no build
npm run lint         # eslint

npx vitest run src/quiz/generators.test.ts              # one file
npx vitest run -t 'knows which count is held'           # one test by name
```

GitHub Pages serves from a subdirectory, so the base path must be set at build
time:

```bash
BASE_PATH=/<repo-name>/ npm run build
```

`.github/workflows/deploy.yml` does this on every push to `main`, deriving the
subdirectory from the repo name rather than hardcoding it, and runs the tests
and lint first so a red suite can't ship. The base path feeds three things at
once -- asset URLs, the manifest `scope`/`start_url`, and the service worker
scope -- so getting it wrong breaks the install-to-home-screen path, not just
a stylesheet.

## Architecture

Three data sources feed one quiz engine. Keeping them separate is the central
design decision, because they have different authority and fail differently.

**`src/data/script.ts` -- the shala's teaching script. The source of truth.**
Transcribed from the training document: every pose block, its counted vinyasa,
the verbatim cue for each count, the breath, the gaze, the hold, and the
adaptations offered. Where this disagrees with `sequence.ts`, this wins. It
produces the majority of the question bank (cues, counting, breath, held
positions, adaptations) and drives the teleprompter view.

**`src/data/sequence.ts` -- the canonical primary series.** Ordered poses tagged
by section, with names, breath counts and traditional drishti. Covers poses the
script doesn't teach, so Full Primary stays complete. Its drishti values are
seeded defaults and are always overridden by the script when one exists.

**`src/data/questionBank.ts` -- authored questions.** What can't be derived:
room opening and closing, mat layout, student intake, scope of practice,
pregnancy and menstruation guidance, past quiz questions.

`src/quiz/generators.ts` derives questions from the first two;
`src/quiz/engine.ts` merges in the third; `src/quiz/scheduler.ts` runs Leitner
spaced repetition; `src/storage/progress.ts` persists to localStorage. No
backend, no accounts -- the app is a static bundle, which is what makes it
shareable as a plain link.

### Subsets are filters, never separate sequences

`src/data/subsets.ts` defines five subsets as lists of pose ids selected from
the single canonical sequence: three Fundamentals levels, Half Primary and Full
Primary. `posesInSubset` always returns them in canonical practice order
regardless of how the id list is written.

This is what makes subset-aware questions work: generators receive the resolved
poses, so "what comes after Janu Sirsasana A?" correctly answers *Urdhva
Dhanurasana* in Fundamentals Beginner and *Janu Sirsasana B* in Full Primary,
with no special-casing.

**The three Fundamentals levels are transcribed from the shala's 60 minute
pacing sheet** and written *additively*: `INTERMEDIATE_SEATED` spreads
`BEGINNER_SEATED` and adds to it, and so on through the closings. That is what
the sheet describes -- one class that grows -- and three hand-copied lists would
drift apart on the first edit. A test asserts each level contains the one below.

Sun salutations and standing are identical at all three levels; only seated and
closing grow.

### Groups nest the picker

The levels share `group: 'fundamentals'`, and `SUBSET_GROUPS` names the family.
The picker shows one button per group plus each ungrouped subset
(`topLevelChoices()`), then a Level row for the selected group. Five peers do
not fit a phone; three do.

`App` stores a single leaf subset id, never a group id -- choosing Fundamentals
selects its `defaultSubsetId`. One piece of state, nothing to reconcile.

Everything outside the Level picker names a level in full, via `subsetLabel()`:
"Fundamentals (Intermediate)", never a bare "Intermediate" -- which to an Ashtangi
means Second Series, not the middle level of a Fundamentals class. "Beginner"
alone has the same problem: beginner *what*. The short names survive only on the
Level buttons, where the group is the button you just pressed.

Build the generator context with `questionContext()` rather than assembling
`{id, name}` by hand, so no caller can disagree about the name.

### Group exits are movable, not owned by a pose

Some blocks are led back-to-back and exit only once, at the end. Paschimottanasana
is the case: the shala leads A, B and D in Primary but only A and B in
Fundamentals, and the exit vinyasa follows whichever variation is last.

`SCRIPT_GROUPS` holds the exit steps; `resolveScript(poseIds)` attaches them to
the last block of the group present in the given subset. Attaching the exit to D
statically would drop it from Fundamentals; attaching it to B would insert a
jump-back into the middle of Primary. Neither matches the room.

A, B and D all use counts 8-10, which is why the exit is 11-14 regardless of
which one it follows -- no renumbering is needed. If a future group doesn't share
that property, this is where renumbering would have to live.

Note that `paschimottanasana-closing` and `closing-three-seals` have their own
11-14 exits written inline. Those are genuinely their own, not group exits.

### Gaze resolution has a precedence order

`src/data/gaze.ts` resolves gaze with the script winning over the seeded
drishti, and reports which source it used. This is load-bearing -- the script
disagrees with the traditional values more often than you'd expect (downward dog
is "belly" here, not the nose; Parsvottanasana is "belly", not the toes;
Utkatasana and Virabhadrasana A are "thumbs", not up). Script-sourced answers
are stated in the shala's words and unflagged; seeded ones carry `unverified`.

A pose whose gaze changes partway through generates no gaze question, because
there's no single right answer.

## Data accuracy conventions

This is a study tool, so **wrong data is worse than missing data**. A blank
field generates no question; a wrong field silently teaches a wrong answer that
gets repeated in an exam and eventually to a student.

- Never guess a value to fill a field. Leave it `undefined` and let the
  generator skip it, until the shala supplies it. The headstand, shoulderstand
  and closing holds were blank on exactly this rule and are now filled from the
  shala: 15 and 10 for Baddha Hasta Sirsasana A and B, and 10 for the
  shoulderstand, the closing Paschimottanasana, Yoga Mudra and Padmasana.
  Parvatasana A and B are still blank, which is the rule working.
- **Write notes and cues in the shala's register.** They describe what's
  offered, not what should happen: "maybe your forehead touches before your
  hands", never "the forehead usually arrives first". No comparison, nothing
  that reads as a target. The room's language deliberately avoids ranking
  students, and a study aid that quietly reintroduces it teaches the wrong
  thing along with the right one.
- Empty answers in `questionBank.ts` are deliberate placeholders, not omissions.
  They are excluded from the quiz and listed in the app's "Needs answers" view.
  **Do not fill them from general knowledge** -- especially the pregnancy,
  menstruation and contraindication entries. Those must come from the shala.
- Substantive errors in the source document are recorded as `sourceIssue` on the
  step and surfaced in the app, *not* silently corrected. Correcting them here
  would hide them from the person who has to fix the actual document.
- Transliteration errors *are* corrected, but every change is recorded in
  `SOURCE_SPELLINGS` so the divergence stays visible. The shala's stylistic
  choices (dasha, shodasha) are left alone.

## Testing notes

Tests focus on the data and the generators rather than the UI, because that is
where a defect would be silently wrong rather than visibly broken. Three
invariants worth preserving:

- **Question ids must be unique and stable.** Progress records key off them, so
  a collision merges two questions' review histories. Script question ids
  include the step index because a count legitimately repeats within a block --
  Urdhva Dhanurasana runs 9/10 three times for the three backbends, and the
  closing seals reuse dasha.
- **Choice order must be deterministic.** `src/quiz/random.ts` seeds a PRNG from
  the question id rather than using `Math.random`, so re-reading a question you
  just missed doesn't reshuffle its options -- otherwise you memorise positions
  instead of answers.
- **A question needs at least two options.** `question()` degrades to free
  recall when the pool can't supply a distractor. This happens legitimately:
  Dandasana's script block has exactly one counted step.

Scheduler functions take `now` as an explicit argument rather than reading the
clock, so interval behaviour is testable without faking timers.
