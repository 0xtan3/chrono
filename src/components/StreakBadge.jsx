import { useStore, todayStr, getStreakMultiplier } from '../store';
import styles from './StreakBadge.module.css';

export default function StreakBadge() {
  const streak = useStore((s) => s.streak);
  const lastActiveDate = useStore((s) => s.lastActiveDate);
  const user = useStore((s) => s.user);
  const timezone = useStore((s) => s.timezone);

  const today = todayStr(timezone);
  const hasCompletedToday = lastActiveDate === today;
  const atRisk = streak > 0 && (!hasCompletedToday || !user);
  const multiplier = getStreakMultiplier(streak);

  const tooltipMsg = !user
    ? `Streak Warning: You are not logged in! Log in and study to protect your ${streak}-day streak.`
    : !hasCompletedToday
    ? `Streak Warning: Study today to protect your ${streak}-day streak & ${multiplier.mult}x XP buff!`
    : `${streak}-Day Streak Active! (${multiplier.label} XP Buff)`;

  return (
    <div className={`${styles.badge} ${atRisk ? styles.risk : ''}`} title={tooltipMsg}>
      <span className={styles.flame}>{streak >= 30 ? '🌟' : streak >= 14 ? '⚡' : '🔥'}</span>
      <span className={styles.count}>{streak}</span>
      {multiplier.mult > 1 && <span className={styles.multiplierHint}>{multiplier.mult}x</span>}
      {atRisk && <span className={styles.riskDot} />}
    </div>
  );
}
