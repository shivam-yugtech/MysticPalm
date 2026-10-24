import { useId } from 'react';
import { t, TRAIT_LABEL_KEYS } from '../lib/i18n';
import { TRAITS, type Language, type Report } from '../lib/report';

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 96;

const point = (index: number, ratio: number) => {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / TRAITS.length;
  return [CENTER + Math.cos(angle) * RADIUS * ratio, CENTER + Math.sin(angle) * RADIUS * ratio] as const;
};

const polygon = (ratios: number[]) =>
  ratios.map((ratio, index) => point(index, ratio).join(',')).join(' ');

export function RadarChart({ report, language }: { report: Report; language: Language }) {
  const id = useId().replace(/:/g, '');
  const values = TRAITS.map(({ key }) => Math.min(100, Math.max(0, report.traits[key] ?? 0)));
  const ratios = values.map((value) => Math.max(0.12, value / 100));

  return (
    <div className="radar">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="radar__svg" role="img" aria-label={t(language, 'traitTitle')}>
        <defs>
          <radialGradient id={`radar-fill-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(244,140,166,0.55)" />
            <stop offset="100%" stopColor="rgba(233,196,106,0.22)" />
          </radialGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon
            key={ring}
            points={polygon([ring, ring, ring, ring, ring, ring])}
            className="radar__grid"
          />
        ))}
        {TRAITS.map((trait, index) => {
          const [x, y] = point(index, 1);
          return <line key={trait.key} x1={CENTER} y1={CENTER} x2={x} y2={y} className="radar__axis" />;
        })}

        <g className="radar__shape">
          <polygon points={polygon(ratios)} fill={`url(#radar-fill-${id})`} className="radar__area" />
          <polygon points={polygon(ratios)} className="radar__edge" />
          {ratios.map((ratio, index) => {
            const [x, y] = point(index, ratio);
            return <circle key={index} cx={x} cy={y} r="3.2" className="radar__dot" />;
          })}
        </g>

        {TRAITS.map((trait, index) => {
          const [x, y] = point(index, 1.26);
          const anchor = Math.abs(x - CENTER) < 6 ? 'middle' : x > CENTER ? 'start' : 'end';
          return (
            <g key={trait.key}>
              <text x={x} y={y - 3} textAnchor={anchor} className="radar__label">
                {t(language, TRAIT_LABEL_KEYS[trait.key])}
              </text>
              <text x={x} y={y + 13} textAnchor={anchor} className="radar__value">
                {values[index]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
