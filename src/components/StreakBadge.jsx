import { useStore } from '../store';
import styles from './StreakBadge.module.css';

export default function StreakBadge() {
  const streak = useStore(s => s.streak);
  const lastActiveDate = useStore(s => s.lastActiveDate);
  const user = useStore(s => s.user);

  const today = new Date().toISOString().split('T')[0];
  const hasCompletedToday = lastActiveDate === today;
  const atRisk = streak > 0 && (!hasCompletedToday || !user);

  const tooltipMsg = !user
    ? `Streak Warning: You are not logged in! Log in and focus on a task to save your ${streak}-day streak.`
    : !hasCompletedToday
    ? `Streak Warning: Focus on a task today to save your ${streak}-day streak!`
    : `${streak}-day streak active!`;

  return (
    <div className={`${styles.badge} ${atRisk ? styles.risk : ''}`} title={tooltipMsg}>
      <span className={styles.flame}>{streak >= 14 ? '🔥🔥' : '🔥'}</span>
      <span className={styles.count}>{streak}</span>
      {atRisk && <span className={styles.riskDot} />}
    </div>
  );
}
