import { useState } from 'react';
import { HandGuide } from '../components/HandGuide';
import { Icon, Steps } from '../components/ui';
import { LANGUAGES, t } from '../lib/i18n';
import type { HandChoice, Language, Profile } from '../lib/report';

const HANDS: { id: HandChoice; label: 'handLeft' | 'handRight' | 'handBoth'; hint: 'handLeftHint' | 'handRightHint' | 'handBothHint' }[] = [
  { id: 'left', label: 'handLeft', hint: 'handLeftHint' },
  { id: 'right', label: 'handRight', hint: 'handRightHint' },
  { id: 'both', label: 'handBoth', hint: 'handBothHint' },
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
                  <HandGuide className="hand-card__mini" />
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

        <label className="field">
          <span>{t(language, 'dobLabel')}</span>
          <input
            type="date"
            value={draft.dob ?? ''}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => update({ dob: event.target.value })}
          />
        </label>

        <label className="field">
          <span>{t(language, 'genderLabel')}</span>
          <select value={draft.gender ?? ''} onChange={(event) => update({ gender: event.target.value })}>
            <option value="">{t(language, 'genderNone')}</option>
            <option value="female">{t(language, 'genderFemale')}</option>
            <option value="male">{t(language, 'genderMale')}</option>
            <option value="other">{t(language, 'genderOther')}</option>
          </select>
        </label>
      </div>

      <p className="language-note">
        {t(language, 'readingIn')} <strong>{languageName}</strong>
      </p>

      <div className="screen-actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => onContinue({ ...draft, language })}
        >
          {t(language, 'toCamera')}
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </main>
  );
}
