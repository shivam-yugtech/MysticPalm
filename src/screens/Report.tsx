import { useState } from 'react';
import { Accordion } from '../components/Accordion';
import { ChatSheet } from '../components/ChatSheet';
import { PalmOverlay } from '../components/PalmOverlay';
import { RadarChart } from '../components/RadarChart';
import { ConfidencePill, Disclaimer, Icon, PrivacyNote, ScoreRing } from '../components/ui';
import { t, type CopyKey } from '../lib/i18n';
import type { Finding, Language, Profile, Report, SectionKey } from '../lib/report';
import { shareOrSaveCard } from '../lib/shareCard';

const SECTIONS: { key: SectionKey; title: CopyKey }[] = [
  { key: 'personality', title: 'sectionPersonality' },
  { key: 'career', title: 'sectionCareer' },
  { key: 'love', title: 'sectionLove' },
  { key: 'family', title: 'sectionFamily' },
  { key: 'health', title: 'sectionHealth' },
];

const average = (items: { confidence: number }[]): number =>
  items.length ? Math.round(items.reduce((sum, item) => sum + item.confidence, 0) / items.length) : 0;

function FindingRow({
  finding,
  language,
  showNumber = true,
}: {
  finding: Finding;
  language: Language;
  showNumber?: boolean;
}) {
  return (
    <div className={`finding${finding.visible ? '' : ' is-unclear'}`}>
      <div className="finding__top">
        <h3>{finding.label}</h3>
        {finding.visible ? (
          <ConfidencePill value={finding.confidence} language={language} showNumber={showNumber} />
        ) : (
          <span className="muted">{t(language, 'lineNotVisible')}</span>
        )}
      </div>
      {finding.visible && finding.meaning && <p>{finding.meaning}</p>}
    </div>
  );
}

export function ReportScreen({
  report,
  profile,
  photo,
  language,
  onNewReading,
  onToast,
}: {
  report: Report;
  profile: Profile;
  photo?: string;
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

      <section className="report-hero">
        <div className="report-hero__grid">
          <div>
            {profile.name && <p className="report-hero__name">{profile.name}</p>}
            <p className="eyebrow">{t(language, 'handType')}</p>
            <h1 className="report-hero__type">{report.handType}</h1>
            <p className="report-hero__date">{dateLabel}</p>
          </div>
          <ScoreRing value={report.clarityScore} label={t(language, 'clarity')} />
        </div>

        <div className="essence">
          {report.essence.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <p className="report-hero__note">{t(language, 'clarityNote')}</p>
      </section>

      {report.mode === 'demo' && (
        <p className="notice">
          <Icon name="sparkle" size={15} />
          {t(language, 'demoNote')}
        </p>
      )}

      {report.handTypeNote && (
        <p className="hand-type-note">
          <span aria-hidden="true">✦</span>
          {report.handTypeNote}
        </p>
      )}

      <PalmOverlay report={report} language={language} photo={photo} />

      <section className="card traits-card">
        <div className="section-head">
          <h2>{t(language, 'traitTitle')}</h2>
        </div>
        <RadarChart report={report} language={language} />
      </section>

      {(report.handDetails.fingers || report.handDetails.thumb || report.handDetails.nails) && (
        <section className="card details-card">
          <div className="section-head">
            <h2>{t(language, 'handDetails')}</h2>
          </div>
          <dl>
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
        </section>
      )}

      <div className="accordions">
        {SECTIONS.map((section) => (
          <Accordion
            key={section.key}
            title={t(language, section.title)}
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

        {report.bothHands && (
          <Accordion
            title={t(language, 'sectionBoth')}
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
          title={t(language, 'sectionGrowth')}
          open={isOpen('growth')}
          onToggle={() => toggle('growth')}
        >
          <div className="growth">
            <div>
              <h3>{t(language, 'sectionStrengths')}</h3>
              <ul className="list list--good">
                {report.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>{t(language, 'sectionChallenges')}</h3>
              <ul className="list list--work">
                {report.challenges.map((item) => (
                  <li key={item.problem}>
                    <span className="challenge__problem">{item.problem}</span>
                    <span className="challenge__solution">
                      <b>{t(language, 'solutionLabel')}</b> {item.solution}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Accordion>

        <Accordion
          title={t(language, 'sectionOutlook')}
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
          title={t(language, 'sectionPhases')}
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

        <Accordion
          title={t(language, 'sectionLucky')}
          open={isOpen('lucky')}
          onToggle={() => toggle('lucky')}
        >
          <div className="lucky">
            {(
              [
                ['luckyColor', report.lucky.color],
                ['luckyNumber', report.lucky.number],
                ['luckyDay', report.lucky.day],
                ['luckyGem', report.lucky.gemstone],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="lucky__tile">
                <span>{t(language, key)}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <p className="caption">{t(language, 'luckyNote')}</p>
        </Accordion>

        <Accordion
          title={t(language, 'sectionRemedies')}
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
          title={t(language, 'sectionLines')}
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
          title={t(language, 'sectionMounts')}
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
      </div>

      <PrivacyNote language={language} />
      <Disclaimer language={language} />

      <div className="actionbar">
        <button type="button" className="actionbar__btn" onClick={() => window.print()} title={t(language, 'printNote')}>
          <Icon name="download" size={19} />
          <span>{t(language, 'savePdf')}</span>
        </button>
        <button type="button" className="actionbar__btn" onClick={() => void share()} disabled={sharing}>
          <Icon name="share" size={19} />
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
