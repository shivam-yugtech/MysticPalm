/**
 * The reading contract, shared by the API (which validates model output) and the
 * report UI (which renders it). Every AI response passes through `normalizeReport`,
 * so the UI can assume the shape below regardless of what the model produced.
 */

export type Language = 'en' | 'hi' | 'hinglish';
export type HandType = 'Earth' | 'Air' | 'Fire' | 'Water';
export type ReadingMode = 'live' | 'demo';
export type HandChoice = 'right' | 'left' | 'both';
export type PhotoRole = 'right' | 'left';

export type TraitKey = 'creativity' | 'logic' | 'emotion' | 'ambition' | 'intuition' | 'stability';
export const TRAITS: { key: TraitKey; label: string }[] = [
  { key: 'creativity', label: 'Creativity' },
  { key: 'logic', label: 'Logic' },
  { key: 'emotion', label: 'Emotion' },
  { key: 'ambition', label: 'Ambition' },
  { key: 'intuition', label: 'Intuition' },
  { key: 'stability', label: 'Stability' },
];

export type FindingGroup = 'major' | 'minor' | 'mount' | 'mark';

export interface Feature {
  id: string;
  group: FindingGroup;
  label: string;
}

/** Every feature the reading must account for, in display order. */
export const FEATURES: Feature[] = [
  { id: 'life', group: 'major', label: 'Life Line' },
  { id: 'head', group: 'major', label: 'Head Line' },
  { id: 'heart', group: 'major', label: 'Heart Line' },
  { id: 'fate', group: 'major', label: 'Fate Line' },
  { id: 'sun', group: 'major', label: 'Sun Line' },
  { id: 'mercury', group: 'minor', label: 'Mercury (Health) Line' },
  { id: 'marriage', group: 'minor', label: 'Relationship Lines' },
  { id: 'bracelet', group: 'minor', label: 'Bracelet (Manibandh)' },
  { id: 'venus_girdle', group: 'minor', label: 'Girdle of Venus' },
  { id: 'intuition', group: 'minor', label: 'Intuition Line' },
  { id: 'mount_jupiter', group: 'mount', label: 'Mount of Jupiter' },
  { id: 'mount_saturn', group: 'mount', label: 'Mount of Saturn' },
  { id: 'mount_apollo', group: 'mount', label: 'Mount of Apollo' },
  { id: 'mount_mercury', group: 'mount', label: 'Mount of Mercury' },
  { id: 'mount_venus', group: 'mount', label: 'Mount of Venus' },
  { id: 'mount_moon', group: 'mount', label: 'Mount of Moon' },
  { id: 'mount_mars_upper', group: 'mount', label: 'Upper Mount of Mars' },
  { id: 'mount_mars_lower', group: 'mount', label: 'Lower Mount of Mars' },
];

export interface Finding {
  id: string;
  group: FindingGroup;
  label: string;
  visible: boolean;
  /** 0–100: how certain the reading is that this feature is real and correctly read. */
  confidence: number;
  /** 0–100 for mounts; 0 for lines and marks. */
  prominence: number;
  meaning: string;
}

export interface Insight {
  text: string;
  confidence: number;
}

export type SectionKey = 'personality' | 'studies' | 'career' | 'friendships' | 'wellbeing';
export const SECTION_KEYS: SectionKey[] = ['personality', 'studies', 'career', 'friendships', 'wellbeing'];

export interface BothHands {
  inherited: string;
  developed: string;
  comparison: string;
}

/** A problem the hand shows, paired with the one upay that answers it. */
export interface Challenge {
  problem: string;
  solution: string;
}

export interface CareerMatch {
  title: string;
  why: string;
}

export interface StudyStyle {
  style: string;
  bestTime: string;
  tips: string[];
}

export interface Report {
  persona: { title: string; tagline: string };
  superpower: string;
  study: StudyStyle;
  careers: CareerMatch[];
  handType: HandType;
  handTypeNote: string;
  clarityScore: number;
  essence: string[];
  traits: Record<TraitKey, number>;
  findings: Finding[];
  handDetails: { fingers: string; thumb: string; nails: string };
  sections: Record<SectionKey, Insight[]>;
  strengths: string[];
  challenges: Challenge[];
  lifePhases: { period: string; note: string }[];
  outlook: { headline: string; points: string[] };
  lucky: { color: string; number: string; day: string; gemstone: string };
  remedies: string[];
  bothHands: BothHands | null;
  language: Language;
  mode: ReadingMode;
  generatedAt: string;
  model?: string;
}

export type Stage = 'school' | 'college' | 'other';

export interface Profile {
  name?: string;
  stage?: Stage;
  stream?: string;
  dominantHand: 'right' | 'left';
  handChoice: HandChoice;
  language: Language;
}

export class ReadingError extends Error {
  constructor(public issues: string[]) {
    super(`Invalid reading: ${issues.join('; ')}`);
    this.name = 'ReadingError';
  }
}

const HAND_TYPES: HandType[] = ['Earth', 'Air', 'Fire', 'Water'];
export const HAND_EMOJI: Record<HandType, string> = { Earth: '🌱', Air: '☁️', Fire: '🔥', Water: '🌊' };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const clamp = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : fallback;
};

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const strList = (v: unknown, max: number): string[] =>
  (Array.isArray(v) ? v : []).map(str).filter(Boolean).slice(0, max);

const insights = (v: unknown): Insight[] => {
  const list = isObject(v) && Array.isArray(v.insights) ? v.insights : Array.isArray(v) ? v : [v];
  return list
    .map((item) =>
      isObject(item)
        ? { text: str(item.text), confidence: clamp(item.confidence, 50) }
        : { text: str(item), confidence: 50 },
    )
    .filter((i) => i.text.length > 0);
};

/** The only place raw model output becomes a `Report`. Throws `ReadingError` with every issue found. */
export function normalizeReport(
  raw: unknown,
  meta: { language: Language; mode: ReadingMode; bothHands: boolean; model?: string },
): Report {
  if (!isObject(raw)) throw new ReadingError(['response was not an object']);
  const issues: string[] = [];

  const handType = HAND_TYPES.includes(raw.handType as HandType) ? (raw.handType as HandType) : null;
  if (!handType) issues.push(`unknown hand type "${String(raw.handType)}"`);

  const essence = strList(raw.essence, 3);
  if (essence.length < 3) issues.push('essence needs three lines');

  const personaRaw = isObject(raw.persona) ? raw.persona : {};
  const persona = { title: str(personaRaw.title), tagline: str(personaRaw.tagline) };
  if (!persona.title || !persona.tagline) issues.push('persona needs a title and a tagline');

  const superpower = str(raw.superpower);
  if (!superpower) issues.push('superpower is empty');

  const studyRaw = isObject(raw.study) ? raw.study : {};
  const study: StudyStyle = {
    style: str(studyRaw.style),
    bestTime: str(studyRaw.bestTime),
    tips: strList(studyRaw.tips, 4),
  };
  if (!study.style || !study.bestTime || study.tips.length < 2) issues.push('study style is incomplete');

  const careers: CareerMatch[] = (Array.isArray(raw.careers) ? raw.careers : [])
    .filter(isObject)
    .map((item) => ({ title: str(item.title), why: str(item.why) }))
    .filter((item) => item.title && item.why)
    .slice(0, 4);
  if (careers.length < 3) issues.push('careers needs three matches');

  // Findings: the model may omit a feature, but the report must still account for it.
  const rawFindings = Array.isArray(raw.findings) ? raw.findings.filter(isObject) : [];
  const byId = new Map<string, Record<string, unknown>>();
  for (const f of rawFindings) {
    const id = str(f.id);
    if (!byId.has(id)) byId.set(id, f);
  }
  const findings: Finding[] = FEATURES.map((feature) => {
    const f = byId.get(feature.id);
    if (!f) {
      return { ...feature, visible: false, confidence: 0, prominence: 0, meaning: '' };
    }
    const visible = f.visible !== false;
    return {
      ...feature,
      visible,
      confidence: visible ? clamp(f.confidence, 50) : 0,
      prominence: feature.group === 'mount' ? clamp(f.prominence, 0) : 0,
      meaning: visible ? str(f.meaning) : '',
    };
  });

  // Marks are free-form: stars, crosses, islands, forks, chains, breaks.
  const marks = rawFindings
    .filter((f) => str(f.group) === 'mark')
    .map((f, i) => {
      const visible = f.visible !== false;
      const rawId = str(f.id) || String(i);
      return {
        id: rawId.startsWith('mark_') ? rawId : `mark_${rawId}`,
        group: 'mark' as const,
        label: str(f.label) || 'Mark',
        visible,
        confidence: visible ? clamp(f.confidence, 50) : 0,
        prominence: 0,
        meaning: visible ? str(f.meaning) : '',
      };
    })
    .filter((m) => m.visible && m.meaning);

  const rawSections = isObject(raw.sections) ? raw.sections : {};
  const sections = {} as Record<SectionKey, Insight[]>;
  for (const key of SECTION_KEYS) {
    const list = insights(rawSections[key]);
    if (list.length === 0) issues.push(`section "${key}" is empty`);
    sections[key] = list;
  }

  const strengths = strList(raw.strengths, 5);
  const challenges: Challenge[] = (Array.isArray(raw.challenges) ? raw.challenges : [])
    .map((item) =>
      isObject(item)
        ? { problem: str(item.problem), solution: str(item.solution) }
        : { problem: str(item), solution: '' },
    )
    .filter((challenge) => challenge.problem || challenge.solution)
    .slice(0, 3);
  if (!strengths.length) issues.push('strengths is empty');
  if (!challenges.length) issues.push('challenges is empty');
  else if (challenges.some((challenge) => !challenge.problem || !challenge.solution)) {
    issues.push('each challenge needs a problem and a solution');
  }

  const lifePhases = (Array.isArray(raw.lifePhases) ? raw.lifePhases : [])
    .filter(isObject)
    .map((p) => ({ period: str(p.period), note: str(p.note) }))
    .filter((p) => p.period && p.note)
    .slice(0, 4);
  if (!lifePhases.length) issues.push('lifePhases is empty');

  const outlookRaw = isObject(raw.outlook) ? raw.outlook : {};
  const outlook = {
    headline: str(outlookRaw.headline),
    points: strList(outlookRaw.points, 5),
  };
  if (!outlook.headline || outlook.points.length < 2) issues.push('outlook is incomplete');

  const luckyRaw = isObject(raw.lucky) ? raw.lucky : {};
  const lucky = {
    color: str(luckyRaw.color),
    number: str(luckyRaw.number),
    day: str(luckyRaw.day),
    gemstone: str(luckyRaw.gemstone),
  };
  if (Object.values(lucky).some((v) => !v)) issues.push('lucky elements are incomplete');

  const remedies = strList(raw.remedies, 5);
  if (remedies.length < 2) issues.push('remedies needs at least two habits');

  const detailsRaw = isObject(raw.handDetails) ? raw.handDetails : {};
  const handDetails = {
    fingers: str(detailsRaw.fingers),
    thumb: str(detailsRaw.thumb),
    nails: str(detailsRaw.nails),
  };

  let bothHands: BothHands | null = null;
  if (meta.bothHands) {
    const b = isObject(raw.bothHands) ? raw.bothHands : {};
    bothHands = { inherited: str(b.inherited), developed: str(b.developed), comparison: str(b.comparison) };
    if (!bothHands.inherited || !bothHands.developed || !bothHands.comparison) {
      issues.push('bothHands comparison is incomplete');
    }
  }

  if (issues.length) throw new ReadingError(issues);

  const traitsRaw = isObject(raw.traits) ? raw.traits : {};
  const traits = {} as Record<TraitKey, number>;
  for (const { key } of TRAITS) traits[key] = clamp(traitsRaw[key], 50);

  return {
    persona,
    superpower,
    study,
    careers,
    handType: handType!,
    handTypeNote: str(raw.handTypeNote),
    clarityScore: clamp(raw.clarityScore, 60),
    essence,
    traits,
    findings: [...findings, ...marks],
    handDetails,
    sections,
    strengths,
    challenges,
    lifePhases,
    outlook,
    lucky,
    remedies,
    bothHands,
    language: meta.language,
    mode: meta.mode,
    generatedAt: new Date().toISOString(),
    model: meta.model,
  };
}

export const findingOf = (report: Report, id: string): Finding | undefined =>
  report.findings.find((f) => f.id === id);

/**
 * Safety guard. Palm reading must never predict death, disease, pregnancy or legal
 * outcomes, so every string in a report is scanned and violating fields are redacted.
 */
const BANNED: { id: string; re: RegExp }[] = [
  { id: 'death', re: /\b(die|dies|dying|death|dead)\b/i },
  { id: 'death-date', re: /\b(death|lifespan|life span|age at death)\b[^.]{0,40}\b(19|20)\d{2}\b/i },
  { id: 'short-life', re: /\b(short|brief)\s+(life|lifespan)\b/i },
  { id: 'hindi-death', re: /(मृत्यु|मौत|अल्पायु|मर जाए|मौत का समय)/i },
  { id: 'disease', re: /\b(cancer|diabetes|tuberculosis|tumou?r|hiv|stroke|heart (attack|failure)|fatal|terminal illness)\b/i },
  { id: 'diagnosis', re: /\b(diagnosed with|you (suffer|are suffering) from|prescribed?|dosage|medical condition)\b/i },
  {
    id: 'pregnancy',
    re: /\b(pregnan(t|cy)|how many (children|kids)|conceive|infertile|(have|having|bear)\s+(\w+\s+){0,2}(children|kids|twins|a baby))\b/i,
  },
  { id: 'hindi-pregnancy', re: /(गर्भ|संतान|बांझ)/i },
  { id: 'legal', re: /\b(lawsuit|litigation|court case|imprison\w*|jail|visa (will|approved)|guilty verdict)\b/i },
  { id: 'guarantee', re: /\b(guaranteed|100% certain|definitely (will|going to))\b/i },
];

export function findBannedClaims(text: string): string[] {
  return BANNED.filter((rule) => rule.re.test(text)).map((rule) => rule.id);
}

function collectStrings(value: unknown, path: string[] = []): { path: string[]; text: string }[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => collectStrings(v, [...path, String(i)]));
  if (isObject(value)) return Object.entries(value).flatMap(([k, v]) => collectStrings(v, [...path, k]));
  return [];
}

export function bannedClaimsIn(report: Report): { path: string; text: string; rules: string[] }[] {
  return collectStrings(report)
    .map(({ path, text }) => ({ path: path.join('.'), text, rules: findBannedClaims(text) }))
    .filter((hit) => hit.rules.length > 0);
}

export const SAFE_COPY: Record<Language, string> = {
  en: 'This reading stays with traditional tendencies and does not make medical, legal or lifespan predictions.',
  hi: 'यह रीडिंग केवल पारंपरिक प्रवृत्तियों तक रहती है और चिकित्सा, कानूनी या आयु से जुड़ी भविष्यवाणी नहीं करती।',
  hinglish:
    'Yeh reading traditional tendencies tak hi rehti hai — medical, legal ya lifespan prediction nahi karti.',
};

/** Replace every string that breaks the guard with safe copy, keeping the report renderable. */
export function redactUnsafe(report: Report): Report {
  const clone: Report = JSON.parse(JSON.stringify(report));
  const safe = SAFE_COPY[clone.language];
  for (const hit of bannedClaimsIn(clone)) {
    const parts = hit.path.split('.');
    let node = clone as unknown as Record<string, unknown>;
    for (const part of parts.slice(0, -1)) node = node[part] as Record<string, unknown>;
    node[parts[parts.length - 1]] = safe;
  }
  return clone;
}

