/**
 * LiveBackground — Fullscreen animated background canvas wrapper
 * 
 * Mounts the selected background renderer as a fixed fullscreen <canvas>
 * behind all page content. FPS-capped at 30fps for performance.
 */

import { useRef, useEffect, useCallback } from 'react';
import { useStore, MODES } from '../store';
import { createLofiCity } from '../backgrounds/lofiCity';
import { createGhibliSummer } from '../backgrounds/ghibliSummer';
import styles from './LiveBackground.module.css';

const RENDERERS = {
  lofiCity: createLofiCity,
  ghibliSummer: createGhibliSummer,
};

// Convert HSL hue + saturation + lightness to approximate RGB
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

const FPS_CAP = 30;
const FRAME_INTERVAL = 1000 / FPS_CAP;

export default function LiveBackground() {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const rafRef = useRef(null);
  const lastFrameRef = useRef(0);
  const lastTimeRef = useRef(0);

  const backgroundId = useStore((s) => s.backgroundId);
  const backgroundQuality = useStore((s) => s.backgroundQuality);
  const mode = useStore((s) => s.mode);
  const protocolPhase = useStore((s) => s.protocolPhase);

  // Get accent color from current mode
  const getAccent = useCallback(() => {
    const isWarmup = mode === 'deep' && protocolPhase === 'warmup';
    if (isWarmup) return { r: 200, g: 210, b: 230 };
    const cfg = MODES[mode] || MODES.deep;
    return hslToRgb(cfg.h, cfg.s, cfg.lb);
  }, [mode, protocolPhase]);

  // Mount / unmount renderer when backgroundId changes
  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous
    if (rendererRef.current) {
      rendererRef.current.destroy();
      rendererRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!backgroundId || backgroundId === 'none' || backgroundId === 'orb' || !RENDERERS[backgroundId]) return;

    // Create new renderer
    const factory = RENDERERS[backgroundId];
    const renderer = factory();
    rendererRef.current = renderer;

    renderer.init(canvasRef.current, { quality: backgroundQuality });
    lastTimeRef.current = performance.now();
    lastFrameRef.current = performance.now();

    // Animation loop (FPS-capped)
    const loop = (now) => {
      if (!rendererRef.current) return;

      const elapsed = now - lastFrameRef.current;
      if (elapsed >= FRAME_INTERVAL) {
        const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1); // clamp to 100ms max
        lastTimeRef.current = now;
        lastFrameRef.current = now - (elapsed % FRAME_INTERVAL);

        renderer.update(dt, { accent: getAccent() });
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [backgroundId, backgroundQuality, getAccent]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current && canvasRef.current) {
        rendererRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Don't render canvas at all if no background or orb selected
  if (!backgroundId || backgroundId === 'none' || backgroundId === 'orb') return null;

  return (
    <canvas
      ref={canvasRef}
      className={styles.backgroundCanvas}
      aria-hidden="true"
    />
  );
}
