import React from 'react';
import { useStore, todayStr } from '../store';
import styles from './DailyProgressBar.module.css';

export default function DailyProgressBar() {
  const days = useStore((s) => s.days);
  const timezone = useStore((s) => s.timezone);
  const dailyGoalMinutes = useStore((s) => s.dailyGoalMinutes) || 120;

  const today = todayStr(timezone);
  const todayMins = days[today]?.mins || 0;
  const progressPercent = Math.min(100, Math.round((todayMins / dailyGoalMinutes) * 100));
  const isGoalAchieved = todayMins >= dailyGoalMinutes;

  return (
    <div className={styles.container} title={`Daily Target: ${todayMins} of ${dailyGoalMinutes} mins focused today (${progressPercent}%)`}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <span className={styles.targetIcon}>{isGoalAchieved ? '🏆' : '🎯'}</span>
          <span className={styles.label}>Daily Target</span>
        </div>
        <div className={styles.statsWrap}>
          <span className={styles.minsCurrent}>{todayMins}m</span>
          <span className={styles.minsDivider}>/</span>
          <span className={styles.minsGoal}>{dailyGoalMinutes}m</span>
          <span className={`${styles.percentTag} ${isGoalAchieved ? styles.achievedTag : ''}`}>
            {isGoalAchieved ? 'COMPLETED' : `${progressPercent}%`}
          </span>
        </div>
      </div>

      <div className={styles.barTrack}>
        <div 
          className={`${styles.barFill} ${isGoalAchieved ? styles.barAchieved : ''}`} 
          style={{ width: `${progressPercent}%` }}
        >
          <div className={styles.glowHead} />
        </div>
      </div>
    </div>
  );
}
