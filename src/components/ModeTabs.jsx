import React from 'react';
import { useStore, MODES } from '../store';
import styles from './ModeTabs.module.css';

const TABS = Object.values(MODES);

export default function ModeTabs() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);

  return (
    <nav className={styles.tabs} aria-label="Study Mode Selection">
      {TABS.map((t) => {
        const isActive = mode === t.key;
        return (
          <button
            key={t.key}
            className={`${styles.tab} ${isActive ? styles.active : ''} ${t.isProtocol ? styles.protocolTab : ''}`}
            onClick={() => setMode(t.key)}
            aria-pressed={isActive}
          >
            {t.badge && <span className={styles.protocolBadge}>★ {t.badge}</span>}
            <span className={styles.tabText}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
