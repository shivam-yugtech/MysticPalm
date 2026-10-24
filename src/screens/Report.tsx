import { useState } from 'react';
import { Accordion } from '../components/Accordion';
import { ChatSheet } from '../components/ChatSheet';
import { PalmGuide } from '../components/PalmGuide';
import { RadarChart } from '../components/RadarChart';
import { ConfidencePill, Disclaimer, Icon, PrivacyNote, ScoreRing } from '../components/ui';
import { PANDIT_COPY, t, type CopyKey } from '../lib/i18n';
import { PanditJi } from '../components/PanditJi';
import { HAND_EMOJI, type Finding, type Language, type Profile, type Report, type SectionKey } from '../lib/report';
import type { HandTrace } from '../lib/palmGeometry';
import { shareOrSaveCard } from '../lib/shareCard';

const SECTIONS: { key: SectionKey; title: CopyKey; emoji: string }[] = [
  { key: 'personality', title: 'sectionPersonality', emoji: '✨' },
  { key: 'studies', title: 'sectionStudies', emoji: '📚' },
  { key: 'career', title: 'sectionCareer', emoji: '🚀' },
  { key: 'friendships', title: 'sectionFriendships', emoji: '🤝' },
  { key: 'wellbeing', title: 'sectionWellbeing', emoji: '🌙' },
];

const LUCKY: { key: 'color' | 'number' | 'day' | 'gemstone'; label: CopyKey; emoji: string }[] = [
  { key: 'color', label: 'luckyColor', emoji: '🎨' },
  { key: 'number', label: 'luckyNumber', emoji: '🔢' },
  { key: 'day', label: 'luckyDay', emoji: '📅' },
  { key: 'gemstone', label: 'luckyGem', emoji: '💎' },
];

const average = (items: { confidence: number }[]): number =>
  items.length ? Math.round(items.reduce((sum, item) => sum + item.confidence, 0) / items.length) : 0;

function FindingRow({ finding, language }: { finding: Finding; language: Language }) {
  return (
    <div className={`finding${finding.visible ? '' : ' is-unclear'}`}>
      <div className="finding__top">
        <h3>{finding.label}</h3>
        {finding.visible ? (
          <ConfidencePill value={finding.confidence} language={language} />
        ) : (
          <span className="muted">{t(language, 'lineNotVisible')}</span>
        )}
      </div>
      {finding.visible && finding.meaning && <p>{finding.meaning}</p>}
    </div>
  );
}

const AccTitle = ({ emoji, text }: { emoji: string; text: string }) => (
  <>
    <span className="acc__emoji" aria-hidden="true">
      {emoji}
    </span>
    {text}
  </>
);

export function ReportScreen({
  report,
  profile,
  photo,
  trace,
  language,
  onNewReading,
  onToast,
}: {
  report: Report;
  profile: Profile;
  photo?: string;
  trace?: HandTrace | null;
  language: Language;
  onNewReading: () => void;
  onToast: (message: string) => void;
}) {
  const [open, setOpen] = useState<string[]>(['personality']);
  const [chatOpen, setChatOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const toggle = (key: string) =>
    setOpen((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  const isOpen = (key: string) => open.includes(key);

  const major = report.findings.filter((f) => f.group === 'major');
  const minor = report.findings.filter((f) => f.group === 'minor');
  const marks = report.findings.filter((f) => f.group === 'mark');
  const mounts = report.findings.filter((f) => f.group === 'mount');
  const dateLabel = new Date(report.generatedAt).toLocaleDateString(
    language === 'hi' ? 'hi-IN' : 'en-IN',
    { day: 'numeric', month: 'long', year: 'numeric' },
  );

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const result = await shareOrSaveCard(report, profile.name);
      if (result === 'saved') onToast(t(language, 'shareSaved'));
    } catch {
      onToast(t(language, 'errorGeneric'));
    } finally {
      setSharing(false);
    }
  };

  return (
    <main className="screen report">
      <div className="print-head">
        <span>MysticPalm</span>
        <span>{dateLabel}</span>
      </div>

      <div className="report-top">
        {report.mode === 'demo' ? (
          <span className="badge badge--demo">{t(language, 'demoBadge')}</span>
        ) : (
          <span className="badge">{t(language, 'reportTitle')}</span>
        )}
        <button type="button" className="link-btn" onClick={onNewReading}>
          <Icon name="refresh" size={15} />
          {t(language, 'newReading')}
        </button>
      </div>

      {report.mode === 'demo' && (
        <p className="notice">
          <Icon name="sparkle" size={15} />
          {t(language, 'demoNote')}
        </p>
      )}

      <PanditJi
        language={language}
        lines={[`${PANDIT_COPY[language].readingIntro}: ${report.persona.title}! ${report.persona.tagline}`, report.superpower, report.outlook.headline]}
        speech={`${PANDIT_COPY[language].readingIntro}, ${report.persona.title}! ${report.superpower} ${report.outlook.headline}`}
        autoSpeak
      />

      <section className="persona">
        <div className="persona__top">
          <span className="persona__emoji" aria-hidden="true">
            {HAND_EMOJI[report.handType]}
          </span>
          <ScoreRing value={report.clarityScore} label={t(language, 'clarity')} />
        </div>
        {profile.name && <p className="persona__name">{profile.name}</p>}
        <p className="eyebrow">{t(language, 'personaLabel')}</p>
        <h1 className="persona__title">{report.persona.title}</h1>
        <p className="persona__tagline">{report.persona.tagline}</p>
        <div className="persona__chips">
          <span className="chip-tag">
            {t(language, 'handType')}: <b>{report.handType}</b>
          </span>
          <span className="chip-tag">{dateLabel}</span>
        </div>
        <ul className="essence">
          {report.essence.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="superpower">
        <span className="superpower__icon" aria-hidden="true">
          ⚡
        </span>
        <div>
          <p className="eyebrow">{t(language, 'superpowerLabel')}</p>
          <p className="superpower__text">{report.superpower}</p>
        </div>
      </section>

      <PalmGuide report={report} profile={profile} language={language} photo={photo} trace={trace} />

      <section className="card lucky-card">
        <div className="section-head">
          <h2>🍀 {t(language, 'sectionLucky')}</h2>
        </div>
        <div className="lucky">
          {LUCKY.map((item) => (
            <div key={item.key} className="lucky__tile">
              <span className="lucky__emoji" aria-hidden="true">
                {item.emoji}
              </span>
              <span>{t(language, item.label)}</span>
              <strong>{report.lucky[item.key]}</strong>
            </div>
          ))}
        </div>
        <p className="caption">{t(language, 'luckyNote')}</p>
      </section>

      <section className="card study-card">
        <div className="section-head">
          <h2>📚 {t(language, 'studyTitle')}</h2>
        </div>
        <p className="study-card__style">{report.study.style}</p>
        <p className="power-hour">
          <span aria-hidden="true">⏰</span>
          <span>{t(language, 'bestTime')}</span>
          <b>{report.study.bestTime}</b>
        </p>
        <h3 className="group-label">{t(language, 'studyTips')}</h3>
        <ol className="tips">
          {report.study.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ol>
      </section>

      <section className="card careers-card">
        <div className="section-head">
          <h2>🚀 {t(language, 'careersTitle')}</h2>
          <p>{t(language, 'careersNote')}</p>
        </div>
        <div className="careers">
          {report.careers.map((career, index) => (
            <article key={career.title} className={`career tone--${['violet', 'cyan', 'pink', 'lime'][index % 4]}`}>
              <h3>{career.title}</h3>
              <p>{career.why}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card traits-card">
        <div className="section-head">
          <h2>📊 {t(language, 'traitTitle')}</h2>
        </div>
        <RadarChart report={report} language={language} />
      </section>

      <section className="card levelup-card">
        <div className="section-head">
          <h2>🎯 {t(language, 'sectionChallenges')}</h2>
        </div>
        <div className="levelups">
          {report.challenges.map((item, index) => (
            <article key={item.problem} className="levelup">
              <span className="levelup__num">{index + 1}</span>
              <div>
                <p className="levelup__problem">{item.problem}</p>
                <p className="levelup__solution">
                  <b>{t(language, 'solutionLabel')} →</b> {item.solution}
                </p>
              </div>
            </article>
          ))}
        </div>
        <h3 className="group-label">{t(language, 'sectionStrengths')}</h3>
        <ul className="list list--good">
          {report.strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>


      {report.handTypeNote && (
        <p className="hand-type-note">
          <span aria-hidden="true">{HAND_EMOJI[report.handType]}</span>
          {report.handTypeNote}
        </p>
      )}

      <h2 className="section-label">{t(language, 'deepDive')}</h2>
      <div className="accordions">
        {SECTIONS.map((section) => (
          <Accordion
            key={section.key}
            title={<AccTitle emoji={section.emoji} text={t(language, section.title)} />}
            subtitle={<ConfidencePill value={average(report.sections[section.key])} language={language} showNumber={false} />}
            open={isOpen(section.key)}
            onToggle={() => toggle(section.key)}
          >
            <div className="insights">
              {report.sections[section.key].map((insight, index) => (
                <article key={index} className="insight">
                  <p>{insight.text}</p>
                  <div className="insight__meta">
                    <ConfidencePill value={insight.confidence} language={language} />
                  </div>
                </article>
              ))}
            </div>
          </Accordion>
        ))}

        <Accordion
          title={<AccTitle emoji="🗓️" text={t(language, 'sectionOutlook')} />}
          open={isOpen('outlook')}
          onToggle={() => toggle('outlook')}
        >
          <div className="outlook">
            <p className="outlook__headline">{report.outlook.headline}</p>
            <ul className="list list--star">
              {report.outlook.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </Accordion>

        <Accordion
          title={<AccTitle emoji="💪" text={t(language, 'sectionRemedies')} />}
          open={isOpen('remedies')}
          onToggle={() => toggle('remedies')}
        >
          <ol className="remedies">
            {report.remedies.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </Accordion>

        <Accordion
          title={<AccTitle emoji="🛤️" text={t(language, 'sectionPhases')} />}
          open={isOpen('phases')}
          onToggle={() => toggle('phases')}
        >
          <ol className="timeline">
            {report.lifePhases.map((phase) => (
              <li key={phase.period}>
                <span className="timeline__dot" aria-hidden="true" />
                <h3>{phase.period}</h3>
                <p>{phase.note}</p>
              </li>
            ))}
          </ol>
        </Accordion>

        {report.bothHands && (
          <Accordion
            title={<AccTitle emoji="🙌" text={t(language, 'sectionBoth')} />}
            open={isOpen('both')}
            onToggle={() => toggle('both')}
          >
            <div className="both-hands">
              <div>
                <h3>{t(language, 'bothInherited')}</h3>
                <p>{report.bothHands.inherited}</p>
              </div>
              <div>
                <h3>{t(language, 'bothDeveloped')}</h3>
                <p>{report.bothHands.developed}</p>
              </div>
              <div className="both-hands__compare">
                <h3>{t(language, 'bothComparison')}</h3>
                <p>{report.bothHands.comparison}</p>
              </div>
            </div>
          </Accordion>
        )}

        <Accordion
          title={<AccTitle emoji="〰️" text={t(language, 'sectionLines')} />}
          open={isOpen('lines')}
          onToggle={() => toggle('lines')}
        >
          <div className="findings">
            <h3 className="group-label">{t(language, 'groupMajor')}</h3>
            {major.map((finding) => (
              <FindingRow key={finding.id} finding={finding} language={language} />
            ))}
            <h3 className="group-label">{t(language, 'groupMinor')}</h3>
            {minor.map((finding) => (
              <FindingRow key={finding.id} finding={finding} language={language} />
            ))}
            {marks.length > 0 && (
              <>
                <h3 className="group-label">{t(language, 'groupMarks')}</h3>
                {marks.map((finding) => (
                  <FindingRow key={finding.id} finding={finding} language={language} />
                ))}
              </>
            )}
          </div>
        </Accordion>

        <Accordion
          title={<AccTitle emoji="⛰️" text={t(language, 'sectionMounts')} />}
          open={isOpen('mounts')}
          onToggle={() => toggle('mounts')}
        >
          <div className="mounts">
            {mounts.map((finding) => (
              <div key={finding.id} className={`mount${finding.visible ? '' : ' is-unclear'}`}>
                <div className="mount__top">
                  <h3>{finding.label}</h3>
                  {finding.visible ? (
                    <ConfidencePill value={finding.confidence} language={language} showNumber={false} />
                  ) : (
                    <span className="muted">{t(language, 'lineNotVisible')}</span>
                  )}
                </div>
                {finding.visible && (
                  <>
                    <div className="mount__bar" aria-hidden="true">
                      <span style={{ width: `${finding.prominence}%` }} />
                    </div>
                    <p>{finding.meaning}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </Accordion>

        {(report.handDetails.fingers || report.handDetails.thumb || report.handDetails.nails) && (
          <Accordion
            title={<AccTitle emoji="🖐️" text={t(language, 'handDetails')} />}
            open={isOpen('details')}
            onToggle={() => toggle('details')}
          >
            <dl className="hand-details">
              {(
                [
                  ['fingers', report.handDetails.fingers],
                  ['thumb', report.handDetails.thumb],
                  ['nails', report.handDetails.nails],
                ] as const
              ).map(([key, value]) =>
                value ? (
                  <div key={key}>
                    <dt>{t(language, key)}</dt>
                    <dd>{value}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          </Accordion>
        )}
      </div>

      <PrivacyNote language={language} />
      <Disclaimer language={language} />

      <div className="actionbar">
        <button type="button" className="actionbar__btn" onClick={() => window.print()} title={t(language, 'printNote')}>
          <Icon name="download" size={19} />
          <span>{t(language, 'savePdf')}</span>
        </button>
        <button type="button" className="actionbar__btn" onClick={() => void share()} disabled={sharing} aria-busy={sharing}>
          {sharing ? <span className="spinner spinner--sm" aria-hidden="true" /> : <Icon name="share" size={19} />}
          <span>{t(language, 'shareCard')}</span>
        </button>
        <button type="button" className="actionbar__btn actionbar__btn--primary" onClick={() => setChatOpen(true)}>
          <Icon name="chat" size={19} />
          <span>{t(language, 'askPalmist')}</span>
        </button>
      </div>

      <ChatSheet open={chatOpen} onClose={() => setChatOpen(false)} report={report} language={language} />
    </main>
  );
}
