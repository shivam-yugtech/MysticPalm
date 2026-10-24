import { describe, expect, it } from 'vitest';
import { allSlotsUsable, requiredRoles, slotUsable, type PhotoSlot } from '../src/lib/capture';
import type { QualityResult } from '../src/lib/quality';
import type { Profile } from '../src/lib/report';

const result = (warnings: QualityResult['warnings'] = []): QualityResult => ({
  pass: true,
  score: 92,
  issues: [],
  warnings,
  metrics: {
    brightness: 120,
    sharpness: 180,
    skinRatio: 0.3,
    handCoverage: 0.3,
    edgeDensity: 0.05,
    highlightRatio: 0,
  },
});

const ready = (warnings: QualityResult['warnings'] = [], confirmed = false): PhotoSlot => ({
  status: 'ready',
  upload: 'data:image/jpeg;base64,AAA',
  result: result(warnings),
  confirmed,
});

const profile = (handChoice: Profile['handChoice']): Profile => ({
  handChoice,
  dominantHand: 'right',
  language: 'en',
});

describe('capture gating', () => {
  it('reads one hand, or two in a fixed order', () => {
    expect(requiredRoles(profile('right'))).toEqual(['right']);
    expect(requiredRoles(profile('left'))).toEqual(['left']);
    expect(requiredRoles(profile('both'))).toEqual(['left', 'right']);
  });

  it.each([
    ['empty', { status: 'empty' } as PhotoSlot, false],
    ['checking', { status: 'checking' } as PhotoSlot, false],
    ['rejected', { status: 'rejected', upload: '', result: { ...result(['back-of-hand']), pass: false } } as PhotoSlot, false],
    ['a clean pass', ready(), true],
    ['a warning not accepted', ready(['back-of-hand']), false],
    ['a warning accepted', ready(['back-of-hand'], true), true],
  ])('treats %s as %s for analysis', (_label, slot, expected) => {
    expect(slotUsable(slot)).toBe(expected);
  });

  it('requires every requested hand to be usable', () => {
    expect(allSlotsUsable(profile('both'), { left: ready(), right: ready() })).toBe(true);
    expect(allSlotsUsable(profile('both'), { left: ready() })).toBe(false);
    expect(allSlotsUsable(profile('both'), { left: ready(), right: ready(['too-far']) })).toBe(false);
    expect(allSlotsUsable(profile('right'), { left: ready(), right: ready() })).toBe(true);
  });
});
