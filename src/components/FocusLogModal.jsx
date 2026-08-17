import React from 'react';
import { useStore } from '../store';
import styles from './FocusLogModal.module.css';

export default function FocusLogModal({ isOpen, onClose }) {
  const focusLog = useStore((s) => s.focusLog);

  if (!isOpen) return null;

  // Group by date
  const grouped = focusLog.reduce((acc, entry) => {
    const d = new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(entry);
    return acc;
  }, {});

  const totalMinutes = focusLog.reduce((sum, entry) => sum + (entry.duration || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Activity Log</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close log">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.statsOverview}>
          <div className={styles.statBox}>
            <span className={styles.statValue}>{totalHours}h</span>
            <span className={styles.statLabel}>Total Focus</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statValue}>{focusLog.length}</span>
            <span className={styles.statLabel}>Sessions</span>
          </div>
        </div>

        <div className={styles.logList}>
          {Object.keys(grouped).length === 0 ? (
            <div className={styles.emptyState}>No focus sessions logged yet.</div>
          ) : (
            Object.entries(grouped).map(([date, entries]) => (
              <div key={date} className={styles.dateGroup}>
                <h3 className={styles.dateHeader}>{date}</h3>
                {entries.map((entry) => (
                  <div key={entry.id} className={styles.logEntry}>
                    <div className={styles.entryIntent}>{entry.intent}</div>
                    <div className={styles.entryDuration}>{entry.duration}m</div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
