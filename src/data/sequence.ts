// src/data/sequence.ts -- JRS 2026-07-29
// The canonical Ashtanga primary series as ordered data.

/**
 * The Ashtanga Primary Series (Yoga Chikitsa), as ordered data.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VERIFY BEFORE YOU STUDY
 *
 * This is seeded from the standard, widely-published primary series. It has NOT
 * been checked against the shala's own materials. Reliability, roughly:
 *
 *   Pose order        -- high confidence, stable across lineages
 *   Sanskrit/English  -- high confidence, though spelling conventions vary
 *   Held vs. transit. -- good confidence
 *   Drishti           -- MEDIUM. Varies by lineage more than order does.
 *   Breath counts     -- 5 unless noted. Finishing-sequence holds vary a lot and
 *                       are left blank rather than guessed.
 *   Vinyasa counts    -- mostly blank on purpose. See the rule in types.ts.
 *
 * When the shala's sheet disagrees with this file, the shala is right. Fix it
 * here and every generated question updates with it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Pose, Section, SectionId } from './types'

export const SECTIONS: readonly Section[] = [
  {
    id: 'surya-namaskara',
    name: 'Sun Salutations',
    blurb: 'Samasthiti and Surya Namaskara A and B.',
  },
  {
    id: 'standing',
    name: 'Standing Sequence',
    blurb: 'Padangusthasana through Virabhadrasana B.',
  },
  {
    id: 'seated',
    name: 'Seated Sequence',
    blurb: 'Dandasana through Setu Bandhasana.',
  },
  {
    id: 'backbends',
    name: 'Backbends',
    blurb: 'Urdhva Dhanurasana and its counter-pose.',
  },
  {
    id: 'finishing',
    name: 'Finishing Sequence',
    blurb: 'Shoulderstand through rest.',
  },
]

/** Poses without `index` -- `buildSequence` assigns that from array order. */
type PoseSeed = Omit<Pose, 'index'>

const SURYA_NAMASKARA: readonly PoseSeed[] = [
  {
    id: 'samasthiti',
    sanskrit: 'Samasthiti',
    english: 'Equal Standing',
    section: 'surya-namaskara',
    hold: 'held',
    notes:
      'The starting and returning position. Not counted in the vinyasa count.',
  },
  {
    id: 'surya-namaskara-a',
    sanskrit: 'Surya Namaskara A',
    english: 'Sun Salutation A',
    section: 'surya-namaskara',
    hold: 'held',
    repetitions: 5,
    breaths: 5,
    vinyasaCount: 9,
    notes: 'Five rounds. Nine vinyasas, of which only sat (downward dog) is held.',
  },
  {
    id: 'surya-namaskara-b',
    sanskrit: 'Surya Namaskara B',
    english: 'Sun Salutation B',
    section: 'surya-namaskara',
    hold: 'held',
    repetitions: 3,
    breaths: 5,
    vinyasaCount: 17,
    notes:
      'Three rounds at this shala, not five. Seventeen vinyasas; only caturdasha (the final downward dog) is held.',
  },
]

const STANDING: readonly PoseSeed[] = [
  {
    id: 'padangusthasana',
    sanskrit: 'Padangusthasana',
    english: 'Big Toe Pose',
    section: 'standing',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
  },
  {
    id: 'padahastasana',
    sanskrit: 'Padahastasana',
    english: 'Hand Under Foot Pose',
    section: 'standing',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
  },
  {
    id: 'utthita-trikonasana',
    sanskrit: 'Utthita Trikonasana',
    english: 'Extended Triangle Pose',
    alsoCalled: ['Utthita Trikonasana A', 'Trikonasana A'],
    section: 'standing',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'hastagrai',
  },
  {
    id: 'parivrtta-trikonasana',
    sanskrit: 'Parivrtta Trikonasana',
    english: 'Revolved Triangle Pose',
    alsoCalled: ['Utthita Trikonasana B', 'Trikonasana B'],
    section: 'standing',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'hastagrai',
  },
  {
    id: 'utthita-parsvakonasana',
    sanskrit: 'Utthita Parsvakonasana',
    english: 'Extended Side Angle Pose',
    alsoCalled: ['Utthita Parsvakonasana A', 'Parsvakonasana A'],
    section: 'standing',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'hastagrai',
  },
  {
    id: 'parivrtta-parsvakonasana',
    sanskrit: 'Parivrtta Parsvakonasana',
    english: 'Revolved Side Angle Pose',
    alsoCalled: ['Utthita Parsvakonasana B', 'Parsvakonasana B'],
    section: 'standing',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'hastagrai',
  },
  {
    id: 'prasarita-padottanasana-a',
    sanskrit: 'Prasarita Padottanasana A',
    english: 'Wide-Legged Forward Fold A',
    section: 'standing',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
  },
  {
    id: 'prasarita-padottanasana-b',
    sanskrit: 'Prasarita Padottanasana B',
    english: 'Wide-Legged Forward Fold B',
    section: 'standing',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
  },
  {
    id: 'prasarita-padottanasana-c',
    sanskrit: 'Prasarita Padottanasana C',
    english: 'Wide-Legged Forward Fold C',
    section: 'standing',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
  },
  {
    id: 'prasarita-padottanasana-d',
    sanskrit: 'Prasarita Padottanasana D',
    english: 'Wide-Legged Forward Fold D',
    section: 'standing',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
  },
  {
    id: 'parsvottanasana',
    sanskrit: 'Parsvottanasana',
    english: 'Intense Side Stretch Pose',
    alsoCalled: ['Pyramid Pose'],
    section: 'standing',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'padhayoragrai',
    notes:
      'The last standing pose the series share. The shala begins intermediate series poses here; primary carries on to Utthita Hasta Padangusthasana.',
  },
  {
    id: 'utthita-hasta-padangusthasana',
    sanskrit: 'Utthita Hasta Padangusthasana',
    english: 'Extended Hand-to-Big-Toe Pose',
    section: 'standing',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'padhayoragrai',
    notes:
      'Front, side (drishti parsva), front again, then lift with hands on hips.',
  },
  {
    id: 'ardha-baddha-padmottanasana',
    sanskrit: 'Ardha Baddha Padmottanasana',
    english: 'Half Bound Lotus Standing Forward Bend',
    section: 'standing',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'nasagrai',
  },
  {
    id: 'utkatasana',
    sanskrit: 'Utkatasana',
    english: 'Fierce Pose / Chair Pose',
    section: 'standing',
    hold: 'held',
    breaths: 5,
    drishti: 'urdhva',
  },
  {
    id: 'virabhadrasana-a',
    sanskrit: 'Virabhadrasana A',
    english: 'Warrior I',
    section: 'standing',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'urdhva',
  },
  {
    id: 'virabhadrasana-b',
    sanskrit: 'Virabhadrasana B',
    english: 'Warrior II',
    section: 'standing',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'hastagrai',
  },
]

const SEATED: readonly PoseSeed[] = [
  {
    id: 'dandasana',
    sanskrit: 'Dandasana',
    english: 'Staff Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
  },
  // The shala teaches A, B and D -- it does not include C. C is kept here so
  // Full Primary stays complete; the Fundamentals subset simply omits it.
  {
    id: 'paschimottanasana-a',
    sanskrit: 'Paschimottanasana A',
    english: 'Seated Forward Bend A',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    notes: 'Peace fingers grab the big toes.',
  },
  {
    id: 'paschimottanasana-b',
    sanskrit: 'Paschimottanasana B',
    english: 'Seated Forward Bend B',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    notes: 'Grab the sides of the foot, thumbs pressing the big toe forward.',
  },
  {
    id: 'paschimottanasana-c',
    sanskrit: 'Paschimottanasana C',
    english: 'Seated Forward Bend C',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'padhayoragrai',
    notes: 'Not taught in the shala’s script.',
  },
  {
    id: 'paschimottanasana-d',
    sanskrit: 'Paschimottanasana D',
    english: 'Seated Forward Bend D',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    notes: 'Bind the hands around the feet.',
  },
  {
    id: 'purvottanasana',
    sanskrit: 'Purvottanasana',
    english: 'Upward Plank Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'broomadhya',
  },
  {
    id: 'ardha-baddha-padma-paschimottanasana',
    sanskrit: 'Ardha Baddha Padma Paschimottanasana',
    english: 'Half Bound Lotus Seated Forward Bend',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'padhayoragrai',
  },
  {
    id: 'trianga-mukha-ekapada-paschimottanasana',
    sanskrit: 'Trianga Mukha Ekapada Paschimottanasana',
    english: 'Three-Limbed Forward Bend',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    bothSides: true,
  },
  {
    id: 'janu-sirsasana-a',
    sanskrit: 'Janu Sirsasana A',
    english: 'Head-to-Knee Pose A',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'padhayoragrai',
  },
  {
    id: 'janu-sirsasana-b',
    sanskrit: 'Janu Sirsasana B',
    english: 'Head-to-Knee Pose B',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'padhayoragrai',
  },
  {
    id: 'janu-sirsasana-c',
    sanskrit: 'Janu Sirsasana C',
    english: 'Head-to-Knee Pose C',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'padhayoragrai',
  },
  {
    id: 'marichyasana-a',
    sanskrit: 'Marichyasana A',
    english: "Marichi's Pose A",
    section: 'seated',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'padhayoragrai',
  },
  {
    id: 'marichyasana-b',
    sanskrit: 'Marichyasana B',
    english: "Marichi's Pose B",
    section: 'seated',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'padhayoragrai',
  },
  {
    id: 'marichyasana-c',
    sanskrit: 'Marichyasana C',
    english: "Marichi's Pose C",
    section: 'seated',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'parsva',
  },
  {
    id: 'marichyasana-d',
    sanskrit: 'Marichyasana D',
    english: "Marichi's Pose D",
    section: 'seated',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'parsva',
  },
  {
    id: 'navasana',
    sanskrit: 'Navasana',
    english: 'Boat Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    repetitions: 5,
    drishti: 'padhayoragrai',
    notes: 'Five repetitions, with a lift between each.',
  },
  {
    id: 'bhujapidasana',
    sanskrit: 'Bhujapidasana',
    english: 'Shoulder Pressing Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
  },
  {
    id: 'kurmasana',
    sanskrit: 'Kurmasana',
    english: 'Tortoise Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'broomadhya',
  },
  {
    id: 'supta-kurmasana',
    sanskrit: 'Supta Kurmasana',
    english: 'Sleeping Tortoise Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'broomadhya',
  },
  {
    id: 'garbha-pindasana',
    sanskrit: 'Garbha Pindasana',
    english: 'Embryo in the Womb Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
    notes: 'Nine rolls around the mat before coming up to Kukkutasana.',
  },
  {
    id: 'kukkutasana',
    sanskrit: 'Kukkutasana',
    english: 'Rooster Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
  },
  {
    id: 'baddha-konasana',
    sanskrit: 'Baddha Konasana',
    english: 'Bound Angle Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
    notes: 'Variations A and B.',
  },
  {
    id: 'upavistha-konasana',
    sanskrit: 'Upavistha Konasana',
    english: 'Wide-Angle Seated Forward Bend',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
    notes: 'A folds forward (drishti nasagrai); B balances and looks up (urdhva).',
  },
  {
    id: 'supta-konasana',
    sanskrit: 'Supta Konasana',
    english: 'Reclining Angle Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
  },
  {
    id: 'supta-padangusthasana',
    sanskrit: 'Supta Padangusthasana',
    english: 'Reclining Big Toe Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    bothSides: true,
    drishti: 'padhayoragrai',
  },
  {
    id: 'ubhaya-padangusthasana',
    sanskrit: 'Ubhaya Padangusthasana',
    english: 'Both Big Toes Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'urdhva',
  },
  {
    id: 'urdhva-mukha-paschimottanasana',
    sanskrit: 'Urdhva Mukha Paschimottanasana',
    english: 'Upward-Facing Forward Bend',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'padhayoragrai',
  },
  {
    id: 'setu-bandhasana',
    sanskrit: 'Setu Bandhasana',
    english: 'Bridge Pose',
    section: 'seated',
    hold: 'held',
    breaths: 5,
    drishti: 'broomadhya',
  },
]

/**
 * Backbending and its counter-pose.
 *
 * Its own division rather than the head of the finishing sequence, which is how
 * the tradition treats it and which matters for the second series, where the
 * backbending grows and the finishing sequence doesn't. The counter-pose sits
 * with what it counters, so finishing starts cleanly at the shoulderstand.
 */
const BACKBENDS: readonly PoseSeed[] = [
  {
    id: 'urdhva-dhanurasana',
    sanskrit: 'Urdhva Dhanurasana',
    english: 'Upward Bow / Wheel Pose',
    section: 'backbends',
    hold: 'held',
    breaths: 5,
    repetitions: 3,
    drishti: 'nasagrai',
    notes: 'Three repetitions, then a closing Paschimottanasana.',
  },
  {
    id: 'paschimottanasana-closing',
    sanskrit: 'Paschimottanasana',
    english: 'Seated Forward Bend (closing)',
    section: 'backbends',
    hold: 'held',
    breaths: 10,
    drishti: 'padhayoragrai',
    notes: 'Counter-pose after the backbends.',
  },
]

const FINISHING: readonly PoseSeed[] = [
  {
    id: 'salamba-sarvangasana',
    sanskrit: 'Salamba Sarvangasana',
    english: 'Shoulderstand',
    section: 'finishing',
    hold: 'held',
    breaths: 10,
    drishti: 'nasagrai',
  },
  {
    id: 'halasana',
    sanskrit: 'Halasana',
    english: 'Plow Pose',
    section: 'finishing',
    hold: 'held',
    breaths: 8,
    drishti: 'nasagrai',
  },
  {
    id: 'karnapidasana',
    sanskrit: 'Karnapidasana',
    english: 'Ear Pressure Pose',
    section: 'finishing',
    hold: 'held',
    breaths: 8,
    drishti: 'nasagrai',
  },
  {
    id: 'urdhva-padmasana',
    sanskrit: 'Urdhva Padmasana',
    english: 'Upward Lotus Pose',
    section: 'finishing',
    hold: 'held',
    breaths: 8,
    drishti: 'nasagrai',
  },
  {
    id: 'pindasana',
    sanskrit: 'Pindasana',
    english: 'Embryo Pose',
    section: 'finishing',
    hold: 'held',
    breaths: 8,
    drishti: 'nasagrai',
  },
  {
    id: 'matsyasana',
    sanskrit: 'Matsyasana',
    english: 'Fish Pose',
    section: 'finishing',
    hold: 'held',
    breaths: 8,
    drishti: 'broomadhya',
  },
  {
    id: 'uttana-padasana',
    sanskrit: 'Uttana Padasana',
    english: 'Extended Leg Pose',
    section: 'finishing',
    hold: 'held',
    breaths: 8,
    drishti: 'broomadhya',
  },
  {
    id: 'sirsasana-a',
    sanskrit: 'Baddha Hasta Sirsasana A',
    english: 'Bound Hands Headstand A',
    section: 'finishing',
    hold: 'held',
    breaths: 15,
    drishti: 'nasagrai',
    notes: 'Ten breaths is acceptable for beginners.',
  },
  {
    id: 'sirsasana-b',
    sanskrit: 'Baddha Hasta Sirsasana B',
    english: 'Bound Hands Headstand B',
    section: 'finishing',
    hold: 'held',
    breaths: 10,
    drishti: 'nasagrai',
    notes: 'Five breaths is acceptable for beginners.',
  },
  {
    id: 'balasana',
    sanskrit: 'Balasana',
    english: "Child's Pose / Rest",
    section: 'finishing',
    hold: 'held',
    drishti: 'nasagrai',
    notes: 'Rest after headstand, typically matching the headstand hold.',
  },
  {
    id: 'baddha-padmasana',
    sanskrit: 'Baddha Padmasana',
    english: 'Bound Lotus Pose',
    section: 'finishing',
    hold: 'held',
    breaths: 5,
    drishti: 'nasagrai',
  },
  {
    id: 'yoga-mudra',
    sanskrit: 'Yoga Mudra',
    english: 'Sealed Yoga Pose',
    section: 'finishing',
    hold: 'held',
    breaths: 10,
    drishti: 'broomadhya',
  },
  {
    id: 'parvatasana-a',
    sanskrit: 'Parvatasana A',
    english: 'Mountain Pose A',
    section: 'finishing',
    hold: 'held',
    notes:
      'Manju’s seated shoulder stretch: in lotus, arms extended overhead. ' +
      'Breath count and gaze not recorded.',
  },
  {
    id: 'parvatasana-b',
    sanskrit: 'Parvatasana B',
    english: 'Mountain Pose B',
    section: 'finishing',
    hold: 'held',
    notes:
      'From A, fold forward. Maybe your forehead touches before your hands. ' +
      'Breath count and gaze not recorded.',
  },
  {
    id: 'padmasana',
    sanskrit: 'Padmasana',
    english: 'Lotus Pose',
    section: 'finishing',
    hold: 'held',
    breaths: 10,
    drishti: 'nasagrai',
  },
  {
    id: 'utplutih',
    sanskrit: 'Utplutih',
    english: 'Uplifting / Scale Pose',
    section: 'finishing',
    hold: 'held',
    breaths: 10,
    drishti: 'nasagrai',
    notes: 'The last pose before the closing chant.',
  },
  {
    id: 'savasana',
    sanskrit: 'Savasana',
    english: 'Corpse Pose / Rest',
    section: 'finishing',
    hold: 'held',
    drishti: 'nasagrai',
    notes: 'Taken after the closing chant. Rest for as long as the teacher gives.',
  },
]

/** Assigns a whole-practice index to each pose, in section order. */
function buildSequence(): readonly Pose[] {
  const bySection: Record<SectionId, readonly PoseSeed[]> = {
    'surya-namaskara': SURYA_NAMASKARA,
    standing: STANDING,
    seated: SEATED,
    backbends: BACKBENDS,
    finishing: FINISHING,
  }

  const poses: Pose[] = []
  for (const section of SECTIONS) {
    for (const seed of bySection[section.id]) {
      poses.push({ ...seed, index: poses.length })
    }
  }
  return poses
}

/** The canonical, ordered primary series. */
export const POSES: readonly Pose[] = buildSequence()

const POSES_BY_ID = new Map(POSES.map((pose) => [pose.id, pose]))
const SECTIONS_BY_ID = new Map(SECTIONS.map((section) => [section.id, section]))

export function getPose(id: string): Pose | undefined {
  return POSES_BY_ID.get(id)
}

export function getSection(id: SectionId): Section | undefined {
  return SECTIONS_BY_ID.get(id)
}

export function posesInSection(id: SectionId): readonly Pose[] {
  return POSES.filter((pose) => pose.section === id)
}
