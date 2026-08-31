import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, MODES, todayStr } from '../store';
import BlobScene from '../components/BlobScene';
import ModeTabs from '../components/ModeTabs';
import Controls from '../components/Controls';
import SessionDots from '../components/SessionDots';
import StreakBadge from '../components/StreakBadge';
import DurationPicker from '../components/DurationPicker';
import FocusLogModal from '../components/FocusLogModal';
import { startBinauralBeats, startPinkNoise, stopSoundscape } from '../utils/audio';
import styles from './TimerPage.module.css';
// ── Formatted time ─────────────────────────────────────────────────────────────
function fmt(secs) {
  const s = Math.max(0, Math.floor(secs));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}


// ── Completion Choice Modal (00:00 completion prompt) ─────────────────────────
function CompletionChoiceModal() {
  const prompt = useStore(s => s.completedPrompt);
  const chooseFocusAgain = useStore(s => s.chooseFocusAgain);
  const chooseTakeBreak = useStore(s => s.chooseTakeBreak);

  if (!prompt) return null;

  const isBreak = prompt.isBreak;

  return (
    <div className={styles.overlay}>
      <div className={styles.choiceCard}>
        <span className={styles.choiceEmoji}>{isBreak ? '☕' : '🎉'}</span>
        <h2 className={styles.choiceTitle}>
          {isBreak ? 'Break Finished!' : 'Session Complete!'}
        </h2>
        <p className={styles.choiceSub}>
          {isBreak
            ? 'Feeling refreshed? Ready to jump back into focus mode?'
            : 'Great focus! Would you like to start another focus session or take a break?'}
        </p>

        <div className={styles.choiceBtnGroup}>
          <button className={styles.primaryChoiceBtn} onClick={chooseFocusAgain}>
            {isBreak ? 'Start Focus Mode 🎯' : 'Focus Again 🎯'}
          </button>
          <button className={styles.secondaryChoiceBtn} onClick={chooseTakeBreak}>
            {isBreak ? 'Extend Break ☕' : 'Take a Break ☕'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Timer Page ─────────────────────────────────────────────────────────────────
export default function TimerPage() {
  const [showFocusLog, setShowFocusLog] = useState(false);
  const mode = useStore(s => s.mode);
  const elapsed = useStore(s => s.elapsed);
  const running = useStore(s => s.running);
  const tick = useStore(s => s.tick);
  const dur = useStore(s => s.durations[s.mode]);
  const soundEnabled = useStore(s => s.soundEnabled);
  const toggleSound = useStore(s => s.toggleSound);
  const user = useStore(s => s.user);
  const logout = useStore(s => s.logout);
  const targetIntent = useStore(s => s.targetIntent);
  const setTargetIntent = useStore(s => s.setTargetIntent);
  const play = useStore(s => s.play);
  const pause = useStore(s => s.pause);
  const reset = useStore(s => s.reset);
  const skip = useStore(s => s.skip);
  const completedPrompt = useStore(s => s.completedPrompt);
  const dismissCompletedPrompt = useStore(s => s.dismissCompletedPrompt);

  const streak = useStore(s => s.streak);
  const lastActiveDate = useStore(s => s.lastActiveDate);
  const timezone = useStore(s => s.timezone);

  const soundscapeType = useStore(s => s.soundscapeType);
  const setSoundscape = useStore(s => s.setSoundscape);
  const warmupEnabled = useStore(s => s.warmupEnabled);
  const toggleWarmup = useStore(s => s.toggleWarmup);

  useEffect(() => {
    if (running && (mode === 'focus' || mode === 'ultradian')) {
      if (soundscapeType === '40hz') startBinauralBeats();
      else if (soundscapeType === 'pink') startPinkNoise();
      else stopSoundscape();
    } else {
      stopSoundscape();
    }
    return stopSoundscape;
  }, [running, mode, soundscapeType]);

  // Hybrid tick: rAF for smooth active visuals, Web Worker for reliable background ticking
  const rafRef = useRef();
  const tickCb = useRef(tick);
  tickCb.current = tick;

  useEffect(() => {
    // 1. Web Worker for background ticking (fires every ~250ms)
    // This ensures the timer catches completion even if rAF is paused by the browser
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
    worker.onmessage = () => {
      tickCb.current();
    };
    worker.postMessage('start');

    // 2. rAF for smooth visual updates when tab is active
    const loop = () => {
      if (document.visibilityState === 'visible') {
        tickCb.current();
      }
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

  // Document title
  const remaining = Math.max(0, dur - elapsed);
  useEffect(() => {
    document.title = `${fmt(remaining)} — CHRONO`;
  }, [remaining, mode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      // Don't trigger shortcuts when typing in inputs
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
        case 'Escape':
          if (completedPrompt) dismissCompletedPrompt();
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [running, play, pause, reset, skip, toggleSound, completedPrompt, dismissCompletedPrompt]);

  const today = todayStr(timezone);
  const hasCompletedToday = lastActiveDate === today;

  return (
    <div className={styles.pageViewport}>
      <CompletionChoiceModal />
      <FocusLogModal isOpen={showFocusLog} onClose={() => setShowFocusLog(false)} />

      {/* Top Header Bar */}
      <header className={styles.topHeader}>
        <div className={styles.brandTitle}>
          <span className={styles.brandDot} />
          <h1 className={styles.title}>CHRONO</h1>
        </div>
        <div className={styles.quoteBox}>
          &ldquo;Keep going, your hardest times often lead to great moments&rdquo;
        </div>
      </header>

      {/* Center Main Focus Container */}
      <main className={styles.centerStage}>
        <div className={styles.taskSelectorContainer}>
          <span className={styles.selectorLabel}>Target:</span>
          <input
            type="text"
            value={targetIntent}
            onChange={(e) => setTargetIntent(e.target.value)}
            className={styles.taskDropdown}
            placeholder="What are you focusing on?"
            style={{ cursor: 'text' }}
          />
          {streak > 0 && !hasCompletedToday && (
            <span
              className={styles.miniStreakWarning}
              title={user ? `Streak Warning: Complete a task focus session today to save your ${streak}-day streak!` : `Streak Warning: You are not logged in! Log in to protect your streak.`}
            >
              ⚠️
            </span>
          )}
        </div>

        <ModeTabs />

        <div className={styles.dotsRow}>
          <SessionDots />
        </div>

        {/* 3D Blob Scene & Countdown Display */}
        <div className={styles.blobWrap}>
          <BlobScene />
          <div className={styles.timeOverlay}>
            <span className={styles.time}>{fmt(remaining)}</span>
            <span className={styles.modeLabel}>
              {mode === 'warmup' ? 'WARM-UP: STARE AT THE DOT' : MODES[mode].label}
            </span>
          </div>
        </div>

        <Controls />
      </main>

      {/* Bottom Floating Dock Bar */}
      <footer className={styles.bottomDock}>
        <div className={styles.dockLeft}>
          <DurationPicker />
          
          <select 
            value={soundscapeType}
            onChange={(e) => setSoundscape(e.target.value)}
            className={styles.soundscapeSelect}
            title="Focus Soundscape"
          >
            <option value="none">No Soundscape</option>
            <option value="40hz">40Hz Binaural</option>
            <option value="pink">Pink Noise</option>
          </select>

          <button 
            className={`${styles.dockIconBtn} ${warmupEnabled ? styles.activeWarmup : ''}`}
            onClick={toggleWarmup}
            title={warmupEnabled ? 'Warm-up Enabled' : 'Warm-up Disabled'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>



        <div className={styles.dockRight}>
          <StreakBadge />

          <button
            className={styles.dockIconBtn}
            onClick={() => setShowFocusLog(true)}
            aria-label="View Activity Log"
            title="Activity Log"
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

          {user ? (
            <button className={styles.userBadge} onClick={logout} title={`Logged in as ${user.name} (${user.email}) - Click to log out`}>
              <span className={styles.userInitial}>{user.name ? user.name[0].toUpperCase() : 'U'}</span>
            </button>
          ) : (
            <Link to="/login" className={styles.loginBtn} title="Log in or Register to sync streaks">
              Log In
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
