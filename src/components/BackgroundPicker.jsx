/**
 * BackgroundPicker — Popover for selecting live animated backgrounds
 */

import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import styles from './BackgroundPicker.module.css';

const BACKGROUNDS = [
  { id: 'orb',          label: 'Orb',           icon: '🔮', desc: 'Default 3D plasma orb' },
  { id: 'ghibliSummer', label: 'Ghibli Summer', icon: '🍃', desc: 'Hand-painted anime meadow' },
  { id: 'lofiCity',     label: 'Lo-fi City',    icon: '🏙️', desc: 'City skyline at night' },
];

export default function BackgroundPicker() {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);
  const btnRef = useRef(null);

  const backgroundId = useStore((s) => s.backgroundId);
  const setBackground = useStore((s) => s.setBackground);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const isOrbSelected = !backgroundId || backgroundId === 'orb' || backgroundId === 'none';
  const isActive = Boolean(backgroundId && backgroundId !== 'orb' && backgroundId !== 'none');

  return (
    <div className={styles.pickerWrap}>
      <button
        ref={btnRef}
        className={`${styles.triggerBtn} ${isActive ? styles.triggerActive : ''}`}
        onClick={() => setOpen((o) => !o)}
        title="Themes"
        aria-label="Toggle theme picker"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="3" />
          <path d="M2 15l5-5 3 3 4-4 8 8" />
          <circle cx="15.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {open && (
        <div ref={popoverRef} className={styles.popover}>
          <div className={styles.popoverHeader}>
            <span className={styles.popoverTitle}>Themes</span>
            <span className={styles.popoverSub}>Visual styles & backgrounds</span>
          </div>

          <div className={styles.optionsList}>
            {BACKGROUNDS.map((bg) => {
              const selected = bg.id === 'orb' ? isOrbSelected : backgroundId === bg.id;
              return (
                <button
                  key={bg.id}
                  className={`${styles.optionBtn} ${selected ? styles.optionSelected : ''}`}
                  onClick={() => {
                    setBackground(bg.id);
                    setOpen(false);
                  }}
                >
                  <span className={styles.optionIcon}>{bg.icon}</span>
                  <div className={styles.optionText}>
                    <span className={styles.optionLabel}>{bg.label}</span>
                    <span className={styles.optionDesc}>{bg.desc}</span>
                  </div>
                  {selected && <span className={styles.checkmark}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
