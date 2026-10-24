import { findBannedClaims, SAFE_COPY, type Language, type Report } from '../src/lib/report';

const API_URL = 'https://api.anthropic.com/v1/messages';
const model = () => process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-5-5';
const MAX_QUESTION = 500;
const MAX_HISTORY = 8;

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

const LANG: Record<Language, string> = {
  en: 'English',
  hi: 'Hindi (Devanagari)',
  hinglish: 'Hinglish (Hindi in Roman script)',
};

const SOLUTION_LABEL: Record<Language, string> = {
  en: 'Try this',
  hi: 'उपाय',
  hinglish: 'Upay',
};

type TailKey = 'actFirst' | 'career' | 'love' | 'health' | 'lucky' | 'outlook' | 'hand' | 'askMore';

/** Demo answers are assembled from the report, so their connective lines follow its language too. */
const TAILS: Record<Language, Record<TailKey, string>> = {
  en: {
    actFirst: 'That is the one worth acting on first — the rest of the hand supports it.',
    career: 'What the hand does not do is promise a number. Ask it about direction, and it is specific.',
    love: 'The hand speaks to how you love, not to who will arrive or when.',
    health:
      'Palmistry reads lifestyle tendencies, never a diagnosis — for anything that worries you, a doctor is the right reader.',
    lucky: 'These are suggestions from the tradition, not promises — treat them as a small ritual, not a lever.',
    outlook: 'The reading gives seasons and preparation, not dates.',
    hand: 'The lines I could read clearly are the ones described in your report; anything faint or hidden I left alone rather than inventing it.',
    askMore:
      'Ask me about a specific area — career, love, the coming year, or the habits this hand suggests — and I will stay with what your hand actually shows.',
  },
  hi: {
    actFirst: 'सबसे पहले इसी पर काम करें — बाकी हाथ इसी दिशा को सहारा देता है।',
    career: 'हाथ किसी आंकड़े का वादा नहीं करता। दिशा पूछें तो यह साफ़ जवाब देता है।',
    love: 'हाथ बताता है कि आप कैसे प्यार करते हैं — कौन आएगा या कब, यह नहीं।',
    health:
      'हस्तरेखा जीवनशैली की प्रवृत्तियाँ पढ़ती है, निदान नहीं — किसी भी चिंता के लिए डॉक्टर सही पढ़ने वाला है।',
    lucky: 'ये परंपरा के सुझाव हैं, वादे नहीं — इन्हें छोटा अनुष्ठान मानें, कोई जादुई बटन नहीं।',
    outlook: 'रीडिंग मौसम और तैयारी बताती है, तारीख़ें नहीं।',
    hand: 'जो रेखाएँ साफ़ दिखीं, वही रिपोर्ट में हैं; जो धुँधली या छिपी थीं, उन्हें बनाया नहीं गया।',
    askMore:
      'करियर, प्रेम, आने वाला साल या आदतों में से कुछ पूछें — मैं वही बताऊँगी जो आपका हाथ दिखाता है।',
  },
  hinglish: {
    actFirst: 'Sabse pehle isi par kaam karo — baaki haath isi direction ko support karta hai.',
    career: 'Haath kisi number ka promise nahi karta. Direction poochho to saaf jawab deta hai.',
    love: 'Haath batata hai ki aap kaise pyaar karte ho — kaun aayega ya kab, yeh nahi.',
    health:
      'Hast rekha lifestyle tendencies padhti hai, diagnosis nahi — kisi bhi chinta ke liye doctor hi sahi reader hai.',
    lucky: 'Yeh tradition ke suggestions hain, promise nahi — inhe chhota ritual maano, koi lever nahi.',
    outlook: 'Reading seasons aur preparation deti hai, dates nahi.',
    hand: 'Jo lines saaf dikhi, wahi report mein hain; jo dhundhli ya chhupi thi, unhe invent nahi kiya.',
    askMore:
      'Career, pyaar, aane wala saal ya aadatein — kuch bhi poochho, main wahi bataungi jo aapka haath dikhata hai.',
  },
};

const LUCKY_LEAD: Record<Language, (r: Report) => string> = {
  en: (r) =>
    `Traditionally this hand is paired with ${r.lucky.color}, the number ${r.lucky.number}, ${r.lucky.day}, and ${r.lucky.gemstone}.`,
  hi: (r) =>
    `परंपरा में इस हाथ के साथ ${r.lucky.color}, अंक ${r.lucky.number}, ${r.lucky.day} और ${r.lucky.gemstone} जोड़े जाते हैं।`,
  hinglish: (r) =>
    `Tradition mein is haath ke saath ${r.lucky.color}, number ${r.lucky.number}, ${r.lucky.day} aur ${r.lucky.gemstone} jode jaate hain.`,
};

const CENTRE: Record<Language, string> = {
  en: "Your reading's centre of gravity is this:",
  hi: 'आपकी रीडिंग का मुख्य सार यह है:',
  hinglish: 'Aapki reading ka centre of gravity yeh hai:',
};

const REFUSAL_TAIL: Record<Language, string> = {
  en: 'Ask me instead about temperament, work, relationships, or the habits this hand suggests.',
  hi: 'इसके बजाय स्वभाव, काम, रिश्तों या इस हाथ की आदतों के बारे में पूछें।',
  hinglish: 'Iske bajaye nature, kaam, rishton ya is haath ki aadaton ke baare mein poochho.',
};

const systemFor = (report: Report) => `You are Pandit Maya, the palmist who just wrote this person's reading. Answer their follow-up questions about it.

Rules:
- Use ONLY the reading below. If it does not cover the question, say so plainly and offer the closest thing it does say. Never invent new lines, mounts, marks, dates or events.
- Never discuss death, lifespan, illness, diagnosis, pregnancy or legal outcomes. If asked, say traditional palmistry does not answer that, and redirect to what the hand does suggest.
- The person's report is written in ${LANG[report.language]}; answer in the same language, in the same simple voice.
- When the report names a problem, give its solution plainly — that is what the person is asking for.
- 2–4 sentences, warm and specific, no lists, no restating the whole reading.
- Do not mention AI, models or prompts.

THEIR READING (JSON):
${JSON.stringify({
  handType: report.handType,
  essence: report.essence,
  traits: report.traits,
  sections: report.sections,
  strengths: report.strengths,
  challenges: report.challenges,
  outlook: report.outlook,
  lucky: report.lucky,
  remedies: report.remedies,
  lifePhases: report.lifePhases,
  bothHands: report.bothHands,
  visibleFindings: report.findings.filter((f) => f.visible).map((f) => `${f.label}: ${f.meaning}`),
})}`;

const topicReply = (report: Report, question: string): string => {
  const q = question.toLowerCase();
  const has = (...words: string[]) => words.some((w) => q.includes(w));
  const first = (key: keyof Report['sections']) => report.sections[key][0]?.text ?? report.essence[0];
  const tail = (key: TailKey) => TAILS[report.language][key];

  if (
    has('work on', 'challenge', 'improve', 'weak', 'problem', 'issue', 'samasya', 'sudhar', 'कमज़ोरी', 'कमजोरी')
  ) {
    const [challenge] = report.challenges;
    return `${challenge.problem}\n\n${SOLUTION_LABEL[report.language]}: ${challenge.solution}\n\n${tail('actFirst')}`;
  }
  if (has('habit', 'remedy', 'remedies', 'upay', 'aadat', 'आदत', 'start first')) {
    return `${report.remedies[0]}\n\n${report.remedies[1]}`;
  }
  if (has('career', 'job', 'money', 'business', 'salary', 'promotion', 'नौकरी', 'करियर', 'पैसा')) {
    return `${first('career')}\n\n${tail('career')}`;
  }
  if (has('love', 'marriage', 'partner', 'relationship', 'crush', 'प्यार', 'प्रेम', 'शादी', 'रिश्ता')) {
    return `${first('love')}\n\n${tail('love')}`;
  }
  if (has('health', 'sleep', 'energy', 'body', 'stress', 'tired', 'सेहत', 'नींद')) {
    return `${first('health')}\n\n${tail('health')}`;
  }
  if (has('lucky', 'colour', 'color', 'gemstone', 'stone', 'number', 'day', 'रंग', 'रत्न')) {
    return `${LUCKY_LEAD[report.language](report)} ${tail('lucky')}`;
  }
  if (
    has(
      'next year',
      'twelve months',
      '12 months',
      'barah mahine',
      'agle mahine',
      'future',
      'when',
      'timing',
      'outlook',
      'आगे',
      'बारह',
      'महीनों',
    )
  ) {
    return `${report.outlook.headline} ${report.outlook.points[0]}\n\n${tail('outlook')}`;
  }
  if (has('hand', 'type', 'shape', 'air', 'water', 'earth', 'fire', 'line', 'हाथ', 'रेखा')) {
    return `${report.handTypeNote} ${tail('hand')}`;
  }
  return `${CENTRE[report.language]} ${report.essence[0]} ${report.essence[1]}\n\n${tail('askMore')}`;
};

export async function palmistReply(input: {
  report: Report;
  history: ChatTurn[];
  question: string;
}): Promise<{ reply: string; mode: 'live' | 'demo' }> {
  const question = input.question.trim().slice(0, MAX_QUESTION);
  const report = input.report;
  if (findBannedClaims(question).length) {
    return {
      reply: `${SAFE_COPY[report.language]} ${REFUSAL_TAIL[report.language]}`,
      mode: process.env.ANTHROPIC_API_KEY ? 'live' : 'demo',
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return { reply: topicReply(report, question), mode: 'demo' };

  const history = input.history.slice(-MAX_HISTORY).map((turn) => ({
    role: turn.role,
    content: turn.text.slice(0, 800),
  }));

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model(),
      max_tokens: 500,
      system: systemFor(report),
      messages: [...history, { role: 'user', content: question }],
    }),
  }).catch(() => null);

  if (!res?.ok) {
    throw new Error('The palmist could not answer just now.');
  }

  const body = (await res.json()) as { content?: { type: string; text?: string }[] };
  const reply = (body.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .trim();

  return {
    reply: reply || TAILS[report.language].askMore,
    mode: 'live',
  };
}
