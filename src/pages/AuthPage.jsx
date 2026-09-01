import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, loginUser, resendVerificationEmail } from '../lib/appwrite';
import { useStore } from '../store';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  
  // Screen size detection (Tablets >= 768px, Desktops/Laptops >= 1024px)
  const [isSmallScreen, setIsSmallScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigate = useNavigate();
  const initAuth = useStore(s => s.initAuth);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUnverifiedEmail('');
    setLoading(true);

    try {
      if (tab === 'register') {
        if (!name.trim()) throw new Error('Please enter your name.');
        await registerUser(email, password, name);
        setSuccess('Account created! We sent a verification email to your address. Please verify your email before logging in.');
        setTab('login');
        setPassword('');
      } else {
        await loginUser(email, password);
        await initAuth();
        navigate('/');
      }
    } catch (err) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(email);
        setError('Your email is not verified yet. Please check your inbox and click the verification link.');
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const target = unverifiedEmail || email;
    if (!target) {
      setError('Please enter your email address above to resend the verification link.');
      return;
    }
    setResending(true);
    setError('');
    try {
      await resendVerificationEmail(target);
      setResendDone(true);
    } catch (err) {
      setError(err.message || 'Failed to resend verification email via Resend.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />

      <header className={styles.header}>
        <Link to="/welcome" className={styles.brand}>
          <span className={styles.brandDot} /> CHRONO
        </Link>
      </header>

      {/* ── Screen Gate for Small Mobile Phones ───────────────────────────── */}
      {isSmallScreen ? (
        <div className={styles.screenGateCard}>
          <div className={styles.gateIconWrap}>
            <span className={styles.gateIcon}>🖥️</span>
          </div>

          <div className={styles.gateBadgePill}>
            <span className={styles.gateBadgeDot} />
            <span>DESKTOP / TABLET REQUIRED</span>
          </div>

          <h2 className={styles.gateTitle}>Get On A Bigger Screen</h2>

          <p className={styles.gateDesc}>
            CHRONO is an uncompromising deep work environment designed for intense, distraction-free study. Your phone is a distraction trap—open CHRONO on your laptop, desktop, or tablet to enter the chamber.
          </p>

          <div className={styles.gateBenefitsList}>
            <div className={styles.gateBenefitItem}>
              <span>✨</span>
              <span>Full-screen 3D liquid focus visualizers</span>
            </div>
            <div className={styles.gateBenefitItem}>
              <span>🎧</span>
              <span>40Hz Gamma & Pink noise stereo soundscapes</span>
            </div>
            <div className={styles.gateBenefitItem}>
              <span>⚡</span>
              <span>90-minute ultradian study cycles & XP leveling</span>
            </div>
          </div>

          <div className={styles.gateActions}>
            <button className={styles.copyLinkBtn} onClick={handleCopyLink}>
              {copied ? '✓ Link Copied to Clipboard!' : '📋 Copy Link for Your Computer'}
            </button>
            <Link to="/welcome" className={styles.backLandingBtn}>
              ← Back to Protocol Overview
            </Link>
          </div>
        </div>
      ) : (
        /* ── Standard Login / Register Form for Desktops & Tablets ───────── */
        <div className={styles.authCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              {tab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className={styles.cardSub}>
              {tab === 'login'
                ? 'Log in to sync your focus streaks across devices'
                : 'Join CHRONO to track your focus streaks and level up'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className={styles.tabGroup}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'login' ? styles.tabActive : ''}`}
              onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
            >
              Log In
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'register' ? styles.tabActive : ''}`}
              onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
            >
              Sign Up
            </button>
          </div>

          {/* Feedback Banners */}
          {error && <div className={styles.errorBanner}>{error}</div>}
          {success && <div className={styles.successBanner}>{success}</div>}

          {/* Resend Verification Notice */}
          {unverifiedEmail && (
            <div className={styles.resendBox}>
              <p className={styles.resendText}>
                Didn't get the verification email?
              </p>
              {resendDone ? (
                <p className={styles.resendSuccess}>✓ Verification link dispatched via Resend!</p>
              ) : (
                <button
                  type="button"
                  className={styles.resendBtn}
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? 'Sending...' : 'Resend Verification Email via Resend'}
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div className={styles.inputGroup}>
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="alex@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading
                ? 'Connecting...'
                : tab === 'login'
                ? 'Sign In to Chamber →'
                : 'Create Account & Begin →'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
