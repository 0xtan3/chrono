import { useState } from 'react';
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

  const navigate = useNavigate();
  const initAuth = useStore(s => s.initAuth);

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
            Register
          </button>
        </div>

        {/* Success Banner */}
        {success && <div className={styles.successBanner}>{success}</div>}

        {/* Error Banner */}
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Unverified Email Warning Action */}
        {unverifiedEmail && (
          <div className={styles.resendBox}>
            <p className={styles.resendText}>
              Didn&apos;t receive the email link for <strong>{unverifiedEmail}</strong>?
            </p>
            {resendDone ? (
              <span className={styles.resendSuccess}>✓ Verification link resent to your inbox!</span>
            ) : (
              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Resending...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {tab === 'register' && (
            <div className={styles.inputGroup}>
              <label htmlFor="authName">Full Name</label>
              <input
                id="authName"
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="authEmail">Email Address</label>
            <input
              id="authEmail"
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="authPassword">Password</label>
            <input
              id="authPassword"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading
              ? 'Processing...'
              : tab === 'login'
                ? 'Log In'
                : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
