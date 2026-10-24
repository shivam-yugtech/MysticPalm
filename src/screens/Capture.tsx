import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { HandGuide } from '../components/HandGuide';
import { HandMesh } from '../components/HandMesh';
import { TraceHud } from '../components/TraceHud';
import { Icon, PrivacyNote, Steps } from '../components/ui';
import { requiredRoles, slotUsable, type PhotoSlot, type PhotoSlots } from '../lib/capture';
import { trackVideo, traceImage, warmUpTracker, type TraceResult } from '../lib/handTracker';
import { t, type CopyKey } from '../lib/i18n';
import type { HandTrace } from '../lib/palmGeometry';
import { inspectImage, type QualityCode, type QualityResult } from '../lib/quality';
import type { Language, PhotoRole, Profile } from '../lib/report';

const QUALITY_COPY: Record<QualityCode, CopyKey> = {
  'too-dark': 'qDark',
  'too-bright': 'qBright',
  blurry: 'qBlur',
  'no-hand': 'qNoHand',
  'back-of-hand': 'qBack',
  'too-far': 'qFar',
  'no-landmarks': 'qLandmarks',
};

/**
 * The tracker sees a real hand far better than the colour heuristic, so a found hand
 * overrules "no hand" (which also stops the skin-colour check failing darker skin), and
 * a photo where it finds none gets a warning the user can override.
 */
function mergeTrace(result: QualityResult, status: TraceResult['status']): QualityResult {
  if (status === 'found') {
    const issues = result.issues.filter((code) => code !== 'no-hand');
    const score = Math.min(100, result.score + (result.issues.length - issues.length) * 30);
    return { ...result, issues, score, pass: issues.length === 0 };
  }
  if (status === 'none' && result.pass) {
    return { ...result, warnings: [...result.warnings, 'no-landmarks'], score: Math.max(0, result.score - 10) };
  }
  return result;
}

function QualityPanel({
  slot,
  language,
  onRetake,
  onConfirm,
}: {
  slot: Extract<PhotoSlot, { status: 'ready' | 'rejected' }>;
  language: Language;
  onRetake: () => void;
  onConfirm: () => void;
}) {
  const { result } = slot;
  const failed = slot.status === 'rejected';
  const primaryIssue: QualityCode | undefined = result.issues[0] ?? result.warnings[0];

  const checks: { key: CopyKey; icon: 'sun' | 'focus' | 'hand'; ok: boolean }[] = [
    { key: 'checkLight', icon: 'sun', ok: !result.issues.includes('too-dark') && !result.issues.includes('too-bright') },
    { key: 'checkFocus', icon: 'focus', ok: !result.issues.includes('blurry') },
    {
      key: 'checkHand',
      icon: 'hand',
      ok:
        !result.issues.includes('no-hand') &&
        !result.warnings.includes('too-far') &&
        !result.warnings.includes('no-landmarks'),
    },
    { key: 'checkPalmSide', icon: 'hand', ok: !result.warnings.includes('back-of-hand') },
  ];

  return (
    <div className={`quality${failed ? ' is-failed' : ''}`} role="status" aria-live="polite">
      <div className="quality__head">
        <span className="quality__title">{t(language, 'qualityTitle')}</span>
        <span className="quality__score">
          {result.score}
          <small>/100</small>
        </span>
      </div>

      <div className="checks">
        {checks.map((check) => (
          <span key={check.key} className={`check${check.ok ? ' is-ok' : ' is-bad'}`}>
            <Icon name={check.ok ? 'check' : 'alert'} size={13} />
            {t(language, check.key)}
          </span>
        ))}
      </div>

      {primaryIssue ? (
        <p className={`quality__message${failed ? ' is-bad' : ''}`}>
          <Icon name="alert" size={16} />
          {t(language, QUALITY_COPY[primaryIssue])}
        </p>
      ) : (
        <p className="quality__message is-good">
          <Icon name="check" size={16} />
          {t(language, 'photoGood')}
        </p>
      )}

      <div className="quality__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetake}>
          <Icon name="refresh" size={15} />
          {t(language, 'retake')}
        </button>
        {slot.status === 'ready' && result.warnings.length > 0 && !slot.confirmed && (
          <button type="button" className="btn btn--quiet btn--sm" onClick={onConfirm}>
            {t(language, 'useAnyway')}
          </button>
        )}
      </div>
    </div>
  );
}

export function Capture({
  language,
  profile,
  slots,
  onSlots,
  onBack,
  onAnalyze,
}: {
  language: Language;
  profile: Profile;
  slots: PhotoSlots;
  onSlots: Dispatch<SetStateAction<PhotoSlots>>;
  onBack: () => void;
  onAnalyze: () => void;
}) {
  const roles = requiredRoles(profile);
  const both = profile.handChoice === 'both';
  const [activeRole, setActiveRole] = useState<PhotoRole>(roles[0]);
  const [camera, setCamera] = useState<'idle' | 'starting' | 'live'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [liveTrace, setLiveTrace] = useState<HandTrace | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeSlot = slots[activeRole] ?? { status: 'empty' as const };
  const usable = roles.every((role) => slotUsable(slots[role]));

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setLiveTrace(null);
    setCamera('idle');
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => warmUpTracker('IMAGE'), []);

  useEffect(() => {
    const video = videoRef.current;
    if (camera !== 'live' || !video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    void video.play().catch(() => undefined);
    return trackVideo(video, setLiveTrace);
  }, [camera]);

  const startCamera = async () => {
    setError(null);
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t(language, 'cameraMissing'));
      return;
    }
    setCamera('starting');
    warmUpTracker('VIDEO');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1440 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamera('live');
    } catch (caught) {
      const name = caught instanceof DOMException ? caught.name : '';
      setCameraError(
        t(language, name === 'NotAllowedError' || name === 'SecurityError' ? 'cameraDenied' : 'cameraMissing'),
      );
      setCamera('idle');
    }
  };

  const inspect = async (blob: Blob) => {
    const role = activeRole;
    setError(null);
    onSlots((current) => ({ ...current, [role]: { status: 'checking' } }));
    try {
      const { result: pixels, upload } = await inspectImage(blob);
      onSlots((current) => ({ ...current, [role]: { status: 'checking', upload } }));

      const traced = await traceImage(upload);
      const trace = traced.status === 'found' ? traced.trace : null;
      const result = mergeTrace(pixels, traced.status);

      const next: PhotoSlot = result.pass
        ? { status: 'ready', upload, result, confirmed: result.warnings.length === 0, trace }
        : { status: 'rejected', upload, result, trace };

      onSlots((current) => ({ ...current, [role]: next }));

      if (both && result.pass && result.warnings.length === 0) {
        const other: PhotoRole = role === 'left' ? 'right' : 'left';
        const otherSlot = slots[other];
        if (!otherSlot || otherSlot.status === 'empty' || otherSlot.status === 'rejected') {
          // Let the trace animation finish before moving to the other hand.
          window.setTimeout(() => setActiveRole(other), trace ? 3200 : 700);
        }
      }
    } catch {
      setError(t(language, 'notImage'));
      onSlots((current) => ({ ...current, [role]: { status: 'empty' } }));
    }
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    if (!video?.videoWidth || activeSlot.status === 'checking') return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    stopCamera();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (blob) await inspect(blob);
  };

  const chooseFile = (file: File | undefined) => {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      setError(t(language, 'notImage'));
      return;
    }
    void inspect(file);
  };

  const setSlot = (role: PhotoRole, slot: PhotoSlot) => onSlots((current) => ({ ...current, [role]: slot }));

  const labelFor = (role: PhotoRole) =>
    t(language, role === 'left' ? 'handLeft' : 'handRight');

  const showPreview = activeSlot.status === 'ready' || activeSlot.status === 'rejected';

  const slotLabel = (slot: PhotoSlot | undefined) => {
    if (!slot || slot.status === 'empty' || slot.status === 'checking') return t(language, 'uploadPhoto');
    if (slot.status === 'rejected') return t(language, 'checkFail');
    return slotUsable(slot) ? t(language, 'checkPass') : t(language, 'reviewPhoto');
  };

  return (
    <main className="screen capture">
      <button type="button" className="link-btn" onClick={onBack}>
        <Icon name="back" size={16} />
        {t(language, 'back')}
      </button>
      <Steps step={2} language={language} />
      <h1 className="title">{t(language, 'captureTitle')}</h1>
      <p className="subtitle">{t(language, 'captureSub')}</p>

      {both && (
        <div className="slots" role="tablist" aria-label={t(language, 'captureTitle')}>
          {roles.map((role) => {
            const slot = slots[role];
            return (
              <button
                key={role}
                type="button"
                role="tab"
                aria-selected={activeRole === role}
                className={`slot${activeRole === role ? ' is-active' : ''}${slotUsable(slot) ? ' is-done' : ''}`}
                onClick={() => {
                  stopCamera();
                  setActiveRole(role);
                }}
              >
                <span className="slot__thumb">
                  {slot && slot.status !== 'empty' && slot.status !== 'checking' ? (
                    <img src={slot.upload} alt="" />
                  ) : (
                    <Icon name="hand" size={18} />
                  )}
                </span>
                <span>
                  <strong>{labelFor(role)}</strong>
                  <small>
                    {slotLabel(slot)}
                  </small>
                </span>
                {slotUsable(slot) && <Icon name="check" size={15} className="slot__tick" />}
              </button>
            );
          })}
        </div>
      )}

      <div
        className={`stage${camera === 'live' ? ' is-live' : ''}${showPreview ? ' has-photo' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          chooseFile(event.dataTransfer.files[0]);
        }}
      >
        {camera === 'live' ? (
          <>
            <video ref={videoRef} className="stage__video" playsInline muted />
            <div className={`stage__brackets${liveTrace ? ' is-locked' : ''}`} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            {liveTrace ? (
              <HandMesh trace={liveTrace} variant="live" language={language} lines={false} labels={false} className="stage__mesh" />
            ) : (
              <HandGuide className="stage__guide" />
            )}
            <p className={`stage__hint${liveTrace ? ' is-locked' : ''}`}>
              <span className="stage__hint-dot" aria-hidden="true" />
              {t(language, liveTrace ? 'liveLocked' : 'liveSearching')}
            </p>
          </>
        ) : showPreview || (activeSlot.status === 'checking' && activeSlot.upload) ? (
          <>
            <img
              className={`stage__photo${activeSlot.status === 'rejected' ? ' is-dim' : ''}`}
              src={activeSlot.upload}
              alt={`${labelFor(activeRole)} ${t(language, 'captureTitle')}`}
            />
            {showPreview && activeSlot.trace && (
              <>
                <HandMesh
                  key={activeSlot.upload.length + activeRole}
                  trace={activeSlot.trace}
                  variant="reveal"
                  language={language}
                  fit="meet"
                  className="stage__mesh"
                />
                <TraceHud trace={activeSlot.trace} language={language} />
              </>
            )}
          </>
        ) : (
          <div className="stage__idle">
            <div className="stage__halo" />
            <HandGuide className="stage__ghost" />
            <p>{t(language, 'cameraHint')}</p>
          </div>
        )}

        {activeSlot.status === 'checking' &&
          (activeSlot.upload ? (
            <>
              <div className="stage__sweep" aria-hidden="true" />
              <div className="stage__status">
                <span className="spinner spinner--sm" aria-hidden="true" />
                {t(language, 'traceDetecting')}
              </div>
            </>
          ) : (
            <div className="stage__checking">
              <span className="spinner" aria-hidden="true" />
              {t(language, 'checking')}
            </div>
          ))}

        {dragging && <div className="stage__drop">{t(language, 'dropHere')}</div>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          chooseFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {cameraError && (
        <p className="alert alert--warn" role="alert">
          <Icon name="alert" size={15} />
          {cameraError}
        </p>
      )}
      {error && (
        <p className="alert alert--warn" role="alert">
          <Icon name="alert" size={15} />
          {error}
        </p>
      )}

      {showPreview && (
        <QualityPanel
          slot={activeSlot}
          language={language}
          onRetake={() => {
            setSlot(activeRole, { status: 'empty' });
            setError(null);
          }}
          onConfirm={() => {
            if (activeSlot.status === 'ready') setSlot(activeRole, { ...activeSlot, confirmed: true });
          }}
        />
      )}

      <div className="capture-actions">
        {camera === 'live' ? (
          <>
            <button type="button" className="btn btn--primary" onClick={() => void takePhoto()}>
              <Icon name="camera" size={18} />
              {t(language, 'captureButton')}
            </button>
            <button type="button" className="btn btn--ghost" onClick={stopCamera}>
              <Icon name="close" size={16} />
              {t(language, 'cancelCamera')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void startCamera()}
              disabled={camera === 'starting' || activeSlot.status === 'checking'}
              aria-busy={camera === 'starting'}
            >
              <Icon name="camera" size={18} />
              {t(language, camera === 'starting' ? 'cameraStarting' : 'startCamera')}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => fileRef.current?.click()}
              disabled={activeSlot.status === 'checking'}
            >
              <Icon name="upload" size={18} />
              {t(language, 'uploadPhoto')}
            </button>
          </>
        )}
      </div>

      <PrivacyNote language={language} long />

      <div className="screen-actions">
        <button type="button" className="btn btn--primary btn--block" disabled={!usable} onClick={onAnalyze}>
          <span aria-hidden="true">✨</span>
          {t(language, 'analyzing')}
          <Icon name="arrow" size={18} />
        </button>
        {!usable && both && <p className="hint">{t(language, 'needBoth')}</p>}
      </div>
    </main>
  );
}
