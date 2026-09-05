import React, { useState, useMemo } from 'react';
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

export default function FocusLogModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'badges' | 'rank'

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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <span className={styles.commandIcon}>⚡</span>
            <h2 className={styles.title}>Study Command Center</h2>
          </div>
          <div className={styles.headerActions}>
            {user ? (
              <button className={styles.authBtn} onClick={logout} title={`Logged in as ${user.name || 'User'}`}>
                Log Out
              </button>
            ) : (
              <Link to="/login" className={styles.authBtnPrimary}>
                Log In
              </Link>
            )}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close command center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Level & Rank Showcase Hero Card */}
        <div className={styles.rankHeroCard} style={{ borderColor: `${levelInfo.rankColor}40` }}>
          <div className={styles.rankAvatarWrap} style={{ borderColor: levelInfo.rankColor, boxShadow: `0 0 20px ${levelInfo.rankColor}30` }}>
            <span className={styles.rankAvatarIcon}>{levelInfo.rankIcon}</span>
          </div>

          <div className={styles.rankHeroDetails}>
            <div className={styles.rankTitleRow}>
              <span className={styles.heroLevelTag}>LEVEL {levelInfo.level}</span>
              <span className={styles.heroTitleText} style={{ color: levelInfo.rankColor }}>{levelInfo.title}</span>
              <span className={styles.heroMultiplierPill}>
                {multiplier.icon} {multiplier.label}
              </span>
            </div>

            <div className={styles.heroProgressBarBg}>
              <div 
                className={styles.heroProgressBarFill} 
                style={{ width: `${levelInfo.progressPercent}%`, backgroundColor: levelInfo.rankColor }}
              />
            </div>

            <div className={styles.heroXpRow}>
              <span className={styles.totalXpLabel}>Total Mastery: <strong>{totalXP.toLocaleString()} XP</strong></span>
              <span className={styles.nextLvlHint}>{levelInfo.xpInLevel} / {levelInfo.xpNeeded} XP to Lv.{levelInfo.level + 1}</span>
            </div>
          </div>
        </div>

        {/* Core Stats Metric Strip */}
        <div className={styles.metricStrip}>
          <div className={styles.metricItem}>
            <span className={styles.metricVal}>{totalHours}h</span>
            <span className={styles.metricLbl}>Total Study</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricVal} style={{ color: '#c084fc' }}>{deepHours}h</span>
            <span className={styles.metricLbl}>Deep Protocol</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricVal}>{sessionCount}</span>
            <span className={styles.metricLbl}>Sessions</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricVal} style={{ color: todayMins >= dailyGoalMinutes ? '#34d399' : '#fff' }}>
              {todayMins}/{dailyGoalMinutes}m
            </span>
            <select
              className={styles.targetSelectMini}
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
              title="Change your daily study target"
            >
              {[30, 45, 60, 90, 120, 180, 240, 300, 360, 480].map((mins) => (
                <option key={mins} value={mins}>
                  Goal: {mins}m ▾
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className={styles.viewTabs}>
          <button 
            className={`${styles.viewTabBtn} ${activeTab === 'history' ? styles.activeViewTab : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📋 Study Logs ({focusLog.length})
          </button>
          <button 
            className={`${styles.viewTabBtn} ${activeTab === 'badges' ? styles.activeViewTab : ''}`}
            onClick={() => setActiveTab('badges')}
          >
            🏆 Milestone Badges ({shownMs.length}/{ALL_BADGES.length})
          </button>
          <button 
            className={`${styles.viewTabBtn} ${activeTab === 'profile' ? styles.activeViewTab : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Identity
          </button>
        </div>

        {/* Content Views */}
        <div className={styles.scrollArea}>
          {activeTab === 'history' && (
            <div className={styles.historyList}>
              {Object.keys(grouped).length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>🚀</span>
                  <p>No study sessions logged yet.</p>
                  <span className={styles.emptyHint}>Start a Deep Work Protocol or Quick Focus block to begin earning XP!</span>
                </div>
              ) : (
                Object.entries(grouped).map(([dateKey, { label, entries }]) => (
                  <div key={dateKey} className={styles.dateGroup}>
                    <h3 className={styles.dateHeader}>{label}</h3>
                    {entries.map((entry) => (
                      <div key={entry.id} className={`${styles.logEntry} ${styles[entry.mode] || ''}`}>
                        <div className={styles.entryMain}>
                          <div className={styles.intentTitle}>
                            {entry.mode === 'deep' && <span className={styles.modeIcon} title="Deep Work Protocol">🧠</span>}
                            {entry.mode === 'recovery' && <span className={styles.modeIcon} title="Neural Reset">🌊</span>}
                            {entry.mode === 'quick' && <span className={styles.modeIcon} title="Quick Focus">⚡</span>}
                            <span className={styles.intentText}>{entry.intent}</span>
                          </div>

                          <div className={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                className={`${styles.starBtn} ${(entry.rating || 0) >= star ? styles.starFilled : ''}`}
                                onClick={() => rateSession(entry.id, star)}
                                title={`Rate focus: ${star} stars`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className={styles.entryMeta}>
                          <span className={styles.entryTime}>
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={styles.entryDuration}>{entry.duration}m</span>
                          {entry.xpEarned && (
                            <span className={`${styles.xpPill} ${styles[entry.rewardTier] || ''}`}>
                              +{entry.xpEarned} XP
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'badges' && (
            <div className={styles.badgesGrid}>
              {ALL_BADGES.map((badge) => {
                const isUnlocked = shownMs.includes(badge.id);
                return (
                  <div 
                    key={badge.id} 
                    className={`${styles.badgeCard} ${isUnlocked ? styles.badgeUnlocked : styles.badgeLocked}`}
                  >
                    <div className={styles.badgeIconWrap}>
                      <span className={styles.badgeIcon}>{badge.icon}</span>
                    </div>
                    <div className={styles.badgeTextCol}>
                      <span className={styles.badgeName}>{badge.name}</span>
                      <span className={styles.badgeDesc}>{badge.desc}</span>
                      <span className={`${styles.badgeStatus} ${isUnlocked ? styles.statusUnlocked : ''}`}>
                        {isUnlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className={styles.profileView}>
              <h3 className={styles.sectionTitle}>Select Identity Matrix</h3>
              <p className={styles.sectionSub}>Choose your visual signature for the Chrono leaderboard.</p>
              
              <div className={styles.avatarGrid}>
                {AVATARS.map((a) => (
                  <button 
                    key={a.id} 
                    className={`${styles.avatarSelectBtn} ${avatarId === a.id ? styles.avatarActive : ''}`}
                    onClick={() => setAvatar(a.id)}
                  >
                    <Avatar id={a.id} size="lg" />
                    <span className={styles.avatarName} style={{ color: a.color }}>{a.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
