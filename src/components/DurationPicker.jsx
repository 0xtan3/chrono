import { useState, useRef, useEffect } from 'react';
import { useStore, QUICK_PRESETS, DEEP_PRESETS, BREAK_PRESETS } from '../store';
import styles from './DurationPicker.module.css';

function Picker({ label, modeKey, presets }) {
  const durations   = useStore((s) => s.durations);
  const setDuration = useStore((s) => s.setDuration);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const currentMin = Math.round((durations[modeKey] || 25 * 60) / 60);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={styles.picker} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen((o) => !o)}>
        <span className={styles.lbl}>{label}</span>
        <span className={styles.val}>{currentMin}m</span>
        <svg className={`${styles.arrow} ${open ? styles.arrowOpen : ''}`} viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown}>
          {presets.map((min) => (
            <button
              key={min}
              className={`${styles.chip} ${currentMin === min ? styles.chipActive : ''}`}
              onClick={() => {
                setDuration(modeKey, min);
                setOpen(false);
              }}
            >
              {min}m
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DurationPicker() {
  const mode = useStore((s) => s.mode);

  if (mode === 'deep') {
    return (
      <div className={styles.row}>
        <Picker label="Deep" modeKey="deep" presets={DEEP_PRESETS} />
        <span className={styles.sep}>·</span>
        <Picker label="Reset" modeKey="recovery" presets={BREAK_PRESETS} />
      </div>
    );
  }

  return (
    <div className={styles.row}>
      <Picker label="Focus" modeKey="quick" presets={QUICK_PRESETS} />
      <span className={styles.sep}>·</span>
      <Picker label="Break" modeKey="short" presets={BREAK_PRESETS} />
    </div>
  );
}
