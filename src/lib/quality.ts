/**
 * Client-side photo quality gate. Everything here runs on raw pixels so it can be
 * unit-tested without a browser; `inspectImage` is the thin browser wrapper.
 *
 * A photo is never sent to the reading engine unless it is usable. Hard failures are
 * specific and actionable; the ambiguous palm-side and framing signals are warnings
 * the user can knowingly override.
 */

export interface Pixels {
  data: ArrayLike<number>;
  width: number;
  height: number;
}

export type QualityCode =
  | 'too-dark'
  | 'too-bright'
  | 'blurry'
  | 'no-hand'
  | 'back-of-hand'
  | 'too-far'
  | 'no-landmarks';

export interface QualityMetrics {
  brightness: number;
  sharpness: number;
  skinRatio: number;
  handCoverage: number;
  edgeDensity: number;
  highlightRatio: number;
}

export interface QualityResult {
  pass: boolean;
  score: number;
  issues: QualityCode[];
  warnings: QualityCode[];
  metrics: QualityMetrics;
}

/** Calibrated for a 320px-wide analysis pass. */
export const LIMITS = {
  width: 320,
  dark: 42,
  bright: 234,
  sharpness: 55,
  hand: 0.055,
  closeUp: 0.16,
  backEdge: 0.2,
  backHighlight: 0.035,
};

const GRID = 48;

function luma(p: Pixels): Float32Array {
  const out = new Float32Array(p.width * p.height);
  for (let i = 0, j = 0; i < out.length; i++, j += 4) {
    out[i] = 0.2126 * p.data[j] + 0.7152 * p.data[j + 1] + 0.0722 * p.data[j + 2];
  }
  return out;
}

function mean(values: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i];
  return values.length ? sum / values.length : 0;
}

/**
 * Variance of the 4-neighbour Laplacian — the standard blur signal. Restricted to
 * the palm where possible, because a sharp hand against a plain wall would otherwise
 * average out to "blurry".
 */
function laplacianVariance(values: Float32Array, w: number, h: number, mask?: Uint8Array): number {
  const lap: number[] = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (mask && (!mask[i] || !mask[i - 1] || !mask[i + 1] || !mask[i - w] || !mask[i + w])) continue;
      lap.push(4 * values[i] - values[i - 1] - values[i + 1] - values[i - w] - values[i + w]);
    }
  }
  const m = mean(lap);
  return lap.reduce((acc, v) => acc + (v - m) ** 2, 0) / Math.max(1, lap.length);
}

const isSkin = (r: number, g: number, b: number): boolean => {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return y > 45 && cb >= 77 && cb <= 130 && cr >= 132 && cr <= 176;
};

/** Largest connected skin region as a fraction of the frame — rejects walls and beige rooms. */
function largestSkinComponent(data: ArrayLike<number>, w: number, h: number): number {
  const grid = new Uint8Array(GRID * GRID);
  const cellW = w / GRID;
  const cellH = h / GRID;
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      let skin = 0;
      let total = 0;
      const x0 = Math.floor(gx * cellW);
      const y0 = Math.floor(gy * cellH);
      for (let y = y0; y < Math.min(h, y0 + cellH); y += 2) {
        for (let x = x0; x < Math.min(w, x0 + cellW); x += 2) {
          const j = (y * w + x) * 4;
          total++;
          if (isSkin(data[j], data[j + 1], data[j + 2])) skin++;
        }
      }
      grid[gy * GRID + gx] = total > 0 && skin / total >= 0.6 ? 1 : 0;
    }
  }

  const seen = new Uint8Array(grid.length);
  let best = 0;
  for (let start = 0; start < grid.length; start++) {
    if (!grid[start] || seen[start]) continue;
    let size = 0;
    const queue = [start];
    seen[start] = 1;
    while (queue.length) {
      const cell = queue.pop()!;
      size++;
      const cx = cell % GRID;
      const cy = Math.floor(cell / GRID);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
        const next = ny * GRID + nx;
        if (grid[next] && !seen[next]) {
          seen[next] = 1;
          queue.push(next);
        }
      }
    }
    best = Math.max(best, size);
  }
  return best / (GRID * GRID);
}

export function analyzePixels(p: Pixels): QualityResult {
  const { width: w, height: h, data } = p;
  if (!w || !h || data.length < w * h * 4) {
    return {
      pass: false,
      score: 0,
      issues: ['no-hand'],
      warnings: [],
      metrics: {
        brightness: 0,
        sharpness: 0,
        skinRatio: 0,
        handCoverage: 0,
        edgeDensity: 0,
        highlightRatio: 0,
      },
    };
  }

  const gray = luma(p);
  const brightness = mean(gray);

  // Skin mask first: blur is judged on the palm itself, not on a plain background.
  const mask = new Uint8Array(w * h);
  let skin = 0;
  for (let i = 0, j = 0; i < mask.length; i++, j += 4) {
    if (isSkin(data[j], data[j + 1], data[j + 2])) {
      mask[i] = 1;
      skin++;
    }
  }
  const sharpness = laplacianVariance(gray, w, h, skin > 800 ? mask : undefined);

  // Palm centre: where palm lines and mounts live.
  const cx0 = Math.floor(w * 0.28);
  const cx1 = Math.floor(w * 0.72);
  const cy0 = Math.floor(h * 0.3);
  const cy1 = Math.floor(h * 0.78);
  let centreSkin = 0;
  let edges = 0;
  let highlights = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (mask[i] && data[i * 4] > 205 && data[i * 4 + 1] > 200 && data[i * 4 + 2] > 190) {
        highlights++;
      }
      if (x >= cx0 && x < cx1 && y >= cy0 && y < cy1) {
        if (!mask[i]) continue;
        centreSkin++;
        if (x > 0 && y > 0 && x < w - 1 && y < h - 1) {
          const gx = gray[i + 1] - gray[i - 1];
          const gy = gray[i + w] - gray[i - w];
          if (Math.hypot(gx, gy) > 70) edges++;
        }
      }
    }
  }

  const metrics: QualityMetrics = {
    brightness: Math.round(brightness),
    sharpness: Math.round(sharpness),
    skinRatio: skin / (w * h),
    handCoverage: largestSkinComponent(data, w, h),
    edgeDensity: centreSkin ? edges / centreSkin : 0,
    highlightRatio: skin ? highlights / skin : 0,
  };

  const issues: QualityCode[] = [];
  const warnings: QualityCode[] = [];

  if (brightness < LIMITS.dark) issues.push('too-dark');
  else if (brightness > LIMITS.bright) issues.push('too-bright');
  if (sharpness < LIMITS.sharpness) issues.push('blurry');
  if (metrics.handCoverage < LIMITS.hand) issues.push('no-hand');
  else if (metrics.handCoverage < LIMITS.closeUp) warnings.push('too-far');

  // Back of the hand is textured and catches nail/knuckle highlights; a palm is smoother.
  // Heuristic and therefore never blocking — the user decides.
  if (
    metrics.handCoverage >= LIMITS.hand &&
    metrics.edgeDensity > LIMITS.backEdge &&
    metrics.highlightRatio > LIMITS.backHighlight
  ) {
    warnings.push('back-of-hand');
  }

  const score = Math.max(0, 100 - issues.length * 30 - warnings.length * 8);

  return { pass: issues.length === 0, score, issues, warnings, metrics };
}

/** Downscale to the analysis width and return pixels + a compressed upload copy. */
export async function inspectImage(source: Blob): Promise<{
  result: QualityResult;
  upload: string;
}> {
  const bitmap = await createImageBitmap(source);

  // Analysis pass: small and fast.
  const scale = Math.min(1, LIMITS.width / bitmap.width);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const pixels = ctx.getImageData(0, 0, w, h);

  // Upload copy: full enough for the model to see palm lines, small enough to send.
  const uploadMax = 1024;
  const uScale = Math.min(1, uploadMax / Math.max(bitmap.width, bitmap.height));
  const uCanvas = document.createElement('canvas');
  uCanvas.width = Math.max(1, Math.round(bitmap.width * uScale));
  uCanvas.height = Math.max(1, Math.round(bitmap.height * uScale));
  uCanvas.getContext('2d')!.drawImage(bitmap, 0, 0, uCanvas.width, uCanvas.height);
  bitmap.close();

  return {
    result: analyzePixels({ data: pixels.data, width: w, height: h }),
    upload: uCanvas.toDataURL('image/jpeg', 0.88),
  };
}
