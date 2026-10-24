import panditVoice from '../assets/panditji-voice.mp3';
import { GeminiKeyCard } from '../components/GeminiKeyCard';
import { PanditJi } from '../components/PanditJi';
import { Disclaimer, Icon, PrivacyNote } from '../components/ui';
import { PANDIT_COPY, t, type CopyKey } from '../lib/i18n';
import type { Language } from '../lib/report';

const UNLOCKS: { emoji: string; title: CopyKey; body: CopyKey; tone: string }[] = [
  { emoji: '🦄', title: 'unlockPersona', body: 'unlockPersonaBody', tone: 'violet' },
  { emoji: '📚', title: 'unlockStudy', body: 'unlockStudyBody', tone: 'cyan' },
  { emoji: '🚀', title: 'unlockCareer', body: 'unlockCareerBody', tone: 'pink' },
  { emoji: '⚡', title: 'unlockSuper', body: 'unlockSuperBody', tone: 'lime' },
  { emoji: '🍀', title: 'unlockLucky', body: 'unlockLuckyBody', tone: 'amber' },
  { emoji: '💬', title: 'unlockChat', body: 'unlockChatBody', tone: 'blue' },
];

const STEPS: { emoji: string; title: CopyKey; body: CopyKey }[] = [
  { emoji: '✋', title: 'how1Title', body: 'how1Body' },
  { emoji: '📸', title: 'how2Title', body: 'how2Body' },
  { emoji: '✨', title: 'how3Title', body: 'how3Body' },
];

export function Landing({
  language,
  onStart,
  onSample,
  onResume,
  sampleBusy,
}: {
  language: Language;
  onStart: () => void;
  onSample: () => void;
  onResume?: () => void;
  sampleBusy: boolean;
}) {
  return (
    <main className="screen landing">
      <section className="hero">
        <p className="eyebrow">
          <span className="eyebrow__dot" aria-hidden="true" />
          {t(language, 'eyebrow')}
        </p>
        <h1 className="hero__title">
          <span>{t(language, 'heroTitle1')}</span>
          <em>{t(language, 'heroTitle2')}</em>
        </h1>
        <p className="hero__sub">{t(language, 'heroSub')}</p>

        <PanditJi
          size="hero"
          language={language}
          lines={PANDIT_COPY[language].welcome}
          speech={PANDIT_COPY[language].welcomeSpeech}
          autoSpeak
          clip={panditVoice}
        />

        <GeminiKeyCard language={language} />

        <div className="hero__actions">
          <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
            <span aria-hidden="true">✋</span>
            {t(language, 'ctaStart')}
            <Icon name="arrow" size={18} />
          </button>
          {onResume ? (
            <button type="button" className="btn btn--ghost" onClick={onResume}>
              <Icon name="sparkle" size={16} />
              {t(language, 'ctaLast')}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onSample}
              disabled={sampleBusy}
              aria-busy={sampleBusy}
            >
              {sampleBusy ? <span className="spinner spinner--sm" aria-hidden="true" /> : <Icon name="sparkle" size={16} />}
              {t(language, 'ctaSample')}
            </button>
          )}
        </div>

        <PrivacyNote language={language} />
      </section>

      <section className="unlock">
        <h2 className="section-label">{t(language, 'unlockTitle')}</h2>
        <div className="unlock__grid">
          {UNLOCKS.map((item) => (
            <article key={item.title} className={`unlock__card tone--${item.tone}`}>
              <span className="unlock__emoji" aria-hidden="true">
                {item.emoji}
              </span>
              <h3>{t(language, item.title)}</h3>
              <p>{t(language, item.body)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how">
        <h2 className="section-label">{t(language, 'howTitle')}</h2>
        <ol className="how__list">
          {STEPS.map((step, index) => (
            <li key={step.title} className="how__item">
              <span className="how__icon" aria-hidden="true">
                {step.emoji}
              </span>
              <div>
                <h3>
                  <span className="how__num">{index + 1}</span>
                  {t(language, step.title)}
                </h3>
                <p>{t(language, step.body)}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="share-hint">
          <Icon name="share" size={15} />
          {t(language, 'shareHint')}
        </p>
      </section>

      <section className="trust">
        <Icon name="lock" size={18} />
        <div>
          <h2>{t(language, 'privacyTitle')}</h2>
          <p>{t(language, 'privacyNote')}</p>
        </div>
      </section>

      <button type="button" className="btn btn--primary btn--block landing__cta" onClick={onStart}>
        {t(language, 'ctaStart')}
        <Icon name="arrow" size={18} />
      </button>

      <Disclaimer language={language} />
    </main>
  );
}
