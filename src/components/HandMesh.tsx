import { useId, type CSSProperties } from 'react';
import { t, type CopyKey } from '../lib/i18n';
import {
  FINGERTIPS,
  HAND_CONNECTIONS,
  LINE_COLORS,
  PALM_LINE_IDS,
  palmLinesFrom,
  pointPx,
  strokeUnit,
  type HandTrace,
  type PalmLineId,
} from '../lib/palmGeometry';
import type { Language } from '../lib/report';

const LINE_LABEL: Record<PalmLineId, CopyKey> = {
  life: 'lineLife',
  head: 'lineHead',
  heart: 'lineHeart',
  fate: 'lineFate',
};

/** The last point of an "M … Q … x y" path, where a label can sit. */
const pathEnd = (d: string) => {
  const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [0, 0];
  return { x: nums[nums.length - 2], y: nums[nums.length - 1] };
};

/**
 * Line tags sit beside where each line ends, pushed apart so they never stack and kept
 * away from the edges a cropped photo may hide.
 */
function placeLabels(
  trace: HandTrace,
  paths: Record<PalmLineId, string>,
  u: number,
  textFor: (id: PalmLineId) => string,
) {
  const gap = 17 * u;
  const marginX = trace.width * 0.1;
  const marginY = trace.height * 0.06;
  const labels = PALM_LINE_IDS.map((id, order) => {
    const end = pathEnd(paths[id]);
    const text = textFor(id);
    const w = text.length * 4.8 * u + 12 * u;
    const right = end.x + 6 * u;
    const x = right + w > trace.width - marginX ? end.x - w - 6 * u : right;
    return { id, order, text, w, x: Math.min(Math.max(x, marginX), trace.width - marginX - w), y: end.y };
  }).sort((a, b) => a.y - b.y);

  for (let i = 1; i < labels.length; i++) {
    const prev = labels[i - 1];
    const overlapsX = labels[i].x < prev.x + prev.w && prev.x < labels[i].x + labels[i].w;
    if (overlapsX && labels[i].y - prev.y < gap) labels[i].y = prev.y + gap;
  }
  // If the stack ran off the bottom, slide it back up.
  // The bottom band is kept free for the tracking read-out.
  const overflow = labels[labels.length - 1].y - trace.height * 0.84;
  if (overflow > 0) labels.forEach((label) => (label.y -= overflow));
  labels.forEach((label) => (label.y = Math.max(label.y, marginY)));
  return labels;
}

/**
 * The "connect the dots" hand: landmarks pop in, the bones join them, then the palm
 * lines are traced. `reveal` plays once, `loop` keeps pulsing (scanning), `live` follows
 * a moving camera feed without animation, and `still` just draws the result.
 */
export function HandMesh({
  trace,
  variant,
  language,
  fit = 'slice',
  lines = true,
  labels = true,
  skeleton = true,
  className = '',
}: {
  skeleton?: boolean;
  trace: HandTrace;
  variant: 'reveal' | 'loop' | 'live' | 'still';
  language: Language;
  fit?: 'slice' | 'meet';
  lines?: boolean;
  labels?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const u = strokeUnit(trace);
  const paths = lines ? palmLinesFrom(trace) : null;
  const pts = trace.points.map((_, i) => pointPx(trace, i));

  return (
    <svg
      className={`mesh mesh--${variant} ${className}`}
      viewBox={`0 0 ${trace.width} ${trace.height}`}
      preserveAspectRatio={`xMidYMid ${fit}`}
      style={{ '--u': `${u}px` } as CSSProperties}
      aria-hidden="true"
    >
      <defs>
        <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={2.2 * u} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`beam-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fe3ff" stopOpacity="0" />
          <stop offset="0.9" stopColor="#4fe3ff" stopOpacity="0.16" />
          <stop offset="0.985" stopColor="#4fe3ff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {(variant === 'reveal' || variant === 'loop') && (
        <rect className="mesh__beam" x="0" y={-trace.height * 0.25} width={trace.width} height={trace.height * 0.25} fill={`url(#beam-${uid})`} />
      )}

      {skeleton && <g className="mesh__bones" stroke="#ffffff" strokeWidth={1.1 * u} strokeLinecap="round">
        {HAND_CONNECTIONS.map(([a, b], i) => (
          <line
            key={`${a}-${b}`}
            x1={pts[a].x}
            y1={pts[a].y}
            x2={pts[b].x}
            y2={pts[b].y}
            pathLength={1}
            style={{ '--i': i } as CSSProperties}
          />
        ))}
      </g>}

      {paths && (
        <g className="mesh__lines" fill="none" strokeLinecap="round" filter={`url(#glow-${uid})`}>
          {PALM_LINE_IDS.map((id, i) => (
            <path
              key={id}
              d={paths[id]}
              stroke={LINE_COLORS[id]}
              strokeWidth={2.6 * u}
              pathLength={1}
              style={{ '--i': i } as CSSProperties}
            />
          ))}
        </g>
      )}

      {skeleton && <g className="mesh__dots">
        {pts.map((pt, i) => {
          const tip = FINGERTIPS.includes(i);
          return (
            <g key={i} className={`mesh__dot${tip ? ' is-tip' : ''}`} style={{ '--i': i } as CSSProperties}>
              <circle className="mesh__ring" cx={pt.x} cy={pt.y} r={(tip ? 7 : 5.5) * u} />
              <circle className="mesh__core" cx={pt.x} cy={pt.y} r={(tip ? 3.2 : 2.5) * u} />
            </g>
          );
        })}
      </g>}

      {paths && labels && (
        <g className="mesh__labels">
          {placeLabels(trace, paths, u, (id) => t(language, LINE_LABEL[id])).map((label) => (
            <g key={label.id} className="mesh__label" style={{ '--i': label.order } as CSSProperties}>
              <rect
                x={label.x}
                y={label.y - 7 * u}
                width={label.w}
                height={14 * u}
                rx={7 * u}
                fill="rgba(6,7,20,0.8)"
                stroke={LINE_COLORS[label.id]}
                strokeWidth={0.8 * u}
              />
              <text x={label.x + label.w / 2} y={label.y + 3 * u} textAnchor="middle" fill="#fff" fontSize={8 * u} fontWeight={700}>
                {label.text}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
