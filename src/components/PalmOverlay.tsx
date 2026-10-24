import { useMemo, useState, type CSSProperties } from 'react';
import { t } from '../lib/i18n';
import {
  LINE_COLORS,
  PALM_LINE_IDS,
  palmLinesFrom,
  strokeUnit,
  TEMPLATE_TRACE,
  type HandTrace,
  type PalmLineId,
} from '../lib/palmGeometry';
import { findingOf, type Language, type Report } from '../lib/report';
import { HandGuide } from './HandGuide';
import { HandMesh } from './HandMesh';
import { TraceHud } from './TraceHud';
import { ConfidencePill } from './ui';

export function PalmOverlay({
  report,
  language,
  photo,
  trace,
}: {
  report: Report;
  language: Language;
  photo?: string;
  trace?: HandTrace | null;
}) {
  const [active, setActive] = useState<PalmLineId | null>(null);
  const selected = active ? findingOf(report, active) : undefined;
  const toggle = (id: PalmLineId) => setActive((current) => (current === id ? null : id));

  // A photo without a detected hand falls back to the illustrated guide.
  const onPhoto = Boolean(photo && trace);
  const shown = onPhoto ? trace! : TEMPLATE_TRACE;
  const paths = useMemo(() => palmLinesFrom(shown), [shown]);
  const u = strokeUnit(shown);

  return (
    <section className="line-map">
      <div className="section-head">
        <h2>〰️ {t(language, 'lineMap')}</h2>
        <p>{t(language, 'lineMapNote')}</p>
      </div>

      <div className={`palm-stage${onPhoto ? ' has-photo' : ''}`}>
        {onPhoto ? (
          <img className="palm-stage__photo" src={photo} alt="" />
        ) : (
          <div className="palm-stage__ghost">
            <HandGuide />
          </div>
        )}
        <div className="palm-stage__scrim" aria-hidden="true" />
        <HandMesh
          trace={shown}
          variant="still"
          language={language}
          lines={false}
          labels={false}
          fit="meet"
          className="palm-stage__mesh"
        />
        <svg
          className="palm-stage__map"
          viewBox={`0 0 ${shown.width} ${shown.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {PALM_LINE_IDS.map((id, index) => {
            const finding = findingOf(report, id);
            const dim = active !== null && active !== id;
            return (
              <g key={id} opacity={dim ? 0.2 : 1}>
                <path
                  d={paths[id]}
                  stroke={LINE_COLORS[id]}
                  strokeWidth={(active === id ? 4 : 2.6) * u}
                  strokeLinecap="round"
                  fill="none"
                  pathLength={1}
                  style={{ '--i': index } as CSSProperties}
                  className={`palm-line${finding?.visible ? '' : ' is-unclear'}`}
                />
                <path
                  d={paths[id]}
                  stroke="transparent"
                  strokeWidth={18 * u}
                  fill="none"
                  className="palm-line__hit"
                  onClick={() => toggle(id)}
                />
              </g>
            );
          })}
        </svg>
        {onPhoto && <TraceHud trace={shown} language={language} delayed={false} />}
      </div>

      <div className="legend">
        {PALM_LINE_IDS.map((id) => {
          const finding = findingOf(report, id);
          return (
            <button
              key={id}
              type="button"
              className={`legend__btn${active === id ? ' is-active' : ''}${finding?.visible ? '' : ' is-unclear'}`}
              style={{ '--c': LINE_COLORS[id] } as CSSProperties}
              aria-pressed={active === id}
              onClick={() => toggle(id)}
            >
              <i aria-hidden="true" />
              {finding?.label ?? id}
            </button>
          );
        })}
      </div>

      <div className="line-readout" aria-live="polite">
        {selected ? (
          <>
            <div className="line-readout__top">
              <strong>{selected.label}</strong>
              {selected.visible ? (
                <ConfidencePill value={selected.confidence} language={language} />
              ) : (
                <span className="muted">{t(language, 'lineNotVisible')}</span>
              )}
            </div>
            {selected.visible && <p>{selected.meaning}</p>}
          </>
        ) : (
          <p className="muted">{t(language, 'lineMapNote')}</p>
        )}
      </div>

      {!onPhoto && <p className="caption">{t(language, 'notFoundPhoto')}</p>}
      <p className="caption">{t(language, 'lineMapSchematic')}</p>
    </section>
  );
}
