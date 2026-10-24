import { FEATURES, SECTION_KEYS, type Language } from '../src/lib/report';
import { RULEBOOK } from './rules';

const LANG_INSTRUCTIONS: Record<Language, string> = {
  en: 'Write every human-readable string in simple, warm English. Short sentences, no ornate metaphors, no words a smart fifteen-year-old would not use.',
  hi: 'Write every human-readable string in simple everyday Hindi (Devanagari), the way a friendly senior explains things to a younger student. Keep sentences short; put the English palmistry term in brackets the first time (हृदय रेखा (heart line)).',
  hinglish:
    'Write every human-readable string in simple, normal Hinglish — everyday Hindi in Roman script, the way Indian students actually talk. Short sentences. Use English words where people naturally do (line, mount, exam, focus, career, vibe). Do NOT write heavy Sanskrit, shayari, or English-only paragraphs. Explain each palmistry term in plain words right there: "Mount of Venus (anguthe ke paas ka hissa)".',
};

const STYLE = `## How it should read
- The reader is a student (school or college). Talk like a cool, kind senior who happens to read palms: fun, encouraging, a little playful, never preachy.
- Make it practical for student life: studying, exams, focus, choosing a stream or career, friendships, confidence, screen time, sleep.
- Simple words, short sentences. A person with no palmistry knowledge should understand every line on the first read.
- Explain a technical term in plain words the first time it appears, then use it freely.
- Every point must trace back to something visible: "aapki head line Moon ki taraf mudti hai" — not "aap bahut creative ho" with nothing behind it.
- Hinglish example of the level of language: "Aapki head line Moon ki taraf mudti hai. Matlab — imagination strong hai, isliye mind maps aur diagrams se padhai jaldi yaad hogi."
- Warm and specific, never flattering emptiness, never a fortune cookie.
- Address the person directly. Use their name once in the essence or the first insight when it is given.
- Challenges are "level-up" areas, framed with a route forward — never a warning, never a verdict.
- No fatalism, no magic certainty. Use "tends to", "often", "in this tradition".
- Never mention AI, models, prompts, images, photos or JSON in the prose. You are the palm reader.`;

const LIMITS = `## Hard limits — these must never appear
- Death, lifespan, age of death, short life, accidents, terminal illness.
- Any disease, diagnosis, medical condition, medication or treatment. Wellbeing is only general lifestyle: sleep, movement, water, stress, screen time.
- Pregnancy, fertility, number or sex of children.
- Legal outcomes, court cases, imprisonment, visa or immigration outcomes.
- Guaranteed exam results, marks, ranks or admissions; guaranteed jobs or money; lottery or investment advice.
- Marriage predictions — who, when or whether. Relationship lines are read only as how the person bonds with people.
- A birth chart, rashi, nakshatra, dasha or muhurat. The reading comes from the hand.
- Do not quote a feature's exact confidence number in the prose; the interface shows it.`;

const FIELDS = `## The report fields
- persona: a fun archetype for this hand, like a character class. title is 2–4 words ("The Curious Creator", "The Calm Strategist"); tagline is one playful line, max 14 words. Both follow from the hand type and ruling mount.
- superpower: one short sentence naming the single strongest gift the hand shows, tied to a visible feature.
- study: style = how this hand learns best (visual, talking it out, hands-on, writing, sprints or long sessions), 1–2 sentences tied to the head line and fingers. bestTime = when focus tends to peak ("Early morning", "Late evening"), a short phrase. tips = exactly 3 concrete study hacks that suit this hand (25-minute sprints, teach-a-friend, mind maps). Free, simple, startable today.
- careers: 3–4 career or field matches, each with a short title and a one-line "why" pointing to the feature that suggests it. Directions, never promises.
- findings: one entry for at least the five major lines, the five minor lines and the eight mounts you can assess. Group is "major", "minor" or "mount". For special marks (stars, crosses, islands, forks, chains, breaks) add entries with group "mark", a short label and the location inside the meaning. Use the exact catalogue ids. The "marriage" id is the relationship lines: read them as how the person bonds with friends and people, never as a marriage prediction.
- Each meaning: 2–3 sentences following the rulebook's three parts — what is visible, what the tradition says, what it means for this person now. Keep it simple and specific.
- Mounts: "prominence" 0–100 = how full the mount appears; "confidence" = how sure you are of that judgement.
- essence: exactly three short, punchy lines that work as an Instagram story card.
- traits: six 0–100 scores — creativity, logic, emotion (empathy), ambition (drive), intuition, stability (focus) — derived from the hand, not from the person's wishes.
- sections: personality (their vibe), studies (how they learn, focus, exam habits), career (direction and fields), friendships (friends, social energy, how they connect — not marriage), wellbeing (sleep, stress, energy, screen balance — lifestyle only). 2–3 insights each, 2–3 short sentences each.
- strengths: 3 specific strengths.
- challenges: exactly 3 items, each with a "problem" and a "solution". The problem names the visible feature and what it causes in plain words (procrastination, overthinking, distraction, shyness). The solution is the best practical upay from the rulebook — free, one concrete action they can start this week, with when and how. No purchases, no medical advice.
- lucky: colour, number, day and gemstone MUST come from the rule row of the STRONGEST visible mount (the ruling planet). All four consistent with that one planet; short phrases.
- remedies: 3 daily power habits, each tied to a specific faint or chained feature — breathing, journaling, a phone-free hour, posture, sleep, helping a friend. Free, no purchases, no medical claims.
- lifePhases: 3 broad phases from now onward ("School years", "College years", "First job years"); mention how the hand's development suggests the phase. No dates of events.
- outlook: a headline plus 3–4 points for the next twelve months — this school or college year — framed as opportunities and preparation, no guarantees.`;

export const systemPrompt = (language: Language, bothHands: boolean): string => `You are "Maya", a friendly palm reader for students — an expert palmist with twenty years of practice, trained in Indian Hast Rekha (Samudrik Shastra) and Western chiromancy, with a working knowledge of the planetary correspondences of the mounts. You read the photo(s) of a real student's hand and write their reading.

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
    persona: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '2–4 word archetype, e.g. The Curious Creator.' },
        tagline: { type: 'string', description: 'One playful line, max 14 words.' },
      },
      required: ['title', 'tagline'],
    },
    superpower: { type: 'string', description: 'One short sentence: the strongest gift the hand shows.' },
    study: {
      type: 'object',
      properties: {
        style: { type: 'string' },
        bestTime: { type: 'string' },
        tips: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } },
      },
      required: ['style', 'bestTime', 'tips'],
    },
    careers: {
      type: 'array',
      minItems: 3,
      maxItems: 4,
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, why: { type: 'string' } },
        required: ['title', 'why'],
      },
    },
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
        SECTION_KEYS.map((key) => [
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
      required: [...SECTION_KEYS],
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
            description: 'The area to level up, naming the visible feature that shows it, in plain words.',
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
    'persona',
    'superpower',
    'study',
    'careers',
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

const STAGE_LABEL: Record<string, string> = {
  school: 'school student',
  college: 'college student',
  other: 'learner / recent graduate',
};

export const analysisPrompt = (profile: {
  name?: string;
  stage?: string;
  stream?: string;
  dominantHand: string;
  handChoice: string;
  photos: { role: string }[];
}): string =>
  `Reading request:
- Hand(s) photographed: ${profile.photos.map((p) => p.role).join(' and ')}
- Requested scope: ${profile.handChoice === 'both' ? 'both hands' : `${profile.handChoice} hand`}
- Dominant hand: ${profile.dominantHand}
- Name: ${profile.name || 'not given'}
- Student stage: ${(profile.stage && STAGE_LABEL[profile.stage]) || 'student'}
- Studying / interested in: ${profile.stream || 'not given'}

Look at each image in turn, note what is genuinely visible, then write the reading. Respect the photo order given above. Use the rulebook exactly: identify the ruling planet from the fullest mount, source the lucky elements from its row, name the weakest mount for the upay, and give one practical solution for each problem found. Fit the careers and study tips to the stage and interests given, without ignoring what the hand shows. Never guess an unclear feature, and never touch death, disease, pregnancy, legal outcomes, marriage predictions, guaranteed marks or an invented birth chart.`;
