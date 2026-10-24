import { describe, expect, it } from 'vitest';
import { analyzePixels, LIMITS, type Pixels } from '../src/lib/quality';

type RGB = [number, number, number];

const W = 320;
const H = 427;
const BG: RGB = [28, 24, 38];
const SKIN: RGB = [205, 155, 125];
const BRIGHT: RGB = [235, 225, 205];

const noise = (x: number, y: number, amount = 10): number => {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (value - Math.floor(value) - 0.5) * amount * 2;
};

const paint = (fn: (x: number, y: number) => RGB): Pixels => {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b] = fn(x, y);
      const i = (y * W + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { data, width: W, height: H };
};

const inside = (x: number, y: number, x0 = 90, x1 = 235, y0 = 100, y1 = 360) =>
  x >= x0 && x < x1 && y >= y0 && y < y1;

/** A sharp palm: skin with creases and sensor noise, on a dark background. */
const palm = (options: { textured?: boolean; highlights?: boolean; small?: boolean } = {}) =>
  paint((x, y) => {
    const bounds = options.small ? [110, 190, 140, 280] : [90, 235, 100, 360];
    if (!inside(x, y, bounds[0], bounds[1], bounds[2], bounds[3])) return BG;
    const n = noise(x, y);
    if (options.highlights && x % 8 < 2 && y % 10 < 3) return BRIGHT;
    if (options.textured && (x + y) % 6 < 3) return [135 + n, 100 + n, 82 + n];
    const crease =
      Math.abs(y - (160 + Math.sin(x / 16) * 10)) < 2 ||
      Math.abs(y - (250 + Math.cos(x / 20) * 12)) < 2;
    if (crease) return [118 + n, 84 + n, 68 + n];
    return [SKIN[0] + n, SKIN[1] + n, SKIN[2] + n];
  });

describe('analyzePixels', () => {
  it('passes a sharp, well-lit palm', () => {
    const result = analyzePixels(palm());
    expect(result.issues).toEqual([]);
    expect(result.pass).toBe(true);
    expect(result.score).toBe(100);
    expect(result.metrics.handCoverage).toBeGreaterThan(LIMITS.closeUp);
    expect(result.metrics.sharpness).toBeGreaterThan(LIMITS.sharpness);
  });

  it.each([
    ['too dark', paint(() => [8, 6, 12]), 'too-dark'],
    ['too bright', paint(() => [252, 250, 244]), 'too-bright'],
    ['a flat blurred palm', paint((x, y) => (inside(x, y) ? SKIN : BG)), 'blurry'],
    ['no palm at all', paint(() => [62, 56, 74]), 'no-hand'],
  ])('rejects %s', (_label, pixels, code) => {
    const result = analyzePixels(pixels);
    expect(result.pass).toBe(false);
    expect(result.issues).toContain(code);
  });

  it('warns about the back of the hand without blocking the reading', () => {
    const result = analyzePixels(palm({ textured: true, highlights: true }));
    expect(result.issues).toEqual([]);
    expect(result.pass).toBe(true);
    expect(result.warnings).toContain('back-of-hand');
  });

  it('warns when the hand is small in the frame', () => {
    const result = analyzePixels(palm({ small: true }));
    expect(result.issues).not.toContain('no-hand');
    expect(result.warnings).toContain('too-far');
  });

  it('treats missing pixel data as no hand', () => {
    const result = analyzePixels({ data: [0, 0, 0, 0], width: 2, height: 2 });
    expect(result).toMatchObject({ pass: false, score: 0 });
    expect(result.issues).toContain('no-hand');
  });
});
