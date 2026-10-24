import { useCallback, useEffect, useRef, useState } from 'react';
import { Header, Toast } from './components/ui';
import { analyzeHands, fetchSample } from './lib/api';
import { requiredRoles, type PhotoSlots } from './lib/capture';
import { t } from './lib/i18n';
import type { HandTrace } from './lib/palmGeometry';
import type { Language, PhotoRole, Profile } from './lib/report';
import { clearReading, loadReading, saveReading, type StoredReading } from './lib/session';
import { Capture } from './screens/Capture';
import { Details } from './screens/Details';
import { Landing } from './screens/Landing';
import { ReportScreen } from './screens/Report';
import { Scanning } from './screens/Scanning';

type Route = 'home' | 'details' | 'capture' | 'scan' | 'report';
const ROUTES: Route[] = ['home', 'details', 'capture', 'scan', 'report'];
const MIN_SCAN_MS = 4200;
const LANG_KEY = 'mysticpalm.lang';

const readRoute = (): Route => {
  const hash = window.location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(hash) ? hash : 'home';
};

const urlFor = (route: Route) => (route === 'home' ? window.location.pathname : `#/${route}`);

const initialLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(LANG_KEY) as Language | null;
    if (stored && ['en', 'hi', 'hinglish'].includes(stored)) return stored;
  } catch {
    // Storage can be blocked; fall back to the default.
  }
  return 'hinglish';
};

const emptyProfile = (language: Language): Profile => ({
  handChoice: 'right',
  dominantHand: 'right',
  language,
});

export default function App() {
  const [restored] = useState<StoredReading | null>(loadReading);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [route, setRoute] = useState<Route>(() => {
    const initial = readRoute();
    if (initial === 'report') return restored ? 'report' : 'home';
    if (initial === 'scan' || initial === 'capture') return 'details';
    return initial;
  });
  const [reading, setReading] = useState<StoredReading | null>(restored);
  const [profile, setProfile] = useState<Profile>(restored?.profile ?? emptyProfile(language));
  const [slots, setSlots] = useState<PhotoSlots>({});
  const [reportPhoto, setReportPhoto] = useState<string | undefined>();
  const [reportTrace, setReportTrace] = useState<HandTrace | null>(null);
  const [scan, setScan] = useState<{ status: 'running' | 'error'; detail?: string }>({ status: 'running' });
  const [sampleBusy, setSampleBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const started = useRef(false);
  const clearToast = useCallback(() => setToast(null), []);
  const scanSlot = slots[requiredRoles(profile)[0]];

  const go = useCallback(
    (next: Route, replace = false) => {
      // Guard against a double tap pushing the same screen twice.
      if (next === route) return;
      window.history[replace ? 'replaceState' : 'pushState'](null, '', urlFor(next));
      setRoute(next);
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    [route],
  );

  // Keep the URL in step with the screen actually shown after a reload.
  useEffect(() => {
    if (readRoute() !== route) window.history.replaceState(null, '', urlFor(route));
  }, []); // first mount only

  useEffect(() => {
    const onPop = () => {
      const next = readRoute();
      if (next === 'report' && !reading) {
        window.history.replaceState(null, '', urlFor('home'));
        setRoute('home');
        return;
      }
      // Never re-run analysis by stepping back into the scanning screen.
      if (next === 'scan') {
        const target: Route = reading ? 'report' : 'capture';
        window.history.replaceState(null, '', urlFor(target));
        setRoute(target);
        return;
      }
      setRoute(next);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [reading]);

  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
  }, [language]);

  const changeLanguage = (next: Language) => {
    if (next === language) return;
    setLanguage(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // ignore
    }
    setProfile((current) => ({ ...current, language: next }));
    if (route === 'report') setToast(t(next, 'languageNotice'));
  };

  const runAnalysis = useCallback(async () => {
    const roles = requiredRoles(profile);
    const photos = roles.map((role) => {
      const slot = slots[role];
      return slot?.status === 'ready' ? { role, dataUrl: slot.upload } : null;
    });

    if (photos.some((photo) => photo === null)) {
      go('capture', true);
      return;
    }

    setScan({ status: 'running' });
    const startedAt = Date.now();
    try {
      const { report } = await analyzeHands(
        photos as { role: PhotoRole; dataUrl: string }[],
        { ...profile, language },
      );
      // The scan is part of the ritual; never let it flash past in milliseconds.
      const remaining = MIN_SCAN_MS - (Date.now() - startedAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      const stored: StoredReading = { report, profile: { ...profile, language } };
      setReading(stored);
      saveReading(stored);
      setReportPhoto(photos[0]?.dataUrl);
      const first = slots[roles[0]];
      setReportTrace(first?.status === 'ready' ? first.trace ?? null : null);
      // The photo is dropped from memory as soon as the reading exists.
      setSlots({});
      go('report', true);
    } catch (error) {
      setScan({
        status: 'error',
        detail: error instanceof Error ? error.message : t(language, 'errorGeneric'),
      });
    }
  }, [profile, slots, language, go]);

  useEffect(() => {
    if (route !== 'scan') {
      started.current = false;
      return;
    }
    if (started.current) return;
    started.current = true;
    void runAnalysis();
  }, [route, runAnalysis]);

  const beginReading = () => {
    setProfile((current) => ({ ...emptyProfile(language), name: current.name, stage: current.stage, stream: current.stream }));
    setSlots({});
    setReportPhoto(undefined);
    setReportTrace(null);
    setScan({ status: 'running' });
    go('details');
  };

  const startNew = () => {
    clearReading();
    setReading(null);
    setReportPhoto(undefined);
    setReportTrace(null);
    setSlots({});
    setProfile((current) => ({ ...emptyProfile(language), name: current.name, stage: current.stage, stream: current.stream }));
    setScan({ status: 'running' });
    go('details', true);
  };

  const openSample = async () => {
    if (sampleBusy) return;
    setSampleBusy(true);
    try {
      const { report } = await fetchSample();
      const stored: StoredReading = { report, profile: emptyProfile(report.language) };
      setReading(stored);
      saveReading(stored);
      setReportPhoto(undefined);
      setReportTrace(null);
      setSlots({});
      go('report');
    } catch (error) {
      setToast(error instanceof Error ? error.message : t(language, 'errorGeneric'));
    } finally {
      setSampleBusy(false);
    }
  };

  return (
    <div className="app">
      <div className="sky" aria-hidden="true">
        <span className="blob blob--1" />
        <span className="blob blob--2" />
        <span className="blob blob--3" />
      </div>
      <div className="shell">
        <Header language={language} onLanguage={changeLanguage} onHome={() => go('home')} />

        {route === 'home' && (
          <Landing
            language={language}
            onStart={beginReading}
            onSample={() => void openSample()}
            onResume={reading ? () => go('report') : undefined}
            sampleBusy={sampleBusy}
          />
        )}

        {route === 'details' && (
          <Details
            language={language}
            profile={profile}
            onContinue={(next) => {
              setProfile(next);
              go('capture');
            }}
            onBack={() => go('home')}
          />
        )}

        {route === 'capture' && (
          <Capture
            language={language}
            profile={profile}
            slots={slots}
            onSlots={setSlots}
            onBack={() => go('details')}
            onAnalyze={() => go('scan')}
          />
        )}

        {route === 'scan' && (
          <Scanning
            language={language}
            status={scan.status}
            detail={scan.detail}
            photo={scanSlot?.status === 'ready' ? scanSlot.upload : undefined}
            trace={scanSlot?.status === 'ready' ? scanSlot.trace : null}
            onRetry={() => {
              started.current = true;
              void runAnalysis();
            }}
            onBack={() => go('capture')}
          />
        )}

        {route === 'report' && reading && (
          <ReportScreen
            report={reading.report}
            profile={reading.profile}
            photo={reportPhoto}
            trace={reportTrace}
            language={language}
            onNewReading={startNew}
            onToast={setToast}
          />
        )}
      </div>

      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}
