import { useEffect, useState } from 'react';
import { HandGuide } from '../components/HandGuide';
import { HandMesh } from '../components/HandMesh';
import { Icon } from '../components/ui';
import { PANDIT_COPY, SCAN_LINES, t } from '../lib/i18n';
import { PanditJi } from '../components/PanditJi';
import { TEMPLATE_TRACE, type HandTrace } from '../lib/palmGeometry';
import type { Language } from '../lib/report';

const STEP_MS = 1100;

export function Scanning({
  language,
  status,
  detail,
  photo,
  trace,
  onRetry,
  onBack,
}: {
  language: Language;
  status: 'running' | 'error';
  detail?: string;
  photo?: string;
  trace?: HandTrace | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  const steps = SCAN_LINES[language];
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (status !== 'running') return;
    setDone(0);
    // The last step stays in progress until the reading actually arrives.
    const timer = window.setInterval(() => setDone((current) => Math.min(current + 1, steps.length - 1)), STEP_MS);
    return () => window.clearInterval(timer);
  }, [status, steps.length]);

  const shown = photo ? trace ?? null : TEMPLATE_TRACE;

  return (
    <main className="screen scanning">
      <div className={`scanframe${status === 'error' ? ' is-error' : ''}${photo ? ' has-photo' : ''}`} aria-hidden="true">
        {photo ? <img className="scanframe__photo" src={photo} alt="" /> : <HandGuide className="scanframe__ghost" />}
        {shown && status === 'running' && (
          <HandMesh trace={shown} variant="loop" language={language} fit="meet" className="scanframe__mesh" />
        )}
        {status === 'running' && <div className="scanframe__grid" />}
        <span className="scanframe__corner scanframe__corner--tl" />
        <span className="scanframe__corner scanframe__corner--tr" />
        <span className="scanframe__corner scanframe__corner--bl" />
        <span className="scanframe__corner scanframe__corner--br" />
      </div>

      {status === 'running' ? (
        <>
          <h1 className="title">{t(language, 'scanningTitle')}</h1>
          <PanditJi language={language} lines={PANDIT_COPY[language].scan} speech={PANDIT_COPY[language].scanSpeech} autoSpeak />
          <ol className="scansteps" aria-live="polite">
            {steps.map((step, index) => {
              const state = index < done ? 'done' : index === done ? 'active' : 'todo';
              return (
                <li key={step} className={`scansteps__item is-${state}`}>
                  <span className="scansteps__mark" aria-hidden="true">
                    {state === 'done' ? <Icon name="check" size={13} /> : state === 'active' ? <span className="spinner spinner--xs" /> : null}
                  </span>
                  {step}
                </li>
              );
            })}
          </ol>
          <p className="privacy">
            <Icon name="lock" size={15} />
            <span>{t(language, 'scanningNote')}</span>
          </p>
        </>
      ) : (
        <>
          <h1 className="title">{t(language, 'scanningError')}</h1>
          <p className="subtitle">{detail || t(language, 'errorGeneric')}</p>
          <div className="screen-actions scanning__actions">
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
