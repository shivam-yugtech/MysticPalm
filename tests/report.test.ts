import { describe, expect, it } from 'vitest';
import { demoReading } from '../server/demo';
import {
  bannedClaimsIn,
  FEATURES,
  findBannedClaims,
  normalizeReport,
  ReadingError,
  redactUnsafe,
  SAFE_COPY,
} from '../src/lib/report';
import { luckyFrom, rulingPlanet } from '../server/rules';
import { meta, validRaw } from './fixtures';

describe('normalizeReport', () => {
  it('accepts a complete reading and keeps its values', () => {
    const report = normalizeReport(validRaw(), meta());
    expect(report.handType).toBe('Air');
    expect(report.clarityScore).toBe(80);
    expect(report.essence).toHaveLength(3);
    expect(report.traits.creativity).toBe(80);
    expect(report.sections.career[0]).toEqual({ text: 'career reading text.', confidence: 74 });
    expect(report.language).toBe('en');
    expect(report.mode).toBe('live');
  });

  it('accounts for every catalogued feature, marking omissions not visible', () => {
    const report = normalizeReport(validRaw(), meta());
    const catalogue = report.findings.filter((f) => f.group !== 'mark');
    expect(catalogue).toHaveLength(FEATURES.length);
    expect(report.findings).toHaveLength(FEATURES.length + 1);

    const heart = report.findings.find((f) => f.id === 'heart')!;
    expect(heart).toMatchObject({ visible: false, confidence: 0, meaning: '' });

    const life = report.findings.find((f) => f.id === 'life')!;
    expect(life).toMatchObject({ visible: true, confidence: 82, meaning: 'A wide, unbroken sweep.' });

    const mark = report.findings.find((f) => f.id === 'mark_star')!;
    expect(mark).toMatchObject({ group: 'mark', label: 'Star on Jupiter', confidence: 52 });
  });

  it.each([
    ['confidence above range', 140, 100],
    ['negative confidence', -20, 0],
    ['string confidence', '63', 63],
    ['missing confidence', undefined, 50],
  ])('clamps %s', (_label, input, expected) => {
    const raw = validRaw();
    (raw.findings[0] as { confidence: unknown }).confidence = input;
    const report = normalizeReport(raw, meta());
    expect(report.findings.find((f) => f.id === 'life')!.confidence).toBe(expected);
  });

  it('clears confidence and meaning when a feature is marked unclear', () => {
    const raw = validRaw();
    raw.findings[0] = { ...raw.findings[0], visible: false, confidence: 90, meaning: 'Guessed something.' } as never;
    const life = normalizeReport(raw, meta()).findings.find((f) => f.id === 'life')!;
    expect(life).toMatchObject({ visible: false, confidence: 0, meaning: '' });
  });

  it('keeps each challenge together with its solution', () => {
    const raw = validRaw();
    raw.challenges = [
      { problem: 'Overthinking delays decisions.', solution: 'Decide one small thing before noon.' },
    ];
    expect(normalizeReport(raw, meta()).challenges).toEqual([
      { problem: 'Overthinking delays decisions.', solution: 'Decide one small thing before noon.' },
    ]);
  });

  it('requires a two-hand comparison only for a two-hand reading', () => {
    expect(() => normalizeReport(validRaw(), meta(true))).toThrow(ReadingError);

    const raw = validRaw() as ReturnType<typeof validRaw> & { bothHands?: unknown };
    raw.bothHands = { inherited: 'a', developed: 'b', comparison: 'c' };
    expect(normalizeReport(raw, meta(true)).bothHands).toEqual({ inherited: 'a', developed: 'b', comparison: 'c' });
    // A single-hand reading ignores any comparison the model volunteers.
    expect(normalizeReport(raw, meta(false)).bothHands).toBeNull();
  });

  it.each([
    ['an unknown hand type', (raw: ReturnType<typeof validRaw>) => ({ ...raw, handType: 'Metal' })],
    ['fewer than three essence lines', (raw: ReturnType<typeof validRaw>) => ({ ...raw, essence: ['one', 'two'] })],
    ['a missing section', (raw: ReturnType<typeof validRaw>) => {
      const sections = { ...raw.sections } as Record<string, unknown>;
      delete sections.health;
      return { ...raw, sections };
    }],
    ['no strengths', (raw: ReturnType<typeof validRaw>) => ({ ...raw, strengths: [] })],
    ['incomplete lucky elements', (raw: ReturnType<typeof validRaw>) => ({ ...raw, lucky: { color: 'Gold' } })],
    ['no remedies', (raw: ReturnType<typeof validRaw>) => ({ ...raw, remedies: [] })],
    ['a challenge with no solution', (raw: ReturnType<typeof validRaw>) => ({
      ...raw,
      challenges: [{ problem: 'Something to work on' }],
    })],
    ['a challenge sent as plain text', (raw: ReturnType<typeof validRaw>) => ({
      ...raw,
      challenges: ['Something to work on'],
    })],
  ])('rejects %s', (_label, mutate) => {
    expect(() => normalizeReport(mutate(validRaw()), meta())).toThrow(ReadingError);
  });

  it('reports every structural issue in one error', () => {
    let issues: string[] = [];
    try {
      normalizeReport({}, meta(true));
    } catch (error) {
      expect(error).toBeInstanceOf(ReadingError);
      issues = (error as ReadingError).issues;
    }
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('hand type'),
        expect.stringContaining('essence'),
        expect.stringContaining('personality'),
        expect.stringContaining('bothHands'),
      ]),
    );
  });
});

describe('safety guard', () => {
  it.each([
    ['death', 'You will die in old age.'],
    ['death-date', 'The death line suggests 2042 is significant.'],
    ['disease', 'This line shows cancer.'],
    ['diagnosis', 'You are diagnosed with a condition.'],
    ['pregnancy', 'You will have three children.'],
    ['legal', 'You will win the court case.'],
    ['guarantee', 'Your success is guaranteed.'],
    ['hindi-death', 'आपकी मृत्यु का समय निकट है।'],
  ])('flags %s', (rule, text) => {
    expect(findBannedClaims(text)).toContain(rule);
  });

  it.each([
    'Your life line is wide and unbroken.',
    'You have a warm presence and a steady hand.',
    'This reading is for guidance and entertainment.',
    'Health here is about rest and movement, not illness.',
  ])('leaves ordinary reading prose alone: %s', (text) => {
    expect(findBannedClaims(text)).toEqual([]);
  });

  it('finds the exact field that breaks the rule and redacts only that field', () => {
    const report = normalizeReport(validRaw(), meta());
    report.sections.health[0].text = 'You will die soon.';

    const hits = bannedClaimsIn(report);
    expect(hits).toHaveLength(1);
    expect(hits[0].path).toBe('sections.health.0.text');

    const safe = redactUnsafe(report);
    expect(safe.sections.health[0].text).toBe(SAFE_COPY.en);
    expect(safe.sections.career[0].text).toBe('career reading text.');
    // The original report is untouched.
    expect(report.sections.health[0].text).toBe('You will die soon.');
  });
});

describe('demo reading', () => {
  it('passes the same contract and safety guard as a live reading', () => {
    const report = demoReading({ handChoice: 'both', dominantHand: 'right', language: 'en' });
    expect(bannedClaimsIn(report)).toEqual([]);
    expect(report.mode).toBe('demo');
    expect(report.findings.filter((f) => f.group === 'mount')).toHaveLength(8);
    expect(report.findings.filter((f) => f.visible).length).toBeGreaterThan(10);
    expect(report.findings.find((f) => f.id === 'venus_girdle')!.visible).toBe(false);
    expect(report.bothHands?.comparison).toBeTruthy();
    expect(Object.values(report.sections).every((list) => list.length >= 2)).toBe(true);
    expect(report.challenges.every((c) => c.problem && c.solution)).toBe(true);
    expect(report.language).toBe('hinglish');
  });

  it('derives its lucky elements from the fullest mount, as the rulebook says', () => {
    const report = demoReading({ handChoice: 'right', dominantHand: 'right', language: 'hinglish' });
    const ruling = rulingPlanet(report.findings);
    expect(ruling?.planet).toBe('Venus');
    expect(report.lucky).toEqual(luckyFrom(ruling!));
  });

  it('omits the comparison for a single hand', () => {
    expect(demoReading({ handChoice: 'left', dominantHand: 'left', language: 'en' }).bothHands).toBeNull();
  });
});
