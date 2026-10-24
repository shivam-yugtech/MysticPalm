import { HandGuide } from '../components/HandGuide';
import { Disclaimer, Icon, PrivacyNote } from '../components/ui';
import { t } from '../lib/i18n';
import type { Language } from '../lib/report';

export function Landing({
  language,
  onStart,
  onSample,
  sampleBusy,
}: {
  language: Language;
  onStart: () => void;
  onSample: () => void;
  sampleBusy: boolean;
}) {
  return (
    <main className="screen landing">
      <section className="hero">
        <p className="eyebrow">
          <Icon name="sparkle" size={14} />
          {t(language, 'eyebrow')}
        </p>
        <h1 className="hero__title">
          <span>{t(language, 'heroTitle1')}</span>
          <em>{t(language, 'heroTitle2')}</em>
        </h1>
        <p className="hero__sub">{t(language, 'heroSub')}</p>

        <div className="hero__art" aria-hidden="true">
          <div className="hero__halo" />
          <div className="hero__ring" />
          <HandGuide lined className="hero__hand" />
          <span className="hero__note hero__note--life">Life</span>
          <span className="hero__note hero__note--heart">Heart</span>
          <span className="hero__note hero__note--head">Head</span>
          <span className="hero__note hero__note--fate">Fate</span>
        </div>

        <div className="hero__actions">
          <button type="button" className="btn btn--primary" onClick={onStart}>
            {t(language, 'ctaStart')}
            <Icon name="arrow" size={18} />
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onSample}
            disabled={sampleBusy}
            aria-busy={sampleBusy}
          >
            {t(language, 'ctaSample')}
          </button>
        </div>

        <PrivacyNote language={language} long />
      </section>

      <section className="how">
        <h2 className="section-label">{t(language, 'howTitle')}</h2>
        <ol className="how__list">
          {(
            [
              { icon: 'hand', title: 'how1Title', body: 'how1Body' },
              { icon: 'camera', title: 'how2Title', body: 'how2Body' },
              { icon: 'sparkle', title: 'how3Title', body: 'how3Body' },
            ] as const
          ).map((step, index) => (
            <li key={step.title} className="how__item">
              <span className="how__icon">
                <Icon name={step.icon} size={18} />
              </span>
              <div>
                <h3>
                  <span className="how__num">{String(index + 1).padStart(2, '0')}</span>
                  {t(language, step.title)}
                </h3>
                <p>{t(language, step.body)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="trust">
        <Icon name="lock" size={16} />
        <div>
          <h2>{t(language, 'privacyTitle')}</h2>
          <p>{t(language, 'privacyNote')}</p>
        </div>
      </section>

      <Disclaimer language={language} />
    </main>
  );
}
