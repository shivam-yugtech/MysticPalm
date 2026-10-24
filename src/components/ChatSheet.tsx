import { useEffect, useRef, useState } from 'react';
import { askPalmist } from '../lib/api';
import { t } from '../lib/i18n';
import type { Language, Report } from '../lib/report';
import { Brand, Icon } from './ui';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

type SuggestionKey = 'chipCareer' | 'chipLove' | 'chipYear' | 'chipHabit';

const SUGGESTIONS: Record<Language, { key: SuggestionKey; question: string }[]> = {
  en: [
    { key: 'chipCareer', question: 'What does my hand say about my career and money?' },
    { key: 'chipLove', question: 'What does my reading say about love?' },
    { key: 'chipYear', question: 'What should I focus on in the next twelve months?' },
    { key: 'chipHabit', question: 'Which habit should I start first?' },
  ],
  hi: [
    { key: 'chipCareer', question: 'मेरे करियर और पैसे के बारे में हाथ क्या कहता है?' },
    { key: 'chipLove', question: 'मेरी प्रेम ज़िंदगी के बारे में रीडिंग क्या कहती है?' },
    { key: 'chipYear', question: 'अगले बारह महीनों में मुझे किस पर ध्यान देना चाहिए?' },
    { key: 'chipHabit', question: 'मुझे सबसे पहले कौन-सी आदत शुरू करनी चाहिए?' },
  ],
  hinglish: [
    { key: 'chipCareer', question: 'Mere career aur paise ke baare mein hatheli kya kehti hai?' },
    { key: 'chipLove', question: 'Meri love life ke baare mein reading kya kehti hai?' },
    { key: 'chipYear', question: 'Agle barah mahine kis cheez par focus karun?' },
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
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('no-scroll');
    const timer = setTimeout(() => inputRef.current?.focus(), 240);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('no-scroll');
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy, error]);

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || busy) return;
    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setBusy(true);
    try {
      const answer = await askPalmist({ report, history: messages, question });
      setMessages((prev) => [...prev, { role: 'assistant', text: answer.reply }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t(language, 'chatError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`sheet${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="sheet__backdrop" aria-label={t(language, 'close')} onClick={onClose} tabIndex={open ? 0 : -1} />
      <div
        className="sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label={t(language, 'chatTitle')}
      >
        <header className="sheet__head">
          <Brand compact />
          <div>
            <h2>{t(language, 'chatTitle')}</h2>
            <p>{t(language, 'chatScope')}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t(language, 'close')}>
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="sheet__body">
          {messages.length === 0 && !busy && (
            <div className="chat-empty">
              <p>{t(language, 'chatIntro')}</p>
              <div className="chips">
                {SUGGESTIONS[language].map((suggestion) => (
                  <button
                    key={suggestion.key}
                    type="button"
                    className="chip"
                    onClick={() => send(suggestion.question)}
                  >
                    {t(language, suggestion.key)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`bubble bubble--${message.role}`}>
              {message.role === 'assistant' && <span className="bubble__who">Pandit Maya</span>}
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
          <div ref={endRef} />
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
              if (event.key === 'Enter' && !event.shiftKey) {
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
