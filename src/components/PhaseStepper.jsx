import styles from './PhaseStepper.module.css';

const PHASES = [
  { key: 'warmup', label: 'Warm-up', icon: '◉' },
  { key: 'focus',  label: 'Deep Work', icon: '🧠' },
  { key: 'nsdr',   label: 'NSDR', icon: '🌊' },
];

export default function PhaseStepper({ currentPhase, warmupEnabled }) {
  const activePhases = warmupEnabled ? PHASES : PHASES.filter(p => p.key !== 'warmup');

  const getStatus = (phaseKey) => {
    if (currentPhase === 'idle') return 'upcoming';
    const order = activePhases.map(p => p.key);
    const currentIdx = order.indexOf(currentPhase);
    const phaseIdx = order.indexOf(phaseKey);
    if (phaseIdx < currentIdx) return 'done';
    if (phaseIdx === currentIdx) return 'active';
    return 'upcoming';
  };

  return (
    <div className={styles.stepper}>
      {activePhases.map((phase, i) => {
        const status = getStatus(phase.key);
        return (
          <div key={phase.key} className={styles.step}>
            {i > 0 && (
              <div className={`${styles.connector} ${status === 'done' || status === 'active' ? styles.connectorActive : ''}`} />
            )}
            <div className={`${styles.dot} ${styles[status]}`}>
              {status === 'done' ? '✓' : phase.icon}
            </div>
            <span className={`${styles.label} ${styles[status + 'Label']}`}>
              {phase.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
