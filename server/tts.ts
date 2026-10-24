import { AnalysisError } from './analyze';
import type { Language } from '../src/lib/report';

const BASE = () => process.env.GEMINI_API_BASE?.trim() || 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = () => process.env.GEMINI_TTS_MODEL?.trim() || 'gemini-3.8-flash-tts';
const FALLBACK_VOICE = 'Puck';
const STYLE =
  'A warm, witty Indian pandit in his late twenties: confident, playful and a little sassy, speaking naturally like a real person chatting with a student, with lively expression and relaxed pacing.';

const voiceCache = new Map<string, string>();

const headers = (key: string) => ({ 'content-type': 'application/json', 'x-goog-api-key': key });

async function call(url: string, key: string, init: RequestInit = {}, ms = 30_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, headers: headers(key), signal: controller.signal });
  } catch {
    throw new AnalysisError('Could not reach Gemini. Check your connection.', 502);
  } finally {
    clearTimeout(timer);
  }
}

async function failure(res: Response): Promise<AnalysisError> {
  const body = (await res.json().catch(() => null)) as { error?: { message?: string; status?: string } } | null;
  const message = body?.error?.message ?? '';
  const code = body?.error?.status ?? '';
  console.warn('[tts] Gemini', res.status, code, message.slice(0, 200));
  if (res.status === 401 || res.status === 403 || /api key|API_KEY/i.test(`${message} ${code}`)) {
    return new AnalysisError('Gemini rejected this API key. Check it and try again.', 401);
  }
  if (res.status === 429) return new AnalysisError('Gemini voice limit reached for now. Try again in a minute.', 429);
  return new AnalysisError(`Gemini voice error: ${message || `HTTP ${res.status}`}`.slice(0, 220), 502);
}

export async function checkKey(key: string): Promise<void> {
  const res = await call(`${BASE()}/models?pageSize=1`, key, { method: 'GET' }, 10_000);
  if (!res.ok) throw await failure(res);
}

async function pickVoice(key: string, language: Language): Promise<string> {
  const lang = language === 'hi' ? 'hi-IN' : 'en-IN';
  const cacheKey = `${key.slice(-6)}:${lang}`;
  const cached = voiceCache.get(cacheKey);
  if (cached) return cached;
  let voice = FALLBACK_VOICE;
  try {
    const res = await call(`${BASE()}/voices?language_code=${lang}&gender=male&page_size=10`, key, { method: 'GET' }, 8_000);
    if (res.ok) {
      const body = (await res.json()) as { voices?: { id?: string; name?: string }[] };
      const found = body.voices?.find((v) => v.id || v.name);
      if (found) voice = (found.id ?? found.name)!.replace(/^voices\//, '');
    }
  } catch {
    voice = FALLBACK_VOICE;
  }
  voiceCache.set(cacheKey, voice);
  return voice;
}

const toWav = (pcm: Buffer, rate = 24_000): Buffer => {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

type Block = { type?: string; data?: string; mime_type?: string; mimeType?: string };

function extractAudio(body: unknown): { data: string; mime: string } | null {
  const b = body as {
    steps?: { type?: string; content?: Block[] }[];
    outputs?: Block[];
    candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
  };
  const blocks = [
    ...(b.steps ?? []).filter((s) => s.type === 'model_output').flatMap((s) => s.content ?? []),
    ...(b.outputs ?? []),
  ].filter((c) => c.type === 'audio' && c.data);
  const last = blocks[blocks.length - 1];
  if (last?.data) return { data: last.data, mime: last.mime_type ?? last.mimeType ?? 'audio/wav' };
  const part = b.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  return part?.data ? { data: part.data, mime: part.mimeType ?? 'audio/l16' } : null;
}

async function synthesize(key: string, text: string, voice: string): Promise<Response> {
  return call(`${BASE()}/interactions`, key, {
    method: 'POST',
    body: JSON.stringify({
      model: MODEL(),
      input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style: STYLE }] }] }],
      response_format: { type: 'audio' },
      generation_config: { speech_config: [{ voice }] },
    }),
  });
}

export async function geminiSpeech(input: { key: string; text: string; language: Language }): Promise<Buffer> {
  const voice = await pickVoice(input.key, input.language);
  let res = await synthesize(input.key, input.text, voice);
  if (!res.ok && voice !== FALLBACK_VOICE && ![401, 403, 429].includes(res.status)) {
    console.warn('[tts] voice', voice, 'failed with', res.status, '- retrying with', FALLBACK_VOICE);
    voiceCache.set(`${input.key.slice(-6)}:${input.language === 'hi' ? 'hi-IN' : 'en-IN'}`, FALLBACK_VOICE);
    res = await synthesize(input.key, input.text, FALLBACK_VOICE);
  }
  if (!res.ok) throw await failure(res);
  const json = await res.json().catch(() => null);
  const audio = extractAudio(json);
  if (!audio) {
    console.warn('[tts] no audio in response, keys:', Object.keys((json ?? {}) as object).join(','));
    throw new AnalysisError('Gemini sent no audio back.', 502);
  }
  const bytes = Buffer.from(audio.data, 'base64');
  if (/wav/i.test(audio.mime) || bytes.subarray(0, 4).toString() === 'RIFF') return bytes;
  const rate = Number(/rate=(\d+)/.exec(audio.mime)?.[1]) || 24_000;
  return toWav(bytes, rate);
}
