import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './ScreenGate.module.css';

export default function ScreenGate({ showBackLink = true }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className={styles.gateOverlay}>
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />

      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandDot} /> CHRONO
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>🖥️</span>
        </div>

        <div className={styles.badgePill}>
          <span className={styles.badgeDot} />
          <span>DESKTOP / TABLET REQUIRED</span>
        </div>

        <h2 className={styles.title}>Get On A Bigger Screen</h2>

        <p className={styles.desc}>
          CHRONO is an uncompromising deep work chamber engineered for intense focus. Your phone is a dopamine distraction trap—open CHRONO on your <strong>laptop</strong>, <strong>desktop</strong>, or <strong>tablet</strong> to enter the chamber.
        </p>

        <div className={styles.benefitsList}>
          <div className={styles.benefitItem}>
            <span>✨</span>
            <span>Full-screen 3D liquid focus visualizers</span>
          </div>
          <div className={styles.benefitItem}>
            <span>🎧</span>
            <span>40Hz Gamma & Pink noise stereo soundscapes</span>
          </div>
          <div className={styles.benefitItem}>
            <span>⚡</span>
            <span>90-minute ultradian study cycles & XP leveling</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? '✓ Link Copied to Clipboard!' : '📋 Copy Link for Your Computer'}
          </button>
          {showBackLink && (
            <Link to="/welcome" className={styles.backLink}>
              ← Back to Protocol Overview
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
