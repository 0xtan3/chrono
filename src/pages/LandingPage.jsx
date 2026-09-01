import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore, getStreakMultiplier, calculateLevel, RANK_TITLES } from '../store';
import { startBinauralBeats, startPinkNoise, stopSoundscape, playCriticalChime } from '../utils/audio';
import styles from './LandingPage.module.css';

const PROTOCOL_PHASES = [
  {
    id: 'primer',
    step: '01',
    name: 'Visual Primer',
    duration: '60s',
    tag: 'NEURAL FOCUS',
    desc: 'Contract your visual field onto a single pinpoint. Triggers immediate optical focus and snaps you out of cognitive inertia.',
    color: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.4)',
  },
  {
    id: 'focus',
    step: '02',
    name: 'Deep Focus Sprint',
    duration: '90m',
    tag: 'PEAK FLOW',
    desc: 'Aligned with natural 90-minute ultradian cycles. Accompanied by real-time 40Hz Gamma acoustic entrainment to lock your attention.',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.5)',
  },
  {
    id: 'reset',
    step: '03',
    name: 'Neural Reset',
    duration: '20m',
    tag: 'CONSOLIDATION',
    desc: 'Zero-input restorative state. Accelerates synaptic plasticity, replenishes dopamine reserves, and locks in what you just learned.',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.5)',
  },
];

const STREAK_MILESTONES = [
  { day: 1,  label: 'Day 1' },
  { day: 7,  label: 'Day 7 (Flame)' },
  { day: 14, label: 'Day 14 (Inferno)' },
  { day: 30, label: 'Day 30 (Supernova)' },
];

export default function LandingPage() {
  const user = useStore((s) => s.user);
  const authLoading = useStore((s) => s.authLoading);
  const navigate = useNavigate();

  const [activePhase, setActivePhase] = useState('focus');
  const [selectedStreakDay, setSelectedStreakDay] = useState(14);
  const [soundPlaying, setSoundPlaying] = useState(null); // null | '40hz' | 'pink'

  // Instant redirect if logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => stopSoundscape();
  }, []);

  const handleSoundToggle = (type) => {
    if (soundPlaying === type) {
      stopSoundscape();
      setSoundPlaying(null);
    } else {
      if (type === '40hz') startBinauralBeats();
      else if (type === 'pink') startPinkNoise();
      setSoundPlaying(type);
    }
  };

  const handleTestDrop = () => {
    playCriticalChime();
  };

  const currentMultiplier = getStreakMultiplier(selectedStreakDay);
  const baseSessionXP = 120;
  const calculatedXP = Math.round(baseSessionXP * currentMultiplier.mult);

  if (authLoading) return null;

  return (
    <div className={styles.landingViewport}>
      {/* Dynamic Background Mesh Gradients */}
      <div className={styles.meshGlowTop} />
      <div className={styles.meshGlowBottom} />
      <div className={styles.meshGridOverlay} />

      {/* ── Top Navigation ─────────────────────────────────────────────────── */}
      <header className={styles.topNav}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          <span className={styles.brandText}>CHRONO</span>
          <span className={styles.versionBadge}>PROTOCOL V2.0</span>
        </div>

        <div className={styles.navActions}>
          <a href="#protocol" className={styles.navLink}>Protocol</a>
          <a href="#science" className={styles.navLink}>Mechanics</a>
          <a href="#gamification" className={styles.navLink}>XP Engine</a>
          <Link to="/login" className={styles.loginBtn}>Sign In</Link>
          <Link to="/login" className={styles.startBtn}>Enter Chamber ⚡</Link>
        </div>
      </header>

      {/* ── Mobile-Only Desktop Advisory Banner ────────────────────────────── */}
      <div className={styles.mobileAdvisoryWrap}>
        <div className={styles.mobileAdvisoryCard}>
          <div className={styles.advisoryHeaderRow}>
            <span className={styles.advisoryIcon}>🖥️</span>
            <span className={styles.advisoryTitle}>BEST EXPERIENCED ON DESKTOP</span>
          </div>
          <p className={styles.advisoryText}>
            For 3D liquid focus visualizers, stereo binaural entrainment, and keyboard shortcuts, switch to your laptop or desktop browser.
          </p>
        </div>
      </div>

      {/* ── Hero Section ───────────────────────────────────────────────────── */}
      <section className={styles.heroSection}>
        <div className={styles.heroBadgePill}>
          <span className={styles.pillDot} />
          <span>BIOLOGICALLY OPTIMIZED DEEP WORK</span>
          <span className={styles.pillDivider}>//</span>
          <span className={styles.pillSub}>RPG LEVELING</span>
        </div>

        <h1 className={styles.heroTitle}>
          Willpower is a myth.<br />
          <span className={styles.heroGradientText}>Protocol is a weapon.</span>
        </h1>

        <p className={styles.heroSubtitle}>
          Ditch 25-minute baby timers. CHRONO fuses structured 90-minute Deep Work cycles with an addictive RPG progression system. Earn XP, stack streak multipliers, and turn brutal study sessions into a daily obsession.
        </p>

        <div className={styles.heroCtaGroup}>
          <Link to="/login" className={styles.mainCtaBtn}>
            <span>Initialize Deep Work</span>
            <span className={styles.ctaArrow}>→</span>
          </Link>

          <div className={styles.soundDemoPills}>
            <span className={styles.soundDemoLabel}>🎧 Live Soundscape Preview:</span>
            <button
              className={`${styles.soundPill} ${soundPlaying === '40hz' ? styles.soundPillActive : ''}`}
              onClick={() => handleSoundToggle('40hz')}
              title="Click to toggle 40Hz Gamma Wave entrainment"
            >
              {soundPlaying === '40hz' ? '■ 40Hz Gamma Playing' : '▶ 40Hz Gamma Focus'}
            </button>
            <button
              className={`${styles.soundPill} ${soundPlaying === 'pink' ? styles.soundPillActive : ''}`}
              onClick={() => handleSoundToggle('pink')}
              title="Click to toggle Pink Noise"
            >
              {soundPlaying === 'pink' ? '■ Pink Noise Playing' : '▶ Pink Noise'}
            </button>
          </div>
        </div>

        {/* ── Interactive Live Protocol Chamber Simulator ─────────────────── */}
        <div className={styles.simulatorCard} id="protocol">
          <div className={styles.simHeader}>
            <div className={styles.simDots}>
              <span className={styles.dotRed} />
              <span className={styles.dotYellow} />
              <span className={styles.dotGreen} />
            </div>
            <span className={styles.simTitle}>CHRONO COGNITIVE PROTOCOL // LIVE SIMULATOR</span>
            <span className={styles.simStatus}>● ENGINE READY</span>
          </div>

          <div className={styles.simBody}>
            {/* Phase Selector Tabs */}
            <div className={styles.phaseTabs}>
              {PROTOCOL_PHASES.map((p) => {
                const isSelected = activePhase === p.id;
                return (
                  <button
                    key={p.id}
                    className={`${styles.phaseTabBtn} ${isSelected ? styles.phaseTabActive : ''}`}
                    onClick={() => setActivePhase(p.id)}
                  >
                    <span className={styles.phaseStepNum}>{p.step}</span>
                    <span className={styles.phaseTabName}>{p.name}</span>
                    <span className={styles.phaseTabDur}>{p.duration}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Phase Dynamic Viewport */}
            {(() => {
              const phase = PROTOCOL_PHASES.find((p) => p.id === activePhase);
              return (
                <div className={styles.phaseContentArea}>
                  <div className={styles.phaseVisualCol}>
                    <div 
                      className={styles.liquidOrbPreview} 
                      style={{ 
                        borderColor: `${phase.color}40`,
                        boxShadow: `0 0 50px ${phase.glow}` 
                      }}
                    >
                      <div className={`${styles.orbCore} ${styles['orb_' + phase.id]}`} />
                      <span className={styles.orbCountdown}>
                        {phase.id === 'primer' ? '00:60' : phase.id === 'focus' ? '90:00' : '20:00'}
                      </span>
                      <span className={styles.orbPhaseLabel} style={{ color: phase.color }}>
                        {phase.name.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className={styles.phaseDetailsCol}>
                    <div className={styles.phaseTag} style={{ color: phase.color, borderColor: `${phase.color}50` }}>
                      {phase.tag}
                    </div>
                    <h3 className={styles.phaseHeading}>{phase.name} ({phase.duration})</h3>
                    <p className={styles.phaseDescText}>{phase.desc}</p>

                    <div className={styles.rewardStatsRow}>
                      <div className={styles.rewardStatBox}>
                        <span className={styles.rewardStatVal}>
                          {phase.id === 'focus' ? '+120 XP' : phase.id === 'reset' ? '+25 XP' : 'Primer'}
                        </span>
                        <span className={styles.rewardStatLbl}>Base Reward</span>
                      </div>
                      <div className={styles.rewardStatBox}>
                        <span className={styles.rewardStatVal}>
                          {phase.id === 'focus' ? '40Hz Gamma' : phase.id === 'reset' ? 'Alpha Calm' : 'Optic Lock'}
                        </span>
                        <span className={styles.rewardStatLbl}>Frequency</span>
                      </div>
                      <div className={styles.rewardStatBox}>
                        <span className={styles.rewardStatVal}>Auto</span>
                        <span className={styles.rewardStatLbl}>Transition</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ── Marquee Feature Strip (Desktop/Tablet Only) ────────────────────── */}
      <div className={`${styles.marqueeStrip} ${styles.desktopOnlySection}`}>
        <div className={styles.marqueeTrack}>
          <span>● 90M ULTRADIAN PROTOCOL</span>
          <span>● REAL-TIME 40HZ GAMMA ACOUSTIC ENTRAINMENT</span>
          <span>● 3.0X STREAK MULTIPLIER ENGINE</span>
          <span>● VARIABLE-RATIO DOPAMINE DROPS</span>
          <span>● 50+ COGNITIVE PRESTIGE RANKS</span>
          <span>● ZERO DISTRACTIONS // MAXIMUM RETENTION</span>
          <span>● 90M ULTRADIAN PROTOCOL</span>
          <span>● REAL-TIME 40HZ GAMMA ACOUSTIC ENTRAINMENT</span>
          <span>● 3.0X STREAK MULTIPLIER ENGINE</span>
        </div>
      </div>

      {/* ── Interactive Streak & Loss Aversion Calculator ──────────────────── */}
      <section className={styles.gamificationSection} id="gamification">
        <div className={styles.sectionHeaderWrap}>
          <span className={styles.sectionEyebrow}>LOSS AVERSION ENGINE</span>
          <h2 className={styles.sectionTitle}>Your Streak Is Your Multiplier</h2>
          <p className={styles.sectionSub}>
            Every consecutive day of Deep Work builds momentum. Miss a day without a freeze, and your multiplier resets to 1.0x.
          </p>
        </div>

        <div className={styles.multiplierCalculatorCard}>
          <div className={styles.milestoneTabsRow}>
            {STREAK_MILESTONES.map((m) => (
              <button
                key={m.day}
                className={`${styles.milestoneBtn} ${selectedStreakDay === m.day ? styles.milestoneActive : ''}`}
                onClick={() => setSelectedStreakDay(m.day)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className={styles.calcDisplayGrid}>
            <div className={styles.calcDisplayCol}>
              <span className={styles.calcDisplayLbl}>Active Streak</span>
              <div className={styles.calcBigNumberRow}>
                <span className={styles.calcBigFlame}>{currentMultiplier.icon}</span>
                <span className={styles.calcBigNum}>{selectedStreakDay}</span>
                <span className={styles.calcBigUnit}>Days</span>
              </div>
              <span className={styles.calcBuffTag}>{currentMultiplier.label}</span>
            </div>

            <div className={styles.calcArrowCol}>⚡</div>

            <div className={styles.calcDisplayCol}>
              <span className={styles.calcDisplayLbl}>XP Per 90m Deep Session</span>
              <div className={styles.calcBigNumberRow}>
                <span className={styles.calcBigNum} style={{ color: '#fbbf24' }}>+{calculatedXP}</span>
                <span className={styles.calcBigUnit}>XP</span>
              </div>
              <span className={styles.calcFormulaHint}>
                (120 Base XP × {currentMultiplier.mult}x Multiplier)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Science Bento Grid (Progressively simplified) ──────────────── */}
      <section className={`${styles.scienceSection} ${styles.desktopOnlySection}`} id="science">
        <div className={styles.sectionHeaderWrap}>
          <span className={styles.sectionEyebrow}>NEUROSCIENCE & GAME THEORY</span>
          <h2 className={styles.sectionTitle}>Engineered for Peak Study Obsession</h2>
          <p className={styles.sectionSub}>
            Why standard pomodoro apps fail, and why structured protocols create unbreakable focus habits.
          </p>
        </div>

        <div className={styles.bentoGrid}>
          {/* Bento Card 1: 90m Cycles */}
          <div className={`${styles.bentoCard} ${styles.bentoLarge}`}>
            <div className={styles.bentoIcon}>🧠</div>
            <h3 className={styles.bentoCardTitle}>90-Minute Ultradian Cycles</h3>
            <p className={styles.bentoCardDesc}>
              The human brain does not operate in 25-minute fragments. True flow state requires 15–20 minutes just to overcome cognitive friction. CHRONO's 90-minute blocks match your nervous system's natural peak performance cycle.
            </p>
            <div className={styles.bentoVisualPill}>
              <span>0–15m: Friction Gate</span>
              <span>→</span>
              <span style={{ color: '#c084fc', fontWeight: 800 }}>15–75m: Peak Flow</span>
              <span>→</span>
              <span>75–90m: Fatigue Gate</span>
            </div>
          </div>

          {/* Bento Card 2: Variable Ratio Rewards */}
          <div className={styles.bentoCard}>
            <div className={styles.bentoIcon}>🎰</div>
            <h3 className={styles.bentoCardTitle}>Variable Dopamine Drops</h3>
            <p className={styles.bentoCardDesc}>
              Every session rolls on a variable-ratio reinforcement schedule. 70% Normal, 20% Bonus (+40 XP), 8% Critical (+100 XP), and 2% Legendary (+250 XP).
            </p>
            <button className={styles.simulateDropBtn} onClick={handleTestDrop}>
              ⚡ Test Critical Chime
            </button>
          </div>

          {/* Bento Card 3: 40Hz Acoustic Entrainment */}
          <div className={styles.bentoCard}>
            <div className={styles.bentoIcon}>🎧</div>
            <h3 className={styles.bentoCardTitle}>40Hz Gamma Wave Synthesis</h3>
            <p className={styles.bentoCardDesc}>
              Generated directly via Web Audio API. 40Hz binaural beats stimulate microglial activity and synchronize neural oscillations for high-density problem solving.
            </p>
          </div>

          {/* Bento Card 4: 50+ Prestige Ranks */}
          <div className={`${styles.bentoCard} ${styles.bentoWide}`}>
            <div className={styles.bentoIcon}>👑</div>
            <h3 className={styles.bentoCardTitle}>50+ Cognitive Prestige Ranks</h3>
            <p className={styles.bentoCardDesc}>
              Turn your semester into an RPG ladder. Progress from <strong>Novice Mind</strong> to <strong>Focused Scholar</strong>, <strong>Cognitive Elite</strong>, and <strong>Living Legend</strong>.
            </p>
            <div className={styles.rankPillsRow}>
              {RANK_TITLES.slice(0, 6).map((r) => (
                <div key={r.title} className={styles.rankPillItem} style={{ borderColor: `${r.color}40` }}>
                  <span>{r.icon}</span>
                  <span style={{ color: r.color }}>{r.title}</span>
                  <span className={styles.rankPillLvl}>Lv.{r.minLevel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison Table: Old Timers vs CHRONO (Desktop Only) ─────────── */}
      <section className={`${styles.comparisonSection} ${styles.desktopOnlySection}`}>
        <div className={styles.sectionHeaderWrap}>
          <span className={styles.sectionEyebrow}>THE EVOLUTION OF FOCUS</span>
          <h2 className={styles.sectionTitle}>Standard Timers vs. CHRONO</h2>
        </div>

        <div className={styles.tableCard}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>Mechanism</th>
                <th>Standard Pomodoro Apps</th>
                <th className={styles.chronoCol}>CHRONO Protocol</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Session Architecture</strong></td>
                <td>25m timer (cuts flow state in half)</td>
                <td className={styles.chronoCol}><strong>90m Ultradian Deep Work Protocol</strong></td>
              </tr>
              <tr>
                <td><strong>Pre-Session Priming</strong></td>
                <td>None (starts cold)</td>
                <td className={styles.chronoCol}><strong>60s Visual Primer (retinal focus lock)</strong></td>
              </tr>
              <tr>
                <td><strong>Recovery Protocol</strong></td>
                <td>Scroll social media for 5 mins</td>
                <td className={styles.chronoCol}><strong>20m Neural Reset (memory consolidation)</strong></td>
              </tr>
              <tr>
                <td><strong>Dopamine Reinforcement</strong></td>
                <td>Boring bell chime</td>
                <td className={styles.chronoCol}><strong>XP Leveling + Streak Multipliers + Drops</strong></td>
              </tr>
              <tr>
                <td><strong>Acoustic Isolation</strong></td>
                <td>Requires external apps</td>
                <td className={styles.chronoCol}><strong>Built-in 40Hz Gamma & Pink Noise</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Terminal / Keyboard Shortcuts Strip (Desktop Only) ─────────────── */}
      <section className={`${styles.keyboardSection} ${styles.desktopOnlySection}`}>
        <div className={styles.keyboardStrip}>
          <span className={styles.kbLabel}>KEYBOARD-FIRST COMMANDS:</span>
          <div className={styles.kbItem}><kbd>Space</kbd> <span>Start / Pause</span></div>
          <div className={styles.kbItem}><kbd>R</kbd> <span>Reset Phase</span></div>
          <div className={styles.kbItem}><kbd>S</kbd> <span>Skip Phase</span></div>
          <div className={styles.kbItem}><kbd>M</kbd> <span>Mute Audio</span></div>
          <div className={styles.kbItem}><kbd>Esc</kbd> <span>Dismiss Modals</span></div>
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
      <footer className={styles.bottomCtaSection}>
        <div className={styles.ctaBox}>
          <span className={styles.ctaEyebrow}>READY TO OUTWORK EVERYONE?</span>
          <h2 className={styles.ctaTitle}>Initialize Your First Protocol Cycle</h2>
          <p className={styles.ctaDesc}>
            Join serious students and engineers using structured neuroscience protocols to achieve ruthless focus.
          </p>
          <Link to="/login" className={styles.giantCtaBtn}>
            Enter the Study Chamber ⚡
          </Link>
          <span className={styles.ctaFooterNote}>Free forever. Zero distractions. Offline-first.</span>
        </div>

        <div className={styles.footerBottomRow}>
          <div className={styles.footerBrand}>
            <span className={styles.brandDot} />
            <span>CHRONO</span>
          </div>
          <span className={styles.footerCopy}>Engineered for extreme cognitive endurance.</span>
        </div>
      </footer>
    </div>
  );
}
