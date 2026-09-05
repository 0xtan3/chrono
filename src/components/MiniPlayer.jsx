import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { useStore, MODES } from '../store';
import styles from './MiniPlayer.module.css';

function fmt(secs) {
  const s = Math.max(0, Math.floor(secs));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(mins).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const MiniPlayer = forwardRef(function MiniPlayer(props, ref) {
  const miniPlayerOpen    = useStore((s) => s.miniPlayerOpen);
  const setMiniPlayerOpen = useStore((s) => s.setMiniPlayerOpen);

  const mode          = useStore((s) => s.mode);
  const protocolPhase = useStore((s) => s.protocolPhase);
  const running       = useStore((s) => s.running);
  const play          = useStore((s) => s.play);
  const pause         = useStore((s) => s.pause);

  // Performance Optimization: Select integer seconds remaining so MiniPlayer only re-renders
  // once per second instead of 60-144 times/sec on every animation frame!
  const remainingSecs = useStore((s) => {
    const isW = s.mode === 'deep' && s.protocolPhase === 'warmup';
    const d = isW ? s.durations.warmup : (s.durations[s.mode] || 1);
    return Math.max(0, Math.floor(d - s.elapsed));
  });

  const isWarmup = mode === 'deep' && protocolPhase === 'warmup';

  // Mode accent colors
  const modeColor = isWarmup
    ? '#f59e0b'
    : mode === 'deep'
    ? '#a855f7'
    : mode === 'quick'
    ? '#38bdf8'
    : mode === 'custom'
    ? '#06b6d4'
    : '#10b981';

  // ── 1. Document Picture-in-Picture State ─────────────────────────────────────
  const [pipWindow, setPipWindow] = useState(null);
  const pipWindowRef = useRef(null);
  const isPipSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
  const isOpeningRef = useRef(false);

  const closePip = useCallback(() => {
    if (pipWindowRef.current) {
      try {
        pipWindowRef.current.close();
      } catch {
        // ignore
      }
      pipWindowRef.current = null;
      setPipWindow(null);
    }
    setMiniPlayerOpen(false);
  }, [setMiniPlayerOpen]);

  const openPip = useCallback(async () => {
    if (!isPipSupported || isOpeningRef.current) return false;
    isOpeningRef.current = true;
    try {
      if (pipWindowRef.current) {
        pipWindowRef.current.focus();
        return true;
      }
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 320,
        height: 165,
      });

      // 1. Immediately eliminate white canvas flash by setting dark scheme & background
      pip.document.documentElement.style.cssText = 'background:#000000!important;color-scheme:dark;margin:0;padding:0;overflow:hidden;';
      pip.document.body.style.cssText = 'background:#000000!important;color-scheme:dark;margin:0;padding:0;overflow:hidden;';

      // 2. Add base style immediately to avoid any flash of unstyled content
      const baseStyle = pip.document.createElement('style');
      baseStyle.textContent = `
        :root { color-scheme: dark; }
        html, body {
          margin: 0;
          padding: 0;
          background: #000000 !important;
          color: #ffffff;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          user-select: none;
          -webkit-user-select: none;
        }
        * { box-sizing: border-box; }
      `;
      pip.document.head.appendChild(baseStyle);

      // 3. Clone stylesheets & links into PiP window
      const allLinks = document.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"]');
      allLinks.forEach((link) => {
        pip.document.head.appendChild(link.cloneNode(true));
      });

      // Clone inline styles
      try {
        [...document.styleSheets].forEach((sheet) => {
          try {
            if (!sheet.href && sheet.cssRules) {
              const styleEl = pip.document.createElement('style');
              [...sheet.cssRules].forEach((rule) => {
                styleEl.appendChild(pip.document.createTextNode(rule.cssText));
              });
              pip.document.head.appendChild(styleEl);
            }
          } catch {
            // CORS restricted sheets skipped safely
          }
        });
      } catch {
        // fallback
      }

      pip.document.title = 'CHRONO';

      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
        pipWindowRef.current = null;
        setMiniPlayerOpen(false);
      });

      pipWindowRef.current = pip;
      setPipWindow(pip);
      setMiniPlayerOpen(true);
      return true;
    } catch (err) {
      console.warn('PiP request canceled or unsupported:', err);
      setMiniPlayerOpen(false);
      return false;
    } finally {
      isOpeningRef.current = false;
    }
  }, [isPipSupported, setMiniPlayerOpen]);

  useImperativeHandle(ref, () => ({
    openPip,
    closePip,
    isPipOpen: () => !!pipWindowRef.current,
  }), [openPip, closePip]);

  // Clean up PiP window on unmount
  useEffect(() => {
    return () => {
      closePip();
    };
  }, [closePip]);

  // When mini player is closed from store, also close PiP
  useEffect(() => {
    if (!miniPlayerOpen) {
      closePip();
    }
  }, [miniPlayerOpen, closePip]);

  // ── 2. In-Tab Draggable Position & Physics ──────────────────────────────────
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('chrono_mini_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 240) : 20;
    const defaultY = typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 80) : 20;
    return { x: defaultX, y: defaultY };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialPosX: 0, initialPosY: 0 });
  const containerRef = useRef(null);

  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('button')) return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: position.x,
      initialPosY: position.y,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    const el = containerRef.current;
    const width = el ? el.offsetWidth : 250;
    const height = el ? el.offsetHeight : 52;

    const maxX = Math.max(10, window.innerWidth - width - 10);
    const maxY = Math.max(10, window.innerHeight - height - 10);

    const nextX = Math.max(10, Math.min(maxX, dragRef.current.initialPosX + deltaX));
    const nextY = Math.max(10, Math.min(maxY, dragRef.current.initialPosY + deltaY));

    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      try {
        localStorage.setItem('chrono_mini_pos', JSON.stringify(position));
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const el = containerRef.current;
        const width = el ? el.offsetWidth : 250;
        const height = el ? el.offsetHeight : 52;
        const maxX = Math.max(10, window.innerWidth - width - 10);
        const maxY = Math.max(10, window.innerHeight - height - 10);
        return {
          x: Math.max(10, Math.min(maxX, prev.x)),
          y: Math.max(10, Math.min(maxY, prev.y)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If PiP is supported, ONLY render the native window portal. Never render the in-tab pill.
  if (isPipSupported) {
    if (!pipWindow) return null;
    return createPortal(
      <div className={styles.pipRoot}>
        <div className={styles.pipCenter}>
          <div className={styles.pipTimeRow}>
            <span
              className={styles.pipDot}
              style={{
                backgroundColor: modeColor,
                boxShadow: `0 0 10px ${modeColor}`,
              }}
              title={isWarmup ? 'Visual Primer' : MODES[mode]?.label || mode}
            />
            {/* Live running time centered */}
            <div className={styles.pipTime}>{fmt(remainingSecs)}</div>
          </div>
          <div className={styles.pipSubtext}>
            {isWarmup ? 'PRIMER' : MODES[mode]?.label?.toUpperCase() || mode.toUpperCase()}
          </div>
        </div>

        {/* Spacious, dedicated controls row below the time */}
        <div className={styles.pipControls}>
          <button
            className={styles.pipPlayBtn}
            onClick={running ? pause : play}
            title={running ? 'Pause (Space)' : 'Start (Space)'}
            aria-label={running ? 'Pause' : 'Start'}
          >
            {running ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            )}
          </button>

          <button
            className={styles.pipCloseBtn}
            onClick={closePip}
            title="Close Mini Player"
            aria-label="Close Mini Player"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>,
      pipWindow.document.body
    );
  }

  // ── Render 3B: In-Tab Floating Draggable Pill (Full Black, Minimal) ───────────
  return (
    <div
      ref={containerRef}
      className={`${styles.floatingContainer} ${isDragging ? styles.isDragging : ''}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="region"
      aria-label="Mini Countdown HUD"
    >
      <div className={styles.miniPill}>
        {/* Grab Handle */}
        <div className={styles.dragHandle} title="Drag to reposition">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.8" />
            <circle cx="15" cy="6" r="1.8" />
            <circle cx="9" cy="12" r="1.8" />
            <circle cx="15" cy="12" r="1.8" />
            <circle cx="9" cy="18" r="1.8" />
            <circle cx="15" cy="18" r="1.8" />
          </svg>
        </div>

        {/* Status Dot */}
        <span
          className={styles.modeDot}
          style={{
            backgroundColor: modeColor,
            boxShadow: `0 0 8px ${modeColor}`,
          }}
          title={isWarmup ? 'Visual Primer' : MODES[mode]?.label || mode}
        />

        {/* Minimal Countdown */}
        <div className={styles.timerDisplay}>
          {fmt(remainingSecs)}
        </div>

        {/* Controls */}
        <div className={styles.controlsGroup}>
          <button
            className={`${styles.actionBtn} ${styles.playBtn}`}
            onClick={running ? pause : play}
            title={running ? 'Pause (Space)' : 'Start (Space)'}
            aria-label={running ? 'Pause' : 'Start'}
          >
            {running ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            )}
          </button>

          {/* Picture-in-Picture Pop-out button */}
          {isPipSupported && (
            <button
              className={`${styles.actionBtn} ${styles.pipBtn}`}
              onClick={openPip}
              title="Pop out to OS Window (drag to any monitor)"
              aria-label="Picture in Picture Window"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <rect x="11" y="9" width="9" height="6" rx="1" />
                <path d="M7 11h.01" />
              </svg>
            </button>
          )}

          {/* Close HUD */}
          <button
            className={`${styles.actionBtn} ${styles.closeBtn}`}
            onClick={() => setMiniPlayerOpen(false)}
            title="Hide Mini HUD (P)"
            aria-label="Close Mini HUD"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

export default MiniPlayer;
