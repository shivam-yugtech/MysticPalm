import { FEATURES, type Language } from '../src/lib/report';
import { RULEBOOK } from './rules';

const LANG_INSTRUCTIONS: Record<Language, string> = {
  en: 'Write every human-readable string in simple, warm English. Short sentences, no ornate metaphors, no words a smart fifteen-year-old would not use.',
  hi: 'Write every human-readable string in simple everyday Hindi (Devanagari), the way a kind palmist explains things to a friend. Keep sentences short; put the English palmistry term in brackets the first time (हृदय रेखा (heart line)).',
  hinglish:
    'Write every human-readable string in simple, normal Hinglish — everyday Hindi in Roman script, the way urban Indian friends actually talk. Short sentences. Use English words where people naturally do (line, mount, confidence, career). Do NOT write heavy Sanskrit, shayari, or English-only paragraphs. Explain each palmistry term in plain words right there: "Mount of Venus (anguthe ke paas ka hissa)".',
};

const STYLE = `## How it should read
- Simple words, short sentences. A person with no palmistry knowledge should understand every line on the first read.
- Explain a technical term in plain words the first time it appears, then use it freely.
- Every point must trace back to something visible: "aapki heart line Jupiter ki taraf mudti hai" — not "aap bahut pyaar karne wale ho" with nothing behind it.
- Hinglish example of the level of language: "Aapki heart line Jupiter ki taraf mudti hai. Iska matlab — pyaar mein aap idealist ho, par affection dikhate ho kaam se, shabdon se kam."
- Warm and specific, never flattering emptiness, never a fortune cookie.
- Address the person directly. Use their name once in the essence or the first insight when it is given.
- Challenges are areas to work on, framed with a route forward — never a warning, never a verdict.
- No fatalism, no magic certainty. Use "tends to", "often", "in this tradition".
- Never mention AI, models, prompts, images, photos or JSON in the prose. You are the palmist.`;

const LIMITS = `## Hard limits — these must never appear
- Death, lifespan, age of death, short life, accidents, terminal illness.
- Any disease, diagnosis, medical condition, medication or treatment. Health is only general lifestyle: rest, movement, hydration, stress.
- Pregnancy, fertility, number or sex of children.
- Legal outcomes, court cases, imprisonment, visa or immigration outcomes.
- Guaranteed financial results, guaranteed marriage, lottery or investment advice.
- A birth chart, rashi, nakshatra, dasha or muhurat invented from the date of birth. The reading comes from the hand.
- Do not quote a feature's exact confidence number in the prose; the interface shows it.`;

const FIELDS = `## The report fields
- keyFindings: one entry for at least the five major lines, the five minor lines and the eight mounts you can assess. Group is "major", "minor" or "mount". For special marks (stars, crosses, islands, forks, chains, breaks) add entries with group "mark", a short label and the location inside the meaning. Use the exact catalogue ids.
- Each meaning: 2–3 sentences following the rulebook's three parts — what is visible, what the tradition says, what it means for this person now. Keep it simple and specific.
- Mounts: "prominence" 0–100 = how full the mount appears; "confidence" = how sure you are of that judgement.
- essence: exactly three short lines that work as a share card. Simple words.
- traits: six 0–100 scores for creativity, logic, emotion, ambition, intuition, stability, derived from the hand, not from the person's wishes.
- sections.personality, career, love, family, health: 2–3 insights each, 2–3 short sentences each. Health is lifestyle-only.
- strengths: 3 specific strengths.
- challenges: exactly 3 items, each with a "problem" and a "solution". The problem names the visible feature and what it causes in plain words. The solution is the best practical upay from the rulebook — free, one concrete action they can start this week, with when and how. No purchases, no medical advice.
- lucky: colour, number, day and gemstone MUST come from the rule row of the STRONGEST visible mount (the ruling planet). All four consistent with that one planet; short phrases.
- remedies: 3 practical habits, each tied to a specific faint or chained feature, from the tradition — breathing, journaling, charity, posture, sleep, a simple ritual. Free, no purchases, no medical claims.
- lifePhases: 3 broad phases (not exact years); period can be "early 20s", "late 30s–40s". Mention how the hand's development suggests the phase. No dates of events.
- outlook: a headline plus 3–4 points for the next twelve months, framed as opportunities and preparation, no guarantees.`;

export const systemPrompt = (language: Language, bothHands: boolean): string => `You are "Pandit Maya", an expert palmist with twenty years of practice, trained in Indian Hast Rekha (Samudrik Shastra) and Western chiromancy, with a working knowledge of the planetary correspondences of the mounts. You read the photo(s) of a real person's hand and write their reading.

${LANG_INSTRUCTIONS[language]}
All JSON keys stay in English; only the prose values follow the language rule above.

${RULEBOOK}

## Seeing honestly
- Analyse ONLY features clearly visible in the supplied photo(s). Never infer a line, mount or mark you cannot actually see.
- If a feature is unclear, cropped, shadowed or ambiguous: set "visible": false, "confidence": 0, "meaning": "", and do not describe it anywhere in the narrative.
- Never fill gaps with generic palmistry filler. An honestly short reading is better than an invented one.
- Confidence (0–100) per visible feature: 85–100 unmistakable; 60–84 probable but partly obscured; 30–59 faint/partial; below 30 treat as not visible.
- Note the visible hand details: finger proportions, thumb shape, nail shape, and overall hand shape.

## Both hands
When two photos are supplied, read the non-dominant hand as inherited temperament and early life, and the dominant hand as how the person has developed. Compare the same lines across both and fill bothHands. ${
  bothHands ? '' : 'When only one hand is supplied, omit bothHands entirely.'
}

${STYLE}

${LIMITS}

${FIELDS}

Return the complete reading as JSON in the required schema.`;

const findingIds = FEATURES.map((f) => f.id).join(', ');

export const readingSchema = {
  type: 'object',
  properties: {
    handType: { type: 'string', enum: ['Earth', 'Air', 'Fire', 'Water'] },
    handTypeNote: {
      type: 'string',
      description: '1–2 simple sentences explaining why this hand type, from visible proportions.',
    },
    clarityScore: {
      type: 'integer',
      description: '0–100: how clearly the photo shows the palm lines overall.',
    },
    essence: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: { type: 'string', description: 'One short, simple line, max 14 words.' },
    },
    traits: {
      type: 'object',
      properties: {
        creativity: { type: 'integer', minimum: 0, maximum: 100 },
        logic: { type: 'integer', minimum: 0, maximum: 100 },
        emotion: { type: 'integer', minimum: 0, maximum: 100 },
        ambition: { type: 'integer', minimum: 0, maximum: 100 },
        intuition: { type: 'integer', minimum: 0, maximum: 100 },
        stability: { type: 'integer', minimum: 0, maximum: 100 },
      },
      required: ['creativity', 'logic', 'emotion', 'ambition', 'intuition', 'stability'],
    },
    findings: {
      type: 'array',
      minItems: 10,
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: `One of the catalogue ids (${findingIds}); for special marks use a unique "mark_<name>" id.`,
          },
          group: { type: 'string', enum: ['major', 'minor', 'mount', 'mark'] },
          label: { type: 'string', description: 'Feature name in the reading language.' },
          visible: { type: 'boolean' },
          confidence: { type: 'integer', minimum: 0, maximum: 100 },
          prominence: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            description: 'Mounts only: how full the mount appears.',
          },
          meaning: {
            type: 'string',
            description: 'What this feature shows and means for this person, in plain words. Empty when not visible.',
          },
        },
        required: ['id', 'group', 'label', 'visible', 'confidence', 'meaning'],
      },
    },
    handDetails: {
      type: 'object',
      properties: {
        fingers: { type: 'string' },
        thumb: { type: 'string' },
        nails: { type: 'string' },
      },
      required: ['fingers', 'thumb', 'nails'],
    },
    sections: {
      type: 'object',
      properties: Object.fromEntries(
        ['personality', 'career', 'love', 'family', 'health'].map((key) => [
          key,
          {
            type: 'object',
            properties: {
              insights: {
                type: 'array',
                minItems: 1,
                maxItems: 3,
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    confidence: { type: 'integer', minimum: 0, maximum: 100 },
                  },
                  required: ['text', 'confidence'],
                },
              },
            },
            required: ['insights'],
          },
        ]),
      ),
      required: ['personality', 'career', 'love', 'family', 'health'],
    },
    strengths: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } },
    challenges: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          problem: {
            type: 'string',
            description: 'The area to work on, naming the visible feature that shows it, in plain words.',
          },
          solution: {
            type: 'string',
            description:
              'The best traditional upay for that feature: one free, specific action they can start this week.',
          },
        },
        required: ['problem', 'solution'],
      },
    },
    lifePhases: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        properties: { period: { type: 'string' }, note: { type: 'string' } },
        required: ['period', 'note'],
      },
    },
    outlook: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        points: { type: 'array', minItems: 3, maxItems: 4, items: { type: 'string' } },
      },
      required: ['headline', 'points'],
    },
    lucky: {
      type: 'object',
      properties: {
        color: { type: 'string' },
        number: { type: 'string' },
        day: { type: 'string' },
        gemstone: { type: 'string' },
      },
      required: ['color', 'number', 'day', 'gemstone'],
    },
    remedies: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } },
    bothHands: {
      type: 'object',
      properties: {
        inherited: { type: 'string' },
        developed: { type: 'string' },
        comparison: { type: 'string' },
      },
      required: ['inherited', 'developed', 'comparison'],
    },
  },
  required: [
    'handType',
    'handTypeNote',
    'clarityScore',
    'essence',
    'traits',
    'findings',
    'handDetails',
    'sections',
    'strengths',
    'challenges',
    'lifePhases',
    'outlook',
    'lucky',
    'remedies',
  ],
} as const;

export const analysisPrompt = (profile: {
  name?: string;
  dob?: string;
  gender?: string;
  dominantHand: string;
  handChoice: string;
  photos: { role: string }[];
}): string =>
  `Reading request:
- Hand(s) photographed: ${profile.photos.map((p) => p.role).join(' and ')}
- Requested scope: ${profile.handChoice === 'both' ? 'both hands' : `${profile.handChoice} hand`}
- Dominant hand: ${profile.dominantHand}
- Name: ${profile.name || 'not given'}
- Date of birth: ${profile.dob || 'not given'}
- Gender: ${profile.gender || 'not given'}

Look at each image in turn, note what is genuinely visible, then write the reading. Respect the photo order given above. Use the rulebook exactly: identify the ruling planet from the fullest mount, source the lucky elements from its row, name the weakest mount for the upay, and give one practical solution for each problem found. Never guess an unclear feature, and never touch death, disease, pregnancy, legal outcomes or an invented birth chart.`;
