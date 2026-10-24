import { findBannedClaims, SAFE_COPY, type Language, type Report } from '../src/lib/report';
import { AnalysisError } from './analyze';

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

type TailKey = 'actFirst' | 'study' | 'career' | 'friends' | 'wellbeing' | 'lucky' | 'outlook' | 'hand' | 'askMore';

/** Demo answers are assembled from the report, so their connective lines follow its language too. */
const TAILS: Record<Language, Record<TailKey, string>> = {
  en: {
    actFirst: 'That is the one worth acting on first — the rest of the hand supports it.',
    study: 'Try one of these this week and keep the one that sticks.',
    career: 'The hand points to directions, not marks or ranks. Explore a couple of these with a small project or a short course.',
    friends: 'The hand speaks to how you connect with people, not to who will show up or when.',
    wellbeing:
      'Palmistry reads lifestyle tendencies, never a diagnosis — for anything that worries you, talk to a doctor or a trusted adult.',
    lucky: 'These are fun suggestions from the tradition, not promises — use them as a small ritual, not a cheat code.',
    outlook: 'The reading gives seasons and preparation, not dates or results.',
    hand: 'The lines I could read clearly are the ones in your report; anything faint or hidden I left alone rather than inventing it.',
    askMore:
      'Ask me about studies, exams, career, friends or the habits this hand suggests — I will stay with what your hand actually shows.',
  },
  hi: {
    actFirst: 'सबसे पहले इसी पर काम करें — बाकी हाथ इसी दिशा को सहारा देता है।',
    study: 'इस हफ़्ते इनमें से एक आज़माएँ और जो जमे, उसे रोज़ की आदत बना लें।',
    career: 'हाथ दिशा बताता है, नंबर या रैंक नहीं। छोटे प्रोजेक्ट या कोर्स से इन रास्तों को परखें।',
    friends: 'हाथ बताता है कि आप लोगों से कैसे जुड़ते हैं — कौन आएगा या कब, यह नहीं।',
    wellbeing:
      'हस्तरेखा जीवनशैली की प्रवृत्तियाँ पढ़ती है, निदान नहीं — किसी भी चिंता के लिए डॉक्टर या किसी भरोसेमंद बड़े से बात करें।',
    lucky: 'ये परंपरा के मज़ेदार सुझाव हैं, वादे नहीं — इन्हें छोटा अनुष्ठान मानें, कोई जादुई शॉर्टकट नहीं।',
    outlook: 'रीडिंग मौसम और तैयारी बताती है, तारीख़ें या नतीजे नहीं।',
    hand: 'जो रेखाएँ साफ़ दिखीं, वही रिपोर्ट में हैं; जो धुँधली या छिपी थीं, उन्हें बनाया नहीं गया।',
    askMore:
      'पढ़ाई, परीक्षा, करियर, दोस्त या आदतों में से कुछ पूछें — मैं वही बताऊँगी जो आपका हाथ दिखाता है।',
  },
  hinglish: {
    actFirst: 'Sabse pehle isi par kaam karo — baaki haath isi direction ko support karta hai.',
    study: 'Is hafte inme se ek try karo, jo chal jaaye use daily habit bana lo.',
    career: 'Haath direction batata hai, marks ya rank nahi. Chhote project ya short course se in raaston ko test karo.',
    friends: 'Haath batata hai ki aap logon se kaise judte ho — kaun aayega ya kab, yeh nahi.',
    wellbeing:
      'Hast rekha lifestyle tendencies padhti hai, diagnosis nahi — kisi bhi chinta ke liye doctor ya kisi trusted bade se baat karo.',
    lucky: 'Yeh tradition ke fun suggestions hain, promise nahi — inhe chhota ritual maano, cheat code nahi.',
    outlook: 'Reading seasons aur preparation deti hai, dates ya results nahi.',
    hand: 'Jo lines saaf dikhi, wahi report mein hain; jo dhundhli ya chhupi thi, unhe invent nahi kiya.',
    askMore:
      'Padhai, exams, career, dost ya aadatein — kuch bhi poochho, main wahi bataungi jo aapka haath dikhata hai.',
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

const STUDY_LEAD: Record<Language, string> = {
  en: 'Best focus time',
  hi: 'फ़ोकस का सबसे अच्छा समय',
  hinglish: 'Best focus time',
};

const CENTRE: Record<Language, string> = {
  en: "Your reading's centre of gravity is this:",
  hi: 'आपकी रीडिंग का मुख्य सार यह है:',
  hinglish: 'Aapki reading ka centre of gravity yeh hai:',
};

const REFUSAL_TAIL: Record<Language, string> = {
  en: 'Ask me instead about your studies, career, friends, or the habits this hand suggests.',
  hi: 'इसके बजाय अपनी पढ़ाई, करियर, दोस्तों या इस हाथ की आदतों के बारे में पूछें।',
  hinglish: 'Iske bajaye apni padhai, career, doston ya is haath ki aadaton ke baare mein poochho.',
};

const systemFor = (report: Report) => `You are Maya, the friendly palm reader who just wrote this student's reading. Answer their follow-up questions about it.

Rules:
- Use ONLY the reading below. If it does not cover the question, say so plainly and offer the closest thing it does say. Never invent new lines, mounts, marks, dates or events.
- Never discuss death, lifespan, illness, diagnosis, pregnancy, marriage predictions, guaranteed marks or legal outcomes. If asked, say traditional palmistry does not answer that, and redirect to what the hand does suggest.
- The person's report is written in ${LANG[report.language]}; answer in the same language, in the same simple, friendly voice — like a kind senior talking to a student.
- When the report names a problem, give its solution plainly — that is what the person is asking for.
- 2–4 sentences, warm and specific, no lists, no restating the whole reading.
- Do not mention AI, models or prompts.

THEIR READING (JSON):
${JSON.stringify({
  persona: report.persona,
  superpower: report.superpower,
  study: report.study,
  careers: report.careers,
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
  visibleFindings: (report.findings ?? []).filter((f) => f.visible).map((f) => `${f.label}: ${f.meaning}`),
})}`;

const topicReply = (report: Report, question: string): string => {
  const q = question.toLowerCase();
  const has = (...words: string[]) => words.some((w) => q.includes(w));
  const first = (key: keyof Report['sections']) => report.sections[key]?.[0]?.text ?? report.essence[0];
  const tail = (key: TailKey) => TAILS[report.language][key];
  const [challenge] = report.challenges ?? [];

  if (
    challenge &&
    has('work on', 'challenge', 'improve', 'weak', 'problem', 'issue', 'level up', 'procrastinat', 'samasya', 'sudhar', 'कमज़ोरी', 'कमजोरी')
  ) {
    return `${challenge.problem}\n\n${SOLUTION_LABEL[report.language]}: ${challenge.solution}\n\n${tail('actFirst')}`;
  }
  if (has('habit', 'remedy', 'remedies', 'upay', 'aadat', 'आदत', 'start first')) {
    return report.remedies.slice(0, 2).join('\n\n');
  }
  if (has('next year', 'this year', 'twelve months', '12 months', 'year ahead', 'barah mahine', 'agle saal', 'outlook', 'बारह', 'अगले साल')) {
    return `${report.outlook.headline} ${report.outlook.points[0] ?? ''}\n\n${tail('outlook')}`;
  }
  if (has('study', 'studies', 'exam', 'padhai', 'padh', 'focus', 'concentrat', 'marks', 'learn', 'पढ़ाई', 'परीक्षा')) {
    const tips = report.study?.tips?.length ? `\n\n• ${report.study.tips.join('\n• ')}` : '';
    const time = report.study?.bestTime ? `\n\n${STUDY_LEAD[report.language]}: ${report.study.bestTime}` : '';
    return `${report.study?.style || first('studies')}${time}${tips}\n\n${tail('study')}`;
  }
  if (has('career', 'job', 'money', 'business', 'stream', 'future', 'field', 'नौकरी', 'करियर', 'पैसा')) {
    const matches = report.careers?.length
      ? `\n\n${report.careers.map((c) => `• ${c.title} — ${c.why}`).join('\n')}`
      : '';
    return `${first('career')}${matches}\n\n${tail('career')}`;
  }
  if (has('friend', 'dost', 'love', 'crush', 'relationship', 'social', 'people', 'दोस्त', 'प्यार', 'रिश्ता')) {
    return `${first('friendships')}\n\n${tail('friends')}`;
  }
  if (has('health', 'sleep', 'energy', 'body', 'stress', 'tired', 'anxious', 'screen', 'सेहत', 'नींद', 'तनाव')) {
    return `${first('wellbeing')}\n\n${tail('wellbeing')}`;
  }
  if (has('lucky', 'colour', 'color', 'gemstone', 'stone', 'number', 'day', 'रंग', 'रत्न')) {
    return `${LUCKY_LEAD[report.language](report)} ${tail('lucky')}`;
  }
  if (has('superpower', 'talent', 'gift', 'special', 'खासियत')) {
    return `${report.persona?.title ? `${report.persona.title}: ` : ''}${report.superpower || report.essence[0]}`;
  }
  if (
    has(
      'next year',
      'this year',
      'twelve months',
      '12 months',
      'barah mahine',
      'agle mahine',
      'when',
      'timing',
      'outlook',
      'आगे',
      'बारह',
      'महीनों',
    )
  ) {
    return `${report.outlook.headline} ${report.outlook.points[0] ?? ''}\n\n${tail('outlook')}`;
  }
  if (has('hand', 'type', 'shape', 'air', 'water', 'earth', 'fire', 'line', 'हाथ', 'रेखा')) {
    return `${report.handTypeNote} ${tail('hand')}`;
  }
  return `${CENTRE[report.language]} ${report.essence[0]} ${report.essence[1] ?? ''}\n\n${tail('askMore')}`;
};

export async function palmistReply(input: {
  report: Report;
  history: ChatTurn[];
  question: string;
}): Promise<{ reply: string; mode: 'live' | 'demo' }> {
  const question = input.question.trim().slice(0, MAX_QUESTION);
  const report = input.report;
  if (findBannedClaims(question).length || /\b(marr(y|ied|iage)|wedding|shaadi|vivah)\b|शादी|विवाह/i.test(question)) {
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model(),
      max_tokens: 1024,
      system: systemFor(report),
      messages: [...history, { role: 'user', content: question }],
    }),
    signal: controller.signal,
  })
    .catch(() => null)
    .finally(() => clearTimeout(timeout));

  if (!res?.ok) {
    throw new AnalysisError(
      res?.status === 429 ? 'Maya is busy for a moment. Try again in a minute.' : 'Maya could not answer just now. Try again.',
      res?.status === 429 ? 429 : 502,
    );
  }

  const body = (await res.json().catch(() => null)) as { content?: { type: string; text?: string }[] } | null;
  const reply = (body?.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .trim();

  const safe = reply && !findBannedClaims(reply).length ? reply : '';
  return {
    reply: safe || TAILS[report.language].askMore,
    mode: 'live',
  };
}
