/**
 * The traditional rulebook the reading is grounded in: Hast Rekha (Samudrik Shastra)
 * read together with Western chiromancy, and the planetary correspondences the mount
 * names already carry. It is prompt material plus one small lookup used by the sample
 * reading, so the prose and the "lucky" elements follow the same rules.
 */
import type { Finding } from '../src/lib/report';

export interface PlanetRule {
  planet: string;
  mounts: string[];
  theme: string;
  full: string;
  flat: string;
  colour: string;
  number: string;
  day: string;
  gemstone: string;
  upay: string;
}

/** Classical planet → colour / number / day / gemstone, and the upay for a weak mount. */
export const PLANETS: PlanetRule[] = [
  {
    planet: 'Jupiter',
    mounts: ['mount_jupiter'],
    theme: 'confidence, leadership, faith, generosity and growth',
    full: 'natural authority and good judgement; people trust you with responsibility',
    flat: 'self-doubt or over-modesty — you wait for permission that is not coming',
    colour: 'Yellow / gold',
    number: '3',
    day: 'Thursday',
    gemstone: 'Yellow sapphire',
    upay: 'Share one thing you know with someone who needs it, once a week; keep a note of what you did well.',
  },
  {
    planet: 'Saturn',
    mounts: ['mount_saturn'],
    theme: 'discipline, duty, patience and staying power',
    full: 'you finish what you start, even when the interest has gone',
    flat: 'structure slips — plans stay plans, and routine feels like a cage',
    colour: 'Deep blue / black',
    number: '8',
    day: 'Saturday',
    gemstone: 'Blue sapphire',
    upay: 'One small task finished before noon, every day for a month; same time, same place.',
  },
  {
    planet: 'Sun',
    mounts: ['mount_apollo'],
    theme: 'creativity, recognition, joy and vitality',
    full: 'a visible gift — craft that people notice without being told',
    flat: 'you keep your talent private and then feel unseen',
    colour: 'Orange / warm gold',
    number: '1',
    day: 'Sunday',
    gemstone: 'Ruby',
    upay: 'Ten minutes of morning light, and one thing you made shown to one person each week.',
  },
  {
    planet: 'Mercury',
    mounts: ['mount_mercury'],
    theme: 'communication, trade, wit and adaptability',
    full: 'quick speech and a mind that talks its way into clarity',
    flat: 'you rehearse too long and say it late, or not at all',
    colour: 'Green',
    number: '5',
    day: 'Wednesday',
    gemstone: 'Emerald',
    upay: 'Three lines in a notebook each morning; one conversation a day where you speak first.',
  },
  {
    planet: 'Venus',
    mounts: ['mount_venus'],
    theme: 'love, beauty, pleasure, harmony and vitality',
    full: 'warmth, appetite for beauty, and a body that asks for music and touch',
    flat: 'affection is hard to receive, and rest feels undeserved',
    colour: 'White / rose',
    number: '6',
    day: 'Friday',
    gemstone: 'Diamond',
    upay: 'One act of care for someone else daily, and one thing purely for pleasure, without earning it.',
  },
  {
    planet: 'Moon',
    mounts: ['mount_moon'],
    theme: 'imagination, intuition, empathy, travel and restlessness',
    full: 'a strong inner picture — you feel a situation before you can explain it',
    flat: 'you mistrust your hunches and over-explain what you already know',
    colour: 'Silver / cream',
    number: '2',
    day: 'Monday',
    gemstone: 'Pearl',
    upay: 'A fixed sleep time, and five silent minutes before you open your messages.',
  },
  {
    planet: 'Mars',
    mounts: ['mount_mars_upper', 'mount_mars_lower'],
    theme: 'courage, endurance, assertiveness and boundary',
    full: 'you hold your ground calmly and defend what you care about',
    flat: 'conflict is avoided until it becomes resentment',
    colour: 'Red',
    number: '9',
    day: 'Tuesday',
    gemstone: 'Red coral',
    upay: 'Fifteen minutes of movement daily, and one clear "no" said without a reason attached.',
  },
];

export const ruleForMount = (mountId: string): PlanetRule | undefined =>
  PLANETS.find((rule) => rule.mounts.includes(mountId));

export const luckyFrom = (rule: PlanetRule) => ({
  color: rule.colour,
  number: rule.number,
  day: rule.day,
  gemstone: rule.gemstone,
});

/** The fullest visible mount is the ruling planet of the hand. */
export const rulingPlanet = (findings: Finding[]): PlanetRule | undefined => {
  const mounts = findings.filter((f) => f.group === 'mount' && f.visible);
  if (!mounts.length) return undefined;
  const fullest = mounts.reduce((best, f) =>
    f.prominence > best.prominence ||
    (f.prominence === best.prominence && f.confidence > best.confidence)
      ? f
      : best,
  );
  return ruleForMount(fullest.id);
};

const planetTable = PLANETS.map(
  (p) =>
    `- ${p.planet} (${p.mounts.length > 1 ? 'upper & lower Mount of Mars' : `Mount of ${p.planet === 'Sun' ? 'Apollo' : p.planet}`}): ${p.theme}. Full: ${p.full}. Flat: ${p.flat}. Lucky: ${p.colour}, number ${p.number}, ${p.day}, ${p.gemstone}. Upay when weak: ${p.upay}`,
).join('\n');

export const RULEBOOK = `## Read in this order
1. Hand type and fingers (the frame).
2. Mounts (the planetary temperament).
3. Major lines, then minor lines (how that temperament moves through life).
4. Marks only where one is unmistakable.
5. The dominant hand is how the person lives now; the non-dominant hand is inherited temperament. When the two disagree, the dominant hand wins.

## Hand types — palm-to-finger proportion decides
- Earth: square palm, short fingers — practical, steady, builds with the hands.
- Air: square palm, long fingers — thought, language, plans that connect people.
- Fire: long palm, short fingers — drive, action, appetite for the next thing.
- Water: long palm, long fingers — feeling, intuition, sensitivity.
- Fingers: index longer than ring = idealism and caution; ring longer = appetite for risk; a long little finger = easy communication; a short one = private feelings. A firm straight thumb = will that outlasts mood; a flexible thumb = adaptability. Oval nails = balance; square = practicality; ridged = an active mind that needs deliberate rest.

## Mounts — the planets of the hand
${planetTable}
The fullest visible mount is the ruling planet of the hand: read the temperament through it, source every lucky element from its row, and choose the area that most needs an upay from the flattest mount. A star on a mount = a gift there; a cross = a lesson there; a grille = scattered energy there.

## Lines — path and quality
Read quality before length: a clear short line is stronger than a faint long one.
- LIFE (arc around Venus) — vitality, energy, rootedness. Broad and deep = stamina. Chained or islanded = spells of low energy. A break = a change of pace. A branch toward the Moon = travel and imagination. Never read its length as length of life.
- HEAD (from between thumb and index across the palm) — mind and decision style. Straight = practical. Curving toward the Moon = imaginative. Joined to the life line at the start = family influence and caution. Separate at the start = early independence. Chained = scattered focus. Forked = a two-track mind. Short = quick decisions. Long = depth.
- HEART (from under the little finger toward Jupiter or Saturn) — emotional style. Ending under Jupiter = idealism, warmth. Under Saturn = steady, reserved. Straight = practical affection. Chained or islanded = emotional ups and downs. Forked = sees people clearly. Deep = strong feeling.
- FATE / SATURN (wrist toward Saturn) — direction, work, structure. Deep and unbroken = a clear path. Broken or offset = changes of direction. Starting late = self-made. Double = parallel callings. Faint or absent = freedom from convention, never failure.
- SUN / APOLLO (toward the ring finger) — recognition, craft, joy. Clear = visible talent. Faint = private satisfaction. A star on Apollo = a recognised gift, as potential, not a promise. Breaks = a change of medium.
- MERCURY / HEALTH (little-finger side) — communication, trade, nervous energy. Clear = quick speech. Chained = nervous energy (read as lifestyle, never digestion or illness). Faint = reserved. Double = versatility.
- MARRIAGE / RELATIONSHIP (edge under Mercury) — bonds. Count the quality, not the number: deep = a significant bond; forked = a long bond with phases; several faint = several affections. Never promise or time a marriage.
- BRACELET / MANIBANDH (wrist) — grounding and physical rhythm. Clear = steady routine. Several lines = resilience. Broken = an uneven routine.
- GIRDLE OF VENUS (arc under the fingers) — sensitivity. Clear = high sensitivity. Broken = guarded. Absent is normal and says nothing about coldness.
- INTUITION (Moon toward Mercury) — gut-feel and empathy. Strong = trusts hunches. Faint = learns by evidence. Broken = ignores intuition under stress.

## Marks — one mark, one meaning
- Star: an exceptional gift, only when unmistakable, never a promise of fame.
- Cross: a test; the mount or line it sits on names the lesson.
- Island: a period of strain or sensitivity in that area of life.
- Fork: two paths, or a talent for seeing both sides.
- Chain: fluctuation — energy, focus or feeling that comes and goes.
- Break: a deliberate change of direction.
- Grille: scattered energy that needs one outlet.
Report a mark only if you can see it clearly, and attach it to the line or mount it sits on.

## Reading rules that keep it honest and useful
- Evidence first: "your heart line is deep and curves toward Jupiter" — never a generic sentence that could belong to anyone.
- Each meaning has three parts in plain words: what is visible, what the tradition says it means, and what it means for this person now.
- Name the strongest mount as the ruling planet and read the temperament through it; name the flattest mount as the area that needs work.
- Every problem gets one solution: the best upay from the tradition for that feature, free, specific, and startable this week. Tie it to the feature ("aapki Saturn mount flat hai, isliye…").
- Challenges are "areas to work on", never warnings or verdicts.
- Health is lifestyle only: rest, movement, food rhythm, stress. Never a diagnosis, never a disease.
- Never predict death, lifespan, illness, pregnancy or legal outcomes, and never guarantee money, marriage or success.
- The date of birth is context for tone only. Never invent a birth chart, rashi, nakshatra, dasha or muhurat — this reading comes from the hand.`;
