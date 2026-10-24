const KEY = 'mysticpalm.geminiKey';
const listeners = new Set<(key: string | null) => void>();

export function getGeminiKey(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setGeminiKey(key: string | null): void {
  try {
    if (key) localStorage.setItem(KEY, key);
    else localStorage.removeItem(KEY);
  } catch {
    return;
  } finally {
    listeners.forEach((fn) => fn(key));
  }
}

export function onGeminiKey(fn: (key: string | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function verifyGeminiKey(key: string): Promise<void> {
  const res = await fetch('/api/tts/check', { method: 'POST', headers: { 'x-gemini-key': key } }).catch(() => null);
  if (!res) throw new Error('Could not reach the server.');
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'That key did not work.');
  }
}
