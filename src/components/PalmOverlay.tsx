import { useState, type CSSProperties } from 'react';
import { t } from '../lib/i18n';
import { findingOf, type Language, type Report } from '../lib/report';
import { HandGuide, LINE_COLORS, PALM_LINES } from './HandGuide';
import { ConfidencePill } from './ui';

const LINE_IDS = ['life', 'head', 'heart', 'fate'] as const;

export function PalmOverlay({
  report,
  language,
  photo,
}: {
  report: Report;
  language: Language;
  photo?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const selected = active ? findingOf(report, active) : undefined;
  const toggle = (id: string) => setActive((current) => (current === id ? null : id));

  return (
    <section className="line-map">
      <div className="section-head">
        <h2>{t(language, 'lineMap')}</h2>
        <p>{t(language, 'lineMapNote')}</p>
      </div>

      <div className={`palm-stage${photo ? ' has-photo' : ''}`}>
        {photo ? (
          <img className="palm-stage__photo" src={photo} alt="Your palm with a schematic line map" />
        ) : (
          <div className="palm-stage__ghost">
            <HandGuide lined />
          </div>
        )}
        <div className="palm-stage__scrim" aria-hidden="true" />
        <svg className="palm-stage__map" viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet">
          {LINE_IDS.map((id) => {
            const finding = findingOf(report, id);
            const dim = active !== null && active !== id;
            return (
              <g key={id} opacity={dim ? 0.22 : 1}>
                <path
                  d={PALM_LINES[id]}
                  stroke={LINE_COLORS[id]}
                  strokeWidth={active === id ? 3.4 : 2.2}
                  strokeLinecap="round"
                  fill="none"
                  className={`palm-line${finding?.visible ? '' : ' is-unclear'}`}
                />
                <path
                  d={PALM_LINES[id]}
                  stroke="transparent"
                  strokeWidth="18"
                  fill="none"
                  className="palm-line__hit"
                  onClick={() => toggle(id)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="legend">
        {LINE_IDS.map((id) => {
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

      {!photo && <p className="caption">{t(language, 'notFoundPhoto')}</p>}
      <p className="caption">{t(language, 'lineMapSchematic')}</p>
    </section>
  );
}
