import React, { useMemo } from 'react';
import { useStore } from '../store';
import styles from './FocusLogModal.module.css';

export default function FocusLogModal({ isOpen, onClose }) {
  const focusLog = useStore((s) => s.focusLog);

  const { grouped, totalHours, sessionCount, deepWorkMins, nsdrCount } = useMemo(() => {
    let dwMins = 0;
    let nsdrs = 0;
    let focusMins = 0;
    let sCount = 0;

    const groupedData = focusLog.reduce((acc, entry) => {
      if (!entry.timestamp) return acc;
      const dateKey = entry.timestamp.split('T')[0];
      
      if (entry.mode === 'ultradian') {
        dwMins += entry.duration || 0;
        focusMins += entry.duration || 0;
        sCount++;
      } else if (entry.mode === 'nsdr') {
        nsdrs++;
      } else {
        focusMins += entry.duration || 0;
        sCount++;
      }

      if (!acc[dateKey]) {
        acc[dateKey] = {
          label: new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
          entries: []
        };
      }
      acc[dateKey].entries.push(entry);
      return acc;
    }, {});

    return {
      grouped: groupedData,
      totalHours: (focusMins / 60).toFixed(1),
      sessionCount: sCount,
      deepWorkMins: dwMins,
      nsdrCount: nsdrs
    };
  }, [focusLog]);

  if (!isOpen) return null;

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
            <span className={styles.statValue}>{sessionCount}</span>
            <span className={styles.statLabel}>Sessions</span>
          </div>
          {deepWorkMins > 0 && (
            <div className={styles.statBox}>
              <span className={styles.statValue}>{(deepWorkMins / 60).toFixed(1)}h</span>
              <span className={styles.statLabel}>Deep Work</span>
            </div>
          )}
          {nsdrCount > 0 && (
            <div className={styles.statBox}>
              <span className={styles.statValue}>{nsdrCount}</span>
              <span className={styles.statLabel}>NSDRs</span>
            </div>
          )}
        </div>

        <div className={styles.logList}>
          {Object.keys(grouped).length === 0 ? (
            <div className={styles.emptyState}>No focus sessions logged yet.</div>
          ) : (
            Object.entries(grouped).map(([dateKey, { label, entries }]) => (
              <div key={dateKey} className={styles.dateGroup}>
                <h3 className={styles.dateHeader}>{label}</h3>
                {entries.map((entry) => (
                  <div key={entry.id} className={`${styles.logEntry} ${entry.mode ? styles[entry.mode] : ''}`}>
                    <div className={styles.entryIntent}>
                      {entry.mode === 'ultradian' && <span className={styles.modeIcon} title="Ultradian Deep Work">🧠</span>}
                      {entry.mode === 'nsdr' && <span className={styles.modeIcon} title="Non-Sleep Deep Rest">🌊</span>}
                      {entry.intent}
                    </div>
                    <div className={styles.entryMeta}>
                      <span className={styles.entryTime}>
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={styles.entryDuration}>{entry.duration}m</span>
                    </div>
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
