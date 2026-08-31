import { useStore, MODES } from '../store';
import styles from './ModeTabs.module.css';

const TABS = Object.entries(MODES)
  .filter(([key]) => key !== 'warmup')
  .map(([key, info]) => ({
    key,
    label: info.label,
  }));

export default function ModeTabs() {
  const mode    = useStore(s => s.mode);
  const setMode = useStore(s => s.setMode);
  const hubermanMode = useStore(s => s.hubermanMode);

  const activeTabs = TABS.filter(t => 
    hubermanMode || (t.key !== 'ultradian' && t.key !== 'nsdr')
  );

  return (
    <nav className={styles.tabs} aria-label="Timer mode">
      {activeTabs.map(t => (
        <button
          key={t.key}
          className={`${styles.tab} ${mode === t.key ? styles.active : ''}`}
          onClick={() => setMode(t.key)}
          aria-pressed={mode === t.key}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
