import { useStore } from '../store';
import styles from './Controls.module.css';

const ResetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const SkipIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

export default function Controls() {
  const running = useStore((s) => s.running);
  const elapsed = useStore((s) => s.elapsed);
  const play    = useStore((s) => s.play);
  const pause   = useStore((s) => s.pause);
  const reset   = useStore((s) => s.reset);
  const skip    = useStore((s) => s.skip);

  return (
    <div className={styles.controls}>
      {/* Main Start / Stop Action Button */}
      <button
        className={`${styles.mainBtn} ${running ? styles.runningBtn : ''}`}
        onClick={() => (running ? pause() : play())}
      >
        {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start'}
      </button>

      {/* Redo / Reset Button */}
      <button
        className={styles.resetBtn}
        onClick={reset}
        title="Reset Phase (Redo)"
        aria-label="Reset Timer"
      >
        <ResetIcon />
      </button>

      {/* Skip Phase Button (visible if running or elapsed > 0) */}
      {(running || elapsed > 0) && (
        <button
          className={styles.skipBtn}
          onClick={skip}
          title="Skip Current Phase"
          aria-label="Skip Phase"
        >
          <SkipIcon />
        </button>
      )}
    </div>
  );
}
