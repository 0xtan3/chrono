import React from 'react';
import { useStore, todayStr } from '../store';
import styles from './DailyProgressBar.module.css';

const PRESET_GOALS = [30, 60, 90, 120, 180, 240];

export default function DailyProgressBar() {
  const days = useStore((s) => s.days);
  const timezone = useStore((s) => s.timezone);
  const dailyGoalMinutes = useStore((s) => s.dailyGoalMinutes) || 120;
  const setDailyGoalMinutes = useStore((s) => s.setDailyGoalMinutes);

  const today = todayStr(timezone);
  const todayMins = days[today]?.mins || 0;
  const progressPercent = Math.min(100, Math.round((todayMins / dailyGoalMinutes) * 100));
  const isGoalAchieved = todayMins >= dailyGoalMinutes;

  const cycleGoal = (e) => {
    e.stopPropagation();
    const idx = PRESET_GOALS.indexOf(dailyGoalMinutes);
    const nextGoal = idx >= 0 ? PRESET_GOALS[(idx + 1) % PRESET_GOALS.length] : 120;
    setDailyGoalMinutes(nextGoal);
  };

  return (
    <div className={styles.container} title={`Daily Target: ${todayMins} of ${dailyGoalMinutes} mins focused today (${progressPercent}%). Click target to change.`}>
      <div className={styles.headerRow}>
        <div className={styles.titleWrap}>
          <span className={styles.targetIcon}>{isGoalAchieved ? '🏆' : '🎯'}</span>
          <span className={styles.label}>Daily Target</span>
        </div>
        <div className={styles.statsWrap}>
          <span className={styles.minsCurrent}>{todayMins}m</span>
          <span className={styles.minsDivider}>/</span>
          <button 
            type="button" 
            className={styles.goalBtn} 
            onClick={cycleGoal}
            title="Click to cycle daily target (30m, 60m, 90m, 120m, 180m, 240m)"
          >
            {dailyGoalMinutes}m
          </button>
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
