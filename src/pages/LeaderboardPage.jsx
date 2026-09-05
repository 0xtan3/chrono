import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Query } from 'appwrite';
import { databases, APPWRITE_CONFIG } from '../lib/appwrite';
import { useStore, calculateLevel } from '../store';
import Avatar from '../components/Avatar';
import ScreenGate from '../components/ScreenGate';
import { isPhoneDevice } from '../utils/device';
import styles from './LeaderboardPage.module.css';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useStore(s => s.user);
  
  const [isPhone, setIsPhone] = useState(() => isPhoneDevice());
  
  useEffect(() => {
    const handleResize = () => setIsPhone(isPhoneDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchLeaders() {
      try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setLeaders(data.leaders || []);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaders();
  }, []);

  if (isPhone) {
    return <ScreenGate showBackLink={true} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />

      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandDot} /> CHRONO
        </Link>
        <Link to="/" className={styles.backLink}>
          ← Back to Timer
        </Link>
      </header>

      <main className={styles.mainContainer}>
        <div className={styles.leaderboardCard}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Global Leaderboard</h1>
            <p className={styles.subtitle}>Top 50 users by total Mastery XP</p>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading ranks...</p>
            </div>
          ) : leaders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No users found on the leaderboard yet.</p>
            </div>
          ) : (
            <div className={styles.listContainer}>
              {leaders.map((leader, index) => {
                const isMe = currentUser && currentUser.$id === leader.userId;
                const levelInfo = calculateLevel(leader.totalXP);
                
                return (
                  <div key={leader.id || leader.userId || index} className={`${styles.row} ${isMe ? styles.isMe : ''}`}>
                    <div className={styles.rankCol}>
                      {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    
                    <div className={styles.userCol}>
                      <Avatar id={leader.avatarId || 'avatar-1'} size="md" />
                      <div className={styles.userDetails}>
                        <span className={styles.userName}>
                          {leader.displayName || 'Unknown Chrononaut'}
                          {isMe && <span className={styles.youBadge}>(You)</span>}
                        </span>
                        <span className={styles.userLevel} style={{ color: levelInfo.rankColor }}>
                          {levelInfo.rankIcon} Lv.{levelInfo.level} • {levelInfo.title}
                        </span>
                      </div>
                    </div>
                    
                    <div className={styles.statsCol}>
                      <div className={styles.statBox}>
                        <span className={styles.statLabel}>Streak</span>
                        <span className={styles.statVal}>{leader.streak} 🔥</span>
                      </div>
                      <div className={styles.statBox}>
                        <span className={styles.statLabel}>Total XP</span>
                        <span className={styles.statValXP}>{leader.totalXP.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
