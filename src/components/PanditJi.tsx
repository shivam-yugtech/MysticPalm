import { useCallback, useEffect, useRef, useState } from 'react';
import pandit from '../assets/pandit.webp';
import { PANDIT_COPY } from '../lib/i18n';
import type { Language } from '../lib/report';
import { getGeminiKey, onGeminiKey } from '../lib/geminiKey';
import { playClip, speak, speakGemini, stopSpeaking, voiceSupported } from '../lib/voice';

const TYPE_MS = 26;
const HOLD_MS = 2600;

export function PanditJi({
  lines,
  speech,
  language,
  size = 'side',
  autoSpeak = false,
  clip,
}: {
  lines: string[];
  speech?: string;
  language: Language;
  size?: 'hero' | 'side';
  autoSpeak?: boolean;
  clip?: string;
}) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [beat, setBeat] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [gemini, setGemini] = useState<string | null>(getGeminiKey);
  const spoken = useRef(false);
  const line = lines[index % lines.length] ?? '';
  const text = speech ?? lines.join(' ');
  const useClip = Boolean(clip) && language !== 'en';

  useEffect(() => {
    setTyped(0);
    const timer = window.setInterval(() => {
      setTyped((count) => {
        if (count >= line.length) {
          window.clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, TYPE_MS);
    return () => window.clearInterval(timer);
  }, [line]);

  useEffect(() => {
    if (typed < line.length || lines.length < 2) return;
    const timer = window.setTimeout(() => setIndex((i) => i + 1), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [typed, line.length, lines.length]);

  useEffect(() => onGeminiKey(setGemini), []);

  const play = useCallback(() => {
    spoken.current = true;
    const events = {
      onStart: () => {
        setLoading(false);
        setSpeaking(true);
      },
      onWord: () => setBeat((b) => b + 1),
      onEnd: () => {
        setLoading(false);
        setSpeaking(false);
      },
    };
    const fallback = () => {
      if (useClip) playClip(clip!, events).catch(() => void speak(text, language, events));
      else void speak(text, language, events);
    };
    setNotice(null);
    if (!gemini) return fallback();
    setLoading(true);
    speakGemini(gemini, text, language, events).catch((error: unknown) => {
      setLoading(false);
      setNotice(error instanceof Error ? error.message : String(error));
      fallback();
    });
  }, [text, language, useClip, clip, gemini]);

  const toggle = () => {
    if (loading) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else play();
  };

  useEffect(() => {
    if (!autoSpeak || !(voiceSupported() || useClip || gemini)) return;
    const activated = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive;
    if (activated) {
      const timer = window.setTimeout(play, 600);
      return () => window.clearTimeout(timer);
    }
    const once = () => {
      if (!spoken.current) play();
    };
    window.addEventListener('pointerdown', once, { once: true });
    return () => window.removeEventListener('pointerdown', once);
  }, [autoSpeak, play, useClip]);

  useEffect(() => stopSpeaking, []);

  return (
    <div className={`pandit pandit--${size}${speaking ? ' is-speaking' : ''}`}>
      <div className="pandit__stage">
        <span className="pandit__aura" aria-hidden="true" />
        <span className="pandit__wave" aria-hidden="true" />
        <span className="pandit__wave pandit__wave--2" aria-hidden="true" />
        <img className={`pandit__img beat-${beat % 2}`} src={pandit} alt="Pandit Ji" draggable={false} />
      </div>
      <div className="pandit__bubble" aria-live="polite">
        <span className="pandit__name">Pandit Ji ✨</span>
        <p>
          {line.slice(0, typed)}
          <i className="pandit__caret" aria-hidden="true" />
        </p>
        {(voiceSupported() || useClip || gemini) && (
          <button type="button" className="pandit__voice" onClick={toggle}>
            {loading ? <span className="spinner spinner--xs" aria-hidden="true" /> : speaking ? '⏸' : '🔊'} {speaking ? PANDIT_COPY[language].stop : PANDIT_COPY[language].listen}
          </button>
        )}
        {notice && <p className="pandit__notice">⚠ {notice}</p>}
      </div>
    </div>
  );
}
