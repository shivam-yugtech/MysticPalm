import { describe, expect, it } from 'vitest';
import { HAND_CONNECTIONS, PALM_LINE_IDS, palmLinesFrom, TEMPLATE_TRACE, type HandTrace } from '../src/lib/palmGeometry';

const numbers = (d: string) => d.match(/-?\d+(\.\d+)?/g)!.map(Number);

describe('palm geometry', () => {
  it('connects all 21 landmarks', () => {
    const used = new Set(HAND_CONNECTIONS.flat());
    expect(used.size).toBe(21);
    expect(TEMPLATE_TRACE.points).toHaveLength(21);
  });

  it('keeps every palm line inside the palm of the illustrated hand', () => {
    const paths = palmLinesFrom(TEMPLATE_TRACE);
    for (const id of PALM_LINE_IDS) {
      const values = numbers(paths[id]);
      for (let i = 0; i < values.length; i += 2) {
        expect(values[i], `${id} x`).toBeGreaterThanOrEqual(50);
        expect(values[i], `${id} x`).toBeLessThanOrEqual(158);
        expect(values[i + 1], `${id} y`).toBeGreaterThanOrEqual(108);
        expect(values[i + 1], `${id} y`).toBeLessThanOrEqual(240);
      }
    }
  });

  it('scales the lines with the photo they were traced on', () => {
    const big: HandTrace = { ...TEMPLATE_TRACE, width: 2000, height: 2800, estimated: false };
    const small = numbers(palmLinesFrom(TEMPLATE_TRACE).heart);
    const large = numbers(palmLinesFrom(big).heart);
    large.forEach((value, i) => expect(value).toBeCloseTo(small[i] * 10, 0));
  });
});
