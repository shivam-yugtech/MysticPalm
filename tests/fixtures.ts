import type { Language } from '../src/lib/report';

export const sectionKeys = ['personality', 'career', 'love', 'family', 'health'] as const;

/** A complete reading in the shape the model is asked to return. */
export const validRaw = () => ({
  handType: 'Air',
  handTypeNote: 'A square palm with long fingers.',
  clarityScore: 80,
  essence: ['A thinking hand.', 'Loyal in a quiet way.', 'Builds slowly once decided.'],
  traits: { creativity: 80, logic: 70, emotion: 60, ambition: 50, intuition: 40, stability: 30 },
  findings: [
    { id: 'life', group: 'major', label: 'Life Line', visible: true, confidence: 82, meaning: 'A wide, unbroken sweep.' },
    { id: 'head', group: 'major', label: 'Head Line', visible: true, confidence: 88, meaning: 'Long and straight.' },
    { id: 'mount_venus', group: 'mount', label: 'Mount of Venus', visible: true, confidence: 70, prominence: 65, meaning: 'Warm and full.' },
    {
      id: 'mark_star',
      group: 'mark',
      label: 'Star on Jupiter',
      visible: true,
      confidence: 52,
      meaning: 'A small star below the index finger.',
    },
  ],
  handDetails: { fingers: 'Long and tapered.', thumb: 'Firm.', nails: 'Oval.' },
  sections: Object.fromEntries(
    sectionKeys.map((key) => [key, { insights: [{ text: `${key} reading text.`, confidence: 74 }] }]),
  ),
  strengths: ['Clarity', 'Durability', 'Range'],
  challenges: [
    { problem: 'Start before ready', solution: 'Take one small decision today.' },
    { problem: 'Ask for help', solution: 'Ask one person clearly this week.' },
    { problem: 'Plan rest', solution: 'Book one rest block before the week starts.' },
  ],
  lifePhases: [
    { period: 'Teens to 20s', note: 'Experiments with shapes.' },
    { period: '30s', note: 'A chosen direction.' },
    { period: '40s onward', note: 'Two strands combine.' },
  ],
  outlook: { headline: 'Depth over novelty.', points: ['Finish one thing.', 'Ask clearly.'] },
  lucky: { color: 'Indigo', number: '7', day: 'Wednesday', gemstone: 'Emerald' },
  remedies: ['Breathe before messages.', 'Keep a decision notebook.'],
});

export const meta = (bothHands = false, language: Language = 'en') => ({
  language,
  mode: 'live' as const,
  bothHands,
});
