import { describe, expect, it } from 'vitest';
import { confidenceLabel, COPY, LANGUAGES, SCAN_LINES, TRAIT_LABEL_KEYS } from '../src/lib/i18n';
import { TRAITS } from '../src/lib/report';

const keys = Object.keys(COPY.en) as (keyof typeof COPY.en)[];

describe('localized copy', () => {
  it('translates every key into every language', () => {
    for (const { id } of LANGUAGES) {
      for (const key of keys) {
        expect(COPY[id][key], `${id}.${key}`).toBeTruthy();
      }
    }
  });

  it('has no leftover placeholders', () => {
    const suspicious = keys.filter((key) => /lorem|todo|placeholder|xxx/i.test(COPY.en[key]));
    expect(suspicious).toEqual([]);
  });

  it.each([
    ['en', /deleted immediately/i, /not a substitute for medical/i],
    ['hi', /मिटा दी जाती है/, /विकल्प नहीं/],
    ['hinglish', /delete ho jaati hai/i, /substitute nahi/i],
  ] as const)('carries the privacy and disclaimer promise in %s', (language, privacy, disclaimer) => {
    expect(COPY[language].privacyNote).toMatch(privacy);
    expect(COPY[language].disclaimer).toMatch(disclaimer);
  });

  it('labels all six traits and supplies four scan stages', () => {
    expect(Object.keys(TRAIT_LABEL_KEYS).sort()).toEqual(TRAITS.map((trait) => trait.key).sort());
    for (const { id } of LANGUAGES) expect(SCAN_LINES[id]).toHaveLength(4);
  });

  it.each([
    [100, 'High'],
    [75, 'High'],
    [74, 'Medium'],
    [45, 'Medium'],
    [44, 'Low'],
    [0, 'Low'],
  ])('maps confidence %i to %s', (value, label) => {
    expect(confidenceLabel('en', value)).toBe(label);
  });
});
