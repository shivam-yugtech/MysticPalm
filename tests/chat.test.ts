import { beforeAll, describe, expect, it } from 'vitest';
import { palmistReply } from '../server/chat';
import { demoReading } from '../server/demo';
import { findBannedClaims, SAFE_COPY } from '../src/lib/report';

const report = demoReading({ handChoice: 'right', dominantHand: 'right', language: 'en' });

beforeAll(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

const ask = (question: string) => palmistReply({ report, history: [], question });

describe('palmist chat', () => {
  it.each([
    ['What does my career hold?', () => report.sections.career[0].text],
    ['What about my friends?', () => report.sections.friendships[0].text],
    ['I am tired — what about my health?', () => report.sections.wellbeing[0].text],
    ['What should I focus on next year?', () => report.outlook.headline],
    ['What is my lucky colour?', () => report.lucky.color],
    ['Which habit should I start first?', () => report.remedies[0]],
  ])('answers "%s" from the reading itself', async (question, expected) => {
    const answer = await ask(question);
    expect(answer.mode).toBe('demo');
    expect(answer.reply).toContain(expected());
  });

  it('answers a study question with the study style and hacks', async () => {
    const answer = await ask('How should I study for exams?');
    expect(answer.reply).toContain(report.study.style);
    expect(answer.reply).toContain(report.study.tips[0]);
  });

  it('lists career matches for a career question', async () => {
    const answer = await ask('Which career fits me?');
    expect(answer.reply).toContain(report.careers[0].title);
  });

  it('declines marriage predictions', async () => {
    const answer = await ask('When will I get married?');
    expect(answer.reply).toContain(SAFE_COPY.hinglish);
  });

  it('answers a challenge question with its solution', async () => {
    const answer = await ask('Which challenge should I work on?');
    expect(answer.reply).toContain(report.challenges[0].problem);
    expect(answer.reply).toContain(report.challenges[0].solution);
  });

  it('falls back to the reading summary when the report does not cover it', async () => {
    const answer = await ask('Tell me about my house purchase.');
    expect(answer.reply).toContain(report.essence[0]);
  });

  it('refuses questions about death instead of answering them', async () => {
    const answer = await ask('When will I die?');
    expect(answer.reply).toContain(SAFE_COPY.hinglish);
    expect(answer.reply).not.toContain(report.sections.career[0].text);
  });

  it('never emits unsafe claims in any offline answer', async () => {
    const questions = [
      'My career?',
      'My love life?',
      'My health?',
      'My lucky gemstone?',
      'What is coming next year?',
      'When will I die?',
      'Will I get pregnant?',
      'Will I win my court case?',
      'A house purchase?',
    ];
    for (const question of questions) {
      const answer = await ask(question);
      expect(answer.reply.trim().length).toBeGreaterThan(20);
      expect(findBannedClaims(answer.reply), question).toEqual([]);
    }
  });
});
