import type { CSSProperties } from 'react';
import { t, type CopyKey } from '../lib/i18n';
import { LINE_COLORS, TEMPLATE_TRACE, type HandTrace, type PalmLineId } from '../lib/palmGeometry';
import { findingOf, type Finding, type Language, type Profile, type Report } from '../lib/report';
import { HandGuide } from './HandGuide';
import { HandMesh } from './HandMesh';

const LINES: { id: PalmLineId; icon: string; keywords: CopyKey; where: CopyKey }[] = [
  { id: 'life', icon: '❦', keywords: 'kwLife', where: 'locLife' },
  { id: 'head', icon: '◎', keywords: 'kwHead', where: 'locHead' },
  { id: 'heart', icon: '♡', keywords: 'kwHeart', where: 'locHeart' },
  { id: 'fate', icon: '✦', keywords: 'kwFate', where: 'locFate' },
];

const MOUNT_SYMBOL: Record<string, string> = {
  mount_jupiter: '♃',
  mount_saturn: '♄',
  mount_apollo: '☉',
  mount_mercury: '☿',
  mount_venus: '♀',
  mount_moon: '☽',
  mount_mars_upper: '♂',
  mount_mars_lower: '♂',
};

const ELEMENT: Record<Report['handType'], string> = { Earth: '🜃', Air: '🜁', Fire: '🜂', Water: '🜄' };

const splitMeaning = (text: string): [string, string] => {
  const match = text.match(/^(.+?[.!?।])\s+(.+)$/s);
  return match ? [match[1], match[2]] : [text, ''];
};

const firstSentence = (text: string) => splitMeaning(text)[0];

function LineCard({ index, finding, line, language }: { index: number; finding?: Finding; line: (typeof LINES)[number]; language: Language }) {
  const visible = finding?.visible && finding.meaning;
  const [seen, meaning] = visible ? splitMeaning(finding.meaning) : ['', ''];
  return (
    <article className="pg-line" style={{ '--c': LINE_COLORS[line.id] } as CSSProperties}>
      <header>
        <span className="pg-line__icon">{line.icon}</span>
        <div>
          <h4>
            {index + 1}. {finding?.label ?? line.id}
          </h4>
          <p className="pg-line__kw">{t(language, line.keywords)}</p>
        </div>
        {finding?.visible && <span className="pg-line__conf">{finding.confidence}%</span>}
      </header>
      <p className="pg-line__where">{t(language, line.where)}</p>
      {visible ? (
        <>
          <p>{seen}</p>
          {meaning && (
            <>
              <h5>{t(language, 'interpretation')}</h5>
              <p>{meaning}</p>
            </>
          )}
        </>
      ) : (
        <p className="pg-muted">{t(language, 'lineNotVisible')}</p>
      )}
    </article>
  );
}

export function PalmGuide({
  report,
  profile,
  language,
  photo,
  trace,
}: {
  report: Report;
  profile: Profile;
  language: Language;
  photo?: string;
  trace?: HandTrace | null;
}) {
  const mounts = report.findings.filter((f) => f.group === 'mount' && f.visible);
  const ruling = [...mounts].sort((a, b) => b.prominence - a.prominence)[0];
  const markers = [
    ...report.findings.filter((f) => f.group === 'mark' && f.visible),
    ...report.findings.filter((f) => f.group === 'minor' && f.visible),
  ].slice(0, 5);
  const hand = t(language, profile.handChoice === 'left' ? 'handLeft' : profile.handChoice === 'both' ? 'handBoth' : 'handRight');

  return (
    <section className="pg" aria-labelledby="pg-title">
      <header className="pg__head">
        <h2 id="pg-title">
          <span aria-hidden="true">✦</span> {t(language, 'guideTitle')}
        </h2>
        <p>{t(language, 'guideTagline')}</p>
      </header>

      <div className="pg__grid">
        <div className="pg__col">
          {photo && trace ? (
            <figure className="pg-photo">
              <img src={photo} alt="" />
              <HandMesh trace={trace} variant="still" language={language} fit="meet" skeleton={false} className="pg-photo__lines" />
            </figure>
          ) : null}

          <div className="pg-box">
            <h3>{t(language, 'atGlance')}</h3>
            <p className="pg-lead">{report.essence[0]}</p>
            <div className="pg-tiles">
              <div>
                <span className="pg-tile__icon">{ELEMENT[report.handType]}</span>
                <small>{t(language, 'handType')}</small>
                <b>{report.handType}</b>
              </div>
              <div>
                <span className="pg-tile__icon">{ruling ? MOUNT_SYMBOL[ruling.id] : '✋'}</span>
                <small>{t(language, 'glanceRuling')}</small>
                <b>{ruling ? ruling.label.replace(/^Mount of /, '') : '—'}</b>
              </div>
              <div>
                <span className="pg-tile__icon">☼</span>
                <small>{t(language, 'glanceHand')}</small>
                <b>{hand}</b>
              </div>
            </div>
            {report.handDetails.fingers && (
              <dl className="pg-facts">
                <div>
                  <dt>{t(language, 'fingers')}</dt>
                  <dd>{firstSentence(report.handDetails.fingers)}</dd>
                </div>
                {report.handDetails.thumb && (
                  <div>
                    <dt>{t(language, 'thumb')}</dt>
                    <dd>{firstSentence(report.handDetails.thumb)}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          <div className="pg-box">
            <h3>{t(language, 'lineOverview')}</h3>
            <div className="pg-art">
              <HandGuide />
              <HandMesh trace={TEMPLATE_TRACE} variant="still" language={language} fit="meet" skeleton={false} className="pg-art__lines" />
            </div>
          </div>

          <div className="pg-box pg-note">
            <h3>{t(language, 'howToRead')}</h3>
            <p>{t(language, 'howToReadBody')}</p>
          </div>
        </div>

        <div className="pg__col">
          <h3 className="pg-section">{t(language, 'fourLines')}</h3>
          {LINES.map((line, index) => (
            <LineCard key={line.id} index={index} line={line} finding={findingOf(report, line.id)} language={language} />
          ))}

          <h3 className="pg-section">{t(language, 'mountsMarkers')}</h3>
          <div className="pg-mounts">
            {mounts.map((mount) => (
              <div key={mount.id} className="pg-mount">
                <span>{MOUNT_SYMBOL[mount.id]}</span>
                <div>
                  <b>{mount.label}</b>
                  <p>{firstSentence(mount.meaning)}</p>
                </div>
              </div>
            ))}
          </div>

          {markers.length > 0 && (
            <div className="pg-box">
              <h3>{t(language, 'minorObserved')}</h3>
              <ul className="pg-markers">
                {markers.map((marker) => (
                  <li key={marker.id}>
                    <b>{marker.label}</b> — {firstSentence(marker.meaning)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <footer className="pg__foot">
        <span>{t(language, 'guidingThought')}</span>
        <p>{report.outlook.headline} {report.strengths[0]}</p>
      </footer>
    </section>
  );
}
