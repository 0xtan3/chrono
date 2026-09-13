/**
 * Ghibli Summer Background Renderer
 * 
 * Hand-painted Studio Ghibli anime countryside aesthetic:
 * - High-resolution hand-painted watercolor/gouache landscape
 * - Subtle cinematic camera breathing
 * - Gentle animated sunbeam radiance through the clouds
 * - Delicate, peaceful dandelion parachute seeds drifting on the summer breeze
 * - Soft golden sunlit motes sparkling in the rays
 * - Center focus vignette ensuring timer legibility and distraction-free calm
 */

export function createGhibliSummer() {
  let canvas, ctx, w, h, dpr;
  let img = null;
  let imgLoaded = false;
  let dandelions = [];
  let motes = [];
  let accent = { r: 105, g: 195, b: 100 };
  let quality = 'high';
  let destroyed = false;
  let time = 0;

  const IMG_URL = '/backgrounds/ghibli_summer.jpg';

  // ── Init Dandelion Seeds (Pappus Parachutes) ─────────────────────────────────
  function initDandelions() {
    dandelions = [];
    const count = quality === 'high' ? 16 : 9; // peaceful, not distracting
    for (let i = 0; i < count; i++) {
      dandelions.push({
        x: Math.random() * w,
        y: h * 0.15 + Math.random() * (h * 0.75),
        vx: 0.6 + Math.random() * 0.8, // gentle breeze drift
        vy: -0.08 + Math.random() * 0.16,
        size: 7 + Math.random() * 6,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 1.0 + Math.random() * 1.2,
        tilt: 0.12 + Math.random() * 0.15,
        opacity: 0.5 + Math.random() * 0.35,
      });
    }
  }

  // ── Init Sunbeam Motes ──────────────────────────────────────────────────────
  function initMotes() {
    motes = [];
    const count = quality === 'high' ? 22 : 12;
    for (let i = 0; i < count; i++) {
      motes.push({
        x: w * 0.4 + Math.random() * (w * 0.6), // focused around sunbeam area
        y: h * 0.05 + Math.random() * (h * 0.55),
        vx: 0.2 + Math.random() * 0.4,
        vy: -0.1 - Math.random() * 0.2,
        size: 1.0 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.5,
        alpha: 0.25 + Math.random() * 0.4,
      });
    }
  }

  // ── Init & Preload ──────────────────────────────────────────────────────────
  function init(canvasEl, options = {}) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    quality = options.quality || 'high';
    destroyed = false;
    time = 0;

    img = new Image();
    img.src = IMG_URL;
    img.onload = () => {
      if (!destroyed) {
        imgLoaded = true;
      }
    };

    resize(window.innerWidth, window.innerHeight);
  }

  function resize(width, height) {
    w = width;
    h = height;
    dpr = quality === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initDandelions();
    initMotes();
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt, state = {}) {
    if (destroyed) return;
    if (state.accent) accent = state.accent;
    time += dt;

    // Move dandelions
    for (const d of dandelions) {
      const sway = Math.sin(time * d.swaySpeed + d.swayPhase);
      d.x += (d.vx + sway * 0.3) * dt * 45;
      d.y += (d.vy + Math.cos(time * d.swaySpeed * 0.7) * 0.25) * dt * 30;

      if (d.x > w + 40) {
        d.x = -30;
        d.y = h * 0.15 + Math.random() * (h * 0.75);
      }
      if (d.y < h * 0.08) d.y = h * 0.85;
      if (d.y > h + 20) d.y = h * 0.2;
    }

    // Move motes
    for (const m of motes) {
      m.x += (m.vx + Math.sin(time * 1.2 + m.phase) * 0.2) * dt * 40;
      m.y += m.vy * dt * 40;

      if (m.x > w + 10) m.x = w * 0.35;
      if (m.y < 0) m.y = h * 0.55;
    }

    draw();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Ghibli Painted Scenery (Cover aspect ratio with subtle zoom breath)
    if (imgLoaded && img) {
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = w / h;

      let drawW, drawH, drawX, drawY;
      const breathe = 1.0 + Math.sin(time * 0.08) * 0.012; // 80s full cycle (soothing, imperceptible)

      if (canvasAspect > imgAspect) {
        drawW = w * breathe;
        drawH = (w / imgAspect) * breathe;
      } else {
        drawH = h * breathe;
        drawW = (h * imgAspect) * breathe;
      }

      drawX = (w - drawW) * 0.5;
      drawY = (h - drawH) * 0.5;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } else {
      // Warm fallback while loading
      const fallback = ctx.createLinearGradient(0, 0, 0, h);
      fallback.addColorStop(0, '#589cd5');
      fallback.addColorStop(0.5, '#f5e4b8');
      fallback.addColorStop(1, '#65a84e');
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Animated Sunbeam Radiance in Upper Sky
    drawSunbeamPulse();

    // 3. Drifting Dandelion Parachute Seeds
    drawDandelions();

    // 4. Sunlit Pollen / Golden Motes
    drawMotes();

    // 5. Cinematic Center Focus Vignette & Contrast Shading
    drawVignetteOverlay();
  }

  // ── Sunbeam Radiance ────────────────────────────────────────────────────────
  function drawSunbeamPulse() {
    ctx.save();
    const sunX = w * 0.65;
    const sunY = h * 0.38;
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.4);

    const sunGlow = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, Math.min(w, h) * 0.6);
    sunGlow.addColorStop(0.0, `rgba(255, 248, 210, ${0.18 + pulse * 0.08})`);
    sunGlow.addColorStop(0.4, `rgba(255, 230, 160, ${0.08 + pulse * 0.04})`);
    sunGlow.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, Math.min(w, h) * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Dandelion Seeds ─────────────────────────────────────────────────────────
  function drawDandelions() {
    ctx.save();

    for (const d of dandelions) {
      ctx.save();
      ctx.translate(d.x, d.y);

      const tilt = d.tilt + Math.sin(time * d.swaySpeed + d.swayPhase) * 0.12;
      ctx.rotate(tilt);

      const sz = d.size;
      const op = d.opacity;

      // Seed grain at bottom
      ctx.fillStyle = `rgba(80, 60, 35, ${op * 0.9})`;
      ctx.beginPath();
      ctx.ellipse(0, sz * 0.8, sz * 0.12, sz * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stem (bristle)
      ctx.strokeStyle = `rgba(255, 255, 245, ${op * 0.85})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, sz * 0.6);
      ctx.lineTo(0, 0);
      ctx.stroke();

      // Parachute tuft (pappus star rays)
      ctx.strokeStyle = `rgba(255, 255, 255, ${op * 0.95})`;
      ctx.lineWidth = 0.9;
      const rayCount = 8;
      for (let r = 0; r < rayCount; r++) {
        const rayAngle = -Math.PI * 0.5 + (r - (rayCount - 1) / 2) * 0.32;
        const rayLen = sz * 0.72;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(rayAngle) * rayLen, Math.sin(rayAngle) * rayLen);
        ctx.stroke();
      }

      // Fluffy center halo
      ctx.fillStyle = `rgba(255, 255, 255, ${op * 0.65})`;
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  // ── Sunlit Motes ────────────────────────────────────────────────────────────
  function drawMotes() {
    for (const m of motes) {
      const pulse = 0.5 + 0.5 * Math.sin(time * m.speed + m.phase);
      const alpha = m.alpha * pulse;

      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 245, 180, ${alpha})`;
      ctx.fill();

      if (m.size > 1.6 && quality === 'high') {
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 130, ${alpha * 0.25})`;
        ctx.fill();
      }
    }
  }

  // ── Center Focus Vignette & Contrast ────────────────────────────────────────
  function drawVignetteOverlay() {
    ctx.save();

    const r = accent.r, g = accent.g, b = accent.b;

    // Subtle mode-aware tint
    ctx.fillStyle = `rgba(${Math.round(r * 0.08)}, ${Math.round(g * 0.08)}, ${Math.round(b * 0.12)}, 0.12)`;
    ctx.fillRect(0, 0, w, h);

    // Dark center focus vignette to give the floating timer digits complete contrast
    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.22, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    vignette.addColorStop(0.0, 'rgba(8, 12, 22, 0.32)'); // soft center backdrop for timer
    vignette.addColorStop(0.65, 'rgba(8, 12, 22, 0.42)');
    vignette.addColorStop(1.0, 'rgba(5, 8, 16, 0.72)');  // cinematic edge darkening

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // Top & Bottom gradient fades for header and dock controls
    const topGrad = ctx.createLinearGradient(0, 0, 0, 110);
    topGrad.addColorStop(0, 'rgba(6, 9, 18, 0.65)');
    topGrad.addColorStop(1, 'rgba(6, 9, 18, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, 110);

    const btmGrad = ctx.createLinearGradient(0, h - 130, 0, h);
    btmGrad.addColorStop(0, 'rgba(6, 9, 18, 0)');
    btmGrad.addColorStop(1, 'rgba(6, 9, 18, 0.7)');
    ctx.fillStyle = btmGrad;
    ctx.fillRect(0, h - 130, w, 130);

    ctx.restore();
  }

  // ── Destroy ─────────────────────────────────────────────────────────────────
  function destroy() {
    destroyed = true;
    img = null;
    imgLoaded = false;
    dandelions = [];
    motes = [];
  }

  return { init, update, resize, destroy };
}
