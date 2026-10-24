/**
 * On-device hand tracking (MediaPipe Hand Landmarker). The photo never leaves the browser
 * for this step; only the model and runtime are downloaded. Everything here degrades to
 * `null` so the reading still works offline or on devices without WebAssembly support.
 */
import type { HandLandmarker } from '@mediapipe/tasks-vision';
import type { HandTrace } from './palmGeometry';

const VERSION = '0.10.14';
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

type Mode = 'IMAGE' | 'VIDEO';
const instances: Partial<Record<Mode, Promise<HandLandmarker | null>>> = {};

async function create(mode: Mode): Promise<HandLandmarker | null> {
  try {
    const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    const options = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: mode,
      numHands: 1,
      minHandDetectionConfidence: 0.4,
      minHandPresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    });
    try {
      return await HandLandmarker.createFromOptions(fileset, options('GPU'));
    } catch {
      return await HandLandmarker.createFromOptions(fileset, options('CPU'));
    }
  } catch {
    return null;
  }
}

const getTracker = (mode: Mode): Promise<HandLandmarker | null> => {
  if (!instances[mode]) {
    instances[mode] = create(mode).then((tracker) => {
      // A failed load may be a flaky network: allow a later retry.
      if (!tracker) delete instances[mode];
      return tracker;
    });
  }
  return instances[mode]!;
};

/** Start downloading the model early so the first photo is traced quickly. */
export const warmUpTracker = (mode: Mode = 'IMAGE'): void => {
  void getTracker(mode);
};

const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export type TraceResult = { status: 'found'; trace: HandTrace } | { status: 'none' } | { status: 'unavailable' };

/** Find the hand in a still photo. */
export async function traceImage(src: string): Promise<TraceResult> {
  const tracker = await withTimeout(getTracker('IMAGE'), 15_000, null);
  if (!tracker) return { status: 'unavailable' };
  try {
    const img = await loadImage(src);
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    // The detector misses hands that fill the whole frame (typical palm close-ups), so
    // retry with a margin around the photo and map the points back.
    for (const pad of [0, 0.25, 0.5]) {
      const input = pad ? padded(img, pad) : img;
      const result = tracker.detect(input);
      const points = result.landmarks[0];
      if (!points?.length) continue;
      const scaleX = pad ? 1 + pad * 2 : 1;
      return {
        status: 'found',
        trace: {
          points: points.map(({ x, y }) => ({ x: x * scaleX - pad, y: y * scaleX - pad })),
          width,
          height,
          score: result.handedness[0]?.[0]?.score ?? 0.9,
          estimated: false,
        },
      };
    }
    return { status: 'none' };
  } catch {
    return { status: 'unavailable' };
  }
}

/** The photo centred on a neutral canvas with `pad` of its size added on every side. */
function padded(img: HTMLImageElement, pad: number): HTMLCanvasElement {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * (1 + pad * 2));
  canvas.height = Math.round(h * (1 + pad * 2));
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, Math.round(w * pad), Math.round(h * pad), w, h);
  return canvas;
}

/**
 * Track a hand in a playing video. Calls `onFrame` about fifteen times a second with the
 * latest trace (or null when no hand is in view) until the returned stop function runs.
 */
export function trackVideo(video: HTMLVideoElement, onFrame: (trace: HandTrace | null) => void): () => void {
  let stopped = false;
  let frame = 0;
  let last = 0;

  void getTracker('VIDEO').then((tracker) => {
    if (!tracker || stopped) return;
    const tick = (now: number) => {
      if (stopped) return;
      if (now - last > 66 && video.readyState >= 2 && video.videoWidth) {
        last = now;
        try {
          const result = tracker.detectForVideo(video, now);
          const points = result.landmarks[0];
          onFrame(
            points?.length
              ? {
                  points: points.map(({ x, y }) => ({ x, y })),
                  width: video.videoWidth,
                  height: video.videoHeight,
                  score: result.handedness[0]?.[0]?.score ?? 0.9,
                  estimated: false,
                }
              : null,
          );
        } catch {
          // A dropped frame is harmless; try the next one.
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  });

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
  };
}
