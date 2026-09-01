import React, { useMemo } from 'react';
import { useStore } from '../store';
import styles from './HubermanLogModal.module.css';

export default function HubermanLogModal({ isOpen, onClose }) {
  const hubermanLog = useStore((s) => s.hubermanLog);
  const cyclesCompleted = useStore((s) => s.huberman.cyclesCompleted);

  const { grouped, deepWorkHours, nsdrCount, totalSessions } = useMemo(() => {
    let dwMins = 0;
    let nsdrs = 0;
    let sessions = 0;

    const groupedData = hubermanLog.reduce((acc, entry) => {
      if (!entry.timestamp) return acc;
      const dateKey = entry.timestamp.split('T')[0];

      if (entry.phase === 'focus') {
        dwMins += entry.duration || 0;
        sessions++;
      } else if (entry.phase === 'nsdr') {
        nsdrs++;
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
      deepWorkHours: (dwMins / 60).toFixed(1),
      nsdrCount: nsdrs,
      totalSessions: sessions,
    };
  }, [hubermanLog]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>🧠 Protocol Log</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close log">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.statsOverview}>
          <div className={styles.statBox}>
            <span className={styles.statValue}>{deepWorkHours}h</span>
            <span className={styles.statLabel}>Deep Work</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statValue}>{totalSessions}</span>
            <span className={styles.statLabel}>Ultradian Sessions</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statValue}>{nsdrCount}</span>
            <span className={styles.statLabel}>NSDRs</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statValue}>{cyclesCompleted}</span>
            <span className={styles.statLabel}>Cycles</span>
          </div>
        </div>

        <div className={styles.logList}>
          {Object.keys(grouped).length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🧪</span>
              <p>No protocol sessions yet.</p>
              <p className={styles.emptyHint}>Start your first Huberman cycle to see your deep work history here.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([dateKey, { label, entries }]) => (
              <div key={dateKey} className={styles.dateGroup}>
                <h3 className={styles.dateHeader}>{label}</h3>
                {entries.map((entry) => (
                  <div key={entry.id} className={`${styles.logEntry} ${styles[entry.phase]}`}>
                    <div className={styles.entryIntent}>
                      <span className={styles.phaseIcon}>
                        {entry.phase === 'focus' ? '🧠' : '🌊'}
                      </span>
                      {entry.intent}
                    </div>
                    <div className={styles.entryMeta}>
                      <span className={styles.entryTime}>
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`${styles.entryDuration} ${styles[entry.phase + 'Duration']}`}>
                        {entry.duration}m
                      </span>
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
