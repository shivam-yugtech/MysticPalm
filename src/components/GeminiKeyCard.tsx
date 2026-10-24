import { useEffect, useState } from 'react';
import { getGeminiKey, onGeminiKey, setGeminiKey, verifyGeminiKey } from '../lib/geminiKey';
import { GEMINI_COPY } from '../lib/i18n';
import type { Language } from '../lib/report';

const SKIP = 'mysticpalm.geminiSkip';

const skipped = () => {
  try {
    return sessionStorage.getItem(SKIP) === '1';
  } catch {
    return false;
  }
};

export function GeminiKeyCard({ language }: { language: Language }) {
  const copy = GEMINI_COPY[language];
  const [saved, setSaved] = useState<string | null>(getGeminiKey);
  const [editing, setEditing] = useState(!getGeminiKey() && !skipped());
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onGeminiKey(setSaved), []);

  const save = async () => {
    const key = value.trim();
    if (!key || busy) return;
    setBusy(true);
    setError(null);
    try {
      await verifyGeminiKey(key);
      setGeminiKey(key);
      setValue('');
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  const skip = () => {
    try {
      sessionStorage.setItem(SKIP, '1');
    } catch {
      return setEditing(false);
    }
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="gkey gkey--compact">
        {saved ? (
          <>
            <span className="gkey__dot" aria-hidden="true" />
            <span>{copy.on}</span>
            <button type="button" onClick={() => setEditing(true)}>
              {copy.change}
            </button>
            <button type="button" onClick={() => setGeminiKey(null)}>
              {copy.remove}
            </button>
          </>
        ) : (
          <button type="button" className="gkey__open" onClick={() => setEditing(true)}>
            🔑 {copy.title}
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      className="gkey"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="gkey__head">
        <span aria-hidden="true">🔑</span>
        <div>
          <h2>{copy.title}</h2>
          <p>{copy.body}</p>
        </div>
      </div>
      <div className="gkey__row">
        <input
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={copy.placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-label={copy.placeholder}
        />
        <button type="submit" className="btn btn--primary btn--sm" disabled={!value.trim() || busy}>
          {busy ? copy.checking : copy.save}
        </button>
      </div>
      {error && <p className="gkey__error" role="alert">{error}</p>}
      <div className="gkey__foot">
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
          {copy.get} ↗
        </a>
        <button type="button" onClick={saved ? () => setEditing(false) : skip}>
          {copy.skip}
        </button>
      </div>
      <p className="gkey__privacy">🔒 {copy.privacy}</p>
    </form>
  );
}
