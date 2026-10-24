import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { geminiSpeech } from '../server/tts';
import { createApp } from '../server/app';

const pcm = Buffer.alloc(4800, 1);
let mode: 'wav' | 'pcm' | 'empty' = 'wav';
let rejectVoice = '';
const seen: { voice?: string; key?: string }[] = [];

const wav = () => {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.write('WAVE', 8);
  return Buffer.concat([header, pcm]);
};

let gemini: Server;
let app: Server;
let appUrl = '';

beforeAll(async () => {
  const mock = express();
  mock.use(express.json());
  mock.use((req, res, next) => {
    if (req.header('x-goog-api-key') !== 'good-key') {
      res.status(400).json({ error: { message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT' } });
      return;
    }
    next();
  });
  mock.get('/models', (_req, res) => res.json({ models: [] }));
  mock.get('/voices', (_req, res) => res.json({ voices: [{ id: 'indian-male-1' }] }));
  mock.post('/interactions', (req, res) => {
    const voice = req.body?.generation_config?.speech_config?.[0]?.voice;
    seen.push({ voice });
    if (voice === rejectVoice) {
      res.status(400).json({ error: { message: 'Unknown voice', status: 'INVALID_ARGUMENT' } });
      return;
    }
    if (mode === 'empty') return res.json({ steps: [] });
    const data = (mode === 'wav' ? wav() : pcm).toString('base64');
    res.json({ steps: [{ type: 'model_output', content: [{ type: 'audio', data, mime_type: mode === 'wav' ? 'audio/wav' : 'audio/l16;rate=24000' }] }] });
  });
  gemini = mock.listen(0);
  process.env.GEMINI_API_BASE = `http://127.0.0.1:${(gemini.address() as AddressInfo).port}`;

  const server = (await createApp({ dev: false })).listen(0);
  app = server;
  appUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  gemini.close();
  app.close();
  delete process.env.GEMINI_API_BASE;
});

beforeEach(() => {
  mode = 'wav';
  rejectVoice = '';
  seen.length = 0;
});

describe('Gemini voice', () => {
  it('returns playable WAV audio from the documented response shape', async () => {
    const audio = await geminiSpeech({ key: 'good-key', text: 'Welcome to Mystic Palm', language: 'hinglish' });
    expect(audio.subarray(0, 4).toString()).toBe('RIFF');
    expect(seen[0].voice).toBe('indian-male-1');
  });

  it('wraps raw PCM in a WAV header', async () => {
    mode = 'pcm';
    const audio = await geminiSpeech({ key: 'good-key', text: 'Namaste', language: 'hi' });
    expect(audio.subarray(0, 4).toString()).toBe('RIFF');
    expect(audio.length).toBe(pcm.length + 44);
  });

  it('retries with a standard voice when the chosen one is rejected', async () => {
    rejectVoice = 'indian-male-1';
    const audio = await geminiSpeech({ key: 'good-key', text: 'Hello beta', language: 'en' });
    expect(audio.subarray(0, 4).toString()).toBe('RIFF');
    expect(seen.map((s) => s.voice)).toEqual(['indian-male-1', 'Puck']);
  });

  it('explains a bad key instead of failing silently', async () => {
    await expect(geminiSpeech({ key: 'bad-key', text: 'Hi', language: 'en' })).rejects.toThrow(/rejected this API key/);
  });

  it('reports when Gemini sends no audio', async () => {
    mode = 'empty';
    await expect(geminiSpeech({ key: 'good-key', text: 'Hi there', language: 'hinglish' })).rejects.toThrow(/no audio/);
  });

  it('serves audio through /api/tts and checks keys through /api/tts/check', async () => {
    const ok = await fetch(`${appUrl}/api/tts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-gemini-key': 'good-key' },
      body: JSON.stringify({ text: 'Arre wah! Welcome to Mystic Palm!', language: 'hinglish' }),
    });
    expect(ok.status).toBe(200);
    expect(ok.headers.get('content-type')).toContain('audio/wav');

    const check = await fetch(`${appUrl}/api/tts/check`, { method: 'POST', headers: { 'x-gemini-key': 'bad-key' } });
    expect(check.status).toBe(401);
    expect((await check.json()).error).toMatch(/rejected/);

    const missing = await fetch(`${appUrl}/api/tts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    expect(missing.status).toBe(400);
  });
});
