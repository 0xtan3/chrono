import { create } from 'zustand';
import { playFocusChime, playBreakChime, unlockAudio } from './utils/audio';
import { getCurrentUser, logoutUser, fetchUserStats, saveUserStats } from './lib/appwrite';

// ── Pomodoro Mode config ──────────────────────────────────────────────────────
export const MODES = {
  focus: { label: 'Focus', h: 252, s: 88, lb: 65, defaultMin: 25 },
  short: { label: 'Short Break', h: 162, s: 72, lb: 60, defaultMin: 5 },
  long: { label: 'Long Break', h: 200, s: 78, lb: 62, defaultMin: 15 },
};
export const FOCUS_PRESETS = [25, 50, 90];
export const BREAK_PRESETS = [5, 10, 15];

// ── Huberman Phase config ─────────────────────────────────────────────────────
export const HUBERMAN_PHASES = {
  idle:   { label: 'Ready',    h: 252, s: 88, lb: 65 },
  warmup: { label: 'Warm-up',  h: 0,   s: 0,  lb: 95 },
  focus:  { label: 'Deep Work', h: 280, s: 80, lb: 60 },
  nsdr:   { label: 'NSDR',     h: 220, s: 60, lb: 40 },
};

// ── Date helpers ─────────────────────────────────────────────────────────────
export function todayStr(tz) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}
function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}

// ── Persistence ───────────────────────────────────────────────────────────────
const LS_KEY = 'chronoTimer_v1';

const DEFAULT_STATE = {
  days: {},
  streak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  streakFreezes: 1,
  focusLog: [],
  hubermanLog: [],
};

function loadStreak() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch { }
  return { ...DEFAULT_STATE };
}
function persist(s) {
  try {
    const current = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    localStorage.setItem(LS_KEY, JSON.stringify({
      ...current,
      streak: s.streak,
      bestStreak: s.bestStreak,
      lastActiveDate: s.lastActiveDate,
      days: s.days,
      timezone: s.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      streakFreezes: s.streakFreezes !== undefined ? s.streakFreezes : (current.streakFreezes ?? 1),
      focusLog: s.focusLog || current.focusLog || [],
      hubermanLog: s.hubermanLog || current.hubermanLog || [],
    }));
  } catch { }
}

// ── Streak helpers (pure) ─────────────────────────────────────────────────────
function recalcStreak(s) {
  if (!s.lastActiveDate) return { ...s, streak: 0 };
  const gap = daysBetween(s.lastActiveDate, todayStr());
  if (gap > 1) return { ...s, streak: 0, lastActiveDate: null };
  return s;
}

function applySession(s, focusMins = 25) {
  const today = todayStr();
  const days = { ...s.days };
  if (!days[today]) days[today] = { sessions: 0, mins: 0 };
  days[today] = {
    ...days[today],
    sessions: days[today].sessions + 1,
    mins: (days[today].mins || 0) + focusMins,
  };

  let streak = s.streak;
  let lastActiveDate = s.lastActiveDate;

  // Streak advances for any logged-in user completing a pomodoro
  if (s.user) {
    if (!lastActiveDate) {
      streak = 1;
    } else if (lastActiveDate === today) {
      // already active today — streak unchanged
    } else if (daysBetween(lastActiveDate, today) === 1) {
      streak += 1;
    } else {
      streak = 1;
    }
    lastActiveDate = today;
  }

  const bestStreak = Math.max(streak, s.bestStreak);
  return { ...s, days, streak, bestStreak, lastActiveDate };
}

// ── Zustand store ─────────────────────────────────────────────────────────────
const initialStreak = recalcStreak(loadStreak());

export const useStore = create((set, get) => ({
  // ── Auth State ──────────────────────────────────────────────
  user: null,
  authLoading: true,
  userDocId: null,
  newBadgeAlert: null,

  async initAuth() {
    set({ authLoading: true });
    try {
      const u = await getCurrentUser();
      if (u) {
        set({ user: u });
        // Fetch stats strictly for this authenticated user ID from Appwrite
        const cloudStats = await fetchUserStats(u.$id);
        if (cloudStats) {
          const localS = get();

          const loadedData = {
            userDocId: cloudStats.docId,
            streak: cloudStats.streak,
            bestStreak: cloudStats.bestStreak,
            totalXP: cloudStats.totalXP,
            lastActiveDate: cloudStats.lastActiveDate,
            days: cloudStats.days,
            shownMs: cloudStats.shownMs,
            focusLog: cloudStats.focusLog || [],
            customRoadmap: cloudStats.customRoadmap || null,
          };

          let finalData = loadedData;
          let needsSyncUp = false;

          // Conflict resolution: trust local state if it has more XP or a more recent active date
          if (
            localS.totalXP > cloudStats.totalXP ||
            (localS.lastActiveDate && cloudStats.lastActiveDate && localS.lastActiveDate > cloudStats.lastActiveDate)
          ) {
            finalData = { ...localS, userDocId: cloudStats.docId };
            needsSyncUp = true;
          } else {
            finalData = recalcStreak(loadedData);
            if (finalData.streak !== cloudStats.streak) needsSyncUp = true;
          }

          set(finalData);
          persist(finalData);
          if (needsSyncUp) {
            get().syncCloudStats();
          }
        } else {
          // Newly logged in user has no stats doc in Appwrite yet.
          // Initialize clean default state and sync to create their DB document.
          const freshData = {
            userDocId: null,
            streak: 0,
            bestStreak: 0,
            totalXP: 0,
            lastActiveDate: null,
            days: {},
            shownMs: [],
            focusLog: [],
            customRoadmap: null,
            activeTaskId: null,
          };
          set(freshData);
          persist(freshData);
          await get().syncCloudStats();
        }
      }
    } catch (e) {
      console.warn('initAuth error:', e);
    } finally {
      set({ authLoading: false });
    }
  },

  setUser(user) {
    set({ user });
    if (user) {
      get().syncCloudStats();
    }
  },

  async logout() {
    await logoutUser();
    const clearedState = {
      user: null,
      userDocId: null,
      streak: 0,
      bestStreak: 0,
      lastActiveDate: null,
      days: {},
      focusLog: [],
      totalXP: 0,
      targetIntent: '',
      customRoadmap: null,
      shownMs: [],
    };
    set(clearedState);
    persist(clearedState);
  },

  async syncCloudStats() {
    const s = get();
    if (!s.user) return;
    const statsData = {
      streak: s.streak,
      bestStreak: s.bestStreak,
      lastActiveDate: s.lastActiveDate,
      days: s.days,
      totalXP: s.totalXP,
      shownMs: s.shownMs || [],
      customRoadmap: s.customRoadmap || null,
      timezone: s.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      streakFreezes: s.streakFreezes !== undefined ? s.streakFreezes : 1,
      focusLog: s.focusLog || [],
    };
    const res = await saveUserStats(s.user.$id, statsData, s.userDocId);
    if (res && res.$id) {
      set({ userDocId: res.$id });
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ██  POMODORO TIMER (standard Focus / Short Break / Long Break)
  // ═══════════════════════════════════════════════════════════════════════════

  mode: 'focus',
  running: false,
  elapsed: 0,          // seconds
  startMs: null,
  durations: { focus: 25 * 60, short: 5 * 60, long: 15 * 60 },
  sessions: 0,
  totalSess: 4,

  // ── Streak / XP (persisted) ─────────────────────────────────
  ...initialStreak,

  // ── Mode config ─────────────────────────────────────────────
  soundEnabled: true,
  completedPrompt: null, // { nextMode: 'short' | 'long' } | null

  toggleSound() {
    unlockAudio();
    set(s => {
      const nextSound = !s.soundEnabled;
      if (nextSound) {
        if (s.mode === 'focus') playFocusChime();
        else playBreakChime();
      }
      return { soundEnabled: nextSound };
    });
  },

  dismissCompletedPrompt() {
    set({ completedPrompt: null });
  },

  chooseFocusAgain() {
    unlockAudio();
    set({ completedPrompt: null, mode: 'focus', elapsed: 0, running: false });
  },

  chooseTakeBreak() {
    unlockAudio();
    const s = get();
    const nextMode = s.completedPrompt?.nextMode || (s.sessions % s.totalSess === 0 ? 'long' : 'short');
    set({ completedPrompt: null, mode: nextMode, elapsed: 0, running: false });
  },

  setMode(mode) {
    unlockAudio();
    const s = get();
    if (s.running) clearInterval(s._interval);
    set({ mode, running: false, elapsed: 0, startMs: null });
  },

  tick() {
    const s = get();
    if (!s.running) return;
    const now = performance.now();
    const elapsed = s.elapsed + (now - s.startMs) / 1000;
    const dur = s.durations[s.mode];
    if (elapsed >= dur) {
      set({ elapsed: dur, running: false, startMs: null });
      get().onComplete();
    } else {
      set({ elapsed, startMs: now });
    }
  },

  play() {
    unlockAudio();
    set({ running: true, startMs: performance.now() });
  },

  pause() {
    set({ running: false, startMs: null });
  },

  reset() {
    set({ running: false, elapsed: 0, startMs: null });
  },

  skip() {
    const s = get();
    set({ elapsed: s.durations[s.mode], running: false, startMs: null });
    get().onComplete();
  },

  setDuration(modeKey, minutes) {
    const s = get();
    const durations = { ...s.durations, [modeKey]: minutes * 60 };
    set({ durations, elapsed: modeKey === s.mode ? 0 : s.elapsed });
  },

  onComplete() {
    const s = get();

    if (s.mode !== 'focus') {
      // Break complete -> play break chime & prompt return to focus
      if (s.soundEnabled) playBreakChime();
      set({ completedPrompt: { isBreak: true, nextMode: 'focus' } });
      return;
    }

    // Focus session complete -> play focus chime
    if (s.soundEnabled) playFocusChime();

    const sessions = Math.min(s.sessions + 1, s.totalSess);
    const focusMins = Math.round(s.durations.focus / 60);
    const newState = applySession(s, focusMins);
    const nextMode = sessions % s.totalSess === 0 ? 'long' : 'short';

    // Add to focus log
    const logEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      intent: (s.targetIntent || '').trim() || 'Deep Focus',
      duration: focusMins,
      timestamp: new Date().toISOString()
    };
    const focusLog = [logEntry, ...(s.focusLog || [])].slice(0, 100);

    set({
      ...newState,
      sessions,
      focusLog,
      completedPrompt: { isBreak: false, nextMode },
    });

    persist(get());
    get().syncCloudStats();
  },

  focusLog: [],
  targetIntent: '',
  setTargetIntent(intent) {
    set({ targetIntent: intent });
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ██  HUBERMAN PROTOCOL (Warm-up → 90m Deep Work → 20m NSDR)
  // ═══════════════════════════════════════════════════════════════════════════

  huberman: {
    phase: 'idle',       // 'idle' | 'warmup' | 'focus' | 'nsdr'
    elapsed: 0,
    running: false,
    startMs: null,
    soundscape: 'none',  // 'none' | '40hz' | 'pink'
    warmupEnabled: true,
    focusDuration: 90 * 60,
    nsdrDuration: 20 * 60,
    warmupDuration: 60,
    cyclesCompleted: 0,
    targetIntent: '',
    completedPhase: null, // null | 'focus' | 'nsdr' (which phase just finished)
  },
  hubermanLog: initialStreak.hubermanLog || [],

  hubermanSetIntent(intent) {
    set(s => ({ huberman: { ...s.huberman, targetIntent: intent } }));
  },

  hubermanSetSoundscape(type) {
    set(s => ({ huberman: { ...s.huberman, soundscape: type } }));
  },

  hubermanToggleWarmup() {
    set(s => ({ huberman: { ...s.huberman, warmupEnabled: !s.huberman.warmupEnabled } }));
  },

  hubermanSetDuration(phase, minutes) {
    const key = phase + 'Duration';
    set(s => ({ huberman: { ...s.huberman, [key]: minutes * 60 } }));
  },

  hubermanPlay() {
    unlockAudio();
    const s = get();
    const h = s.huberman;

    if (h.phase === 'idle') {
      // Start a new cycle
      const startPhase = h.warmupEnabled ? 'warmup' : 'focus';
      set({ huberman: { ...h, phase: startPhase, elapsed: 0, running: true, startMs: performance.now(), completedPhase: null } });
    } else {
      // Resume current phase
      set({ huberman: { ...h, running: true, startMs: performance.now() } });
    }
  },

  hubermanPause() {
    set(s => ({ huberman: { ...s.huberman, running: false, startMs: null } }));
  },

  hubermanReset() {
    set(s => ({ huberman: { ...s.huberman, phase: 'idle', elapsed: 0, running: false, startMs: null, completedPhase: null } }));
  },

  hubermanSkip() {
    const s = get();
    const h = s.huberman;
    if (h.phase === 'idle') return;
    // Force complete current phase
    const dur = h.phase === 'warmup' ? h.warmupDuration : h.phase === 'focus' ? h.focusDuration : h.nsdrDuration;
    set({ huberman: { ...h, elapsed: dur, running: false, startMs: null } });
    get().hubermanOnPhaseComplete();
  },

  hubermanTick() {
    const s = get();
    const h = s.huberman;
    if (!h.running) return;

    const now = performance.now();
    const elapsed = h.elapsed + (now - h.startMs) / 1000;
    const dur = h.phase === 'warmup' ? h.warmupDuration : h.phase === 'focus' ? h.focusDuration : h.nsdrDuration;

    if (elapsed >= dur) {
      set({ huberman: { ...h, elapsed: dur, running: false, startMs: null } });
      get().hubermanOnPhaseComplete();
    } else {
      set({ huberman: { ...h, elapsed, startMs: now } });
    }
  },

  hubermanOnPhaseComplete() {
    const s = get();
    const h = s.huberman;

    if (h.phase === 'warmup') {
      // Warm-up done -> auto-start focus
      if (s.soundEnabled) playFocusChime();
      set({ huberman: { ...h, phase: 'focus', elapsed: 0, running: true, startMs: performance.now(), completedPhase: null } });
      return;
    }

    if (h.phase === 'focus') {
      // Deep work done -> log it, show prompt, prepare NSDR
      if (s.soundEnabled) playFocusChime();
      const focusMins = Math.round(h.focusDuration / 60);

      // Also apply to streak/days (Huberman focus counts for streaks too)
      const newState = applySession(s, focusMins);

      const logEntry = {
        id: 'hlog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        intent: (h.targetIntent || '').trim() || 'Deep Work',
        phase: 'focus',
        duration: focusMins,
        timestamp: new Date().toISOString(),
      };
      const hubermanLog = [logEntry, ...(s.hubermanLog || [])].slice(0, 100);

      set({
        ...newState,
        hubermanLog,
        huberman: { ...h, phase: 'nsdr', elapsed: 0, running: false, startMs: null, completedPhase: 'focus' },
      });
      persist(get());
      get().syncCloudStats();
      return;
    }

    if (h.phase === 'nsdr') {
      // NSDR done -> log it, cycle complete
      if (s.soundEnabled) playBreakChime();
      const nsdrMins = Math.round(h.nsdrDuration / 60);

      const logEntry = {
        id: 'hlog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        intent: 'Deep Rest (NSDR)',
        phase: 'nsdr',
        duration: nsdrMins,
        timestamp: new Date().toISOString(),
      };
      const hubermanLog = [logEntry, ...(s.hubermanLog || [])].slice(0, 100);

      set({
        hubermanLog,
        huberman: { ...h, phase: 'idle', elapsed: 0, running: false, startMs: null, cyclesCompleted: h.cyclesCompleted + 1, completedPhase: 'nsdr' },
      });
      persist(get());
      return;
    }
  },

  hubermanDismissCompleted() {
    set(s => ({ huberman: { ...s.huberman, completedPhase: null } }));
  },

  hubermanStartNsdr() {
    // User confirms to start NSDR after focus phase
    unlockAudio();
    set(s => ({ huberman: { ...s.huberman, completedPhase: null, running: true, startMs: performance.now() } }));
  },

  hubermanSkipNsdr() {
    // User skips NSDR, go to idle
    unlockAudio();
    const s = get();
    set({ huberman: { ...s.huberman, phase: 'idle', elapsed: 0, running: false, startMs: null, cyclesCompleted: s.huberman.cyclesCompleted + 1, completedPhase: null } });
  },
}));
