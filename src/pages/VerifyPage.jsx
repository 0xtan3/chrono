import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { verifyUserEmail, resendVerificationEmail } from '../lib/appwrite';
import styles from './VerifyPage.module.css';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  const [status, setStatus]   = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [redirectCount, setRedirectCount] = useState(5);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState(''); // 'sent' | 'error' | ''
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !secret) {
      setStatus('error');
      setErrorMsg('Invalid verification link. Missing user ID or secret token.');
      return;
    }

    async function doVerify() {
      try {
        const result = await verifyUserEmail(userId, secret);
        if (result.alreadyVerified) {
          setStatus('success');
        } else {
          setStatus('success');
        }
      } catch (err) {
        setStatus('error');
        const msg = err.message || 'Email verification failed or link has expired.';
        setErrorMsg(msg);
        // Check if the error indicates an expired token
        if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
          setIsExpired(true);
        }
      }
    }

    doVerify();
  }, [userId, secret]);

  // Auto-redirect countdown after success
  useEffect(() => {
    if (status !== 'success') return;
    if (redirectCount <= 0) {
      navigate('/login');
      return;
    }
    const timer = setTimeout(() => setRedirectCount(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, redirectCount, navigate]);

  // Cooldown timer for resend
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

  const handleResend = async () => {
    if (!resendEmail || !resendEmail.includes('@')) {
      setResendResult('error');
      return;
    }
    setResending(true);
    setResendResult('');
    try {
      await resendVerificationEmail(resendEmail);
      setResendResult('sent');
      setCooldown(60);
    } catch (err) {
      if (err.retryAfter) {
        setCooldown(err.retryAfter);
        setResendResult('sent');
      } else {
        setResendResult('error');
      }
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

      <div className={styles.card}>
        {status === 'verifying' && (
          <div className={styles.box}>
            <div className={styles.spinner} />
            <h2 className={styles.title}>Verifying Your Account...</h2>
            <p className={styles.sub}>Connecting to CHRONO authentication services</p>
          </div>
        )}

        {status === 'success' && (
          <div className={styles.box}>
            <span className={styles.successIcon}>🎉</span>
            <h2 className={styles.title}>Account Verified!</h2>
            <p className={styles.sub}>
              Your email has been successfully verified. You can now log in and start tracking your focus sessions.
            </p>
            <button className={styles.actionBtn} onClick={() => navigate('/login')}>
              Log In to CHRONO →
            </button>
            <p className={styles.redirectNote}>
              Redirecting to login in {redirectCount}s...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.box}>
            <span className={styles.errorIcon}>⚠️</span>
            <h2 className={styles.title}>Verification Failed</h2>
            <p className={styles.sub}>{errorMsg}</p>

            {/* Resend option for expired/invalid tokens */}
            {isExpired && (
              <div className={styles.resendSection}>
                <p className={styles.resendLabel}>Request a new verification email:</p>
                <input
                  type="email"
                  className={styles.resendInput}
                  placeholder="your@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                {cooldown > 0 ? (
                  <p className={styles.resendCooldown}>✓ Sent! Resend available in {cooldown}s</p>
                ) : (
                  <button
                    className={styles.resendBtn}
                    onClick={handleResend}
                    disabled={resending || !resendEmail}
                  >
                    {resending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                )}
                {resendResult === 'sent' && cooldown <= 0 && (
                  <p className={styles.resendSuccess}>✓ Verification email sent! Check your inbox.</p>
                )}
                {resendResult === 'error' && (
                  <p className={styles.resendError}>Please enter a valid email address.</p>
                )}
              </div>
            )}

            <button className={styles.actionBtn} onClick={() => navigate('/login')}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
