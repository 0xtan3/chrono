import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, loginUser, resendVerificationEmail } from '../lib/appwrite';
import { useStore } from '../store';
import { isPhoneDevice } from '../utils/device';
import ScreenGate from '../components/ScreenGate';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResend, setShowResend] = useState(false); // Show resend for both register + unverified login
  const [resendEmail, setResendEmail] = useState('');   // The email to resend to
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [cooldown, setCooldown] = useState(0);          // Cooldown seconds remaining
  const cooldownRef = useRef(null);
  
  // Phone detection (iPhones, Android mobile, small screens)
  const [isPhone, setIsPhone] = useState(() => isPhoneDevice());

  useEffect(() => {
    const handleResize = () => {
      setIsPhone(isPhoneDevice());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  const navigate = useNavigate();
  const initAuth = useStore(s => s.initAuth);

  // If detected as a phone, render the ScreenGate
  if (isPhone) {
    return <ScreenGate showBackLink={true} />;
  }

  const startCooldown = (seconds = 60) => {
    setCooldown(seconds);
    setResendDone(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowResend(false);
    setResendDone(false);
    setLoading(true);

    try {
      if (tab === 'register') {
        if (!name.trim()) throw new Error('Please enter your name.');
        await registerUser(email, password, name);
        setSuccess('Account created! We sent a verification email to your inbox. Please verify before logging in.');
        setResendEmail(email);
        setShowResend(true);
        startCooldown(60);
        setTab('login');
        setPassword('');
      } else {
        await loginUser(email, password);
        await initAuth();
        navigate('/');
      }
    } catch (err) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        const targetEmail = err.email || email;
        setResendEmail(targetEmail);
        setShowResend(true);
        setError('Your email is not verified yet. We just sent a new verification link to your inbox. Please check your spam folder too.');
        
        // Auto-resend in background
        resendVerificationEmail(targetEmail).then(() => {
          startCooldown(60);
        }).catch((e) => {
          if (e.retryAfter) {
            setCooldown(e.retryAfter);
            setResendDone(true);
          }
        });
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const target = resendEmail || email;
    if (!target) {
      setError('Please enter your email address above to resend the verification link.');
      return;
    }
    setResending(true);
    setError('');
    try {
      await resendVerificationEmail(target);
      startCooldown(60);
    } catch (err) {
      // Handle rate limit with server-provided retry time
      if (err.retryAfter) {
        setCooldown(err.retryAfter);
        setResendDone(true);
      }
      setError(err.message || 'Failed to resend verification email.');
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
            Sign Up
          </button>
        </div>

        {/* Feedback Banners */}
        {error && <div className={styles.errorBanner}>{error}</div>}
        {success && <div className={styles.successBanner}>{success}</div>}

        {/* Resend Verification Notice — shown after registration OR unverified login */}
        {showResend && (
          <div className={styles.resendBox}>
            <p className={styles.resendText}>
              Didn't get the verification email? Check spam/junk too.
            </p>
            {cooldown > 0 ? (
              <p className={styles.resendCooldown}>
                ✓ Email sent! You can resend in {cooldown}s
              </p>
            ) : (
              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
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
    </div>
  );
}
