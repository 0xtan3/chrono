import { create } from 'zustand';
import { playFocusChime, playBreakChime, unlockAudio } from './utils/audio';
import { playLofi, pauseLofi, setLofiVolume as updateLofiVolume, skipToNextLofiTrack, getCurrentLofiTrack } from './utils/musicApi';
import { getCurrentUser, logoutUser, fetchUserStats, saveUserStats } from './lib/appwrite';
import { CATS as DEFAULT_CATS } from './utils/roadmapData';

// ── Date helpers ─────────────────────────────────────────────────────────────
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function daysBetween(a, b) {
  return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
}

// ── Persistence ───────────────────────────────────────────────────────────────
const LS_KEY = 'chronoTimer_v1';

function loadStreak() {
  try {
    const r = localStorage.getItem(LS_KEY);
    if (r) {
      const parsed = JSON.parse(r);
      return {
        days: {},
        streak: 0,
        bestStreak: 0,
        totalXP: 0,
        lastActiveDate: null,
        shownMs: [],
        tasks: [],
        activeTaskId: null,
        customRoadmap: null,
        ...parsed
      };
    }
  } catch { }
  return { days: {}, streak: 0, bestStreak: 0, totalXP: 0, lastActiveDate: null, shownMs: [], tasks: [], activeTaskId: null, customRoadmap: null };
}
function persist(s) {
  try {
    const current = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    localStorage.setItem(LS_KEY, JSON.stringify({
      ...current,
      streak: s.streak,
      bestStreak: s.bestStreak,
      totalXP: s.totalXP,
      lastActiveDate: s.lastActiveDate,
      days: s.days,
      shownMs: s.shownMs,
      tasks: s.tasks ?? current.tasks ?? [],
      activeTaskId: s.activeTaskId !== undefined ? s.activeTaskId : (current.activeTaskId ?? null),
      customRoadmap: s.customRoadmap !== undefined ? s.customRoadmap : (current.customRoadmap ?? null)
    }));
  } catch { }
}

// ── Level table ───────────────────────────────────────────────────────────────
export const LEVELS = [
  { xp: 0, name: 'Seedling', n: 1 },
  { xp: 100, name: 'Student', n: 2 },
  { xp: 300, name: 'Scholar', n: 3 },
  { xp: 700, name: 'Expert', n: 4 },
  { xp: 1500, name: 'Master', n: 5 },
  { xp: 3000, name: 'Legend', n: 6 },
  { xp: 6000, name: 'Immortal', n: 7 },
];
export function getLevelInfo(xp) {
  let lvl = LEVELS[0], next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) { lvl = LEVELS[i]; next = LEVELS[i + 1] ?? null; }
  }
  const progress = next ? (xp - lvl.xp) / (next.xp - lvl.xp) : 1;
  return { lvl, next, progress, toNext: next ? next.xp - xp : 0 };
}

// ── Milestone config ──────────────────────────────────────────────────────────
export const MILESTONES = [
  { days: 3, emoji: '🌱', title: '3-Day Streak!', sub: 'Consistency is everything. Keep it up!' },
  { days: 7, emoji: '🔥', title: 'One Full Week!', sub: 'Seven days straight. This is becoming a habit.' },
  { days: 14, emoji: '⚡', title: '14-Day Streak!', sub: 'Two weeks! Your future self thanks you.' },
  { days: 21, emoji: '🎯', title: '21-Day Streak!', sub: 'Science says habits form at 21 days. You made it!' },
  { days: 30, emoji: '🏆', title: '30-Day Streak!', sub: 'A full month. Truly unstoppable.' },
  { days: 60, emoji: '💎', title: '60 Days Strong!', sub: 'Diamond-level dedication.' },
  { days: 100, emoji: '👑', title: '100-Day Streak!', sub: 'ONE HUNDRED DAYS. You are a legend.' },
];

// ── Badge config ──────────────────────────────────────────────────────────────
export const BADGES = [
  { id: 'first_step', type: 'session', target: 1, emoji: '🔥', title: 'First Step', sub: 'Completed your first Pomodoro today.' },
  { id: 'double_focus', type: 'session', target: 2, emoji: '🥉', title: 'Double Focus', sub: 'Completed 2 Pomodoros in a single day.' },
  { id: 'deep_work', type: 'session', target: 4, emoji: '🥈', title: 'Deep Work', sub: 'Completed 4 Pomodoros in a single day.' },
  { id: 'flow_state', type: 'session', target: 6, emoji: '🥇', title: 'Flow State', sub: 'Completed 6 Pomodoros in a single day.' },
  { id: 'finisher', type: 'task', target: 1, emoji: '🎯', title: 'Finisher', sub: 'Completed a task today.' },
  { id: 'overachiever', type: 'task', target: 3, emoji: '🚀', title: 'Overachiever', sub: 'Completed 3 tasks today.' },
];

// ── Mode config ───────────────────────────────────────────────────────────────
export const MODES = {
  focus: { label: 'Focus', h: 252, s: 88, lb: 65, defaultMin: 25 },
  short: { label: 'Short Break', h: 162, s: 72, lb: 60, defaultMin: 5 },
  long: { label: 'Long Break', h: 200, s: 78, lb: 62, defaultMin: 15 },
};
export const FOCUS_PRESETS = [25, 50, 90];
export const BREAK_PRESETS = [5, 10, 15];

// ── Visualizers Catalog ────────────────────────────────────────────────────────
export const VISUALIZERS = [
  { id: 'liquid_blob', name: 'Liquid Blob',    reqStreak: 0,  emoji: '🔮', desc: '3D fluid wave sphere' },
  { id: 'blank',       name: 'Blank Minimal',  reqStreak: 0,  emoji: '✨', desc: 'Clean typography (no visualizer)' },
  { id: 'ice_melt',    name: 'Ice Melt',       reqStreak: 5,  emoji: '🧊', desc: 'Frozen ice block that melts to zero — realistic caustics, drips & steam' },
  { id: 'neon_ring',   name: 'Neon Torus',     reqStreak: 3,  emoji: '⭕', desc: 'Rotating cyberpunk energy ring' },
  { id: 'cosmic_orb',  name: 'Cosmic Orb',     reqStreak: 7,  emoji: '🌌', desc: 'Deep space stardust particle sphere' },
];

// ── Background Themes Catalog ──────────────────────────────────────────────────
export const THEMES = [
  { id: 'midnight',    name: 'Midnight Void', reqStreak: 0, emoji: '🌑', bg: '#080b12', accent: '#7c3aed' },
  { id: 'deep_space',  name: 'Deep Cosmos',   reqStreak: 3, emoji: '🌌', bg: '#030712', accent: '#3b82f6' },
  { id: 'cyberpunk',   name: 'Neon Cyber',    reqStreak: 7, emoji: '🔮', bg: '#0d021a', accent: '#ec4899' },
  { id: 'zen_forest',  name: 'Zen Emerald',   reqStreak: 14, emoji: '🌲', bg: '#02140f', accent: '#10b981' },
  { id: 'solar_amber', name: 'Solar Amber',   reqStreak: 21, emoji: '🌅', bg: '#1a0b02', accent: '#f59e0b' },
];

// ── Streak helpers (pure) ─────────────────────────────────────────────────────
function recalcStreak(s) {
  if (!s.lastActiveDate) return { ...s, streak: 0 };
  const gap = daysBetween(s.lastActiveDate, todayStr());
  if (gap > 1) return { ...s, streak: 0, lastActiveDate: null };
  return s;
}

function applySession(s, xpEarned) {
  const today = todayStr();
  const days = { ...s.days };
  if (!days[today]) days[today] = { sessions: 0, xp: 0, badges: [] };
  // Ensure existing days have badges array
  if (!days[today].badges) days[today].badges = [];
  days[today] = { ...days[today], sessions: days[today].sessions + 1, xp: days[today].xp + xpEarned };

  let streak = s.streak;
  let lastActiveDate = s.lastActiveDate;

  // Streak only advances if user is logged in AND focusing on an active task
  if (s.user && s.activeTaskId) {
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
  const totalXP = s.totalXP + xpEarned;
  return { ...s, days, streak, bestStreak, totalXP, lastActiveDate };
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
          const loadedData = {
            userDocId: cloudStats.docId,
            streak: cloudStats.streak,
            bestStreak: cloudStats.bestStreak,
            totalXP: cloudStats.totalXP,
            lastActiveDate: cloudStats.lastActiveDate,
            days: cloudStats.days,
            shownMs: cloudStats.shownMs,
            tasks: cloudStats.tasks || [],
            customRoadmap: cloudStats.customRoadmap || null,
          };
          set(loadedData);
          persist(loadedData);
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
            tasks: [],
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
      totalXP: 0,
      lastActiveDate: null,
      days: {},
      shownMs: [],
      tasks: [],
      customRoadmap: null,
      activeTaskId: null,
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
      totalXP: s.totalXP,
      lastActiveDate: s.lastActiveDate,
      days: s.days,
      shownMs: s.shownMs,
      tasks: s.tasks || [],
      customRoadmap: s.customRoadmap || null,
    };
    const res = await saveUserStats(s.user.$id, statsData, s.userDocId);
    if (res && res.$id) {
      set({ userDocId: res.$id });
    }
  },

  // ── Timer state ─────────────────────────────────────────────
  mode: 'focus',
  running: false,
  elapsed: 0,          // seconds
  startMs: null,
  durations: { focus: 25 * 60, short: 5 * 60, long: 15 * 60 },
  sessions: 0,
  totalSess: 4,

  // ── Streak / XP (persisted) ─────────────────────────────────
  ...initialStreak,

  soundEnabled: true,
  milestone: null,
  completedPrompt: null, // { nextMode: 'short' | 'long' } | null
  selectedVisualizer: 'liquid_blob',
  selectedTheme: 'midnight',
  isPlayingLofi: false,
  lofiVolume: 0.5,
  currentLofiTrack: getCurrentLofiTrack(),
  isSettingsOpen: false,

  toggleSettings() {
    set(s => ({ isSettingsOpen: !s.isSettingsOpen }));
  },

  toggleLofi() {
    unlockAudio();
    const s = get();
    if (s.isPlayingLofi) {
      pauseLofi();
      set({ isPlayingLofi: false });
    } else {
      const activeTrack = playLofi(s.lofiVolume);
      set({ isPlayingLofi: true, currentLofiTrack: activeTrack });
    }
  },

  skipLofiTrack() {
    unlockAudio();
    const s = get();
    const nextTrack = skipToNextLofiTrack(s.lofiVolume);
    set({ isPlayingLofi: true, currentLofiTrack: nextTrack });
  },

  setLofiVolume(volume) {
    set({ lofiVolume: volume });
    updateLofiVolume(volume);
  },

  setVisualizer(visId) {
    const s = get();
    const vis = VISUALIZERS.find(v => v.id === visId);
    if (!vis) return;
    if (s.bestStreak >= vis.reqStreak) {
      set({ selectedVisualizer: visId });
    }
  },

  setTheme(themeId) {
    const s = get();
    const th = THEMES.find(t => t.id === themeId);
    if (!th) return;
    if (s.bestStreak >= th.reqStreak) {
      set({ selectedTheme: themeId });
    }
  },

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
      if (s.soundEnabled) {
        playBreakChime();
      }
      set({ completedPrompt: { isBreak: true, nextMode: 'focus' } });
      return;
    }

    // Focus session complete -> play focus chime
    if (s.soundEnabled) {
      playFocusChime();
    }

    // Focus session complete
    const sessions = Math.min(s.sessions + 1, s.totalSess);
    const focusMins = Math.round(s.durations.focus / 60);
    const bonus = s.streak >= 30 ? 2 : s.streak >= 7 ? 1.5 : 1;
    const xp = Math.round(focusMins * bonus);

    const prevLvl = getLevelInfo(s.totalXP).lvl.n;
    const newState = applySession(s, xp);
    const newLvl = getLevelInfo(newState.totalXP).lvl.n;

    // Check milestones
    const found = MILESTONES.find(
      m => m.days === newState.streak && !newState.shownMs.includes(m.days)
    );
    const shownMs = found ? [...newState.shownMs, found.days] : newState.shownMs;

    // Update active task if selected
    let tasks = s.tasks || [];
    if (s.activeTaskId) {
      tasks = tasks.map(t => {
        if (t.id === s.activeTaskId) {
          const sessionsCompleted = t.sessionsCompleted + 1;
          return { ...t, sessionsCompleted };
        }
        return t;
      });
    }

    // Check new badges
    const today = todayStr();
    const todaySessions = newState.days[today]?.sessions || 0;
    const earnedBadges = newState.days[today]?.badges || [];
    let newBadge = null;

    BADGES.filter(b => b.type === 'session').forEach(badge => {
      if (todaySessions >= badge.target && !earnedBadges.includes(badge.id)) {
        earnedBadges.push(badge.id);
        newBadge = badge;
      }
    });

    if (newBadge) {
      newState.days[today].badges = earnedBadges;
    }

    persist({ ...newState, shownMs, tasks, activeTaskId: s.activeTaskId });

    const nextMode = sessions % s.totalSess === 0 ? 'long' : 'short';

    set({
      ...newState,
      sessions,
      shownMs,
      tasks,
      xpFlash: { amount: xp, bonus: bonus > 1, levelUp: newLvl > prevLvl, ts: Date.now() },
      milestone: found ?? null,
      newBadgeAlert: newBadge,
      completedPrompt: { isBreak: false, nextMode },
    });

    // Cloud sync
    get().syncCloudStats();
  },

  dismissMilestone() {
    set({ milestone: null });
  },

  dismissBadgeAlert() {
    set({ newBadgeAlert: null });
  },

  clearXpFlash() {
    set({ xpFlash: null });
  },

  addTask(title, description = '', category = 'foundations') {
    const s = get();
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title,
      description,
      category,
      sessionsCompleted: 0,
      completed: false,
      date: todayStr(),
    };
    const tasks = [...(s.tasks || []), newTask];
    set({ tasks });
    persist({
      ...s,
      tasks,
      activeTaskId: s.activeTaskId
    });
    s.syncCloudStats();
  },

  toggleTaskCompleted(taskId) {
    const s = get();
    let taskCompletedJustNow = false;
    const tasks = (s.tasks || []).map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        if (nextCompleted) taskCompletedJustNow = true;
        return {
          ...t,
          completed: nextCompleted
        };
      }
      return t;
    });

    let extraState = {};
    if (taskCompletedJustNow) {
      const xpEarned = 50;
      const today = todayStr();
      const prevLvl = getLevelInfo(s.totalXP).lvl.n;
      
      const days = { ...s.days };
      if (!days[today]) days[today] = { sessions: 0, xp: 0, badges: [] };
      if (!days[today].badges) days[today].badges = [];
      days[today] = { ...days[today], xp: days[today].xp + xpEarned };

      let streak = s.streak;
      if (!s.lastActiveDate) {
        streak = 1;
      } else if (s.lastActiveDate === today) {
        // already active today
      } else if (daysBetween(s.lastActiveDate, today) === 1) {
        streak += 1;
      } else {
        streak = 1;
      }
      
      extraState = {
        days,
        streak,
        lastActiveDate: today,
        bestStreak: Math.max(streak, s.bestStreak),
        totalXP: s.totalXP + xpEarned,
      };

      // Check task badges
      const tasksCompletedToday = tasks.filter(t => t.completed && t.date === today).length;
      const earnedBadges = extraState.days[today].badges || [];
      let newBadge = null;

      BADGES.filter(b => b.type === 'task').forEach(badge => {
        if (tasksCompletedToday >= badge.target && !earnedBadges.includes(badge.id)) {
          earnedBadges.push(badge.id);
          newBadge = badge;
        }
      });

      if (newBadge) {
        extraState.days[today].badges = earnedBadges;
        extraState.newBadgeAlert = newBadge;
      }

      extraState.xpFlash = { amount: xpEarned, bonus: false, levelUp: getLevelInfo(extraState.totalXP).lvl.n > prevLvl, ts: Date.now() };
    }

    const nextActiveId = s.activeTaskId === taskId && taskCompletedJustNow ? null : s.activeTaskId;

    const mergedState = {
      tasks,
      activeTaskId: nextActiveId,
      ...extraState
    };

    set(mergedState);

    const sNew = get();
    persist({
      ...sNew,
      tasks,
      activeTaskId: nextActiveId
    });
    sNew.syncCloudStats();
  },

  deleteTask(taskId) {
    const s = get();
    const tasks = (s.tasks || []).filter(t => t.id !== taskId);
    const activeTaskId = s.activeTaskId === taskId ? null : s.activeTaskId;
    set({ tasks, activeTaskId });
    persist({
      ...s,
      tasks,
      activeTaskId
    });
    s.syncCloudStats();
  },

  setActiveTaskId(taskId) {
    const s = get();
    set({ activeTaskId: taskId });
    persist({
      ...s,
      tasks: s.tasks,
      activeTaskId: taskId
    });
  },

  importWeekTasks(weekKey, weekItems) {
    const s = get();
    const existingTitles = new Set((s.tasks || []).map(t => t.title.toLowerCase()));
    
    const newTasks = weekItems
      .filter(item => !existingTitles.has(item.label.toLowerCase()))
      .map(item => ({
        id: 'task_roadmap_' + item.id + '_' + Date.now(),
        title: item.label,
        description: '',
        referenceUrl: item.url || item.ytUrl || '',
        category: item.cat,
        sessionsCompleted: 0,
        completed: false,
        date: todayStr(),
        roadmapId: item.id,
      }));

    if (newTasks.length === 0) return;

    const tasks = [...(s.tasks || []), ...newTasks];
    set({ tasks });
    persist({
      ...s,
      tasks,
      activeTaskId: s.activeTaskId
    });
    s.syncCloudStats();
  },

  importSingleTask(item) {
    const s = get();
    const existing = (s.tasks || []).find(t => t.roadmapId === item.id || t.title.toLowerCase() === item.label.toLowerCase());
    if (existing) return;

    const newTask = {
      id: 'task_roadmap_' + item.id + '_' + Date.now(),
      title: item.label,
      description: '',
      referenceUrl: item.url || item.ytUrl || '',
      category: item.cat,
      sessionsCompleted: 0,
      completed: false,
      date: todayStr(),
      roadmapId: item.id,
    };

    const tasks = [...(s.tasks || []), newTask];
    set({ tasks });
    persist({
      ...s,
      tasks,
      activeTaskId: s.activeTaskId
    });
    s.syncCloudStats();
  },

  setCustomRoadmap(roadmapData) {
    const s = get();
    set({ customRoadmap: roadmapData });
    persist({
      ...s,
      customRoadmap: roadmapData
    });
  },

  resetCustomRoadmap() {
    const s = get();
    set({ customRoadmap: null });
    persist({
      ...s,
      customRoadmap: null
    });
  },

  // Add a new item to the active roadmap (creates custom roadmap from defaults if none yet)
  addRoadmapItem(item) {
    const s = get();
    // Bootstrap from defaults if no custom roadmap yet
    const base = s.customRoadmap || {
      categories: { ...s.categories },
      items: [],
      weeks: [],
    };
    // Avoid collisions – import default items/weeks lazily
    const updatedItems = [
      ...(base.items || []),
      {
        id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        cat: item.cat,
        label: item.label,
        src: item.src || 'web',
        url: item.url || '',
        week: item.week,
      }
    ];
    const customRoadmap = { ...base, items: updatedItems };
    set({ customRoadmap });
    persist({ ...s, customRoadmap });
    s.syncCloudStats();
  },

  // Add a new week to the active roadmap
  addRoadmapWeek(weekKey, weekLabel) {
    const s = get();
    const base = s.customRoadmap || {
      categories: { ...s.categories },
      items: [],
      weeks: [],
    };
    // Prevent duplicate week keys
    if ((base.weeks || []).some(w => w.key === weekKey)) return;
    const updatedWeeks = [...(base.weeks || []), { key: weekKey, label: weekLabel }];
    const customRoadmap = { ...base, weeks: updatedWeeks };
    set({ customRoadmap });
    persist({ ...s, customRoadmap });
    s.syncCloudStats();
  },

  // Add a custom category to the active roadmap
  addRoadmapCategory(key, label, color) {
    const s = get();
    const base = s.customRoadmap || {
      categories: {},
      items: [],
      weeks: [],
    };
    const updatedCats = { ...(base.categories || {}), [key]: { label, color } };
    const customRoadmap = { ...base, categories: updatedCats };
    set({ customRoadmap });
    persist({ ...s, customRoadmap });
    s.syncCloudStats();
  },

  // Remove a roadmap item by id
  deleteRoadmapItem(itemId) {
    const s = get();
    if (!s.customRoadmap) return;
    const updatedItems = (s.customRoadmap.items || []).filter(i => i.id !== itemId);
    const customRoadmap = { ...s.customRoadmap, items: updatedItems };
    set({ customRoadmap });
    persist({ ...s, customRoadmap });
    s.syncCloudStats();
  },

  loadDefaultRoadmap() {
    const s = get();
    const defaultRoadmap = {
      categories: DEFAULT_CATS,
      items: [],
      weeks: [],
      includeDefaults: true
    };
    set({ customRoadmap: defaultRoadmap });
    persist({ ...s, customRoadmap: defaultRoadmap });
    s.syncCloudStats();
  },
}));
