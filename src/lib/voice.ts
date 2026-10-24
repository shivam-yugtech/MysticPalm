import type { Language } from './report';

const MALE_HINTS = /ravi|prabhat|hemant|madhur|rishi|male|aarav|kunal|david|guy|mark|daniel|alex|fred/i;

let cached: SpeechSynthesisVoice[] = [];

const loadVoices = (): Promise<SpeechSynthesisVoice[]> =>
  new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const now = synth.getVoices();
    if (now.length) return resolve(now);
    const done = () => resolve(synth.getVoices());
    synth.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1200);
  });

const pickVoice = (voices: SpeechSynthesisVoice[], language: Language) => {
  const prefs = language === 'hi' ? ['hi-IN', 'en-IN'] : ['en-IN', 'hi-IN', 'en-GB', 'en-US', 'en'];
  for (const pref of prefs) {
    const pool = voices.filter((v) => v.lang.replace('_', '-').startsWith(pref));
    const male = pool.find((v) => MALE_HINTS.test(v.name));
    if (male) return male;
    if (pool.length && pref !== 'en-US' && pref !== 'en') return pool[0];
  }
  return voices.find((v) => MALE_HINTS.test(v.name)) ?? voices[0];
};

export const voiceSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export async function speak(
  text: string,
  language: Language,
  events: { onStart?: () => void; onWord?: () => void; onEnd?: () => void } = {},
): Promise<void> {
  if (!voiceSupported()) return events.onEnd?.();
  stopSpeaking();
  const synth = window.speechSynthesis;
  synth.cancel();
  if (!cached.length) cached = await loadVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(cached, language);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  utterance.pitch = 0.82;
  utterance.rate = 1.04;
  utterance.onstart = () => events.onStart?.();
  utterance.onboundary = () => events.onWord?.();
  utterance.onend = () => events.onEnd?.();
  utterance.onerror = () => events.onEnd?.();
  synth.speak(utterance);
}

export const stopSpeaking = () => {
  clipStop?.();
  if (voiceSupported()) window.speechSynthesis.cancel();
};

let clipStop: (() => void) | null = null;

export function playClip(src: string, events: { onStart?: () => void; onWord?: () => void; onEnd?: () => void } = {}): void {
  stopSpeaking();
  const audio = new Audio(src);
  let frame = 0;
  let context: AudioContext | null = null;
  let loud = false;
  const finish = () => {
    cancelAnimationFrame(frame);
    void context?.close().catch(() => undefined);
    context = null;
    if (clipStop === stop) clipStop = null;
    events.onEnd?.();
  };
  const stop = () => {
    audio.pause();
    finish();
  };
  clipStop = stop;
  try {
    context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    context.createMediaElementSource(audio).connect(analyser);
    analyser.connect(context.destination);
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += (v - 128) ** 2;
      const level = Math.sqrt(sum / data.length) / 128;
      if (level > 0.08 && !loud) events.onWord?.();
      loud = level > 0.06;
      frame = requestAnimationFrame(tick);
    };
    audio.addEventListener('play', () => (frame = requestAnimationFrame(tick)), { once: true });
  } catch {
    context = null;
  }
  audio.addEventListener('play', () => events.onStart?.(), { once: true });
  audio.addEventListener('ended', finish, { once: true });
  audio.addEventListener('error', finish, { once: true });
  void audio.play().catch(finish);
}

const geminiCache = new Map<string, string>();

export async function speakGemini(
  key: string,
  text: string,
  language: Language,
  events: { onStart?: () => void; onWord?: () => void; onEnd?: () => void } = {},
): Promise<void> {
  const cacheKey = `${language}:${text}`;
  let url = geminiCache.get(cacheKey);
  if (!url) {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-gemini-key': key },
      body: JSON.stringify({ text, language }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? 'Gemini voice failed.');
    }
    url = URL.createObjectURL(await res.blob());
    geminiCache.set(cacheKey, url);
  }
  playClip(url, events);
}
