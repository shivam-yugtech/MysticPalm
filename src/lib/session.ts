import type { Profile, Report } from './report';

const KEY = 'mysticpalm.reading.v1';

export interface StoredReading {
  report: Report;
  profile: Profile;
}

export function saveReading(reading: StoredReading): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(reading));
  } catch {
    // Storage can be full or blocked; the reading still lives in memory.
  }
}

export function loadReading(): StoredReading | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReading;
    if (!parsed?.report?.sections || !parsed.profile) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearReading(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
