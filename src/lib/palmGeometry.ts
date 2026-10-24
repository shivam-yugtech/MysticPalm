/**
 * Hand geometry shared by the live tracker, the scan animation and the report line map.
 * Points follow the 21-landmark hand model: 0 wrist, 1–4 thumb, 5–8 index, 9–12 middle,
 * 13–16 ring, 17–20 little finger. Coordinates are normalised to the image (0–1).
 */

export interface Point {
  x: number;
  y: number;
}

export interface HandTrace {
  points: Point[];
  /** Pixel size of the image the points belong to, so overlays keep its aspect ratio. */
  width: number;
  height: number;
  /** 0–1 detector confidence; 0 for the built-in template. */
  score: number;
  /** True when the points come from the template rather than a detected hand. */
  estimated: boolean;
}

export type PalmLineId = 'life' | 'head' | 'heart' | 'fate';
export const PALM_LINE_IDS: PalmLineId[] = ['life', 'head', 'heart', 'fate'];

export const LINE_COLORS: Record<PalmLineId, string> = {
  life: '#ffd166',
  head: '#5ee7ff',
  heart: '#ff6ec7',
  fate: '#a3ff8f',
};

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

/** Fingertips get a brighter dot in the mesh. */
export const FINGERTIPS = [4, 8, 12, 16, 20];

/** Landmarks drawn onto the illustrated hand (200×280 viewBox) for the sample and the hero. */
const TEMPLATE_PX: [number, number][] = [
  [104, 236],
  [72, 214], [52, 196], [38, 178], [26, 160],
  [72, 136], [72, 114], [72, 96], [72, 80],
  [97, 134], [97, 108], [97, 84], [97, 62],
  [123, 136], [123, 114], [123, 94], [123, 74],
  [147, 138], [147, 122], [147, 108], [147, 96],
];

export const TEMPLATE_TRACE: HandTrace = {
  points: TEMPLATE_PX.map(([x, y]) => ({ x: x / 200, y: y / 280 })),
  width: 200,
  height: 280,
  score: 0,
  estimated: true,
};

const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

const fmt = (p: Point) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;

/**
 * Palm lines placed from the hand's own landmarks. They follow where each crease runs
 * in relation to the knuckles, wrist and thumb, so they land on the user's palm rather
 * than on a fixed drawing.
 */
export function palmLinesFrom(trace: HandTrace): Record<PalmLineId, string> {
  const p = trace.points.map((pt) => ({ x: pt.x * trace.width, y: pt.y * trace.height }));
  const wrist = p[0];
  const centre = [0, 5, 9, 13, 17].reduce((acc, i) => ({ x: acc.x + p[i].x / 5, y: acc.y + p[i].y / 5 }), { x: 0, y: 0 });
  const down = (pt: Point, t: number) => lerp(pt, wrist, t);

  // Where the head and life lines start: between the index knuckle and the thumb.
  const origin = lerp(down(p[5], 0.14), p[2], 0.45);

  const heartStart = lerp(down(p[17], 0.2), down(p[13], 0.2), -0.25);
  const heartCtrl = down(p[13], 0.27);
  const heartEnd = down(lerp(p[5], p[9], 0.5), 0.2);

  const headCtrl = down(p[9], 0.4);
  const headEnd = lerp(down(p[17], 0.38), centre, -0.12);

  const lifeCtrl = lerp(lerp(p[2], wrist, 0.5), centre, 0.3);
  const lifeEnd = lerp(lerp(wrist, p[1], 0.3), centre, 0.12);

  const fateStart = lerp(wrist, p[9], 0.06);
  const fateEnd = down(p[9], 0.32);
  const fateCtrl = lerp(lerp(fateStart, fateEnd, 0.5), centre, 0.15);

  return {
    life: `M${fmt(origin)} Q${fmt(lifeCtrl)} ${fmt(lifeEnd)}`,
    head: `M${fmt(origin)} Q${fmt(headCtrl)} ${fmt(headEnd)}`,
    heart: `M${fmt(heartStart)} Q${fmt(heartCtrl)} ${fmt(heartEnd)}`,
    fate: `M${fmt(fateStart)} Q${fmt(fateCtrl)} ${fmt(fateEnd)}`,
  };
}

/** Pixel position of a landmark inside the trace's own coordinate space. */
export const pointPx = (trace: HandTrace, index: number): Point => ({
  x: trace.points[index].x * trace.width,
  y: trace.points[index].y * trace.height,
});

/** Typical on-screen size of a stroke for this trace, so dots look the same on any photo. */
export const strokeUnit = (trace: HandTrace): number => Math.max(trace.width, trace.height) / 280;
