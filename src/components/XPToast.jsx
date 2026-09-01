import React, { useEffect } from 'react';
import { useStore } from '../store';
import styles from './XPToast.module.css';

export default function XPToast() {
  const activeToast = useStore((s) => s.activeToastReward);
  const clearToast = useStore((s) => s.clearToastReward);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 4500);
    return () => clearTimeout(timer);
  }, [activeToast, clearToast]);

  if (!activeToast) return null;

  const { tier, xp, label, isLevelUp, newLevel, newTitle } = activeToast;

  return (
    <div className={`${styles.toastOverlay} ${styles[tier]}`} onClick={clearToast}>
      <div className={styles.toastCard}>
        {/* Tier Banner / Icon */}
        <div className={styles.topBanner}>
          {tier === 'legendary' && <span className={styles.tierEmoji}>👑 LEGENDARY DROP!</span>}
          {tier === 'critical' && <span className={styles.tierEmoji}>⚡ CRITICAL COGNITIVE SURGE!</span>}
          {tier === 'bonus' && <span className={styles.tierEmoji}>✨ BONUS FOCUS SURGE!</span>}
          {tier === 'normal' && !isLevelUp && <span className={styles.tierEmoji}>🎯 SESSION COMPLETED</span>}
          {isLevelUp && <span className={styles.levelUpBadge}>🌟 RANK UP: LEVEL {newLevel}!</span>}
        </div>

        {/* Big XP Pill */}
        <div className={styles.xpRow}>
          <span className={styles.xpValue}>+{xp}</span>
          <span className={styles.xpUnit}>XP</span>
        </div>

        {isLevelUp ? (
          <div className={styles.levelUpText}>
            You have ascended to <strong>{newTitle}</strong>!
          </div>
        ) : (
          <div className={styles.subText}>{label}</div>
        )}

        <span className={styles.dismissHint}>Click anywhere to dismiss</span>
      </div>
    </div>
  );
}
