import {
  bannedClaimsIn,
  normalizeReport,
  ReadingError,
  redactUnsafe,
  type Profile,
  type Report,
} from '../src/lib/report';
import { analysisPrompt, readingSchema, systemPrompt } from './prompt';
import { demoReading } from './demo';

const API_URL = 'https://api.anthropic.com/v1/messages';
const model = () => process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-5-5';
const MAX_TOKENS = 16000;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export class AnalysisError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export interface PhotoInput {
  role: 'left' | 'right';
  dataUrl: string;
}

interface ImagePayload {
  role: 'left' | 'right';
  mediaType: string;
  data: string;
}

const decodePhoto = (photo: PhotoInput): ImagePayload => {
  const match = /^data:([^;]+);base64,(.+)$/.exec(photo.dataUrl);
  if (!match) throw new AnalysisError('That photo could not be read. Please choose it again.', 400);
  if (!IMAGE_TYPES.includes(match[1])) {
    throw new AnalysisError('Photos must be JPEG, PNG or WebP.', 400);
  }
  if (match[2].length > 8_000_000) {
    throw new AnalysisError('That photo is too large. Please try a smaller one.', 413);
  }
  return { role: photo.role, mediaType: match[1], data: match[2] };
};


type JsonSchema = Record<string, unknown>;

function toApiSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toApiSchema);
  if (!node || typeof node !== 'object') return node;
  const unsupported = ['minItems', 'maxItems', 'minimum', 'maximum', 'minLength', 'maxLength', 'pattern'];
  const out: JsonSchema = {};
  for (const [key, value] of Object.entries(node as JsonSchema)) {
    if (unsupported.includes(key)) continue;
    out[key] = key === 'properties'
      ? Object.fromEntries(
          Object.entries(value as JsonSchema).map(([name, schema]) => [name, toApiSchema(schema)]),
        )
      : toApiSchema(value);
  }
  if (out.type === 'object') out.additionalProperties = false;
  return out;
}

const schema = () => toApiSchema(readingSchema);

interface ModelMessage {
  role: 'user' | 'assistant';
  content: string | unknown[];
}

async function callModel(
  messages: ModelMessage[],
  system: string,
  apiKey: string,
): Promise<{ parsed: unknown; rawText: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);
  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model(),
        max_tokens: MAX_TOKENS,
        system,
        messages,
        output_config: { format: { type: 'json_schema', schema: schema() } },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new AnalysisError(
      aborted ? 'The reading took too long. Please try again.' : 'The reading service could not be reached.',
    );
  } finally {
    clearTimeout(timeout);
  }

  const body = (await res.json().catch(() => null)) as
    | { content?: { type: string; text?: string }[]; stop_reason?: string; error?: { message?: string } }
    | null;

  if (!res.ok) {
    const detail = body?.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 401 || res.status === 403) {
      throw new AnalysisError('The reading service rejected its credentials.', 503);
    }
    if (res.status === 429) {
      throw new AnalysisError('The palmist is booked out for a moment. Try again in a minute.', 429);
    }
    throw new AnalysisError(`The reading service returned an error: ${detail}`, 502);
  }

  if (body?.stop_reason === 'refusal') {
    throw new AnalysisError('This photo could not be read as a palm. Try a clearer photo of your open hand.', 422);
  }

  const textContent = (body?.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('');
  const json = textContent.slice(textContent.indexOf('{'), textContent.lastIndexOf('}') + 1);
  try {
    return { parsed: JSON.parse(json), rawText: textContent };
  } catch {
    throw new AnalysisError('The reading came back incomplete. Please try once more.');
  }
}

const buildContent = (photos: ImagePayload[], profile: Profile): unknown[] => [
  ...photos.flatMap((photo, i) => [
    { type: 'text', text: `Photo ${i + 1} — the ${photo.role.toUpperCase()} hand.` },
    { type: 'image', source: { type: 'base64', media_type: photo.mediaType, data: photo.data } },
  ]),
  { type: 'text', text: analysisPrompt({ ...profile, photos }) },
];

export async function createReading(input: {
  photos: PhotoInput[];
  profile: Profile;
}): Promise<{ report: Report; mode: 'live' | 'demo' }> {
  const { profile } = input;
  const photos = input.photos.map(decodePhoto);
  const bothHands = profile.handChoice === 'both';
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    return { report: demoReading(profile), mode: 'demo' };
  }

  const system = systemPrompt(profile.language, bothHands);
  const content = buildContent(photos, profile);
  const messages: ModelMessage[] = [{ role: 'user', content }];
  const meta = { language: profile.language, mode: 'live' as const, bothHands, model: model() };

  for (let attempt = 0; attempt < 2; attempt++) {
    const { parsed: raw, rawText } = await callModel(messages, system, apiKey);
    let candidate: Report | null = null;
    let correction: string;

    try {
      candidate = normalizeReport(raw, meta);
      correction = '';
    } catch (error) {
      if (!(error instanceof ReadingError)) throw error;
      correction = `Your previous response was rejected: ${error.issues.join('; ')}. Return a complete reading that satisfies every required field.`;
    }

    if (candidate) {
      const unsafe = bannedClaimsIn(candidate);
      if (!unsafe.length) return { report: candidate, mode: 'live' };
      if (attempt === 1) return { report: redactUnsafe(candidate), mode: 'live' };
      correction = `Your previous reading broke a safety rule (${unsafe
        .map((u) => u.rules.join('+'))
        .join(', ')}) in these fields: ${unsafe
        .map((u) => u.path)
        .join(', ')}. Rewrite the whole reading without any reference to death, lifespan, disease, diagnosis, pregnancy, children, marriage predictions, guarantees or legal outcomes. Keep wellbeing as general lifestyle tendencies.`;
    }

    messages.push({ role: 'assistant', content: rawText });
    messages.push({ role: 'user', content: `${correction}\n\nReturn the corrected complete reading only.` });
  }

  throw new AnalysisError('The reading could not be completed. Please try again.');
}
