import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import styles from './MusicPlayer.module.css';

export default function MusicPlayer() {
  const [showVolume, setShowVolume] = useState(false);
  const ref = useRef();

  const isPlayingLofi    = useStore(s => s.isPlayingLofi);
  const lofiVolume       = useStore(s => s.lofiVolume);
  const currentLofiTrack = useStore(s => s.currentLofiTrack);
  const toggleLofi       = useStore(s => s.toggleLofi);
  const skipLofiTrack    = useStore(s => s.skipLofiTrack);
  const setLofiVolume    = useStore(s => s.setLofiVolume);

  // Close volume popover on outside click
  useEffect(() => {
    if (!showVolume) return;
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setShowVolume(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showVolume]);

  return (
    <div
      className={styles.wrapper}
      ref={ref}
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      {/* Linked Volume & Track Popover */}
      {showVolume && (
        <div className={styles.volumePopover}>
          <div className={styles.trackInfoRow}>
            <div className={styles.trackMeta}>
              <span className={styles.trackTitle}>{currentLofiTrack?.title || 'Deep Space Organ'}</span>
              <span className={styles.trackGenre}>{currentLofiTrack?.genre || 'Cinematic Space'}</span>
            </div>
            <button
              className={styles.skipBtn}
              onClick={skipLofiTrack}
              title="Skip to Next Track"
              aria-label="Skip to Next Track"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 4 15 12 5 20 5 4"/>
                <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className={styles.volHeader}>
            <span className={styles.volLabel}>Volume</span>
            <span className={styles.volPercent}>{Math.round(lofiVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={lofiVolume}
            onChange={e => setLofiVolume(parseFloat(e.target.value))}
            className={styles.volSlider}
          />
        </div>
      )}

      {/* Single Music Icon Button */}
      <button
        className={`${styles.musicBtn} ${isPlayingLofi ? styles.playing : ''}`}
        onClick={toggleLofi}
        aria-label={isPlayingLofi ? 'Pause Music' : 'Play Background Music'}
        title={
          isPlayingLofi
            ? `Playing: ${currentLofiTrack?.title || 'Space Ambient'} (Click to Pause, Hover for Volume & Skip)`
            : 'Play Background Music (Hover for Volume & Skip)'
        }
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        {isPlayingLofi && <span className={styles.pulseDot} />}
      </button>
    </div>
  );
}
