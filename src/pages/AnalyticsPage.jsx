import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, getLevelInfo, MILESTONES, BADGES, todayStr } from '../store';
import styles from './AnalyticsPage.module.css';

// ── Icons ─────────────────────────────────────────────────────────────────────
const FlameIcon = () => <span className={styles.flameIcon}>🔥</span>;
const SessionsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const TodayIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
);
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

// ── Interactive Weekly Focus Bar Chart Component ──────────────────────────────
function WeeklyChart({ days }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Compute last 7 days (ending today)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const sess = (days[dateStr] || {}).sessions || 0;
    // Estimate focus minutes (e.g. 25m per session)
    const mins = sess * 25;
    return { dateStr, dayLabel, sess, mins };
  });

  const maxMins = Math.max(...last7Days.map(d => d.mins), 60); // min scale 60m

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.cardTitle}>Focus Time Distribution</h3>
          <span className={styles.cardSub}>Past 7 Days Output</span>
        </div>
        <div className={styles.avgPill}>
          Avg {(last7Days.reduce((a, b) => a + b.mins, 0) / 7).toFixed(0)}m / day
        </div>
      </div>

      <div className={styles.chartContainer}>
        {last7Days.map((d, idx) => {
          const heightPercent = Math.max(8, (d.mins / maxMins) * 100);
          const isToday = d.dateStr === todayStr();
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={d.dateStr}
              className={styles.barCol}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className={styles.chartTooltip}>
                  <strong>{d.mins}m</strong> ({d.sess} session{d.sess !== 1 ? 's' : ''})
                </div>
              )}

              {/* SVG / CSS Bar */}
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${isToday ? styles.barToday : ''}`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* Day Label */}
              <span className={`${styles.barLabel} ${isToday ? styles.barLabelActive : ''}`}>
                {d.dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Behavioral Insights Card ──────────────────────────────────────────────────
function BehaviorInsights({ days, streak, totalXP }) {
  const today = todayStr();
  
  // Calculate consistency score (active days in past 14 days)
  const past14Active = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return ((days[s] || {}).sessions || 0) > 0;
  }).filter(Boolean).length;

  const consistencyPct = Math.round((past14Active / 14) * 100);

  // Derive persona
  const persona =
    streak >= 14 ? 'Unstoppable Titan 🚀' :
    consistencyPct >= 70 ? 'Deep Work Master 🧠' :
    streak >= 3 ? 'Rising Scholar 🌱' : 'Focus Explorer ⚡';

  return (
    <div className={styles.insightsCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>Behavioral Insights</h3>
          <span className={styles.cardSub}>Habit Strength &amp; Patterns</span>
        </div>
        <span className={styles.personaBadge}>{persona}</span>
      </div>

      <div className={styles.insightsGrid}>
        {/* Metric 1: Consistency */}
        <div className={styles.insightBox}>
          <div className={styles.insightTop}>
            <span className={styles.insightVal}>{consistencyPct}%</span>
            <ZapIcon />
          </div>
          <span className={styles.insightLabel}>14-Day Consistency</span>
          <div className={styles.miniBar}>
            <div className={styles.miniFill} style={{ width: `${consistencyPct}%` }} />
          </div>
        </div>

        {/* Metric 2: Streak Health */}
        <div className={styles.insightBox}>
          <div className={styles.insightTop}>
            <span className={styles.insightVal}>{streak}d</span>
            <FlameIcon />
          </div>
          <span className={styles.insightLabel}>Current Velocity</span>
          <span className={styles.insightSub}>
            {streak > 0 ? 'Streak Active &amp; Healthy' : 'Start a session today!'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Activity Matrix Heatmap ───────────────────────────────────────────────────
function Heatmap({ days }) {
  const today = todayStr();
  const DN = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const cells = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (27 - i));
    const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const sess = (days[s] || {}).sessions || 0;
    const lvl  = sess >= 4 ? 4 : sess >= 3 ? 3 : sess >= 2 ? 2 : sess >= 1 ? 1 : 0;
    const isToday = s === today;
    return { s, sess, lvl, isToday, dayName: DN[d.getDay()] };
  });

  const rows = Array.from({ length: 4 }, (_, r) => cells.slice(r*7, r*7+7));

  return (
    <div className={styles.heatmapCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.cardTitle}>28-Day Activity Matrix</h3>
          <span className={styles.cardSub}>Daily Focus Density</span>
        </div>
        <div className={styles.heatmapLegend}>
          <span className={styles.legendText}>Less</span>
          {[0,1,2,3,4].map(l => (
            <div key={l} className={`${styles.cell} ${styles[`lvl${l}`]}`} />
          ))}
          <span className={styles.legendText}>More</span>
        </div>
      </div>

      <div className={styles.heatmapGrid}>
        <div className={styles.heatmapDayLabels}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <span key={d} className={styles.dayLabel}>{d}</span>
          ))}
        </div>
        {rows.map((row, ri) => (
          <div key={ri} className={styles.heatmapRow}>
            {row.map(cell => (
              <div
                key={cell.s}
                className={`${styles.cell} ${styles[`lvl${cell.lvl}`]} ${cell.isToday ? styles.today : ''}`}
                title={`${cell.s}: ${cell.sess} session${cell.sess !== 1 ? 's' : ''}`}
              >
                {cell.sess > 0 && <span className={styles.cellDot} />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Milestone Checklist ───────────────────────────────────────────────────────
function MilestoneList({ streak }) {
  return (
    <div className={styles.milestoneCardContainer}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.cardTitle}>Milestones &amp; Badges</h3>
          <span className={styles.cardSub}>Streak Achievements</span>
        </div>
      </div>

      <div className={styles.milestonesGrid}>
        {MILESTONES.map(m => {
          const unlocked = streak >= m.days;
          return (
            <div
              key={m.days}
              className={`${styles.milestoneCard} ${unlocked ? styles.milestoneUnlocked : ''}`}
            >
              <div className={styles.msHeader}>
                <span className={styles.msEmoji}>{unlocked ? m.emoji : '🔒'}</span>
                <span className={`${styles.msBadge} ${unlocked ? styles.msBadgeUnlocked : ''}`}>
                  {unlocked ? 'Unlocked' : `${m.days}d goal`}
                </span>
              </div>
              <div className={styles.msTitle}>{m.title}</div>
              <div className={styles.msSub}>
                {unlocked ? m.sub : `Reach ${m.days} days`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Daily Badges List ─────────────────────────────────────────────────────────
function DailyBadgesList({ days }) {
  // Count how many times each badge was earned
  const badgeCounts = {};
  BADGES.forEach(b => badgeCounts[b.id] = 0);

  Object.values(days).forEach(dayStats => {
    if (dayStats.badges) {
      dayStats.badges.forEach(badgeId => {
        if (badgeCounts[badgeId] !== undefined) {
          badgeCounts[badgeId]++;
        }
      });
    }
  });

  return (
    <div className={styles.milestoneCardContainer} style={{ marginTop: '2rem' }}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.cardTitle}>Daily Badges</h3>
          <span className={styles.cardSub}>Earned for intense daily focus</span>
        </div>
      </div>

      <div className={styles.milestonesGrid}>
        {BADGES.map(b => {
          const count = badgeCounts[b.id] || 0;
          const unlocked = count > 0;
          return (
            <div
              key={b.id}
              className={`${styles.milestoneCard} ${unlocked ? styles.milestoneUnlocked : ''}`}
            >
              <div className={styles.msHeader}>
                <span className={styles.msEmoji}>{unlocked ? b.emoji : '🔒'}</span>
                <span className={`${styles.msBadge} ${unlocked ? styles.msBadgeUnlocked : ''}`}>
                  {unlocked ? `Earned ${count}x` : 'Locked'}
                </span>
              </div>
              <div className={styles.msTitle}>{b.title}</div>
              <div className={styles.msSub}>{b.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Analytics Page Dashboard ─────────────────────────────────────────────────
export default function AnalyticsPage() {
  const streak     = useStore(s => s.streak);
  const bestStreak = useStore(s => s.bestStreak);
  const totalXP    = useStore(s => s.totalXP);
  const days       = useStore(s => s.days);

  const today     = todayStr();
  const todaySess = (days[today] || {}).sessions || 0;
  const totalSess = Object.values(days).reduce((a, d) => a + (d.sessions || 0), 0);
  const { lvl, next, progress, toNext } = getLevelInfo(totalXP);

  const hour = new Date().getHours();
  const atRisk = streak > 0 && todaySess === 0 && hour >= 18;

  return (
    <div className={styles.dashboardViewport}>
      {/* Background Ambient Glow Orbs */}
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />

      {/* Top Header Navigation */}
      <header className={styles.topHeader}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.backBtn} aria-label="Back to timer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </Link>
          <div>
            <h1 className={styles.title}>Behavior &amp; Focus Analytics</h1>
            <span className={styles.subtitle}>Performance Overview</span>
          </div>
        </div>

        {/* Level Ribbon */}
        <div className={styles.levelRibbon}>
          <div className={styles.levelRibbonTop}>
            <span className={styles.lvlBadge}>LVL {lvl.n} • {lvl.name}</span>
            <span className={styles.xpText}>{totalXP.toLocaleString()} XP</span>
          </div>
          <div className={styles.xpTrack}>
            <div className={styles.xpFill} style={{ width: `${(progress * 100).toFixed(1)}%` }} />
          </div>
        </div>
      </header>

      {/* Streak At Risk Warning */}
      {atRisk && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '12px',
          padding: '14px 20px',
          margin: '0 0 1.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.4s ease',
        }}>
          <span style={{ fontSize: '1.3rem' }}>🔥</span>
          <span style={{ color: '#fca5a5', fontSize: '0.9rem', fontWeight: 600 }}>
            Streak at risk! Complete a focus session before midnight to save your {streak}-day streak.
          </span>
          <Link to="/" style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            background: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '8px',
            color: '#fca5a5',
            textDecoration: 'none',
            fontSize: '0.8rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            Go Focus →
          </Link>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <main className={styles.dashboardGrid}>
        {/* Row 1: Weekly Focus Chart + Behavioral Insights */}
        <div className={styles.rowTop}>
          <WeeklyChart days={days} />
          <BehaviorInsights days={days} streak={streak} totalXP={totalXP} />
        </div>

        {/* Row 2: Quick Metrics Row */}
        <div className={styles.metricsRow}>
          <div className={styles.metricItem}>
            <span className={styles.metricVal}>{totalSess}</span>
            <span className={styles.metricLbl}>Total Sessions</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricVal}>{todaySess}</span>
            <span className={styles.metricLbl}>Sessions Today</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricVal}>{streak}d</span>
            <span className={styles.metricLbl}>Active Streak</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricVal}>{bestStreak}d</span>
            <span className={styles.metricLbl}>Best Streak</span>
          </div>
        </div>

        {/* Row 3: Activity Matrix + Milestones */}
        <div className={styles.rowBottom}>
          <Heatmap days={days} />
          <MilestoneList streak={streak} />
        </div>
        <DailyBadgesList days={days} />
      </main>
    </div>
  );
}
