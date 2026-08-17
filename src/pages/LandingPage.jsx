import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const user = useStore(s => s.user);
  const authLoading = useStore(s => s.authLoading);
  const navigate = useNavigate();

  // If already logged in, instantly redirect to the app (timer)
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) return null; // Let the AuthGuard or simple null handle the flash

  return (
    <div className={styles.landingViewport}>
      {/* Background Ambient Glow Orbs */}
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />

      {/* Top Navigation */}
      <nav className={styles.topNav}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          CHRONO
        </div>
        <Link to="/login" className={styles.loginBtn}>Sign In</Link>
      </nav>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.tagline}>Radically Simple Focus</div>
        
        <h1 className={styles.heroTitle}>
          Hyperfocus,<br />
          simplified.
        </h1>
        
        <p className={styles.heroSubtitle}>
          CHRONO is a beautifully minimal focus timer designed specifically for the distracted mind. No clutter, no complex systems. Just a fluid interface, strict accountability, and your deep work.
        </p>

        <Link to="/login" className={styles.ctaBtn}>
          Start Focusing
          <span className={styles.ctaArrow}>→</span>
        </Link>

        {/* Features Grid */}
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>✨</div>
            <h3 className={styles.featureTitle}>Pure Immersion</h3>
            <p className={styles.featureDesc}>A distraction-free, full-screen fluid visualizer that keeps you grounded without stealing your attention.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📈</div>
            <h3 className={styles.featureTitle}>Silent Tracking</h3>
            <p className={styles.featureDesc}>Your focus sessions and intentions are automatically logged behind the scenes into a beautiful activity dashboard.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔥</div>
            <h3 className={styles.featureTitle}>Strict Accountability</h3>
            <p className={styles.featureDesc}>Build momentum day by day. Miss a session, and your streak resets. We'll even remind you so you don't forget.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
