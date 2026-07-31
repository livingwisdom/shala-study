# ytt study

A quiz app for memorising the Ashtanga primary series, built for a teacher
training course.

**https://livingwisdom.github.io/ytt-study/**

Open that link, tap **Add to Home Screen**, and it behaves like an app -- on
iPhone and Android both. It works offline, so it's usable in the studio whether
or not the wifi is. Nothing to install, no account, no cost.

Your progress is saved on your own device and never leaves it, which also means
it isn't backed up and doesn't follow you between phone and laptop. Clearing
your browser's site data clears it. On iPhone, adding it to the home screen is
worth doing for a second reason: Safari discards a plain tab's stored data after
about a week of not visiting the site.

## what it quizzes you on

Pick a sequence -- **Fundamentals**, **Half Primary**, or **Full Primary** -- and
the questions adapt to it. Fundamentals comes in three levels, **Beginner**,
**Intermediate** and **Advanced**, taken from the shala's 60 minute class
pacing sheet: the same class, growing. Each is a typical shape rather than a
rule, to be adapted to the class and the time. Fundamentals asks about what
you'll actually lead:

- What do you say on catvari? On sapta? -- the cues, verbatim, from free recall
- Which count is held in Surya Namaskara B, and for how many breaths?
- Is dvadasha an inhale or an exhale?
- Which count does Dandasana pick up on? (The running count carries across poses.)
- What adaptation do you offer someone who can't reach the toe?
- Where's the gaze in Parsvottanasana?
- How many poses in the standing sequence? What comes after Janu Sirsasana A?
- Sanskrit ↔ English names, breath counts, rounds
- Room opening and closing, mat layout, what to ask students, what you may and
  may not assume, pregnancy and menstruation guidance

That's 750 questions at Fundamentals Beginner, rising to 865 at Advanced, 913
for Half Primary and 997 for Full Primary. Ones you miss come back sooner; ones
you know come back weeks later. Sessions are twenty questions, about ten
minutes.

There's also a **teaching script** view -- the whole script in large type, with
count, breath, gaze and adaptations pulled out, sized to read while standing.

## before you rely on it

The script-derived material is the shala's own and is reliable. Everything
outside it is not:

- Poses the script doesn't cover (Marichyasana, Navasana, the full finishing
  sequence) are seeded from the standard published primary series. Order and
  names are dependable; **gaze is flagged "unverified" in the app** wherever it
  came from a book rather than the script.
- The studio-specific material -- room setup, intake questions,
  contraindications -- is deliberately blank. Those answers vary between studios
  and they're exactly what you'll be examined on, so they need to come from your
  training notes. The app lists what's missing under **Needs answers**.
- **Needs answers** also lists gaps in the script itself: poses where it writes
  "(gaze ?)", places where it contradicts itself, and the spellings corrected
  here but not in your document.

## filling in the gaps

- `src/data/script.ts` -- the teaching script. The source of truth. Fix a cue
  here and every question about it updates.
- `src/data/questionBank.ts` -- the written questions. Fill in an `answer` and it
  joins the quiz automatically. Add your past quiz questions here; they're the
  most useful thing in the app, because they're the real assessment format.
- `src/data/sequence.ts` -- the wider primary series, for the poses the script
  doesn't cover.

**Changing a Fundamentals level:** the three levels live in
`src/data/subsets.ts`, written additively -- Intermediate is Beginner plus a few
poses, Advanced is Intermediate plus a few more. Edit the block a pose belongs
to (`BEGINNER_SEATED`, `INTERMEDIATE_CLOSING`, and so on) and every level built
from it follows. Order within a list doesn't matter, since practice order always
comes from the canonical sequence.

## development

```bash
npm install
npm run dev      # localhost:5173
npm test
npm run build
```

Pushing to `main` builds and publishes to GitHub Pages automatically
(`.github/workflows/deploy.yml`); a failing test stops the deploy. To host it
anywhere else, deploy `dist/` from `BASE_PATH=/<subdirectory>/ npm run build`,
or plain `npm run build` if it's served from the root.
