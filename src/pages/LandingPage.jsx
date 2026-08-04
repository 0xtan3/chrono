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
        <div className={styles.tagline}>Procrastination ends here</div>
        
        <h1 className={styles.heroTitle}>
          TikTok stole your attention.<br />
          Let's get it back.
        </h1>
        
        <p className={styles.heroSubtitle}>
          Chrono isn't just a timer. It's a ruthless accountability system with custom learning roadmaps, harsh streak tracking, and data that exposes exactly where your time goes. 
        </p>

        <Link to="/login" className={styles.ctaBtn}>
          Lock In Now
          <span className={styles.ctaArrow}>→</span>
        </Link>

        {/* Features Grid */}
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🧠</div>
            <h3 className={styles.featureTitle}>Deep Work States</h3>
            <p className={styles.featureDesc}>Immerse yourself in customizable pomodoro sessions paired with our built-in interstellar lo-fi player.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🗺️</div>
            <h3 className={styles.featureTitle}>Custom Roadmaps</h3>
            <p className={styles.featureDesc}>Don't just work blindly. Import learning roadmaps and track your progress through weeks of structured content.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔥</div>
            <h3 className={styles.featureTitle}>Ruthless Streaks</h3>
            <p className={styles.featureDesc}>Miss a day? You lose it all. Chrono sends you a reminder email before midnight to save your streak.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
