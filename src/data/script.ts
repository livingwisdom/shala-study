// src/data/script.ts -- JRS 2026-07-29
// The shala's teaching script as structured data.

/**
 * The shala's teaching script, as structured data.
 *
 * Transcribed from ytt_teaching_script_20260729.md ("New version May 13:
 * ensured dristhi, adaptations to each held pose").
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS FILE IS THE SOURCE OF TRUTH.
 *
 * Where this disagrees with `sequence.ts`, this wins -- it's the shala's own
 * wording, counting, and gaze, and it's what you'll be examined on.
 *
 * Cues are verbatim. Sanskrit transliteration has been corrected where the doc
 * had outright errors, with every change recorded in SOURCE_SPELLINGS so the
 * divergence stays visible; the shala's stylistic choices (dasha, shodasha)
 * are left alone. Substantive problems in the source -- a wrong limb, a
 * duplicated count -- are marked `sourceIssue` on the step rather than fixed,
 * because correcting them here silently would hide them from the doc's author.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Breath = 'inhale' | 'exhale'

/**
 * The Sanskrit ordinals used to call the count, 1-indexed.
 *
 * The script's own "sha" style is kept throughout (dasha, shodasha) -- that's a
 * legitimate phonetic rendering of daśa/ṣoḍaśa and it's how the shala writes
 * it. Only outright errors are corrected; see SOURCE_SPELLINGS for the diff.
 */
export const SANSKRIT_COUNT: readonly string[] = [
  'ekam',
  'dve',
  'trini',
  'catvari',
  'panca',
  'sat',
  'sapta',
  'astau',
  'nava',
  'dasha',
  'ekadasha',
  'dvadasha',
  'trayodasha',
  'caturdasha',
  'pancadasha',
  'shodasha',
  'saptadasha',
  'ashtadasha',
  'ekonavimshatih',
  'vimshatih',
]

/**
 * Where this file's spelling diverges from the source document.
 *
 * Recorded rather than silently applied: if the shala's handout uses the
 * left-hand spelling, that's what an examiner will expect to see, and you
 * should know the two differ before deciding which to learn.
 */
export const SOURCE_SPELLINGS: readonly {
  asWritten: string
  corrected: string
  why: string
}[] = [
  { asWritten: 'due', corrected: 'dve', why: 'द्वे -- "due" is a phonetic slip.' },
  {
    asWritten: 'catuari',
    corrected: 'catvari',
    why: 'चत्वारि -- the conjunct is tva, not tua.',
  },
  {
    asWritten: 'duodasha',
    corrected: 'dvadasha',
    why: 'द्वादश -- "duo" is Latin; the Sanskrit stem is dva.',
  },
  {
    asWritten: 'ekonavimshathih',
    corrected: 'ekonavimshatih',
    why: 'एकोनविंशतिः -- plain t, no aspiration.',
  },
  {
    asWritten: 'vimshathih',
    corrected: 'vimshatih',
    why: 'विंशतिः -- plain t, no aspiration.',
  },
  {
    asWritten: 'samasthih',
    corrected: 'samasthiti',
    why: 'समस्थितिः -- "equal standing"; the ending is -sthiti.',
  },
  {
    asWritten: 'utplutihih',
    corrected: 'utplutih',
    why: 'उत्प्लुतिः -- the -ih ending is doubled in the doc.',
  },
  {
    asWritten: 'surya namaskar',
    corrected: 'surya namaskara',
    why: 'नमस्कार -- the final -a is dropped in Hindi, kept in Sanskrit.',
  },
  {
    asWritten: 'dristhi',
    corrected: 'drishti',
    why: 'दृष्टि -- the r and i are transposed in the doc header.',
  },
]

export interface Hold {
  /** Breaths held at this step. */
  breaths: number
  /** The refining cue given while holding, if any. */
  note?: string
}

export interface ScriptStep {
  /** Vinyasa number, or null for the uncounted "--" steps. */
  count: number | null
  breath: Breath
  /** Verbatim cue from the script. */
  cue: string
  /**
   * Gaze in the shala's own words ("thumbs", "belly", "nose", "toe", "hand",
   * "left fingertips"). Undefined where the script doesn't specify one.
   */
  gaze?: string
  /** True where the script itself records the gaze as unknown -- "(gaze ?)". */
  gazeUnknown?: boolean
  /** Bracketed alternatives and modifications, verbatim. */
  adaptations?: readonly string[]
  hold?: Hold
  /** A problem in the source document, left as written on purpose. */
  sourceIssue?: string
  /**
   * The cue as the source document writes it, where this file corrects it.
   *
   * Recorded rather than replaced silently: the doc still says the old thing,
   * and whoever maintains it needs to be able to see what diverged.
   */
  correctedFrom?: string
}

export interface PoseScript {
  /** Slug for this block of the script. */
  id: string
  /** Heading as written in the script. */
  title: string
  /** Poses in `sequence.ts` this block covers. */
  poseIds: readonly string[]
  /** Rounds, where the script specifies them. */
  rounds?: number
  /** Instruction to the teacher, not to the room. */
  teacherNote?: string
  /**
   * Group this block belongs to, if it shares a movable exit. See SCRIPT_GROUPS.
   */
  group?: string
  steps: readonly ScriptStep[]
}

/** Terse constructor so the data below stays readable. */
function s(
  count: number | null,
  breath: Breath,
  cue: string,
  extra: Partial<Omit<ScriptStep, 'count' | 'breath' | 'cue'>> = {},
): ScriptStep {
  return { count, breath, cue, ...extra }
}

/**
 * A run of blocks led back-to-back that exits only once, at the end.
 *
 * Paschimottanasana is the case this exists for: the shala leads A, B and D in
 * Primary but only A and B in Fundamentals, and the exit vinyasa follows
 * whichever variation is last. Attaching the exit to D would drop it from
 * Fundamentals; attaching it to B would insert a jump-back into the middle of
 * Primary. Neither is what happens in the room.
 *
 * So the exit belongs to the *group*, and `resolveScript` attaches it to the
 * last block actually being practised. A, B and D all use counts 8-10, which is
 * why the exit is 11-14 regardless of which one it follows -- no renumbering.
 */
export interface ScriptGroup {
  id: string
  /** Steps that close the group, after whichever block comes last. */
  exit: readonly ScriptStep[]
}

export const SCRIPT_GROUPS: readonly ScriptGroup[] = [
  {
    id: 'paschimottanasana',
    exit: [
      s(11, 'inhale', 'cross legs, plant hands, press lift up', {
        adaptations: ['mini ws'],
      }),
      s(12, 'exhale', 'jump legs back to caturanga'),
      s(13, 'inhale', 'upward facing dog'),
      s(14, 'exhale', 'downward facing dog'),
    ],
  },
]

const CATURANGA_EXIT: readonly ScriptStep[] = [
  s(11, 'exhale', 'jump legs back to caturanga'),
  s(12, 'inhale', 'upward facing dog'),
  s(13, 'exhale', 'downward facing dog'),
]

export const TEACHING_SCRIPT: readonly PoseScript[] = [
  {
    id: 'surya-namaskara-a',
    title: 'surya namaskara a',
    poseIds: ['surya-namaskara-a'],
    rounds: 5,
    steps: [
      s(1, 'inhale', 'hands up, head back, elbows squeeze', { gaze: 'thumbs' }),
      s(2, 'exhale', 'forward fold, head to knees, palms grounded'),
      s(3, 'inhale', 'half lift, head up, spine long'),
      s(4, 'exhale', 'hop or step back, caturanga'),
      s(5, 'inhale', 'upward facing dog', { gaze: 'nose' }),
      s(
        6,
        'exhale',
        'downward facing dog, internally rotate legs, externally rotate arms, tail bone points at top back corner of the room',
        { gaze: 'belly', hold: { breaths: 5 } },
      ),
      s(7, 'inhale', 'travel forward, feet between the hands, spine long, head up'),
      s(8, 'exhale', 'fold forward, palms grounded, head to knees'),
      s(9, 'inhale', 'rise up, arms extend up, elbows squeeze together', {
        gaze: 'thumbs',
      }),
      s(null, 'exhale', 'samasthiti'),
    ],
  },

  {
    id: 'surya-namaskara-b',
    title: 'surya namaskara b',
    poseIds: ['surya-namaskara-b'],
    rounds: 3,
    steps: [
      s(1, 'inhale', 'knees bent, hips low, arms up', { gaze: 'thumbs' }),
      s(2, 'exhale', 'forward fold, head to knees, palms grounded'),
      s(3, 'inhale', 'half lift, head up, spine long'),
      s(4, 'exhale', 'hop or step back, caturanga'),
      s(5, 'inhale', 'upward facing dog', { gaze: 'nose' }),
      s(
        6,
        'exhale',
        'downward facing dog, internally rotate legs, externally rotate arms, tail bone points at top back corner of the room',
        { gaze: 'belly' },
      ),
      s(
        7,
        'inhale',
        'right foot steps between the hands, arms up, elbows squeeze together',
        { gaze: 'thumbs' },
      ),
      s(8, 'exhale', 'palms press, foot lifts, caturanga'),
      s(9, 'inhale', 'upward facing dog', { gaze: 'nose' }),
      s(10, 'exhale', 'downward facing dog', { gaze: 'belly' }),
      s(11, 'inhale', 'left foot steps between hands, arms up, squeeze elbows', {
        gaze: 'thumbs',
      }),
      s(12, 'exhale', 'press palms, lift foot, caturanga'),
      s(13, 'inhale', 'upward facing dog', { gaze: 'nose' }),
      s(14, 'exhale', 'downward facing dog', {
        gaze: 'belly',
        hold: { breaths: 5 },
      }),
      s(15, 'inhale', 'hop or step between the hands, head up, spine long'),
      s(16, 'exhale', 'fold forward, palms grounded, head to knees'),
      s(17, 'inhale', 'knees bent, hips low, arms up', { gaze: 'thumbs' }),
      s(null, 'exhale', 'samasthiti'),
    ],
  },

  {
    id: 'padangusthasana',
    title: 'padangusthasana',
    poseIds: ['padangusthasana'],
    steps: [
      s(1, 'inhale', 'feet shoulder width apart, peace fingers grab big toes, spine long'),
      s(
        2,
        'exhale',
        'forward fold, leaning slightly forward, arms pulling, keep space between shoulders and ears',
        { hold: { breaths: 5 } },
      ),
      s(3, 'inhale', 'half lift'),
      s(null, 'exhale', 'pause'),
    ],
  },

  {
    id: 'padahastasana',
    title: 'padahastasana',
    poseIds: ['padahastasana'],
    steps: [
      s(1, 'inhale', 'hands under feet, palms up, feet internally rotated'),
      s(
        2,
        'exhale',
        'fold, shift weight forward, pressing down on inner line of foot, straightening the legs',
        { hold: { breaths: 5, note: 'folding deeper on exhales' } },
      ),
      s(3, 'inhale', 'head up, half lift'),
      s(null, 'exhale', 'samasthiti'),
    ],
  },

  {
    id: 'utthita-trikonasana',
    title: 'utthita trikonasana',
    poseIds: ['utthita-trikonasana'],
    steps: [
      s(1, 'inhale', 'step right foot back, feet wide, arms T'),
      s(2, 'exhale', 'right hand grabs big toe', {
        gaze: 'thumb',
        hold: { breaths: 5, note: 'lean back' },
      }),
      s(3, 'inhale', 'rise up, arms T, pivot left foot forward'),
      s(4, 'exhale', 'left hand grabs big toe', {
        gaze: 'thumb',
        hold: { breaths: 5, note: 'lean back' },
        correctedFrom: 'left foot grabs big toe',
      }),
      s(5, 'inhale', 'rise up, arms T, pivot right foot'),
    ],
  },

  {
    id: 'parivrtta-trikonasana',
    title: 'parivrtta trikonasana',
    poseIds: ['parivrtta-trikonasana'],
    steps: [
      s(2, 'exhale', 'left hand outside right foot', {
        gaze: 'thumb',
        adaptations: ['left hand can also go inside right foot, or on a block'],
        hold: {
          breaths: 5,
          note: 'pinky finger toward the ground, lengthen on the inhales, twist on the exhales',
        },
      }),
      s(3, 'inhale', 'rise up, feet parallel, arms T'),
      s(
        4,
        'exhale',
        'left foot pivots, right hand goes outside left foot, left arm extended',
        {
          gaze: 'thumb',
          adaptations: ['or inside foot, or on block'],
          hold: {
            breaths: 5,
            note: 'pinky finger toward the ground, lengthen on the inhales, twist on the exhales',
          },
        },
      ),
      s(5, 'inhale', 'rise up, arms T'),
      s(null, 'exhale', 'samasthiti'),
    ],
  },

  {
    id: 'utthita-parsvakonasana',
    title: 'utthita parsvakonasana',
    poseIds: ['utthita-parsvakonasana'],
    steps: [
      s(1, 'inhale', 'right foot steps wide, arms T'),
      s(
        2,
        'exhale',
        'fold over right knee, right hand outside right foot, left arm extends',
        {
          gaze: 'hand',
          adaptations: ['elbow on knee or block under hand'],
          hold: {
            breaths: 5,
            note: 'pressing the outside edge of the left foot, stacking left hip on top of right hip, opening your chest',
          },
        },
      ),
      s(3, 'inhale', 'rise up, arms T, feet parallel'),
      s(
        4,
        'exhale',
        'left foot pivots, left hand outside left foot, right arm extends',
        {
          gaze: 'hand',
          adaptations: ['elbow on knee or block under hand'],
          hold: {
            breaths: 5,
            note: 'pressing the outside edge of right foot, stacking right hip on left, opening chest',
          },
        },
      ),
      s(5, 'inhale', 'rise up, arms T, come through center'),
    ],
  },

  {
    id: 'parivrtta-parsvakonasana',
    title: 'parivrtta parsvakonasana',
    poseIds: ['parivrtta-parsvakonasana'],
    steps: [
      s(2, 'exhale', 'left knee lowers, left elbow hooks right knee, hands in prayer', {
        gaze: 'hand',
        adaptations: ['stay knee down, or knee up w/ prayer twist, or open arms'],
        hold: { breaths: 5 },
      }),
      s(3, 'inhale', 'rise up, arms T'),
      s(4, 'exhale', 'right knee lowers, right elbow hooks left knee, hands in prayer', {
        gaze: 'hand',
        adaptations: ['repeat version from first side'],
        hold: { breaths: 5 },
      }),
      s(5, 'inhale', 'rise up, arms T'),
      s(null, 'exhale', 'samasthiti'),
    ],
  },

  {
    id: 'prasarita-padottanasana-a',
    title: 'prasarita padottanasana a',
    poseIds: ['prasarita-padottanasana-a'],
    steps: [
      s(1, 'inhale', 'step right foot back, feet parallel, hands to waist'),
      s(2, 'exhale', 'forward fold, hands shoulder width'),
      s(null, 'inhale', 'hands in line with feet, arms straight, pause here'),
      s(3, 'exhale', 'fold all the way, crown of head reaching to mat', {
        gaze: 'nose',
        adaptations: ['can use block'],
        hold: { breaths: 5 },
      }),
      s(4, 'inhale', 'half lift, arms straight'),
      s(null, 'exhale', 'pause here'),
      s(5, 'inhale', 'rise up, hands waist'),
      s(null, 'exhale', 'here'),
    ],
  },

  {
    id: 'prasarita-padottanasana-b',
    title: 'prasarita padottanasana b',
    poseIds: ['prasarita-padottanasana-b'],
    steps: [
      s(1, 'inhale', 'arms T'),
      s(2, 'exhale', 'hands waist'),
      s(null, 'inhale', 'head up, look ceiling, squeeze elbows'),
      s(3, 'exhale', 'fold forward', {
        gaze: 'nose',
        adaptations: ['feel free to repeat A with hands down'],
        hold: { breaths: 5 },
      }),
      s(4, 'inhale', 'rise up'),
      s(null, 'exhale', 'pause'),
    ],
  },

  {
    id: 'prasarita-padottanasana-c',
    title: 'prasarita padottanasana c',
    poseIds: ['prasarita-padottanasana-c'],
    steps: [
      s(1, 'inhale', 'arms T'),
      s(
        2,
        'exhale',
        'interlace the fingers behind the back, arms straight, elbows slightly bent',
        { adaptations: ['strap shoulder width, thumbs out'] },
      ),
      s(null, 'inhale', 'look up, chest open'),
      s(3, 'exhale', 'fold', { gaze: 'nose', hold: { breaths: 5 } }),
      s(4, 'inhale', 'rise up, keep the hands'),
      s(null, 'exhale', 'pause here, keep the hands'),
    ],
  },

  {
    id: 'prasarita-padottanasana-d',
    title: 'prasarita padottanasana d',
    poseIds: ['prasarita-padottanasana-d'],
    steps: [
      s(1, 'inhale', 'hands waist'),
      s(2, 'exhale', 'peace fingers grab big toes', {
        adaptations: ['or ankles, or shins'],
      }),
      s(null, 'inhale', 'spine long, head up'),
      s(3, 'exhale', 'fold', { gaze: 'nose', hold: { breaths: 5 } }),
      s(4, 'inhale', 'half lift, arms long'),
      s(null, 'exhale', 'pause here'),
      s(5, 'inhale', 'hands to waist, rise all the way up'),
      s(null, 'exhale', 'samasthiti'),
    ],
  },

  {
    id: 'parsvottanasana',
    title: 'parsvottanasana',
    poseIds: ['parsvottanasana'],
    steps: [
      s(
        1,
        'inhale',
        'hands reverse prayer, step right foot back, pivot to face the back of the mat',
        { adaptations: ['knuckle to knuckle, hands on ribs'] },
      ),
      s(2, 'exhale', 'fold over right leg, hips square to front edge of mat', {
        gaze: 'belly',
        adaptations: ['bent knee ok if hamstrings tight'],
        hold: { breaths: 5, note: 'left foot at 45 degrees, hips square' },
      }),
      s(3, 'inhale', 'rise up, pivot both feet to the left'),
      s(4, 'exhale', 'fold over left leg, hips square to front edge of mat', {
        gaze: 'belly',
        hold: { breaths: 5, note: 'right foot at 45 degrees, hips square' },
      }),
      s(5, 'inhale', 'rise up, turn to face the right'),
      s(null, 'exhale', 'samasthiti'),
    ],
  },

  {
    id: 'utthita-hasta-padangusthasana',
    title: 'utthita hasta padangusthasana',
    poseIds: ['utthita-hasta-padangusthasana'],
    teacherNote: 'might want to stagger with your neighbors 🙂',
    steps: [
      s(1, 'inhale', 'right foot lift, peace fingers grab big toe, spine long', {
        adaptations: [
          'palm pushing knee, or strap held around foot, can also go to wall if dizzy, or ankle injury',
        ],
      }),
      s(2, 'exhale', 'fold forward', {
        gaze: 'toe',
        hold: {
          breaths: 5,
          note: 'little bend in extended leg is ok, standing leg strong',
        },
      }),
      s(3, 'inhale', 'head up'),
      s(4, 'exhale', 'extend leg to the right', {
        gaze: 'left side',
        adaptations: ['knee bent, hand inside knee or palm on knee - no pull'],
        hold: { breaths: 5 },
      }),
      s(5, 'inhale', 'bring leg back to center, head up'),
      s(6, 'exhale', 'fold forward'),
      s(7, 'inhale', 'rise up, release the foot, catch your waist', {
        gaze: 'toe',
        adaptations: ['even if low, keep leg straight'],
        hold: { breaths: 5, note: 'keep lifting' },
      }),
      s(null, 'exhale', 'lower the leg'),
      s(8, 'inhale', 'left foot lift, peace fingers grab big toe, spine long', {
        adaptations: [
          'palm pushing knee, or strap held around foot, can also go to wall if dizzy, or ankle injury',
        ],
      }),
      s(9, 'exhale', 'fold forward', { gaze: 'toe', hold: { breaths: 5 } }),
      s(10, 'inhale', 'head up'),
      s(11, 'exhale', 'extend leg to the left', {
        gaze: 'right side',
        adaptations: ['knee bent, hand inside knee or palm on knee - no pull'],
        hold: { breaths: 5 },
      }),
      s(12, 'inhale', 'bring leg back to center, head up'),
      s(13, 'exhale', 'fold forward'),
      s(14, 'inhale', 'rise up, release the foot, catch your waist', {
        gaze: 'toe',
        adaptations: ['even if low, keep leg straight'],
        hold: { breaths: 5 },
      }),
      s(null, 'exhale', 'lower the leg, return to the front of the mat, samasthiti'),
    ],
  },

  {
    id: 'ardha-baddha-padmottanasana',
    title: 'ardha baddha padmottanasana',
    poseIds: ['ardha-baddha-padmottanasana'],
    steps: [
      s(1, 'inhale', 'right foot half lotus, right hand binds foot', {
        adaptations: ['figure four: foot above knee'],
      }),
      s(2, 'exhale', 'fold, head to knee, left hand grounded', {
        gaze: 'belly',
        adaptations: ['figure four: both hands to blocks/mat, standing ok'],
        hold: { breaths: 5 },
      }),
      s(3, 'inhale', 'lift head only'),
      s(null, 'exhale', 'here'),
      s(
        4,
        'inhale',
        'with control, rise all the way up, see if you can keep the bind, balance at the top',
      ),
      s(5, 'exhale', 'right foot down'),
      s(6, 'inhale', 'left leg to half lotus, left hand binds if you have lotus', {
        adaptations: ['figure four: foot above knee'],
      }),
      s(7, 'exhale', 'fold all the way down, take your time', {
        gaze: 'belly',
        adaptations: ['figure four: both hands to blocks/mat, standing ok'],
        hold: { breaths: 5 },
      }),
      s(8, 'inhale', 'lift head only'),
      s(null, 'exhale', 'here'),
      s(
        9,
        'inhale',
        'with control, rise all the way up, see if you can keep the foot, balance at the top',
      ),
      s(10, 'exhale', 'left foot down', {
        correctedFrom: 'right foot down',
      }),
    ],
  },

  {
    id: 'utkatasana',
    title: 'utkatasana (through vinyasa)',
    poseIds: ['utkatasana'],
    steps: [
      s(1, 'inhale', 'hands up'),
      s(2, 'exhale', 'forward fold'),
      s(3, 'inhale', 'half lift'),
      s(4, 'exhale', 'go back, caturanga'),
      s(5, 'inhale', 'upward facing dog', { gaze: 'nose' }),
      s(6, 'exhale', 'downward facing dog', { gaze: 'belly' }),
      s(7, 'inhale', 'jump forward, feet together, knees bent, hips low, arms up', {
        gaze: 'thumbs',
        adaptations: [
          'hands apart, spiral fingers in',
          'feet apart, internally rotate feet',
        ],
        hold: {
          breaths: 5,
          note: 'sink hips a little more, sternum slightly up, squeeze elbows',
        },
      }),
      s(8, 'inhale', 'forward fold, palms grounded, transition of choice'),
      s(9, 'exhale', 'caturanga'),
      s(10, 'inhale', 'upward facing dog', { gaze: 'nose' }),
      s(11, 'exhale', 'downward facing dog', { gaze: 'belly' }),
    ],
  },

  {
    id: 'virabhadrasana-a',
    title: 'virabhadrasana a',
    poseIds: ['virabhadrasana-a'],
    steps: [
      s(7, 'inhale', 'right foot steps forward, arms up', {
        gaze: 'thumbs',
        adaptations: ['can bend knee less, widen stance laterally, or do lunge'],
        hold: {
          breaths: 5,
          note: 'bend the right knee, let the left thigh roll out',
        },
      }),
      s(null, 'inhale', 'rise up, keep looking at hands'),
      s(8, 'exhale', 'pivot to the other side', {
        gaze: 'thumbs',
        adaptations: ['can bend knee less, widen stance laterally, or do lunge'],
        hold: {
          breaths: 5,
          note: 'left knee aligned with second or third toe, right thigh rolls open',
        },
      }),
      s(null, 'inhale', 'arms open wide'),
    ],
  },

  {
    id: 'virabhadrasana-b',
    title: 'virabhadrasana b',
    poseIds: ['virabhadrasana-b'],
    steps: [
      s(9, 'exhale', 'arms T', {
        gaze: 'left fingertips',
        adaptations: ['palms up: more accessible to older folks'],
        hold: { breaths: 5, note: 'tuck the tailbone, shoulders low' },
      }),
      s(null, 'inhale', 'straighten front leg, turn feet parallel, arms T'),
      s(10, 'exhale', 'right foot pivots, right knee bends, look over right fingers', {
        gaze: 'right fingertips',
        hold: { breaths: 5 },
      }),
      s(11, 'inhale', 'transition of your choice'),
      s(12, 'exhale', 'jump back, caturanga'),
      s(13, 'inhale', 'upward facing dog', { gaze: 'nose' }),
      s(14, 'exhale', 'downward facing dog'),
    ],
  },

  {
    id: 'dandasana',
    title: 'dandasana',
    poseIds: ['dandasana'],
    steps: [
      s(
        7,
        'inhale',
        'jump through to seated, legs long in front, hands by your hips, shoulders back and down',
        {
          gaze: 'nose',
          hold: {
            breaths: 5,
            note: 'feet together, toes active, pointing back, heels may lift',
          },
        },
      ),
    ],
  },

  {
    id: 'paschimottanasana-a',
    title: 'paschimottanasana A',
    poseIds: ['paschimottanasana-a'],
    group: 'paschimottanasana',
    steps: [
      s(8, 'inhale', 'peace fingers grab big toes'),
      s(9, 'exhale', 'fold', { hold: { breaths: 5 } }),
      s(10, 'inhale', 'head up'),
      s(null, 'exhale', 'pause here'),
    ],
  },

  {
    id: 'paschimottanasana-b',
    title: 'paschimottanasana B',
    poseIds: ['paschimottanasana-b'],
    group: 'paschimottanasana',
    steps: [
      s(8, 'inhale', 'grab the sides of your foot, thumbs press big toe forward'),
      s(9, 'exhale', 'fold', { hold: { breaths: 5 } }),
      s(10, 'inhale', 'head up'),
      s(null, 'exhale', 'pause here'),
    ],
  },

  {
    id: 'paschimottanasana-d',
    title: 'paschimottanasana D',
    poseIds: ['paschimottanasana-d'],
    group: 'paschimottanasana',
    steps: [
      s(8, 'inhale', 'bind your hands around your feet'),
      s(9, 'exhale', 'fold', { hold: { breaths: 5 } }),
      s(10, 'inhale', 'head up'),
      s(null, 'exhale', 'pause here'),
    ],
  },

  {
    id: 'purvottanasana',
    title: 'purvottanasana',
    poseIds: ['purvottanasana'],
    steps: [
      s(7, 'inhale', 'jump through, legs long in front'),
      s(
        null,
        'exhale',
        'place palms down about a foot behind your back, fingers forward, point your toes',
      ),
      s(8, 'inhale', 'lift your hips, head back, toes toward the floor', {
        gaze: 'nose',
        hold: { breaths: 5 },
      }),
      s(9, 'exhale', 'lower down'),
      s(10, 'inhale', 'cross legs, plant hands, press lift up'),
      ...CATURANGA_EXIT,
    ],
  },

  {
    id: 'ardha-baddha-padma-paschimottanasana',
    title: 'ardha baddha padma paschimottanasana',
    poseIds: ['ardha-baddha-padma-paschimottanasana'],
    steps: [
      s(
        7,
        'inhale',
        'jump through, right leg on top, figure four or half lotus, can try to bind here',
        { gazeUnknown: true },
      ),
      s(8, 'exhale', 'fold', { hold: { breaths: 5 } }),
      s(9, 'inhale', 'lift head'),
      s(null, 'exhale', 'pause'),
      s(10, 'inhale', 'cross legs, plant hands, press lift up'),
      s(11, 'exhale', 'jump legs back to caturanga'),
      s(12, 'inhale', 'upward facing dog'),
      s(13, 'exhale', 'downward facing dog'),
      s(
        14,
        'inhale',
        'jump through, left leg on top, figure four or half lotus, can try to bind here',
        { gazeUnknown: true },
      ),
      s(15, 'exhale', 'fold', { hold: { breaths: 5 } }),
      s(16, 'inhale', 'lift head'),
      s(null, 'exhale', 'pause'),
      s(17, 'inhale', 'cross legs, plant hands, press lift up'),
      s(18, 'exhale', 'jump legs back to caturanga'),
      s(19, 'inhale', 'upward facing dog'),
      s(20, 'exhale', 'downward facing dog'),
    ],
  },

  {
    id: 'trianga-mukha-ekapada-paschimottanasana',
    title: 'trianga mukha ekapada paschimottanasana',
    poseIds: ['trianga-mukha-ekapada-paschimottanasana'],
    steps: [
      s(7, 'inhale', 'jump through, right leg trails, ankle near hip', {
        gazeUnknown: true,
      }),
      s(8, 'exhale', 'fold', {
        hold: {
          breaths: 5,
          note: 'think knees coming closer together, leaning toward center line of body, toes pointing back',
        },
      }),
      s(9, 'inhale', 'lift head'),
      s(null, 'exhale', 'pause'),
      s(10, 'inhale', 'plant hands, press through the top of your foot, lift up'),
      s(11, 'exhale', 'jump legs back to caturanga'),
      s(12, 'inhale', 'upward facing dog'),
      s(13, 'exhale', 'downward facing dog'),
      s(
        14,
        'inhale',
        'jump through, left leg trails, ankle near hip, toes pointing back',
        { gazeUnknown: true },
      ),
      s(15, 'exhale', 'fold', {
        hold: { breaths: 5, note: 'leaning toward the center line, grounding both hips' },
      }),
      s(16, 'inhale', 'lift head'),
      s(null, 'exhale', 'pause'),
      s(17, 'inhale', 'plant hands, press through the top of your foot, lift up'),
      s(18, 'exhale', 'jump legs back to caturanga'),
      s(19, 'inhale', 'upward facing dog'),
      s(20, 'exhale', 'downward facing dog'),
    ],
  },

  {
    id: 'janu-sirsasana-a',
    title: 'janu sirsasana a',
    poseIds: ['janu-sirsasana-a'],
    steps: [
      s(7, 'inhale', 'jump through, right leg on top, coming into seated tree', {
        gazeUnknown: true,
      }),
      s(8, 'exhale', 'fold, hands on the ankle, or the foot, or binding', {
        hold: { breaths: 5, note: 'toes active, elbows lifted, arms active' },
      }),
      s(9, 'inhale', 'lift head'),
      s(null, 'exhale', 'pause'),
      s(10, 'inhale', 'cross legs, plant hands, press lift up'),
      s(11, 'exhale', 'jump legs back to caturanga'),
      s(12, 'inhale', 'upward facing dog'),
      s(13, 'exhale', 'downward facing dog'),
      s(
        14,
        'inhale',
        'the other side, jump through, left leg on top, coming into seated tree with left foot',
        { gazeUnknown: true },
      ),
      s(15, 'exhale', 'fold, hands on the ankle, or the foot, or binding', {
        hold: { breaths: 5, note: 'toes active, elbows lifted, arms active' },
      }),
      s(16, 'inhale', 'lift head'),
      s(null, 'exhale', 'pause'),
      s(17, 'inhale', 'cross legs, plant hands, press lift up'),
      s(18, 'exhale', 'jump legs back to caturanga'),
      s(19, 'inhale', 'upward facing dog'),
      s(20, 'exhale', 'downward facing dog'),
    ],
  },

  {
    id: 'urdhva-dhanurasana',
    title: 'urdhva dhanurasana',
    poseIds: ['urdhva-dhanurasana'],
    rounds: 3,
    steps: [
      s(7, 'inhale', 'jump through, legs long in front', { gazeUnknown: true }),
      s(8, 'exhale', 'lie back, knees bent, prepare for backbend'),
      s(9, 'inhale', 'can do bridge or wheel, lift up', { hold: { breaths: 5 } }),
      s(10, 'exhale', 'lower down to tap the top of the head, walk hands closer'),
      s(9, 'inhale', 'lift up', { hold: { breaths: 5 } }),
      s(10, 'exhale', 'lower down to tap the top of the head, walk hands closer'),
      s(9, 'inhale', 'lift up', { hold: { breaths: 5 } }),
      s(10, 'exhale', 'lower all the way down'),
      s(11, 'inhale', 'opportunity to chakrasana or rock back and forth'),
      s(12, 'exhale', 'we’ll all meet in caturanga'),
      s(13, 'inhale', 'upward facing dog'),
      s(14, 'exhale', 'downward facing dog'),
    ],
  },

  {
    id: 'paschimottanasana-closing',
    title: 'paschimottanasana',
    poseIds: ['paschimottanasana-closing'],
    steps: [
      s(7, 'inhale', 'jump through to seated, legs long in front'),
      s(null, 'exhale', ''),
      s(8, 'inhale', 'grabbing somewhere on the legs'),
      s(9, 'exhale', 'fold, make this one more about the back', {
        hold: { breaths: 10 },
      }),
      s(10, 'inhale', 'head up'),
      s(null, 'exhale', 'pause here'),
      s(11, 'inhale', 'cross legs, plant hands, press lift up', {
        adaptations: ['mini ws'],
      }),
      s(12, 'exhale', 'jump legs back to caturanga'),
      s(13, 'inhale', 'upward facing dog'),
      s(14, 'exhale', 'downward facing dog'),
    ],
  },

  {
    id: 'closing-three-seals',
    title: 'closing three seals',
    poseIds: ['yoga-mudra', 'padmasana', 'utplutih'],
    steps: [
      s(7, 'inhale', 'jump through to seated, legs long in front'),
      s(null, 'exhale', 'yoga mudra'),
      s(
        8,
        'inhale',
        'diamond, half lotus, or full lotus, binding the feet if available, left arm first',
      ),
      s(9, 'exhale', 'fold', { hold: { breaths: 10 } }),
      s(
        10,
        'inhale',
        'padmasana -- if you have half lotus switch legs here, back straight, chin tucked',
        { hold: { breaths: 10 } },
      ),
      s(
        10,
        'inhale',
        'utplutih -- this one works with full lotus or no lotus, place your hands outside your legs somewhere between hip and knee, lean forward and lift',
        {
          gaze: 'nose',
          hold: { breaths: 10 },
          sourceIssue:
            'Counted "dasha" (10) twice -- padmasana and utplutih share a number.',
        },
      ),
      s(11, 'inhale', 'cross legs, plant hands, press lift up', {
        adaptations: ['mini ws'],
      }),
      s(12, 'exhale', 'jump legs back to caturanga'),
      s(13, 'inhale', 'upward facing dog'),
      s(14, 'exhale', 'downward facing dog'),
    ],
  },
]

const SCRIPT_BY_POSE = new Map<string, PoseScript>()
for (const block of TEACHING_SCRIPT) {
  for (const poseId of block.poseIds) SCRIPT_BY_POSE.set(poseId, block)
}

export function scriptForPose(poseId: string): PoseScript | undefined {
  return SCRIPT_BY_POSE.get(poseId)
}

/**
 * The script for a given set of poses, with each group's movable exit attached
 * to the last block of that group actually present.
 *
 * Pass the poses of the subset you're studying. Fundamentals (A, B) gets the
 * exit after B; Primary (A, B, D) gets it after D. Neither is special-cased.
 */
export function resolveScript(poseIds: Iterable<string>): PoseScript[] {
  const present = new Set(poseIds)
  const blocks = TEACHING_SCRIPT.filter((block) =>
    block.poseIds.some((poseId) => present.has(poseId)),
  )

  // TEACHING_SCRIPT is in practice order, and filter preserves it, so the last
  // block seen for a group is the last one led.
  const lastOfGroup = new Map<string, string>()
  for (const block of blocks) {
    if (block.group) lastOfGroup.set(block.group, block.id)
  }

  return blocks.map((block) => {
    if (!block.group || lastOfGroup.get(block.group) !== block.id) return block
    const group = SCRIPT_GROUPS.find((candidate) => candidate.id === block.group)
    if (!group) return block
    return { ...block, steps: [...block.steps, ...group.exit] }
  })
}

/** Every pose id any script block touches. */
const ALL_SCRIPTED_POSE_IDS = TEACHING_SCRIPT.flatMap((block) => [...block.poseIds])

/** The whole script, with group exits attached -- for the teleprompter. */
export function fullScript(): PoseScript[] {
  return resolveScript(ALL_SCRIPTED_POSE_IDS)
}

export function getScriptBlock(id: string): PoseScript | undefined {
  return TEACHING_SCRIPT.find((block) => block.id === id)
}

/** Every pose the script covers, in script order. */
export function scriptedPoseIds(): string[] {
  return TEACHING_SCRIPT.flatMap((block) => [...block.poseIds])
}

/** Steps that are held, across the whole script. */
export function heldSteps(): { block: PoseScript; step: ScriptStep }[] {
  return TEACHING_SCRIPT.flatMap((block) =>
    block.steps.filter((step) => step.hold).map((step) => ({ block, step })),
  )
}

/** Steps whose gaze the script itself records as unknown. */
export function unknownGazeSteps(): { block: PoseScript; step: ScriptStep }[] {
  return TEACHING_SCRIPT.flatMap((block) =>
    block.steps.filter((step) => step.gazeUnknown).map((step) => ({ block, step })),
  )
}

/** Problems in the source document, left as written. */
export function sourceIssues(): { block: PoseScript; step: ScriptStep }[] {
  return TEACHING_SCRIPT.flatMap((block) =>
    block.steps.filter((step) => step.sourceIssue).map((step) => ({ block, step })),
  )
}

/** Cues corrected here but not yet in the source document. */
export function corrections(): { block: PoseScript; step: ScriptStep }[] {
  return TEACHING_SCRIPT.flatMap((block) =>
    block.steps.filter((step) => step.correctedFrom).map((step) => ({ block, step })),
  )
}
