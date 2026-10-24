import { useEffect, useState } from 'react';
import { HandGuide } from '../components/HandGuide';
import { Icon } from '../components/ui';
import { SCAN_LINES, t } from '../lib/i18n';
import type { Language } from '../lib/report';

export function Scanning({
  language,
  status,
  detail,
  onRetry,
  onBack,
}: {
  language: Language;
  status: 'running' | 'error';
  detail?: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  const [index, setIndex] = useState(0);
  const lines = SCAN_LINES[language];

  useEffect(() => {
    if (status !== 'running') return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % lines.length), 1100);
    return () => window.clearInterval(timer);
  }, [status, lines.length]);

  return (
    <main className="screen scanning">
      <div className={`scan${status === 'error' ? ' is-error' : ''}`} aria-hidden="true">
        <div className="scan__aura" />
        <div className="scan__ring" />
        <HandGuide lined className="scan__hand" />
        {status === 'running' && <div className="scan__beam" />}
      </div>

      {status === 'running' ? (
        <>
          <h1 className="title">{t(language, 'scanningTitle')}</h1>
          <p className="scan__line" aria-live="polite">
            {lines[index]}
          </p>
          <div className="progress" role="progressbar" aria-label={t(language, 'scanningTitle')}>
            <span />
          </div>
          <p className="privacy">
            <Icon name="lock" size={15} />
            <span>{t(language, 'scanningNote')}</span>
          </p>
        </>
      ) : (
        <>
          <h1 className="title">{t(language, 'scanningError')}</h1>
          <p className="subtitle">{detail || t(language, 'errorGeneric')}</p>
          <div className="screen-actions">
            <button type="button" className="btn btn--primary" onClick={onRetry}>
              <Icon name="refresh" size={18} />
              {t(language, 'tryAgain')}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onBack}>
              {t(language, 'back')}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
