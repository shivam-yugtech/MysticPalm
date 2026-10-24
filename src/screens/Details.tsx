import { useState } from 'react';
import { HandGuide } from '../components/HandGuide';
import { Icon, Steps } from '../components/ui';
import { LANGUAGES, STREAMS, t, type CopyKey } from '../lib/i18n';
import type { HandChoice, Language, Profile, Stage } from '../lib/report';

const HANDS: { id: HandChoice; label: CopyKey; hint: CopyKey }[] = [
  { id: 'left', label: 'handLeft', hint: 'handLeftHint' },
  { id: 'right', label: 'handRight', hint: 'handRightHint' },
  { id: 'both', label: 'handBoth', hint: 'handBothHint' },
];

const STAGES: { id: Stage; label: CopyKey; emoji: string }[] = [
  { id: 'school', label: 'stageSchool', emoji: '🎒' },
  { id: 'college', label: 'stageCollege', emoji: '🎓' },
  { id: 'other', label: 'stageOther', emoji: '🌟' },
];

export function Details({
  language,
  profile,
  onContinue,
  onBack,
}: {
  language: Language;
  profile: Profile;
  onContinue: (profile: Profile) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<Profile>({ ...profile, language });
  const update = (patch: Partial<Profile>) => setDraft((current) => ({ ...current, ...patch }));
  const languageName = LANGUAGES.find((item) => item.id === language)?.label ?? 'English';

  return (
    <main className="screen details">
      <button type="button" className="link-btn" onClick={onBack}>
        <Icon name="back" size={16} />
        {t(language, 'back')}
      </button>
      <Steps step={1} language={language} />
      <h1 className="title">{t(language, 'detailsTitle')}</h1>
      <p className="subtitle">{t(language, 'detailsSub')}</p>

      <div className="hand-choice" role="radiogroup" aria-label={t(language, 'detailsTitle')}>
        {HANDS.map((hand) => {
          const selected = draft.handChoice === hand.id;
          return (
            <button
              key={hand.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`hand-card${selected ? ' is-selected' : ''}`}
              onClick={() => update({ handChoice: hand.id })}
            >
              <span className="hand-card__art">
                {hand.id === 'both' ? (
                  <>
                    <HandGuide className="hand-card__mini is-back" />
                    <HandGuide className="hand-card__mini is-front" />
                  </>
                ) : (
                  <HandGuide className={`hand-card__mini${hand.id === 'left' ? ' is-mirror' : ''}`} />
                )}
              </span>
              <span className="hand-card__label">{t(language, hand.label)}</span>
              <span className="hand-card__hint">{t(language, hand.hint)}</span>
              <span className="hand-card__check" aria-hidden="true">
                <Icon name="check" size={12} />
              </span>
            </button>
          );
        })}
      </div>

      <h2 className="field-title">{t(language, 'dominantTitle')}</h2>
      <p className="field-sub">{t(language, 'dominantSub')}</p>
      <div className="seg" role="radiogroup" aria-label={t(language, 'dominantTitle')}>
        {(
          [
            { id: 'left', label: 'dominantLeft' },
            { id: 'right', label: 'dominantRight' },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={draft.dominantHand === option.id}
            className={draft.dominantHand === option.id ? 'is-active' : ''}
            onClick={() => update({ dominantHand: option.id })}
          >
            {t(language, option.label)}
          </button>
        ))}
      </div>

      <div className="optional-card">
        <div className="optional-card__head">
          <h2 className="field-title">{t(language, 'aboutTitle')}</h2>
          <span className="tag">{t(language, 'aboutSub')}</span>
        </div>

        <label className="field">
          <span>{t(language, 'nameLabel')}</span>
          <input
            type="text"
            value={draft.name ?? ''}
            maxLength={60}
            placeholder={t(language, 'namePlaceholder')}
            autoComplete="given-name"
            onChange={(event) => update({ name: event.target.value })}
          />
        </label>

        <div className="field">
          <span id="stage-label">{t(language, 'stageLabel')}</span>
          <div className="chip-row" role="radiogroup" aria-labelledby="stage-label">
            {STAGES.map((stage) => {
              const active = draft.stage === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`pick${active ? ' is-active' : ''}`}
                  onClick={() => update({ stage: active ? undefined : stage.id })}
                >
                  <span aria-hidden="true">{stage.emoji}</span>
                  {t(language, stage.label)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <span id="stream-label">{t(language, 'streamLabel')}</span>
          <div className="chip-row" role="radiogroup" aria-labelledby="stream-label">
            {STREAMS.map((stream) => {
              const active = draft.stream === stream.id;
              return (
                <button
                  key={stream.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`pick${active ? ' is-active' : ''}`}
                  onClick={() => update({ stream: active ? undefined : stream.id })}
                >
                  {t(language, stream.label)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="language-note">
        {t(language, 'readingIn')} <strong>{languageName}</strong>
      </p>

      <div className="screen-actions">
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={() => onContinue({ ...draft, name: draft.name?.trim() || undefined, language })}
        >
          {t(language, 'toCamera')}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </main>
  );
}
