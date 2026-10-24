import { useEffect, useId, type ReactNode } from 'react';
import { confidenceLabel, LANGUAGES, t, type CopyKey } from '../lib/i18n';
import type { Language } from '../lib/report';

type IconName =
  | 'sparkle'
  | 'camera'
  | 'upload'
  | 'lock'
  | 'check'
  | 'alert'
  | 'download'
  | 'share'
  | 'chat'
  | 'chevron'
  | 'close'
  | 'back'
  | 'refresh'
  | 'sun'
  | 'focus'
  | 'hand'
  | 'arrow';

const ICONS: Record<IconName, ReactNode> = {
  sparkle: (
    <>
      <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" />
      <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.5h3l1.4-2h8.2l1.4 2h3v10h-17z" />
      <circle cx="12" cy="13.2" r="3.4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4.5" />
      <path d="M7.5 9L12 4.5 16.5 9" />
      <path d="M4 15v4.5h16V15" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  alert: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4.5M12 17.5v.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" />
      <path d="M7.5 10.5L12 15l4.5-4.5" />
      <path d="M4 19.5h16" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V4" />
      <path d="M8 7.5L12 3.5l4 4" />
      <path d="M5 12v8h14v-8" />
    </>
  ),
  chat: (
    <path d="M4 5.5h16v11H9.5L4 20z" />
  ),
  chevron: <path d="M6 9.5l6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: (
    <>
      <path d="M19 12H5" />
      <path d="M10.5 6.5L5 12l5.5 5.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
    </>
  ),
  focus: (
    <>
      <path d="M3.5 8V4.5H8M16 4.5h4.5V8M20.5 16v3.5H16M8 19.5H3.5V16" />
      <circle cx="12" cy="12" r="2.4" />
    </>
  ),
  hand: (
    <>
      <path d="M9 11V4.8a1.6 1.6 0 0 1 3.2 0V10" />
      <path d="M12.2 10V3.8a1.6 1.6 0 0 1 3.2 0V10" />
      <path d="M15.4 10.2V5.6a1.6 1.6 0 0 1 3.2 0V14c0 4.2-2.3 6.5-6.2 6.5-2.6 0-4.2-1.1-5.4-3L5.6 14a1.7 1.7 0 0 1 2.9-1.7L9 13.6" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
};

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ICONS[name]}
    </svg>
  );
}

export function Brand({ onClick, compact }: { onClick?: () => void; compact?: boolean }) {
  const inner = (
    <>
      <span className="brand__mark">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M11 25c-2.4-2.2-3.4-5.4-3.1-9.4l.5-5.2a1.9 1.9 0 1 1 3.7.4l.3 3.5.5-7.7a1.9 1.9 0 1 1 3.7.4l.3 6.8.6-6a1.9 1.9 0 1 1 3.7.4l-.4 6.4.6-4.4a1.9 1.9 0 0 1 3.7.6l-.5 8.3c-.3 3.4-1.5 5.3-3.4 6.7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && <span className="brand__name">MysticPalm</span>}
    </>
  );
  return onClick ? (
    <button type="button" className="brand" onClick={onClick} aria-label="MysticPalm home">
      {inner}
    </button>
  ) : (
    <span className="brand">{inner}</span>
  );
}

export function LanguageToggle({
  value,
  onChange,
  label,
}: {
  value: Language;
  onChange: (language: Language) => void;
  label: string;
}) {
  return (
    <div className="lang" role="group" aria-label={label}>
      {LANGUAGES.map((language) => (
        <button
          key={language.id}
          type="button"
          className={`lang__btn${value === language.id ? ' is-active' : ''}`}
          aria-pressed={value === language.id}
          onClick={() => onChange(language.id)}
        >
          {language.short}
        </button>
      ))}
    </div>
  );
}

export function Header({
  language,
  onLanguage,
  onHome,
}: {
  language: Language;
  onLanguage: (language: Language) => void;
  onHome: () => void;
}) {
  return (
    <header className="topbar">
      <Brand onClick={onHome} />
      <LanguageToggle value={language} onChange={onLanguage} label={t(language, 'languageLabel')} />
    </header>
  );
}

export function Steps({ step, language }: { step: 1 | 2 | 3; language: Language }) {
  const labels: { n: 1 | 2 | 3; key: CopyKey }[] = [
    { n: 1, key: 'stepHands' },
    { n: 2, key: 'stepPhoto' },
    { n: 3, key: 'stepReading' },
  ];
  return (
    <nav className="steps" aria-label={t(language, 'stepLabel')}>
      {labels.map(({ n, key }) => (
        <span
          key={n}
          className={`steps__item${n === step ? ' is-current' : ''}${n < step ? ' is-done' : ''}`}
          aria-current={n === step ? 'step' : undefined}
        >
          <span className="steps__dot">{n < step ? '✓' : n}</span>
          {t(language, key)}
        </span>
      ))}
    </nav>
  );
}

export function ConfidencePill({
  value,
  language,
  showNumber = true,
}: {
  value: number;
  language: Language;
  showNumber?: boolean;
}) {
  const level = value >= 75 ? 'high' : value >= 45 ? 'med' : 'low';
  return (
    <span className={`pill pill--${level}`} title={`${value}/100 ${t(language, 'confidence')}`}>
      <i aria-hidden="true" />
      {confidenceLabel(language, value)}
      {showNumber && <b>{value}</b>}
    </span>
  );
}

export function ScoreRing({ value, label }: { value: number; label: string }) {
  const id = useId().replace(/:/g, '');
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="score" title={`${label}: ${value}`}>
      <svg viewBox="0 0 84 84" className="score__ring" aria-hidden="true">
        <defs>
          <linearGradient id={`score-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f6dfa4" />
            <stop offset="100%" stopColor="#e9a96a" />
          </linearGradient>
        </defs>
        <circle cx="42" cy="42" r={radius} className="score__track" />
        <circle
          cx="42"
          cy="42"
          r={radius}
          className="score__value"
          stroke={`url(#score-${id})`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * value) / 100}
        />
      </svg>
      <span className="score__num">{value}</span>
      <span className="score__caption">{label}</span>
    </div>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, 4200);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

export function PrivacyNote({ language, long = false }: { language: Language; long?: boolean }) {
  return (
    <p className="privacy">
      <Icon name="lock" size={15} />
      <span>{t(language, long ? 'privacyNote' : 'privacyShort')}</span>
    </p>
  );
}

export function Disclaimer({ language }: { language: Language }) {
  return (
    <footer className="disclaimer">
      <span className="disclaimer__mark" aria-hidden="true">
        ✦
      </span>
      <p>{t(language, 'disclaimer')}</p>
    </footer>
  );
}
