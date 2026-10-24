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

type VoiceEvents = { onStart?: () => void; onWord?: () => void; onEnd?: () => void };

let clipStop: (() => void) | null = null;
let sharedContext: AudioContext | null = null;

const audioContext = (): AudioContext | null => {
  if (!sharedContext) {
    try {
      sharedContext = new AudioContext();
    } catch {
      sharedContext = null;
    }
  }
  return sharedContext;
};

export const audioState = () => sharedContext?.state ?? "none";

export const unlockAudio = () => {
  const context = audioContext();
  if (context && context.state !== 'running') void context.resume().catch(() => undefined);
};

if (typeof window !== 'undefined') {
  for (const type of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(type, unlockAudio, { passive: true });
}

export async function playClip(src: string, events: VoiceEvents = {}): Promise<void> {
  stopSpeaking();
  const audio = new Audio(src);
  audio.preload = 'auto';
  let frame = 0;
  let pulse = 0;
  let loud = false;
  let done = false;
  let nodes: AudioNode[] = [];

  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame);
    window.clearInterval(pulse);
    nodes.forEach((node) => node.disconnect());
    nodes = [];
    if (clipStop === stop) clipStop = null;
    events.onEnd?.();
  };
  const stop = () => {
    audio.pause();
    finish();
  };
  clipStop = stop;

  const context = audioContext();
  if (context && context.state !== 'running') await context.resume().catch(() => undefined);

  if (context?.state === 'running') {
    try {
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      const source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);
      nodes = [source, analyser];
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
      audio.addEventListener('playing', () => (frame = requestAnimationFrame(tick)), { once: true });
    } catch {
      nodes = [];
    }
  }
  if (!nodes.length) {
    audio.addEventListener('playing', () => (pulse = window.setInterval(() => events.onWord?.(), 240)), { once: true });
  }

  audio.addEventListener('ended', finish, { once: true });
  audio.addEventListener('error', finish, { once: true });
  try {
    await audio.play();
  } catch (error) {
    finish();
    throw error;
  }
  if (!done) events.onStart?.();
}

const geminiCache = new Map<string, string>();

export async function speakGemini(key: string, text: string, language: Language, events: VoiceEvents = {}): Promise<void> {
  const cacheKey = `${language}:${text}`;
  let url = geminiCache.get(cacheKey);
  if (!url) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 45_000);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-gemini-key': key },
        body: JSON.stringify({ text, language }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Gemini voice failed.');
      }
      const blob = await res.blob();
      if (!blob.size || !blob.type.startsWith('audio/')) throw new Error('Gemini sent no audio back.');
      url = URL.createObjectURL(blob);
      geminiCache.set(cacheKey, url);
    } catch (error) {
      throw error instanceof DOMException && error.name === 'AbortError' ? new Error('Gemini voice took too long.') : error;
    } finally {
      window.clearTimeout(timer);
    }
  }
  await playClip(url, events);
}
