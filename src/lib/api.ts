import type { PhotoRole, Profile, Report } from './report';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new Error('Could not reach the reading service. Check your connection.');
  }

  const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) {
    throw new Error(body?.error ?? 'The reading service is unavailable right now.');
  }
  if (!body) throw new Error('The reading service sent an empty reply.');
  return body;
}

export const analyzeHands = (photos: { role: PhotoRole; dataUrl: string }[], profile: Profile) =>
  request<{ report: Report; mode: 'live' | 'demo' }>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ photos, profile }),
  });

export const fetchSample = () => request<{ report: Report }>('/api/sample');

export const askPalmist = (payload: {
  report: Report;
  history: { role: 'user' | 'assistant'; text: string }[];
  question: string;
}) =>
  request<{ reply: string; mode: 'live' | 'demo' }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
