import { create } from 'zustand';
import { 
  playFocusChime, 
  playBreakChime, 
  playCriticalChime, 
  playLegendaryChime, 
  playLevelUpChime, 
  unlockAudio 
} from './utils/audio';
import { getCurrentUser, logoutUser, fetchUserStats, saveUserStats } from './lib/appwrite';

// ── Unified Mode config ───────────────────────────────────────────────────────
export const MODES = {
  deep:     { key: 'deep',     label: 'Deep Work',    defaultMin: 90, h: 275, s: 85, lb: 65, isProtocol: true, badge: 'Protocol' },
  quick:    { key: 'quick',    label: 'Quick Focus',  defaultMin: 25, h: 252, s: 88, lb: 65, isProtocol: false },
  recovery: { key: 'recovery', label: 'Neural Reset', defaultMin: 20, h: 215, s: 75, lb: 55, isProtocol: false },
  short:    { key: 'short',    label: 'Short Break',  defaultMin: 5,  h: 162, s: 72, lb: 60, isProtocol: false },
};

export const QUICK_PRESETS = [15, 25, 45];
export const DEEP_PRESETS = [60, 90, 120];
export const BREAK_PRESETS = [5, 10, 15, 20];

// ── Level & Progression System ───────────────────────────────────────────────
export const RANK_TITLES = [
  { minLevel: 1,  title: 'Novice Mind',     color: '#94a3b8', icon: '🌱' },
  { minLevel: 3,  title: 'Apprentice',      color: '#38bdf8', icon: '⚡' },
  { minLevel: 6,  title: 'Focused Scholar', color: '#818cf8', icon: '📖' },
  { minLevel: 10, title: 'Deep Thinker',    color: '#a855f7', icon: '🧠' },
  { minLevel: 15, title: 'Flow Master',     color: '#c084fc', icon: '🌊' },
  { minLevel: 20, title: 'Cognitive Elite', color: '#f43f5e', icon: '🔥' },
  { minLevel: 30, title: 'Grandmaster',     color: '#fbbf24', icon: '👑' },
  { minLevel: 40, title: 'Living Legend',   color: '#34d399', icon: '🌟' },
  { minLevel: 50, title: 'Transcendent',    color: '#f472b6', icon: '🪐' },
];

export function calculateLevel(totalXP = 0) {
  // Smooth logarithmic-polynomial level curve
  // Level 1: 0, Level 2: 100, Level 3: 260, Level 5: 750, Level 10: 2700, Level 25: 14000
  let level = 1;
  while (xpForLevel(level + 1) <= totalXP) {
    level++;
  }
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const xpInLevel = totalXP - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(100, Math.max(0, (xpInLevel / xpNeeded) * 100));

  let rank = RANK_TITLES[0];
  for (let r of RANK_TITLES) {
    if (level >= r.minLevel) rank = r;
  }

  return {
    level,
    title: rank.title,
    rankColor: rank.color,
    rankIcon: rank.icon,
    currentLevelXp,
    nextLevelXp,
    xpInLevel,
    xpNeeded,
    progressPercent,
  };
}

export function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.round(55 * Math.pow(level - 1, 1.85) + (level - 1) * 45);
}

// ── Streak Multipliers ────────────────────────────────────────────────────────
export function getStreakMultiplier(streak = 0) {
  if (streak >= 30) return { mult: 3.0, label: '3.0x Supernova', icon: '🌟' };
  if (streak >= 14) return { mult: 2.0, label: '2.0x Inferno',   icon: '⚡' };
  if (streak >= 7)  return { mult: 1.5, label: '1.5x Flame',     icon: '🔥' };
  return { mult: 1.0, label: '1.0x Base', icon: '✨' };
}

// ── Milestone Badges ──────────────────────────────────────────────────────────
export const ALL_BADGES = [
  { id: 'first_spark',    name: 'First Spark',      desc: 'Complete your first focus block',          icon: '✨', tier: 'bronze' },
  { id: 'deep_initiate',  name: 'Deep Initiate',    desc: 'Complete a 90m Deep Work Protocol',        icon: '🧠', tier: 'silver' },
  { id: 'neural_reset',   name: 'Neural Reset',     desc: 'Complete a 20m Recovery session',          icon: '🌊', tier: 'silver' },
  { id: 'flame_streak',   name: '7-Day Flame',      desc: 'Achieve a 7-day study streak (1.5x XP)',   icon: '🔥', tier: 'gold' },
  { id: 'inferno_streak', name: '30-Day Inferno',   desc: 'Achieve a 30-day study streak (3.0x XP)',  icon: '⚡', tier: 'platinum' },
  { id: 'century_mind',   name: 'Century Mind',     desc: 'Log 100 total study blocks',               icon: '🏛️', tier: 'platinum' },
  { id: 'goal_crusher',   name: 'Goal Crusher',     desc: 'Surpass your daily study goal',            icon: '🎯', tier: 'gold' },
  { id: 'deep_voyager',   name: 'Deep Voyager',     desc: 'Accumulate 10+ hours in Deep Work',        icon: '🪐', tier: 'platinum' },
];

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

// ── Local Persistence ─────────────────────────────────────────────────────────
const LS_KEY = 'chrono_study_engine_v2';

const DEFAULT_STATE = {
  days: {},
  streak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  totalXP: 0,
  dailyGoalMinutes: 120,
  shownMs: [],
  focusLog: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  streakFreezes: 1,
  avatarId: 'avatar-1',
};

function loadState() {
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
      totalXP: s.totalXP,
      dailyGoalMinutes: s.dailyGoalMinutes || 120,
      shownMs: s.shownMs || [],
      days: s.days,
      timezone: s.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      streakFreezes: s.streakFreezes !== undefined ? s.streakFreezes : (current.streakFreezes ?? 1),
      focusLog: s.focusLog || current.focusLog || [],
      avatarId: s.avatarId || current.avatarId || 'avatar-1',
    }));
  } catch { }
}

function recalcStreak(s) {
  if (!s.lastActiveDate) return { ...s, streak: 0 };
  const gap = daysBetween(s.lastActiveDate, todayStr());
  if (gap > 1) return { ...s, streak: 0, lastActiveDate: null };
  return s;
}

// ── Zustand Store ─────────────────────────────────────────────────────────────
const initialData = recalcStreak(loadState());

export const useStore = create((set, get) => ({
  // ── Auth & Cloud Sync ───────────────────────────────────────
  user: null,
  authLoading: true,
  userDocId: null,

  async initAuth() {
    set({ authLoading: true });
    try {
      const u = await getCurrentUser();
      if (u) {
        set({ user: u });
        const cloudStats = await fetchUserStats(u.$id);
        if (cloudStats) {
          const localS = get();
          // Always preserve cloud avatar if present; fallback to local or default
          const chosenAvatar = cloudStats.avatarId || localS.avatarId || 'avatar-1';

          const loadedData = {
            userDocId: cloudStats.docId,
            streak: cloudStats.streak,
            bestStreak: cloudStats.bestStreak,
            totalXP: cloudStats.totalXP !== undefined ? cloudStats.totalXP : (localS.totalXP || 0),
            lastActiveDate: cloudStats.lastActiveDate,
            days: cloudStats.days || {},
            shownMs: cloudStats.shownMs || [],
            focusLog: cloudStats.focusLog || [],
            dailyGoalMinutes: cloudStats.dailyGoalMinutes || localS.dailyGoalMinutes || 120,
            avatarId: chosenAvatar,
            streakFreezes: cloudStats.streakFreezes !== undefined ? cloudStats.streakFreezes : (localS.streakFreezes ?? 1),
            timezone: cloudStats.timezone || localS.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          };

          let finalData = loadedData;
          let needsSyncUp = false;

          // Conflict resolution: trust local state if local has more progress/XP
          if (
            localS.totalXP > (cloudStats.totalXP || 0) ||
            (localS.lastActiveDate && cloudStats.lastActiveDate && localS.lastActiveDate > cloudStats.lastActiveDate)
          ) {
            finalData = {
              ...localS,
              userDocId: cloudStats.docId,
              avatarId: chosenAvatar,
              streakFreezes: cloudStats.streakFreezes !== undefined ? cloudStats.streakFreezes : (localS.streakFreezes ?? 1),
              timezone: cloudStats.timezone || localS.timezone,
            };
            needsSyncUp = true;
          } else {
            finalData = recalcStreak(loadedData);
            if (finalData.streak !== cloudStats.streak) needsSyncUp = true;
          }

          set(finalData);
          persist(finalData);
          if (needsSyncUp) {
            await get().syncCloudStats();
          }
        } else {
          // Fresh user account setup
          await get().syncCloudStats();
        }
      }
    } catch (e) {
      console.error('initAuth error:', e);
    } finally {
      set({ authLoading: false });
    }
  },

  setAvatar: async (avatarId) => {
    set({ avatarId });
    persist(get());
    return await get().syncCloudStats();
  },

  setUser(user) {
    set({ user });
    if (user) get().syncCloudStats();
  },

  async logout() {
    const s = get();
    if (s.user) {
      try {
        await s.syncCloudStats();
      } catch (e) {
        console.warn('Pre-logout sync warning:', e);
      }
    }
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
      shownMs: [],
      avatarId: 'avatar-1',
      streakFreezes: 1,
    };
    set(clearedState);
    persist(clearedState);
  },

  async syncCloudStats() {
    const s = get();
    if (!s.user) return null;
    const statsData = {
      streak: s.streak,
      bestStreak: s.bestStreak,
      lastActiveDate: s.lastActiveDate,
      days: s.days,
      totalXP: s.totalXP || 0,
      shownMs: s.shownMs || [],
      customRoadmap: null,
      timezone: s.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      streakFreezes: s.streakFreezes !== undefined ? s.streakFreezes : 1,
      dailyGoalMinutes: s.dailyGoalMinutes || 120,
      focusLog: s.focusLog || [],
      displayName: s.user?.name || '',
      avatarId: s.avatarId || 'avatar-1',
    };
    const res = await saveUserStats(s.user.$id, statsData, s.userDocId);
    if (res && res.$id) {
      set({ userDocId: res.$id });
    }
    return res;
  },

  // ── Gamification State ──────────────────────────────────────
  totalXP: initialData.totalXP || 0,
  dailyGoalMinutes: initialData.dailyGoalMinutes || 120,
  shownMs: initialData.shownMs || [],
  streak: initialData.streak || 0,
  bestStreak: initialData.bestStreak || 0,
  lastActiveDate: initialData.lastActiveDate || null,
  days: initialData.days || {},
  focusLog: initialData.focusLog || [],
  timezone: initialData.timezone,
  streakFreezes: initialData.streakFreezes ?? 1,
  avatarId: initialData.avatarId || 'avatar-1',

  activeToastReward: null, // { tier, xp, label, isLevelUp, newLevel }
  clearToastReward: () => set({ activeToastReward: null }),

  setDailyGoalMinutes: (mins) => {
    set({ dailyGoalMinutes: Math.max(15, Math.min(720, mins)) });
    persist(get());
    get().syncCloudStats();
  },

  // ── Timer & Protocol State ──────────────────────────────────
  mode: 'deep', // 'deep' (Deep Work Protocol), 'quick', 'recovery', 'short'
  running: false,
  elapsed: 0, // seconds
  startMs: null,
  durations: {
    deep: 90 * 60,
    quick: 25 * 60,
    recovery: 20 * 60,
    short: 5 * 60,
    warmup: 60,
  },
  
  // Protocol State Machine (for Deep Work)
  protocolPhase: 'idle', // 'idle' | 'warmup' | 'focus' | 'recovery'
  warmupEnabled: true,   // Visual Primer 60s
  toggleWarmup: () => set((s) => ({ warmupEnabled: !s.warmupEnabled })),
  
  soundscapeType: 'none', // 'none' | '40hz' | 'pink'
  setSoundscape: (type) => set({ soundscapeType: type }),

  soundEnabled: true,
  miniPlayerOpen: false,
  toggleMiniPlayer: () => set((s) => ({ miniPlayerOpen: !s.miniPlayerOpen })),
  setMiniPlayerOpen: (open) => set({ miniPlayerOpen: open }),

  targetIntent: '',
  setTargetIntent: (intent) => set({ targetIntent: intent }),

  completedPrompt: null, // { isBreak: bool, mode: string, xpEarned: number, rewardTier: string }

  // ── Mode Switching ──────────────────────────────────────────
  setMode(newMode) {
    unlockAudio();
    set({
      mode: newMode,
      protocolPhase: 'idle',
      running: false,
      elapsed: 0,
      startMs: null,
    });
  },

  setDuration(modeKey, minutes) {
    const s = get();
    const durations = { ...s.durations, [modeKey]: minutes * 60 };
    set({ durations, elapsed: modeKey === s.mode ? 0 : s.elapsed });
  },

  toggleSound() {
    unlockAudio();
    set((s) => {
      const nextSound = !s.soundEnabled;
      if (nextSound) playFocusChime();
      return { soundEnabled: nextSound };
    });
  },

  // ── Timer Controls ──────────────────────────────────────────
  play() {
    unlockAudio();
    const s = get();

    // If starting Deep Work Protocol from beginning and Warm-up is active
    if (s.mode === 'deep' && (s.protocolPhase === 'idle' || s.protocolPhase === 'warmup') && s.elapsed === 0 && s.warmupEnabled) {
      set({
        protocolPhase: 'warmup',
        running: true,
        startMs: performance.now(),
        elapsed: 0,
      });
    } else {
      const activePhase = s.mode === 'deep' && s.protocolPhase === 'idle' ? 'focus' : s.protocolPhase;
      set({
        protocolPhase: s.mode === 'deep' ? activePhase : 'idle',
        running: true,
        startMs: performance.now(),
      });
    }
  },

  pause() {
    set({ running: false, startMs: null });
  },

  reset() {
    set({
      running: false,
      elapsed: 0,
      startMs: null,
      protocolPhase: 'idle',
    });
  },

  skip() {
    const s = get();
    const isWarmup = s.mode === 'deep' && s.protocolPhase === 'warmup';
    const dur = isWarmup ? s.durations.warmup : s.durations[s.mode];
    set({ elapsed: dur, running: false, startMs: null });
    get().onComplete(true); // true = wasSkipped
  },

  tick() {
    const s = get();
    if (!s.running) return;
    const now = performance.now();
    const isWarmup = s.mode === 'deep' && s.protocolPhase === 'warmup';
    const dur = isWarmup ? s.durations.warmup : s.durations[s.mode];
    const elapsed = s.elapsed + (now - s.startMs) / 1000;

    if (elapsed >= dur) {
      set({ elapsed: dur, running: false, startMs: null });
      get().onComplete(false);
    } else {
      set({ elapsed, startMs: now });
    }
  },

  // ── Session Completion & XP Calculation Engine ──────────────
  onComplete(wasSkipped = false) {
    const s = get();

    // 1. Warm-up Phase Complete -> Auto advance to Deep Focus Phase
    if (s.mode === 'deep' && s.protocolPhase === 'warmup') {
      if (s.soundEnabled) playFocusChime();
      set({
        protocolPhase: 'focus',
        elapsed: 0,
        running: true,
        startMs: performance.now(),
      });
      return;
    }

    const isDeep = s.mode === 'deep';
    const isQuick = s.mode === 'quick';
    const isRecovery = s.mode === 'recovery';
    const isShort = s.mode === 'short';

    const focusMins = Math.round(s.durations[s.mode] / 60);

    // 2. Intermittent Variable Reward Engine
    let baseXP = 0;
    if (isDeep) baseXP = 120;
    else if (isQuick) baseXP = Math.round(focusMins * 1.2);
    else if (isRecovery) baseXP = 25;
    else if (isShort) baseXP = 5;

    if (wasSkipped) {
      baseXP = Math.round(baseXP * 0.3); // Heavy reduction if skipped early
    }

    const { mult } = getStreakMultiplier(s.streak);
    const xpWithMultiplier = Math.round(baseXP * mult);

    // Variable Reward Roll (Variable-Ratio Schedule)
    const roll = Math.random() * 100;
    let rewardTier = 'normal';
    let bonusXP = 0;
    let rewardLabel = `+${xpWithMultiplier} XP`;

    if (!wasSkipped && (isDeep || isQuick)) {
      if (roll > 98) {
        rewardTier = 'legendary';
        bonusXP = 250;
        rewardLabel = `LEGENDARY COGNITIVE DROP! +${xpWithMultiplier + bonusXP} XP`;
        if (s.soundEnabled) playLegendaryChime();
      } else if (roll > 90) {
        rewardTier = 'critical';
        bonusXP = 100;
        rewardLabel = `CRITICAL FOCUS SURGE! +${xpWithMultiplier + bonusXP} XP`;
        if (s.soundEnabled) playCriticalChime();
      } else if (roll > 70) {
        rewardTier = 'bonus';
        bonusXP = 40;
        rewardLabel = `BONUS MOMENTUM! +${xpWithMultiplier + bonusXP} XP`;
        if (s.soundEnabled) playFocusChime();
      } else {
        rewardTier = 'normal';
        if (s.soundEnabled) playFocusChime();
      }
    } else {
      if (s.soundEnabled) {
        if (isRecovery || isShort) playBreakChime();
        else playFocusChime();
      }
    }

    const totalSessionXP = xpWithMultiplier + bonusXP;
    const oldLevelInfo = calculateLevel(s.totalXP);
    const newTotalXP = s.totalXP + totalSessionXP;
    const newLevelInfo = calculateLevel(newTotalXP);
    const isLevelUp = newLevelInfo.level > oldLevelInfo.level;

    if (isLevelUp && s.soundEnabled) {
      setTimeout(() => playLevelUpChime(), 800);
    }

    // 3. Streak & Daily Progress Updates
    const today = todayStr(s.timezone);
    const days = { ...s.days };
    if (!days[today]) days[today] = { sessions: 0, mins: 0, xp: 0 };
    days[today] = {
      ...days[today],
      sessions: days[today].sessions + 1,
      mins: (days[today].mins || 0) + focusMins,
      xp: (days[today].xp || 0) + totalSessionXP,
    };

    // Cap days history to last 365 days to prevent hitting Appwrite 64KB limit
    const dayKeys = Object.keys(days).sort();
    if (dayKeys.length > 365) {
      const keysToRemove = dayKeys.slice(0, dayKeys.length - 365);
      keysToRemove.forEach((k) => delete days[k]);
    }

    let streak = s.streak;
    let lastActiveDate = s.lastActiveDate;

    if (s.user && (isDeep || isQuick)) {
      if (!lastActiveDate) {
        streak = 1;
      } else if (lastActiveDate === today) {
        // already active today
      } else if (daysBetween(lastActiveDate, today) === 1) {
        streak += 1;
      } else {
        streak = 1;
      }
      lastActiveDate = today;
    }

    const bestStreak = Math.max(streak, s.bestStreak);

    // 4. Append to Focus Log
    const logEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      intent: (s.targetIntent || '').trim() || (isDeep ? 'Deep Work Protocol' : isRecovery ? 'Neural Reset' : 'Focus Session'),
      mode: s.mode,
      duration: focusMins,
      xpEarned: totalSessionXP,
      rewardTier,
      timestamp: new Date().toISOString(),
      wasSkipped,
    };
    const focusLog = [logEntry, ...(s.focusLog || [])].slice(0, 150);

    // 5. Milestone Badges Checking
    const unlocked = new Set(s.shownMs || []);
    if (isDeep || isQuick) unlocked.add('first_spark');
    if (isDeep) unlocked.add('deep_initiate');
    if (isRecovery) unlocked.add('neural_reset');
    if (streak >= 7) unlocked.add('flame_streak');
    if (streak >= 30) unlocked.add('inferno_streak');
    if (Object.values(days).reduce((a, b) => a + (b.sessions || 0), 0) >= 100) unlocked.add('century_mind');
    if (days[today].mins >= s.dailyGoalMinutes) unlocked.add('goal_crusher');
    const totalDeepMins = focusLog
      .filter((e) => e.mode === 'deep')
      .reduce((acc, e) => acc + (e.duration || 0), 0);
    if (totalDeepMins >= 600) unlocked.add('deep_voyager');

    // 6. Set Next Stage / Completion Prompt
    let nextPrompt = null;
    if (isDeep) {
      nextPrompt = {
        title: 'Deep Work Complete! 🧠',
        sub: 'Your neural circuits are primed. Take 20 minutes of Neural Reset to consolidate memory and restore peak dopamine.',
        primaryLabel: 'Start Neural Reset 🌊',
        secondaryLabel: 'Finish Protocol ✨',
        nextMode: 'recovery',
        xpEarned: totalSessionXP,
        rewardTier,
      };
    } else if (isQuick) {
      nextPrompt = {
        title: 'Focus Block Done! 🎯',
        sub: 'Great momentum. Jump into a short recharge break or lock in another session?',
        primaryLabel: 'Recharge (5m) ☕',
        secondaryLabel: 'Focus Again 🎯',
        nextMode: 'short',
        xpEarned: totalSessionXP,
        rewardTier,
      };
    } else {
      nextPrompt = {
        title: 'Recovery Complete! 🌊',
        sub: 'Your energy is replenished and ready for deep cognitive flow.',
        primaryLabel: 'Start Deep Work 🧠',
        secondaryLabel: 'Done For Now ⚡',
        nextMode: 'deep',
        xpEarned: totalSessionXP,
        rewardTier: 'normal',
      };
    }

    set({
      totalXP: newTotalXP,
      streak,
      bestStreak,
      lastActiveDate,
      days,
      shownMs: Array.from(unlocked),
      focusLog,
      completedPrompt: nextPrompt,
      protocolPhase: isDeep ? 'recovery' : 'idle',
      activeToastReward: {
        tier: rewardTier,
        xp: totalSessionXP,
        label: rewardLabel,
        isLevelUp,
        newLevel: newLevelInfo.level,
        newTitle: newLevelInfo.title,
      },
    });

    persist(get());
    get().syncCloudStats();
  },

  rateSession(logId, stars) {
    set((s) => {
      const focusLog = s.focusLog.map((item) => {
        if (item.id === logId) return { ...item, rating: stars };
        return item;
      });
      return { focusLog };
    });
    persist(get());
    get().syncCloudStats();
  },

  dismissCompletedPrompt() {
    set({ completedPrompt: null, protocolPhase: 'idle' });
  },

  chooseNextMode(targetMode) {
    unlockAudio();
    get().setMode(targetMode);
    set({ completedPrompt: null });
    get().play();
  },
}));
