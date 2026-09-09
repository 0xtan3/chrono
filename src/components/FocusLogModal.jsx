import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  useStore, 
  calculateLevel, 
  getStreakMultiplier, 
  ALL_BADGES, 
  todayStr 
} from '../store';
import { AVATARS } from './Avatar';
import Avatar from './Avatar';
import styles from './FocusLogModal.module.css';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconDeep = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="14" height="14">
    <circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="2.5" />
  </svg>
);

const IconQuick = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="14" height="14">
    <polygon points="6 2 6 8 11 8" /><circle cx="8" cy="8" r="6" />
  </svg>
);

const IconRecovery = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="14" height="14">
    <path d="M2 8c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M14 8c0 3.3-2.7 6-6 6s-6-2.7-6-6" />
  </svg>
);

const MODE_ICONS = { deep: <IconDeep />, quick: <IconQuick />, recovery: <IconRecovery /> };

// ── Vector Badge Icons (Modern, non-childish) ──────────────────────────────────
const BADGE_SVGS = {
  first_spark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  deep_initiate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M12 2a5 5 0 0 0-5 5v1a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
      <path d="M7 13a6 6 0 0 0-3 5.2V20h16v-1.8A6 6 0 0 0 17 13" />
      <circle cx="12" cy="7" r="1.5" fill="currentColor" />
    </svg>
  ),
  neural_reset: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  flame_streak: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
    </svg>
  ),
  inferno_streak: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  century_mind: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M4 22h16M4 6h16M2 6l10-4 10 4M6 6v16M10 6v16M14 6v16M18 6v16" />
    </svg>
  ),
  goal_crusher: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  deep_voyager: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="12" cy="12" r="6" />
      <path d="M2.5 14.5c3.5 4 15.5 4 19-5" />
      <path d="M21.5 9.5c-3.5-4-15.5-4-19 5" strokeDasharray="2 2" />
    </svg>
  ),
};

export default function FocusLogModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('logs');

  const focusLog         = useStore((s) => s.focusLog);
  const totalXP          = useStore((s) => s.totalXP);
  const streak           = useStore((s) => s.streak);
  const shownMs          = useStore((s) => s.shownMs) || [];
  const days             = useStore((s) => s.days);
  const timezone         = useStore((s) => s.timezone);
  const dailyGoalMinutes    = useStore((s) => s.dailyGoalMinutes) || 120;
  const setDailyGoalMinutes = useStore((s) => s.setDailyGoalMinutes);
  const rateSession         = useStore((s) => s.rateSession);
  const avatarId            = useStore((s) => s.avatarId);
  const setAvatar           = useStore((s) => s.setAvatar);
  const user                = useStore((s) => s.user);
  const logout              = useStore((s) => s.logout);
  const emailNotifications  = useStore((s) => s.emailNotifications);
  const setEmailNotifications = useStore((s) => s.setEmailNotifications);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const levelInfo = calculateLevel(totalXP);
  const multiplier = getStreakMultiplier(streak);
  const today = todayStr(timezone);
  const todayMins = days[today]?.mins || 0;

  const { grouped, totalHours, deepHours, sessionCount } = useMemo(() => {
    let totalMins = 0;
    let deepMins = 0;
    let count = 0;

    const groupedData = focusLog.reduce((acc, entry) => {
      if (!entry.timestamp) return acc;
      const dateKey = entry.timestamp.split('T')[0];

      if (entry.mode === 'deep') {
        deepMins += entry.duration || 0;
        totalMins += entry.duration || 0;
        count++;
      } else if (entry.mode === 'quick') {
        totalMins += entry.duration || 0;
        count++;
      }

      if (!acc[dateKey]) {
        acc[dateKey] = {
          label: new Date(entry.timestamp).toLocaleDateString(undefined, { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          entries: [],
        };
      }
      acc[dateKey].entries.push(entry);
      return acc;
    }, {});

    return {
      grouped: groupedData,
      totalHours: (totalMins / 60).toFixed(1),
      deepHours: (deepMins / 60).toFixed(1),
      sessionCount: count,
    };
  }, [focusLog]);

  if (!isOpen) return null;

  const tabs = [
    { key: 'logs',     label: 'Logs' },
    { key: 'badges',   label: 'Badges' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Command Center">
        
        {/* ── Header ─────────────────────────────────────── */}
        <div className={styles.header}>
          <h2 className={styles.title}>Command Center</h2>
          <div className={styles.headerActions}>
            {user ? (
              <button className={styles.authBtn} onClick={logout} title={`Logged in as ${user.name || 'User'}`}>
                Log Out
              </button>
            ) : (
              <Link to="/login" className={styles.authBtn}>Log In</Link>
            )}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <IconClose />
            </button>
          </div>
        </div>

        {/* ── Rank Hero ──────────────────────────────────── */}
        <div className={styles.rankHero}>
          <div className={styles.rankRow}>
            <span className={styles.rankLevel}>Lv.{levelInfo.level}</span>
            <span className={styles.rankDot}>•</span>
            <span className={styles.rankTitle} style={{ color: levelInfo.rankColor }}>{levelInfo.title}</span>
            <span className={styles.rankMultiplier}>{multiplier.label}</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ 
                width: `${levelInfo.progressPercent}%`, 
                backgroundColor: levelInfo.rankColor 
              }}
            />
          </div>
          <div className={styles.xpRow}>
            <span className={styles.xpTotal}>{totalXP.toLocaleString()} XP</span>
            <span className={styles.xpNext}>{levelInfo.xpInLevel} / {levelInfo.xpNeeded}</span>
          </div>
        </div>

        {/* ── Stats Strip ────────────────────────────────── */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statVal}>{totalHours}h</span>
            <span className={styles.statLbl}>Total</span>
          </div>
          <span className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statVal}>{deepHours}h</span>
            <span className={styles.statLbl}>Deep</span>
          </div>
          <span className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statVal}>{sessionCount}</span>
            <span className={styles.statLbl}>Sessions</span>
          </div>
          <span className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statVal} style={{ color: todayMins >= dailyGoalMinutes ? '#34d399' : undefined }}>
              {todayMins}/{dailyGoalMinutes}m
            </span>
            <div className={styles.statSelectWrapper}>
              <span className={styles.statLbl}>Target</span>
              <select
                className={styles.statSelect}
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                title="Change daily target"
                aria-label="Daily target minutes"
              >
                {[30, 45, 60, 90, 120, 180, 240, 300, 360, 480].map((m) => (
                  <option key={m} value={m}>{m}m</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ─────────────────────────────────────── */}
        <nav className={styles.tabBar}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* ── Content ─────────────────────────────────────── */}
        <div className={styles.scrollArea}>

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className={styles.logsList}>
              {Object.keys(grouped).length === 0 ? (
                <div className={styles.empty}>
                  <p className={styles.emptyTitle}>No sessions yet</p>
                  <p className={styles.emptySub}>Start a focus block to begin tracking progress.</p>
                </div>
              ) : (
                Object.entries(grouped).map(([dateKey, { label, entries }]) => (
                  <div key={dateKey} className={styles.dateGroup}>
                    <h3 className={styles.dateHeader}>{label}</h3>
                    {entries.map((entry) => (
                      <div key={entry.id} className={styles.logEntry}>
                        <div className={styles.entryLeft}>
                          <span className={styles.entryModeIcon}>{MODE_ICONS[entry.mode]}</span>
                          <span className={styles.entryIntent}>{entry.intent || entry.mode}</span>
                        </div>
                        <div className={styles.entryRight}>
                          <div className={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map((star) => {
                              const filled = (entry.rating || 0) >= star;
                              return (
                                <button
                                  key={star}
                                  className={`${styles.starBtn} ${filled ? styles.starFilled : ''}`}
                                  onClick={() => rateSession(entry.id, star)}
                                  title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                >
                                  <svg viewBox="0 0 24 24" width="11" height="11" fill={filled ? '#fbbf24' : 'none'} stroke={filled ? '#fbbf24' : '#3f3f46'} strokeWidth="1.6">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                  </svg>
                                </button>
                              );
                            })}
                          </div>
                          <span className={styles.entryDuration}>{entry.duration}m</span>
                          {entry.xpEarned && (
                            <span className={styles.entryXp}>+{entry.xpEarned}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className={styles.badgesList}>
              {ALL_BADGES.map((badge) => {
                const unlocked = shownMs.includes(badge.id);
                return (
                  <div key={badge.id} className={`${styles.badgeRow} ${unlocked ? styles.badgeUnlocked : ''}`}>
                    <div className={styles.badgeIconBox}>
                      {BADGE_SVGS[badge.id] || (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      )}
                    </div>
                    <div className={styles.badgeInfo}>
                      <span className={styles.badgeName}>{badge.name}</span>
                      <span className={styles.badgeDesc}>{badge.desc}</span>
                    </div>
                    <span className={`${styles.badgeStatus} ${unlocked ? styles.statusDone : ''}`}>
                      {unlocked ? (
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                          <polyline points="3.5 8.5 6.5 11.5 12.5 5" />
                        </svg>
                      ) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Settings Tab (Avatar + Notifications) */}
          {activeTab === 'settings' && (
            <div className={styles.settingsView}>
              
              {/* Avatar Section */}
              <div className={styles.settingsSection}>
                <h3 className={styles.settingsLabel}>Avatar</h3>
                <div className={styles.avatarGrid}>
                  {AVATARS.map((a) => (
                    <button 
                      key={a.id} 
                      className={`${styles.avatarBtn} ${avatarId === a.id ? styles.avatarActive : ''}`}
                      onClick={() => setAvatar(a.id)}
                      title={a.name}
                    >
                      <Avatar id={a.id} size="lg" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications Section */}
              <div className={styles.settingsSection}>
                <h3 className={styles.settingsLabel}>Notifications</h3>
                <div className={styles.settingsRow}>
                  <div className={styles.settingsRowLeft}>
                    <span className={styles.settingsIcon}><IconMail /></span>
                    <div className={styles.settingsText}>
                      <span className={styles.settingsName}>Email Reminders</span>
                      <span className={styles.settingsDesc}>Streak warnings, inactivity alerts, freeze notifications</span>
                    </div>
                  </div>
                  <button
                    className={`${styles.toggle} ${emailNotifications !== false ? styles.toggleOn : ''}`}
                    onClick={() => setEmailNotifications(emailNotifications === false)}
                    role="switch"
                    aria-checked={emailNotifications !== false}
                    aria-label="Toggle email notifications"
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
