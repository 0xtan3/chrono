/**
 * Summer Coast Background Renderer
 * 
 * Photorealistic, tranquil summer coastal dusk:
 * - High-resolution realistic coastal sunset base with subtle cinematic breathing
 * - Dynamic animated water shimmer, specular ripples, and rolling ocean swell reflections
 * - Subtle coastal sea-spray motes drifting in the warm evening breeze
 * - Mode-aware atmospheric color grading overlay
 * - Center vignette ensuring crystal-clear timer contrast and distraction-free focus
 */

export function createSummerCoast() {
  let canvas, ctx, w, h, dpr;
  let img = null;
  let imgLoaded = false;
  let motes = [];
  let swells = [];
  let accent = { r: 235, g: 155, b: 85 };
  let quality = 'high';
  let destroyed = false;
  let time = 0;

  const IMG_URL = '/backgrounds/summer_coastal_dusk.jpg';

  // ── Init Motes (golden sea-spray & twilight dust) ───────────────────────────
  function initMotes() {
    motes = [];
    const count = quality === 'high' ? 25 : 12;
    for (let i = 0; i < count; i++) {
      motes.push({
        x: Math.random() * w,
        y: h * 0.35 + Math.random() * (h * 0.65),
        vx: 0.15 + Math.random() * 0.3,
        vy: -0.15 - Math.random() * 0.25,
        size: 1.0 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.2,
        baseAlpha: 0.2 + Math.random() * 0.4,
      });
    }
  }

  // ── Init Ocean Swells ───────────────────────────────────────────────────────
  function initSwells() {
    swells = [
      { yRel: 0.52, speed: 0.25, freq: 0.008, amp: 2.5, alpha: 0.18 },
      { yRel: 0.62, speed: 0.35, freq: 0.006, amp: 4.0, alpha: 0.22 },
      { yRel: 0.74, speed: 0.45, freq: 0.005, amp: 6.0, alpha: 0.26 },
      { yRel: 0.88, speed: 0.55, freq: 0.004, amp: 8.5, alpha: 0.30 },
    ];
  }

  // ── Init & Preload ──────────────────────────────────────────────────────────
  function init(canvasEl, options = {}) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    quality = options.quality || 'high';
    destroyed = false;
    time = 0;

    // Load background photograph
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

    initMotes();
    initSwells();
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt, state = {}) {
    if (destroyed) return;
    if (state.accent) accent = state.accent;
    time += dt;

    // Move motes
    for (const m of motes) {
      m.x += (m.vx + Math.sin(time * 0.6 + m.phase) * 0.2) * dt * 45;
      m.y += m.vy * dt * 45;

      if (m.y < h * 0.25) {
        m.y = h + 10;
        m.x = Math.random() * w;
      }
      if (m.x > w + 10) m.x = -10;
    }

    draw();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, w, h);

    const horizonY = h * 0.46; // Ocean horizon in the realistic photograph

    // 1. Draw Photographic Background (Cover aspect ratio with subtle zoom breath)
    if (imgLoaded && img) {
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = w / h;

      let drawW, drawH, drawX, drawY;
      const breathe = 1.0 + Math.sin(time * 0.08) * 0.015; // 0.08 rad/s = 80s full cycle (soothing, imperceptible)

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
      // Atmospheric fallback while loading
      const fallback = ctx.createLinearGradient(0, 0, 0, h);
      fallback.addColorStop(0, '#0c1020');
      fallback.addColorStop(0.46, '#281a26');
      fallback.addColorStop(0.55, '#c88648');
      fallback.addColorStop(1, '#0c1424');
      ctx.fillStyle = fallback;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Animated Water Shimmer & Golden Specular Reflection Trail
    drawWaterShimmer(horizonY);

    // 3. Gentle Rolling Ocean Swell Waves (Highlights)
    drawRollingSwells(horizonY);

    // 4. Subtle Drifting Evening Sea-spray Motes
    drawMotes();

    // 5. Mode-Aware Atmospheric Tint & Center Focus Vignette
    drawAtmosphereVignette(horizonY);
  }

  // ── Water Shimmer & Sun Glints ──────────────────────────────────────────────
  function drawWaterShimmer(horizonY) {
    const waterH = h - horizonY;
    const sunX = w * 0.48; // Sun position along horizon in the photograph

    ctx.save();

    // Shimmering ripple lines on the golden water reflection path
    const shimmerCount = quality === 'high' ? 28 : 14;
    for (let i = 0; i < shimmerCount; i++) {
      const progress = i / shimmerCount;
      const y = horizonY + Math.pow(progress, 1.25) * waterH;
      const spread = (40 + progress * w * 0.65) * (0.8 + Math.sin(time * 1.5 + i * 1.1) * 0.2);
      const startX = sunX - spread * 0.5 + Math.sin(time * 0.9 + i * 0.7) * 15;
      const endX = sunX + spread * 0.5 + Math.sin(time * 0.9 + i * 0.7) * 15;

      // Natural wave phase
      const waveOffset = Math.sin(time * 1.8 + i * 0.8) * 0.5;
      const alpha = (0.08 + Math.sin(time * 2.2 + i * 1.4) * 0.05) * (1 - progress * 0.55);

      if (alpha > 0.01) {
        const glintGrad = ctx.createLinearGradient(startX, y, endX, y);
        glintGrad.addColorStop(0, 'rgba(255, 220, 150, 0)');
        glintGrad.addColorStop(0.5, `rgba(255, 235, 180, ${alpha * 1.8})`);
        glintGrad.addColorStop(1, 'rgba(255, 220, 150, 0)');

        ctx.strokeStyle = glintGrad;
        ctx.lineWidth = 1.2 + progress * 2.2;
        ctx.beginPath();
        ctx.moveTo(startX, y + waveOffset);
        ctx.lineTo(endX, y + waveOffset);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // ── Rolling Ocean Swells ────────────────────────────────────────────────────
  function drawRollingSwells(horizonY) {
    ctx.save();
    for (let i = 0; i < swells.length; i++) {
      const sw = swells[i];
      const baseWaveY = horizonY + sw.yRel * (h - horizonY);

      ctx.beginPath();
      const step = quality === 'high' ? 16 : 32;

      for (let x = 0; x <= w; x += step) {
        const y = baseWaveY +
          Math.sin(x * sw.freq + time * sw.speed) * sw.amp +
          Math.cos(x * sw.freq * 1.8 - time * sw.speed * 0.7) * (sw.amp * 0.35);

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Soft water crest wash
      const swellAlpha = sw.alpha * (0.8 + 0.2 * Math.sin(time * 0.5 + i));
      ctx.strokeStyle = `rgba(255, 225, 175, ${swellAlpha * 0.35})`;
      ctx.lineWidth = 1.4 + i * 0.4;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Sea-spray Motes ─────────────────────────────────────────────────────────
  function drawMotes() {
    for (const m of motes) {
      const pulse = 0.5 + 0.5 * Math.sin(time * m.speed + m.phase);
      const alpha = m.baseAlpha * pulse;

      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 235, 190, ${alpha})`;
      ctx.fill();

      if (m.size > 1.8 && quality === 'high') {
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 195, 110, ${alpha * 0.25})`;
        ctx.fill();
      }
    }
  }

  // ── Atmospheric Mode Tint & Vignette ────────────────────────────────────────
  function drawAtmosphereVignette(horizonY) {
    ctx.save();

    const r = accent.r, g = accent.g, b = accent.b;

    // Subtle mode-aware color grading blend over entire scene
    ctx.fillStyle = `rgba(${Math.round(r * 0.12)}, ${Math.round(g * 0.08)}, ${Math.round(b * 0.16)}, 0.14)`;
    ctx.fillRect(0, 0, w, h);

    // Deep center focus vignette so timer and controls remain 100% crystal clear
    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.25, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    vignette.addColorStop(0.0, 'rgba(6, 8, 16, 0.28)'); // soft center darkening for timer digits
    vignette.addColorStop(0.65, 'rgba(6, 8, 16, 0.45)');
    vignette.addColorStop(1.0, 'rgba(4, 6, 12, 0.75)'); // cinematic dark edges

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // Subtle top & bottom shadow for dock and header readability
    const topGrad = ctx.createLinearGradient(0, 0, 0, 120);
    topGrad.addColorStop(0, 'rgba(6, 8, 14, 0.65)');
    topGrad.addColorStop(1, 'rgba(6, 8, 14, 0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, 120);

    const btmGrad = ctx.createLinearGradient(0, h - 140, 0, h);
    btmGrad.addColorStop(0, 'rgba(6, 8, 14, 0)');
    btmGrad.addColorStop(1, 'rgba(6, 8, 14, 0.7)');
    ctx.fillStyle = btmGrad;
    ctx.fillRect(0, h - 140, w, 140);

    ctx.restore();
  }

  // ── Destroy ─────────────────────────────────────────────────────────────────
  function destroy() {
    destroyed = true;
    img = null;
    imgLoaded = false;
    motes = [];
    swells = [];
  }

  return { init, update, resize, destroy };
}
