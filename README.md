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
- Which breaths aren't counted? (Prasarita Padottanasana takes an uncounted
  inhale between dve and trini, and most blocks end on one.)
- Which count does a given cue belong to? Where does a block start and end?
- Sanskrit ↔ English names, the shala's other names (Trikonasana B, Pyramid
  Pose), breath counts, rounds
- Which level first teaches a pose
- Room opening and closing, mat layout, what to ask students, what you may and
  may not assume, pregnancy and menstruation guidance

That's 1087 questions at Fundamentals Beginner, rising to 1210 at Advanced,
1211 for Half Primary and 1295 for Full Primary. Sessions are twenty questions,
about ten minutes.

Answer one right and it moves out a step -- back tomorrow, then in three days, a
week, three weeks. Miss it and it returns to the front of the queue whatever it
had earned before: there's no partial credit, because half-remembering a cue is
what leaves you stranded in front of a room. So the questions you keep missing
keep coming back, and the ones you know get out of your way.

## studying one pose

If a single pose keeps slipping -- the bind, the count, the cue you always
fumble -- open **Browse sequence** and tap it. That starts a session on that
pose alone: its names, its gaze and breath count, what comes before and after
it, and its whole script block, cue by cue. Thirty to fifty questions
depending on the pose.

A focused session takes what's due first and then keeps going with what isn't,
because you picked that pose on purpose and "nothing due for it" would be the
wrong answer. Everything you answer still counts towards normal review. The
focus lasts for that session only.

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
