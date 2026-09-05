import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useStore, MODES, todayStr } from '../store';
import BlobScene from '../components/BlobScene';
import ModeTabs from '../components/ModeTabs';
import PhaseStepper from '../components/PhaseStepper';
import Controls from '../components/Controls';
import StreakBadge from '../components/StreakBadge';
import LevelBadge from '../components/LevelBadge';
import DailyProgressBar from '../components/DailyProgressBar';
import DurationPicker from '../components/DurationPicker';
import FocusLogModal from '../components/FocusLogModal';
import XPToast from '../components/XPToast';
import Avatar from '../components/Avatar';
import MiniPlayer from '../components/MiniPlayer';
import miniPlayerStyles from '../components/MiniPlayer.module.css';
import { startBinauralBeats, startPinkNoise, stopSoundscape } from '../utils/audio';
import { requestNotificationPermission, sendSiteSwitchedNotification } from '../utils/notifications';
import styles from './TimerPage.module.css';

// ── Formatted time ─────────────────────────────────────────────────────────────
function fmt(secs) {
  const s = Math.max(0, Math.floor(secs));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(mins).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ── Completion Choice Modal (Prompt after session) ────────────────────────────
function CompletionChoiceModal() {
  const prompt = useStore((s) => s.completedPrompt);
  const dismiss = useStore((s) => s.dismissCompletedPrompt);
  const chooseNextMode = useStore((s) => s.chooseNextMode);

  if (!prompt) return null;

  const { title, sub, primaryLabel, secondaryLabel, nextMode, xpEarned, rewardTier } = prompt;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.choiceCard} ${styles[rewardTier] || ''}`}>
        <span className={styles.choiceEmoji}>
          {rewardTier === 'legendary' ? '👑' : rewardTier === 'critical' ? '⚡' : nextMode === 'recovery' ? '🧠' : '✨'}
        </span>
        <h2 className={styles.choiceTitle}>{title}</h2>
        <p className={styles.choiceSub}>{sub}</p>

        {xpEarned && (
          <div className={styles.rewardSummaryPill}>
            <span>XP Earned:</span>
            <strong className={styles.xpAmount}>+{xpEarned} XP</strong>
          </div>
        )}

        <div className={styles.choiceBtnGroup}>
          <button className={styles.primaryChoiceBtn} onClick={() => chooseNextMode(nextMode)}>
            {primaryLabel}
          </button>
          <button className={styles.secondaryChoiceBtn} onClick={dismiss}>
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Unified Timer Page ───────────────────────────────────────────────────
export default function TimerPage() {
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [showSiteSwitchPrompt, setShowSiteSwitchPrompt] = useState(false);
  const miniPlayerRef = useRef(null);

  const mode            = useStore((s) => s.mode);
  const protocolPhase   = useStore((s) => s.protocolPhase);
  const elapsed         = useStore((s) => s.elapsed);
  const running         = useStore((s) => s.running);
  const tick            = useStore((s) => s.tick);
  const durations       = useStore((s) => s.durations);
  const warmupEnabled   = useStore((s) => s.warmupEnabled);
  const toggleWarmup    = useStore((s) => s.toggleWarmup);
  const soundscapeType  = useStore((s) => s.soundscapeType);
  const setSoundscape   = useStore((s) => s.setSoundscape);
  const soundEnabled    = useStore((s) => s.soundEnabled);
  const toggleSound     = useStore((s) => s.toggleSound);
  const user            = useStore((s) => s.user);
  const logout          = useStore((s) => s.logout);
  const targetIntent    = useStore((s) => s.targetIntent);
  const setTargetIntent = useStore((s) => s.setTargetIntent);
  const play            = useStore((s) => s.play);
  const pause           = useStore((s) => s.pause);
  const reset           = useStore((s) => s.reset);
  const skip            = useStore((s) => s.skip);
  const completedPrompt = useStore((s) => s.completedPrompt);
  const dismissPrompt   = useStore((s) => s.dismissCompletedPrompt);
  const miniPlayerOpen  = useStore((s) => s.miniPlayerOpen);
  const toggleMiniPlayer = useStore((s) => s.toggleMiniPlayer);
  const setMiniPlayerOpen = useStore((s) => s.setMiniPlayerOpen);

  const streak          = useStore((s) => s.streak);
  const lastActiveDate  = useStore((s) => s.lastActiveDate);
  const timezone        = useStore((s) => s.timezone);

  const isWarmup = mode === 'deep' && protocolPhase === 'warmup';
  const dur = isWarmup ? durations.warmup : (durations[mode] || 1);
  const remaining = Math.max(0, dur - elapsed);

  // 1. Hybrid Tick Engine (Worker + rAF)
  const rafRef = useRef();
  const tickCb = useRef(tick);
  tickCb.current = tick;

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

  // 2. Soundscape Audio Lifecycle
  useEffect(() => {
    if (running && (mode === 'deep' || mode === 'quick') && !isWarmup) {
      if (soundscapeType === '40hz') startBinauralBeats();
      else if (soundscapeType === 'pink') startPinkNoise();
      else stopSoundscape();
    } else {
      stopSoundscape();
    }
    return stopSoundscape;
  }, [running, mode, soundscapeType, isWarmup]);

  // 3. Document Title
  useEffect(() => {
    document.title = 'CHRONO';
  }, []);

  const handleToggleMiniPlayer = useCallback(async () => {
    if (miniPlayerRef.current?.isPipOpen()) {
      miniPlayerRef.current.closePip();
    } else if (miniPlayerOpen) {
      setMiniPlayerOpen(false);
    } else {
      if (miniPlayerRef.current?.openPip) {
        const opened = await miniPlayerRef.current.openPip();
        if (!opened && !('documentPictureInPicture' in window)) {
          setMiniPlayerOpen(true);
        }
      } else {
        setMiniPlayerOpen(true);
      }
    }
  }, [miniPlayerOpen, setMiniPlayerOpen]);

  // 4. Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (running) pause();
          else play();
          break;
        case 'KeyR':
          if (!e.ctrlKey && !e.metaKey) reset();
          break;
        case 'KeyS':
          if (!e.ctrlKey && !e.metaKey) skip();
          break;
        case 'KeyM':
          if (!e.ctrlKey && !e.metaKey) toggleSound();
          break;
        case 'KeyP':
          if (!e.ctrlKey && !e.metaKey) handleToggleMiniPlayer();
          break;
        case 'Escape':
          if (completedPrompt) dismissPrompt();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [running, play, pause, reset, skip, toggleSound, handleToggleMiniPlayer, completedPrompt, dismissPrompt]);

  // 5. Site Switched Detection & Notification
  useEffect(() => {
    if (running && 'Notification' in window && Notification.permission === 'default') {
      requestNotificationPermission();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (running && !miniPlayerOpen) {
          sendSiteSwitchedNotification(() => {
            setShowSiteSwitchPrompt(true);
            setMiniPlayerOpen(true);
            miniPlayerRef.current?.openPip();
          });
          setShowSiteSwitchPrompt(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [running, miniPlayerOpen, setMiniPlayerOpen]);

  const today = todayStr(timezone);
  const hasCompletedToday = lastActiveDate === today;

  // Sublabel for 3D Blob overlay
  const getBlobSublabel = () => {
    if (isWarmup) return 'VISUAL PRIMER: LOCK YOUR EYES';
    if (mode === 'deep') return 'DEEP WORK PROTOCOL';
    if (mode === 'recovery') return 'NEURAL RESET';
    return MODES[mode]?.label?.toUpperCase() || '';
  };

  return (
    <div className={styles.pageViewport}>
      <CompletionChoiceModal />
      <FocusLogModal isOpen={showCommandCenter} onClose={() => setShowCommandCenter(false)} />
      <XPToast />
      <MiniPlayer ref={miniPlayerRef} />

      {/* Site Switched Notification Banner */}
      {showSiteSwitchPrompt && (
        <aside className={miniPlayerStyles.switchPrompt} role="alert">
          <span className={miniPlayerStyles.switchPromptIcon}>⏱️</span>
          <span className={miniPlayerStyles.switchPromptText}>
            Switched away while focusing? Use Mini Player on your screen.
          </span>
          <button
            className={miniPlayerStyles.switchPromptAcceptBtn}
            onClick={async () => {
              setShowSiteSwitchPrompt(false);
              if (miniPlayerRef.current?.openPip) {
                const opened = await miniPlayerRef.current.openPip();
                if (!opened && !('documentPictureInPicture' in window)) {
                  setMiniPlayerOpen(true);
                }
              } else {
                setMiniPlayerOpen(true);
              }
            }}
          >
            <span>Yes, Use Mini Player</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button
            className={miniPlayerStyles.switchPromptDismissBtn}
            onClick={() => setShowSiteSwitchPrompt(false)}
            title="Dismiss"
            aria-label="Dismiss prompt"
          >
            ✕
          </button>
        </aside>
      )}

      {/* Top Header Bar */}
      <header className={styles.topHeader}>
        <div className={styles.brandTitle}>
          <span className={styles.brandDot} />
          <h1 className={styles.title}>CHRONO</h1>
        </div>

        <div className={styles.headerRight}>
          <Link to="/leaderboard" className={styles.leaderboardIconBtn} title="View Leaderboard" aria-label="Leaderboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
            </svg>
          </Link>
          <StreakBadge />
          {/* Level & Rank Badge (Clickable to open Command Center) */}
          <LevelBadge onClick={() => setShowCommandCenter(true)} />
        </div>
      </header>

      {/* Center Main Focus Container */}
      <main className={styles.centerStage}>
        {/* Target Intent Input */}
        <div className={styles.taskSelectorContainer}>
          <span className={styles.selectorLabel}>Target:</span>
          <input
            type="text"
            value={targetIntent}
            onChange={(e) => setTargetIntent(e.target.value)}
            className={styles.taskDropdown}
            placeholder={mode === 'deep' ? 'What demands your deep focus?' : 'What are you working on?'}
            style={{ cursor: 'text' }}
          />
          {streak > 0 && !hasCompletedToday && (
            <span
              className={styles.miniStreakWarning}
              title={`Save your ${streak}-day streak! Complete a study session today to protect your XP multiplier.`}
            >
              ⚠️
            </span>
          )}
        </div>

        {/* Mode Selector Tabs */}
        <ModeTabs />

        {/* Protocol Phase Stepper (Only active in Deep Work) */}
        {mode === 'deep' && (
          <div className={styles.stepperWrap}>
            <PhaseStepper currentPhase={protocolPhase} warmupEnabled={warmupEnabled} />
          </div>
        )}

        {/* 3D Liquid Scene & Countdown Display */}
        <div className={styles.blobWrap}>
          <BlobScene />
          <div className={styles.timeOverlay}>
            <span className={styles.time}>{fmt(remaining)}</span>
            <span className={`${styles.modeLabel} ${isWarmup ? styles.warmupText : ''}`}>
              {getBlobSublabel()}
            </span>
          </div>
        </div>

        {/* Daily Study Target Progress Bar */}
        <DailyProgressBar />

        {/* Controls (Start, Pause, Reset) */}
        <Controls />
      </main>

      {/* Bottom Floating Command Dock */}
      <footer className={styles.bottomDock}>
        <div className={styles.dockLeft}>
          <DurationPicker />
        </div>

        <div className={styles.dockRight}>
          {/* Visual Primer Warmup Toggle */}
          <button
            className={`${styles.dockIconBtn} ${warmupEnabled ? styles.activeWarmup : ''}`}
            onClick={toggleWarmup}
            title={warmupEnabled ? 'Visual Primer (Warm-up): ON' : 'Visual Primer: OFF'}
            aria-label="Toggle Visual Primer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>

          {/* Soundscape Selector (40Hz Gamma Beat / Pink Noise) */}
          <select
            value={soundscapeType}
            onChange={(e) => setSoundscape(e.target.value)}
            className={styles.soundscapeSelect}
            title="Acoustic Enhancer"
          >
            <option value="40hz">🧠 40Hz Gamma</option>
            <option value="pink">🌊 Pink Noise</option>
            <option value="none">🔇 Soundscape Off</option>
          </select>


          {/* Audio Chime Mute/Unmute */}
          <button
            className={styles.dockIconBtn}
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute chimes' : 'Unmute chimes'}
            title={soundEnabled ? 'Chimes Active' : 'Chimes Muted'}
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

          {/* Mini Player Direct 1-Click Launch */}
          <button
            className={`${styles.dockIconBtn} ${miniPlayerOpen ? styles.activeMiniPlayer : ''}`}
            onClick={handleToggleMiniPlayer}
            title={miniPlayerOpen ? 'Close Mini Player (P)' : 'Open Mini Player (P)'}
            aria-label="Toggle Mini Player"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <rect x="12" y="9" width="8" height="6" rx="1" />
              <circle cx="6" cy="10" r="1" fill="currentColor" />
            </svg>
          </button>

        </div>
      </footer>
    </div>
  );
}
