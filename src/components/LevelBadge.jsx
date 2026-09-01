import React from 'react';
import { useStore, calculateLevel, getStreakMultiplier } from '../store';
import styles from './LevelBadge.module.css';

export default function LevelBadge({ onClick }) {
  const totalXP = useStore((s) => s.totalXP);
  const streak = useStore((s) => s.streak);
  const { level, title, rankIcon, rankColor, xpInLevel, xpNeeded, progressPercent } = calculateLevel(totalXP);
  const multiplier = getStreakMultiplier(streak);

  return (
    <button className={styles.badgeContainer} onClick={onClick} title="Click to view Study Rank & Level Progress">
      <div className={styles.rankIconWrap} style={{ borderColor: rankColor }}>
        <span className={styles.rankIcon}>{rankIcon}</span>
      </div>

      <div className={styles.infoCol}>
        <div className={styles.topRow}>
          <span className={styles.levelTag}>Lv.{level}</span>
          <span className={styles.titleText} style={{ color: rankColor }}>{title}</span>
          {multiplier.mult > 1 && (
            <span className={styles.multBadge} title={`${multiplier.label} Active!`}>
              {multiplier.icon} {multiplier.mult}x
            </span>
          )}
        </div>

        <div className={styles.progressBarBg}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${progressPercent}%`, backgroundColor: rankColor }}
          />
        </div>
      </div>

      <div className={styles.xpDetail}>
        <span className={styles.xpNumber}>{xpInLevel}</span>
        <span className={styles.xpDivider}>/</span>
        <span className={styles.xpMax}>{xpNeeded} XP</span>
      </div>
    </button>
  );
}
