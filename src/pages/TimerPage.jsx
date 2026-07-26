import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStore, MODES } from '../store';
import BlobScene       from '../components/BlobScene';
import ModeTabs        from '../components/ModeTabs';
import Controls        from '../components/Controls';
import SessionDots     from '../components/SessionDots';
import StreakBadge     from '../components/StreakBadge';
import DurationPicker  from '../components/DurationPicker';
import MusicPlayer     from '../components/MusicPlayer';
import SettingsModal   from '../components/SettingsModal';
import styles from './TimerPage.module.css';



// ── Formatted time ─────────────────────────────────────────────────────────────
function fmt(secs) {
  const s = Math.max(0, Math.floor(secs));
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}

// ── XP float toast ─────────────────────────────────────────────────────────────
function XpToast() {
  const xpFlash      = useStore(s => s.xpFlash);
  const clearXpFlash = useStore(s => s.clearXpFlash);

  useEffect(() => {
    if (!xpFlash) return;
    const t = setTimeout(clearXpFlash, 2000);
    return () => clearTimeout(t);
  }, [xpFlash]);

  if (!xpFlash) return null;
  return (
    <div className={styles.xpToast}>
      +{xpFlash.amount} XP{xpFlash.bonus ? ' 🔥' : ''}
      {xpFlash.levelUp && <span className={styles.lvlUp}> · LEVEL UP!</span>}
    </div>
  );
}

// ── Milestone modal ─────────────────────────────────────────────────────────────
function MilestoneModal() {
  const milestone       = useStore(s => s.milestone);
  const dismissMilestone = useStore(s => s.dismissMilestone);
  const canvasRef = useRef();
  const rafRef    = useRef();

  useEffect(() => {
    if (!milestone) return;
    const cv  = canvasRef.current;
    const ctx = cv.getContext('2d');
    cv.width  = window.innerWidth;
    cv.height = window.innerHeight;
    const COLORS = ['#a78bfa','#60a5fa','#34d399','#fbbf24','#f87171','#f0abfc','#fff'];
    const pts = Array.from({ length: 110 }, () => ({
      x:  Math.random() * cv.width,
      y: -10 - Math.random() * 160,
      vx: (Math.random() - .5) * 3.5,
      vy: 2 + Math.random() * 3.5,
      sz: 4 + Math.random() * 5,
      color: COLORS[Math.random() * COLORS.length | 0],
      rot: Math.random() * 360,
      rv: (Math.random() - .5) * 8,
      rect: Math.random() > .5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      let alive = false;
      for (const p of pts) {
        if (p.y < cv.height + 20) alive = true;
        p.x += p.vx; p.y += p.vy; p.rot += p.rv; p.vy += .065;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - p.y / cv.height);
        if (p.rect) ctx.fillRect(-p.sz/2, -p.sz/4, p.sz, p.sz/2);
        else { ctx.beginPath(); ctx.arc(0,0,p.sz/2,0,Math.PI*2); ctx.fill(); }
        ctx.restore();
      }
      if (alive) rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0,0,cv.width,cv.height);
    };
  }, [milestone]);

  if (!milestone) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && dismissMilestone()}>
      <canvas ref={canvasRef} className={styles.confetti} />
      <div className={styles.milestoneCard}>
        <span className={styles.milestoneEmoji}>{milestone.emoji}</span>
        <h2 className={styles.milestoneTitle}>{milestone.title}</h2>
        <p className={styles.milestoneSub}>{milestone.sub}</p>
        <button className={styles.milestoneBtn} onClick={dismissMilestone}>
          Keep Going →
        </button>
      </div>
    </div>
  );
}

// ── Completion Choice Modal (00:00 completion prompt) ─────────────────────────
function CompletionChoiceModal() {
  const prompt           = useStore(s => s.completedPrompt);
  const chooseFocusAgain = useStore(s => s.chooseFocusAgain);
  const chooseTakeBreak  = useStore(s => s.chooseTakeBreak);

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
  const mode         = useStore(s => s.mode);
  const elapsed      = useStore(s => s.elapsed);
  const tick         = useStore(s => s.tick);
  const dur          = useStore(s => s.durations[s.mode]);
  const soundEnabled = useStore(s => s.soundEnabled);
  const toggleSound    = useStore(s => s.toggleSound);
  const toggleSettings = useStore(s => s.toggleSettings);
  const user           = useStore(s => s.user);
  const logout         = useStore(s => s.logout);
  const tasks        = useStore(s => s.tasks || []);
  const activeTaskId = useStore(s => s.activeTaskId);
  const activeTask   = tasks.find(t => t.id === activeTaskId);
  const setActiveTaskId = useStore(s => s.setActiveTaskId);
  
  const streak         = useStore(s => s.streak);
  const lastActiveDate = useStore(s => s.lastActiveDate);

  // rAF-driven tick
  const rafRef   = useRef();
  const tickCb   = useRef(tick);
  tickCb.current = tick;

  useEffect(() => {
    const loop = () => { tickCb.current(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Document title
  const remaining = Math.max(0, dur - elapsed);
  useEffect(() => {
    document.title = `${fmt(remaining)} — CHRONO`;
  }, [remaining, mode]);

  const today = new Date().toISOString().split('T')[0];
  const hasCompletedToday = lastActiveDate === today;

  return (
    <div className={styles.pageViewport}>
      <MilestoneModal />
      <CompletionChoiceModal />
      <SettingsModal />

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
          <span className={styles.selectorLabel}>🎯 Target:</span>
          <select
            value={activeTaskId || ''}
            onChange={(e) => setActiveTaskId(e.target.value || null)}
            className={styles.taskDropdown}
            title={activeTask ? activeTask.description : 'Select a study task from your roadmap queue'}
          >
            <option value="">-- No active focus task --</option>
            {tasks.filter(t => !t.completed).map(t => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
            {tasks.filter(t => !t.completed).length === 0 && (
              <option value="" disabled>No active tasks. Go to Study Hub to import!</option>
            )}
          </select>
          {activeTask && (
            <span className={styles.activeTaskPomoCount}>
              ({activeTask.sessionsCompleted} Pomos)
            </span>
          )}
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
            <XpToast />
            <span className={styles.time}>{fmt(remaining)}</span>
            <span className={styles.modeLabel}>{MODES[mode].label}</span>
          </div>
        </div>

        <Controls />
      </main>

      {/* Bottom Floating Dock Bar */}
      <footer className={styles.bottomDock}>
        <div className={styles.dockLeft}>
          <DurationPicker />
        </div>

        <div className={styles.dockRight}>
          <StreakBadge />

          <MusicPlayer />

          <button
            className={`${styles.dockIconBtn} ${!soundEnabled ? styles.muted : ''}`}
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            title={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
          >
            {soundEnabled ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            )}
          </button>

          <Link to="/tasks" className={styles.dockIconBtn} aria-label="Tasks & Roadmap" title="Tasks & Roadmap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </Link>

          <Link to="/analytics" className={styles.dockIconBtn} aria-label="Analytics" title="Analytics">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
          </Link>

          {/* Settings Button (Bottom Right Dock) */}
          <button
            className={styles.dockIconBtn}
            onClick={toggleSettings}
            aria-label="Settings"
            title="Customization Settings (Unlockable Visualizers & Backgrounds)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
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
