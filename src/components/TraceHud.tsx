import { t } from '../lib/i18n';
import type { HandTrace } from '../lib/palmGeometry';
import type { Language } from '../lib/report';

/** Tracking read-out shown over a traced photo. */
export function TraceHud({ trace, language, delayed = true }: { trace: HandTrace; language: Language; delayed?: boolean }) {
  const match = Math.round(Math.min(0.99, Math.max(0.6, trace.score)) * 100);
  return (
    <div className={`hud${delayed ? ' is-delayed' : ''}`} aria-live="polite">
      <span className="hud__chip hud__chip--top">
        <i aria-hidden="true" />
        {t(language, trace.estimated ? 'traceGuide' : 'traceLocked')}
      </span>
      <span className="hud__chip hud__chip--bottom">
        <b>21</b> {t(language, 'tracePoints')} · <b>4</b> {t(language, 'traceLines')}
        {!trace.estimated && (
          <>
            {' '}
            · <b>{match}%</b> {t(language, 'traceMatch')}
          </>
        )}
      </span>
    </div>
  );
}
