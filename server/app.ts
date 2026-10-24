import express, { type NextFunction, type Request, type Response } from 'express';
import { resolve } from 'node:path';
import { AnalysisError, createReading } from './analyze';
import { palmistReply, type ChatTurn } from './chat';
import { demoReading } from './demo';
import type { HandChoice, Language, PhotoRole, Profile, Report } from '../src/lib/report';

type Handler = (req: Request, res: Response) => Promise<void>;
const asyncHandler = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

const text = (value: unknown, max = 80): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed || undefined;
};

const LANGUAGES: Language[] = ['en', 'hi', 'hinglish'];
const HANDS: HandChoice[] = ['left', 'right', 'both'];

function readProfile(value: unknown): Profile {
  const raw = (value ?? {}) as Record<string, unknown>;
  const handChoice = HANDS.includes(raw.handChoice as HandChoice) ? (raw.handChoice as HandChoice) : 'right';
  return {
    name: text(raw.name, 60),
    dob: text(raw.dob, 20),
    gender: text(raw.gender, 24),
    dominantHand: raw.dominantHand === 'left' ? 'left' : 'right',
    handChoice,
    language: LANGUAGES.includes(raw.language as Language) ? (raw.language as Language) : 'hinglish',
  };
}

function readPhotos(value: unknown, profile: Profile): { role: PhotoRole; dataUrl: string }[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 2) {
    throw new AnalysisError('Add a photo of your hand first.', 400);
  }
  const photos = value.map((item) => {
    const raw = (item ?? {}) as Record<string, unknown>;
    if (typeof raw.dataUrl !== 'string') throw new AnalysisError('That photo could not be read.', 400);
    return { role: (raw.role === 'left' ? 'left' : 'right') as PhotoRole, dataUrl: raw.dataUrl };
  });

  if (profile.handChoice === 'both') {
    const roles = new Set(photos.map((p) => p.role));
    if (photos.length !== 2 || roles.size !== 2) {
      throw new AnalysisError('For both hands, add one photo of each palm.', 400);
    }
  } else if (photos.length !== 1 || photos[0].role !== profile.handChoice) {
    throw new AnalysisError('Add one photo of the palm you chose.', 400);
  }
  return photos;
}

const isReport = (value: unknown): value is Report => {
  const r = value as Report;
  return (
    !!r &&
    typeof r === 'object' &&
    typeof r.handType === 'string' &&
    Array.isArray(r.essence) &&
    !!r.sections &&
    typeof r.sections === 'object' &&
    LANGUAGES.includes(r.language)
  );
};

function readHistory(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((turn): turn is ChatTurn => !!turn && (turn.role === 'user' || turn.role === 'assistant'))
    .map((turn) => ({ role: turn.role, text: String(turn.text ?? '').slice(0, 800) }))
    .slice(-8);
}

export async function createApp(options: { dev: boolean }): Promise<express.Express> {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, mode: process.env.ANTHROPIC_API_KEY ? 'live' : 'demo' });
  });

  // The sample never calls the model, so the landing page can show a reading for free.
  app.get('/api/sample', (_req, res) => {
    res.json({
      report: demoReading({ dominantHand: 'right', handChoice: 'right', language: 'hinglish' }),
    });
  });

  app.post(
    '/api/analyze',
    asyncHandler(async (req, res) => {
      const profile = readProfile(req.body?.profile);
      const photos = readPhotos(req.body?.photos, profile);
      const { report, mode } = await createReading({ photos, profile });
      res.json({ report, mode });
    }),
  );

  app.post(
    '/api/chat',
    asyncHandler(async (req, res) => {
      if (!isReport(req.body?.report)) throw new AnalysisError('Your reading is missing. Start a new reading.', 400);
      const question = text(req.body.question, 500);
      if (!question) throw new AnalysisError('Type a question first.', 400);
      const answer = await palmistReply({
        report: req.body.report as Report,
        history: readHistory(req.body.history),
        question,
      });
      res.json(answer);
    }),
  );

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'That endpoint does not exist.' });
  });

  if (options.dev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const dist = resolve(process.cwd(), 'dist');
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(resolve(dist, 'index.html')));
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AnalysisError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    console.error('[api]', err);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  });

  return app;
}
