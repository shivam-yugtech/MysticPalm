import { useEffect, useRef, useState } from 'react';
import { askPalmist } from '../lib/api';
import { t } from '../lib/i18n';
import type { Language, Report } from '../lib/report';
import { Icon } from './ui';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

type SuggestionKey = 'chipStudy' | 'chipCareer' | 'chipFriends' | 'chipHabit';

const SUGGESTIONS: Record<Language, { key: SuggestionKey; question: string }[]> = {
  en: [
    { key: 'chipStudy', question: 'How should I study for exams?' },
    { key: 'chipCareer', question: 'Which career fits me best?' },
    { key: 'chipFriends', question: 'What does my hand say about my friends and social life?' },
    { key: 'chipHabit', question: 'Which habit should I start first?' },
  ],
  hi: [
    { key: 'chipStudy', question: 'परीक्षा के लिए मुझे कैसे पढ़ाई करनी चाहिए?' },
    { key: 'chipCareer', question: 'मेरे लिए कौन-सा करियर सबसे सही है?' },
    { key: 'chipFriends', question: 'मेरे दोस्तों और सोशल लाइफ़ के बारे में हाथ क्या कहता है?' },
    { key: 'chipHabit', question: 'मुझे सबसे पहले कौन-सी आदत शुरू करनी चाहिए?' },
  ],
  hinglish: [
    { key: 'chipStudy', question: 'Exams ke liye mujhe kaise padhai karni chahiye?' },
    { key: 'chipCareer', question: 'Mere liye kaunsa career sabse fit hai?' },
    { key: 'chipFriends', question: 'Mere doston aur social life ke baare mein haath kya kehta hai?' },
    { key: 'chipHabit', question: 'Kaunsi aadat sabse pehle shuru karun?' },
  ],
};

export function ChatSheet({
  open,
  onClose,
  report,
  language,
}: {
  open: boolean;
  onClose: () => void;
  report: Report;
  language: Language;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // A new reading starts a new conversation.
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [report.generatedAt]);

  useEffect(() => {
    sheetRef.current?.toggleAttribute('inert', !open);
    if (!open) return;
    document.body.classList.add('no-scroll');
    const timer = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 260);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('no-scroll');
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Scroll only the chat body, never the page behind it.
  useEffect(() => {
    const body = bodyRef.current;
    if (open && body) body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
  }, [open, messages, busy, error]);

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || busy) return;
    setInput('');
    setError(null);
    const history = messages;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setBusy(true);
    try {
      const answer = await askPalmist({ report, history, question });
      setMessages((prev) => [...prev, { role: 'assistant', text: answer.reply }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t(language, 'chatError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={sheetRef} className={`sheet${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="sheet__backdrop" aria-label={t(language, 'close')} onClick={onClose} tabIndex={-1} />
      <div className="sheet__panel" role="dialog" aria-modal="true" aria-label={t(language, 'chatTitle')}>
        <header className="sheet__head">
          <span className="sheet__avatar" aria-hidden="true">
            🔮
          </span>
          <div>
            <h2>{t(language, 'chatTitle')}</h2>
            <p>{t(language, 'chatScope')}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t(language, 'close')}>
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="sheet__body" ref={bodyRef}>
          {messages.length === 0 && !busy && (
            <div className="chat-empty">
              <p>{t(language, 'chatIntro')}</p>
              <div className="chips">
                {SUGGESTIONS[language].map((suggestion) => (
                  <button
                    key={suggestion.key}
                    type="button"
                    className="chip"
                    onClick={() => void send(suggestion.question)}
                  >
                    {t(language, suggestion.key)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`bubble bubble--${message.role}`}>
              {message.role === 'assistant' && <span className="bubble__who">Maya ✨</span>}
              <p>{message.text}</p>
            </div>
          ))}

          {busy && (
            <div className="bubble bubble--assistant bubble--typing">
              <span className="typing" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="sr-only">{t(language, 'chatThinking')}</span>
            </div>
          )}

          {error && (
            <p className="chat-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, 500))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            maxLength={500}
            placeholder={t(language, 'chatPlaceholder')}
            aria-label={t(language, 'chatPlaceholder')}
          />
          <button
            type="submit"
            className="composer__send"
            disabled={!input.trim() || busy}
            aria-label={t(language, 'chatSend')}
          >
            <Icon name="arrow" size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
