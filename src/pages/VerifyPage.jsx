import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { verifyUserEmail } from '../lib/appwrite';
import styles from './VerifyPage.module.css';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  const [status, setStatus]   = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || !secret) {
      setStatus('error');
      setErrorMsg('Invalid verification link. Missing user ID or secret token.');
      return;
    }

    async function doVerify() {
      try {
        await verifyUserEmail(userId, secret);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.message || 'Email verification failed or link has expired.');
      }
    }

    doVerify();
  }, [userId, secret]);

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
          </div>
        )}

        {status === 'error' && (
          <div className={styles.box}>
            <span className={styles.errorIcon}>⚠️</span>
            <h2 className={styles.title}>Verification Failed</h2>
            <p className={styles.sub}>{errorMsg}</p>
            <button className={styles.actionBtn} onClick={() => navigate('/login')}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
