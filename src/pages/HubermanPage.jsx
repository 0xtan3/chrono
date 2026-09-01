import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, HUBERMAN_PHASES } from '../store';
import BlobScene from '../components/BlobScene';
import PhaseStepper from '../components/PhaseStepper';
import HubermanLogModal from '../components/HubermanLogModal';
import { startBinauralBeats, startPinkNoise, stopSoundscape } from '../utils/audio';
import styles from './HubermanPage.module.css';

// ── Formatted time ─────────────────────────────────────────────────────────────
function fmt(secs) {
  const s = Math.max(0, Math.floor(secs));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(mins).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ── Phase Completion Prompt ───────────────────────────────────────────────────
function PhaseCompleteModal() {
  const completedPhase = useStore(s => s.huberman.completedPhase);
  const hubermanStartNsdr = useStore(s => s.hubermanStartNsdr);
  const hubermanSkipNsdr = useStore(s => s.hubermanSkipNsdr);
  const hubermanDismissCompleted = useStore(s => s.hubermanDismissCompleted);
  const hubermanPlay = useStore(s => s.hubermanPlay);
  const phase = useStore(s => s.huberman.phase);

  if (!completedPhase) return null;

  if (completedPhase === 'focus') {
    return (
      <div className={styles.overlay}>
        <div className={styles.choiceCard}>
          <span className={styles.choiceEmoji}>🧠</span>
          <h2 className={styles.choiceTitle}>Deep Work Complete!</h2>
          <p className={styles.choiceSub}>
            Incredible focus. Huberman recommends 20 minutes of Non-Sleep Deep Rest to consolidate learning and replenish dopamine.
          </p>
          <div className={styles.choiceBtnGroup}>
            <button className={styles.primaryChoiceBtn} onClick={hubermanStartNsdr}>
              Start NSDR 🌊
            </button>
            <button className={styles.secondaryChoiceBtn} onClick={hubermanSkipNsdr}>
              Skip & Finish Cycle
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (completedPhase === 'nsdr') {
    return (
      <div className={styles.overlay}>
        <div className={styles.choiceCard}>
          <span className={styles.choiceEmoji}>✨</span>
          <h2 className={styles.choiceTitle}>Cycle Complete!</h2>
          <p className={styles.choiceSub}>
            Full Huberman protocol cycle finished. Your brain has been primed, worked, and restored. Start another cycle or take a longer break.
          </p>
          <div className={styles.choiceBtnGroup}>
            <button className={styles.primaryChoiceBtn} onClick={() => {
              hubermanDismissCompleted();
              hubermanPlay();
            }}>
              Start New Cycle 🔄
            </button>
            <button className={styles.secondaryChoiceBtn} onClick={hubermanDismissCompleted}>
              Done for Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Huberman Page ──────────────────────────────────────────────────────────────
export default function HubermanPage() {
  const [showLog, setShowLog] = useState(false);

  const h = useStore(s => s.huberman);
  const hubermanPlay = useStore(s => s.hubermanPlay);
  const hubermanPause = useStore(s => s.hubermanPause);
  const hubermanReset = useStore(s => s.hubermanReset);
  const hubermanSkip = useStore(s => s.hubermanSkip);
  const hubermanTick = useStore(s => s.hubermanTick);
  const hubermanSetIntent = useStore(s => s.hubermanSetIntent);
  const hubermanSetSoundscape = useStore(s => s.hubermanSetSoundscape);
  const hubermanToggleWarmup = useStore(s => s.hubermanToggleWarmup);
  const soundEnabled = useStore(s => s.soundEnabled);
  const toggleSound = useStore(s => s.toggleSound);

  // Tick engine (same hybrid approach as TimerPage)
  const rafRef = useRef();
  const tickCb = useRef(hubermanTick);
  tickCb.current = hubermanTick;

  useEffect(() => {
    const workerBlob = new Blob([`
      let interval;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          interval = setInterval(() => self.postMessage('tick'), 250);
        } else if (e.data === 'stop') {
          clearInterval(interval);
        }
      };
    `], { type: 'application/javascript' });

    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);
    worker.onmessage = () => tickCb.current();
    worker.postMessage('start');

    const loop = () => {
      if (document.visibilityState === 'visible') tickCb.current();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      worker.postMessage('stop');
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Soundscape lifecycle
  useEffect(() => {
    if (h.running && h.phase === 'focus') {
      if (h.soundscape === '40hz') startBinauralBeats();
      else if (h.soundscape === 'pink') startPinkNoise();
      else stopSoundscape();
    } else {
      stopSoundscape();
    }
    return stopSoundscape;
  }, [h.running, h.phase, h.soundscape]);

  // Document title
  const getDuration = () => {
    if (h.phase === 'warmup') return h.warmupDuration;
    if (h.phase === 'focus') return h.focusDuration;
    if (h.phase === 'nsdr') return h.nsdrDuration;
    return 0;
  };
  const remaining = Math.max(0, getDuration() - h.elapsed);

  useEffect(() => {
    if (h.phase !== 'idle') {
      document.title = `${fmt(remaining)} — HUBERMAN — CHRONO`;
    } else {
      document.title = 'Huberman Protocol — CHRONO';
    }
  }, [remaining, h.phase]);

  // Button label
  const getButtonLabel = () => {
    if (h.phase === 'idle') return 'Start Protocol';
    if (h.running) return 'Pause';
    return 'Resume';
  };

  const getPhaseLabel = () => {
    if (h.phase === 'idle') return 'Ready to begin';
    if (h.phase === 'warmup') return 'STARE AT THE DOT';
    return HUBERMAN_PHASES[h.phase]?.label || '';
  };

  return (
    <div className={styles.pageViewport}>
      <PhaseCompleteModal />
      <HubermanLogModal isOpen={showLog} onClose={() => setShowLog(false)} />

      {/* Top Header */}
      <header className={styles.topHeader}>
        <div className={styles.brandTitle}>
          <Link to="/" className={styles.backLink} title="Back to Pomodoro">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <span className={styles.brandDot} />
          <h1 className={styles.title}>HUBERMAN PROTOCOL</h1>
        </div>
        <div className={styles.protocolBadge}>🧠 Neuroscience-Based Focus</div>
      </header>

      {/* Center Stage */}
      <main className={styles.centerStage}>
        {/* Target Intent */}
        <div className={styles.intentContainer}>
          <span className={styles.intentLabel}>Deep Work Target:</span>
          <input
            type="text"
            value={h.targetIntent}
            onChange={(e) => hubermanSetIntent(e.target.value)}
            className={styles.intentInput}
            placeholder="What demands your deepest focus?"
            style={{ cursor: 'text' }}
          />
        </div>

        {/* Phase Stepper */}
        <PhaseStepper currentPhase={h.phase} warmupEnabled={h.warmupEnabled} />

        {/* 3D Blob */}
        <div className={styles.blobWrap}>
          <BlobScene hubermanPhase={h.phase === 'idle' ? undefined : h.phase} />
          <div className={styles.timeOverlay}>
            <span className={styles.time}>
              {h.phase === 'idle' ? fmt(h.focusDuration) : fmt(remaining)}
            </span>
            <span className={styles.phaseLabel}>{getPhaseLabel()}</span>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <button
            className={`${styles.mainBtn} ${h.running ? styles.runningBtn : ''}`}
            onClick={() => h.running ? hubermanPause() : hubermanPlay()}
          >
            {getButtonLabel()}
          </button>

          {h.phase !== 'idle' && (
            <>
              <button className={styles.resetBtn} onClick={hubermanReset} title="Reset Protocol">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
              <button className={styles.skipBtn} onClick={hubermanSkip} title="Skip Phase">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 4 15 12 5 20 5 4" />
                  <line x1="19" y1="5" x2="19" y2="19" />
                </svg>
              </button>
            </>
          )}
        </div>
      </main>

      {/* Bottom Dock */}
      <footer className={styles.bottomDock}>
        <div className={styles.dockLeft}>
          <select
            value={h.soundscape}
            onChange={(e) => hubermanSetSoundscape(e.target.value)}
            className={styles.soundscapeSelect}
            title="Focus Soundscape"
          >
            <option value="none">No Soundscape</option>
            <option value="40hz">40Hz Binaural</option>
            <option value="pink">Pink Noise</option>
          </select>

          <button
            className={`${styles.dockIconBtn} ${h.warmupEnabled ? styles.warmupActive : ''}`}
            onClick={hubermanToggleWarmup}
            title={h.warmupEnabled ? 'Warm-up: ON' : 'Warm-up: OFF'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        <div className={styles.dockRight}>
          <div className={styles.cycleBadge} title="Cycles completed">
            <span className={styles.cycleCount}>{h.cyclesCompleted}</span>
            <span className={styles.cycleLabel}>cycles</span>
          </div>

          <button
            className={styles.dockIconBtn}
            onClick={() => setShowLog(true)}
            aria-label="View Protocol Log"
            title="Protocol Log"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>

          <button
            className={styles.dockIconBtn}
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            title={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
          >
            {soundEnabled ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
