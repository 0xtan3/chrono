/**
 * Summer Night Background Renderer
 * 
 * Minimalist, distraction-free summer twilight:
 * - Deep navy/indigo night sky with a soft warm summer horizon afterglow
 * - Delicate, softly glowing crescent moon
 * - Faint, tranquil ambient stars with slow breathing oscillation
 * - Ultra-slow, smooth twilight cloud wisps
 * - Dark, clean horizon silhouette giving maximum visual calm for deep focus
 */

export function createSummerNight() {
  let canvas, ctx, w, h, dpr;
  let stars = [];
  let clouds = [];
  let accent = { r: 168, g: 85, b: 247 };
  let quality = 'high';
  let destroyed = false;
  let time = 0;

  // ── Init Stars (faint, gentle ambient points) ───────────────────────────────
  function initStars() {
    stars = [];
    const count = quality === 'high' ? 45 : 25;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * (h * 0.65), // keep to upper sky
        radius: 0.6 + Math.random() * 0.9,
        baseAlpha: 0.15 + Math.random() * 0.35,
        breatheSpeed: 0.2 + Math.random() * 0.4, // very slow, calming breathing
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // ── Init Clouds (faint, slow-drifting twilight wisps) ────────────────────────
  function initClouds() {
    clouds = [];
    const count = 3;
    for (let i = 0; i < count; i++) {
      clouds.push({
        x: (w / count) * i + (Math.random() - 0.5) * 100,
        y: h * 0.25 + i * (h * 0.18),
        width: w * (0.6 + Math.random() * 0.4),
        height: 60 + Math.random() * 40,
        speed: 0.015 + Math.random() * 0.02, // very slow drift
        opacity: 0.06 + Math.random() * 0.06,
      });
    }
  }

  // ── Init & Resize ───────────────────────────────────────────────────────────
  function init(canvasEl, options = {}) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    quality = options.quality || 'high';
    destroyed = false;
    time = 0;

    resize(window.innerWidth, window.innerHeight);
  }

  function resize(width, height) {
    w = width;
    h = height;
    dpr = quality === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initStars();
    initClouds();
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt, state = {}) {
    if (destroyed) return;
    if (state.accent) accent = state.accent;
    time += dt;

    // Slow ambient cloud drift
    for (const c of clouds) {
      c.x += c.speed * dt * 25;
      if (c.x > w + c.width * 0.5) {
        c.x = -c.width * 0.6;
      }
    }

    draw();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, w, h);

    const r = accent.r, g = accent.g, b = accent.b;

    // 1. Deep Summer Twilight Sky Gradient
    // Deep dark navy at top -> rich twilight violet -> soft warm sunset afterglow at horizon
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0.0, 'rgb(7, 9, 18)');         // Deep cosmic navy
    skyGrad.addColorStop(0.4, 'rgb(14, 16, 32)');        // Midnight indigo
    skyGrad.addColorStop(0.72, `rgba(${Math.round(28 + r * 0.08)}, ${Math.round(22 + g * 0.06)}, ${Math.round(44 + b * 0.08)}, 1)`); // Twilight purple
    skyGrad.addColorStop(0.88, `rgba(${Math.round(75 + r * 0.25)}, ${Math.round(42 + g * 0.15)}, 62, 1)`); // Warm dusky rose
    skyGrad.addColorStop(1.0, `rgba(${Math.round(135 + r * 0.35)}, ${Math.round(75 + g * 0.25)}, 68, 1)`); // Warm horizon afterglow

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Horizon Warm Haze (gentle breathing ambient glow)
    const breathe = 0.5 + 0.5 * Math.sin(time * 0.25);
    const hazeGrad = ctx.createRadialGradient(w * 0.5, h, 20, w * 0.5, h, h * 0.65);
    hazeGrad.addColorStop(0.0, `rgba(${Math.round(180 + r * 0.2)}, ${Math.round(100 + g * 0.15)}, 70, ${0.18 + breathe * 0.06})`);
    hazeGrad.addColorStop(0.5, `rgba(110, 48, 75, ${0.10 + breathe * 0.04})`);
    hazeGrad.addColorStop(1.0, 'rgba(10, 12, 24, 0)');

    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, h * 0.4, w, h * 0.6);

    // 3. Faint, Breathing Twilight Clouds (wisps)
    for (const c of clouds) {
      const cGrad = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, c.width * 0.5);
      cGrad.addColorStop(0, `rgba(${Math.round(110 + r * 0.15)}, ${Math.round(70 + g * 0.1)}, 95, ${c.opacity})`);
      cGrad.addColorStop(0.6, `rgba(45, 30, 55, ${c.opacity * 0.4})`);
      cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.width * 0.5, c.height * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Subtle, Calm Ambient Stars
    for (const s of stars) {
      const alpha = s.baseAlpha * (0.6 + 0.4 * Math.sin(time * s.breatheSpeed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(235, 238, 255, ${alpha})`;
      ctx.fill();
    }

    // 5. Delicate Crescent Moon (Upper Right)
    drawCrescentMoon();

    // 6. Minimalist Distant Ridge Silhouette (Very Low at Bottom)
    drawDistantRidge();
  }

  // ── Delicate Crescent Moon ──────────────────────────────────────────────────
  function drawCrescentMoon() {
    ctx.save();
    const moonX = w * 0.82;
    const moonY = h * 0.18;
    const moonR = Math.min(w, h) * 0.038;

    // Very soft lunar aura
    const moonAura = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 3.5);
    moonAura.addColorStop(0.0, 'rgba(255, 250, 235, 0.15)');
    moonAura.addColorStop(0.5, 'rgba(240, 230, 210, 0.05)');
    moonAura.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonAura;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Crescent moon shape
    ctx.fillStyle = 'rgba(255, 250, 238, 0.9)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, -0.4, Math.PI * 0.9, false);
    ctx.quadraticCurveTo(moonX - moonR * 0.1, moonY + moonR * 0.1, moonX + moonR * 0.35, moonY - moonR * 0.9);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ── Minimalist Distant Ridge ────────────────────────────────────────────────
  function drawDistantRidge() {
    ctx.save();

    // Soft low rolling ridge near the very bottom
    const ridgeY = h * 0.88;

    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, ridgeY + Math.sin(0.5) * 15);

    const step = 20;
    for (let x = 0; x <= w; x += step) {
      const y = ridgeY + Math.sin(x * 0.003) * 18 + Math.cos(x * 0.0015) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    // Deepest midnight silhouette
    ctx.fillStyle = '#060810';
    ctx.fill();

    // Subtle edge rim catching the horizon afterglow
    ctx.strokeStyle = 'rgba(165, 95, 80, 0.22)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, ridgeY + Math.sin(0.5) * 15);
    for (let x = 0; x <= w; x += step) {
      const y = ridgeY + Math.sin(x * 0.003) * 18 + Math.cos(x * 0.0015) * 12;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.restore();
  }

  // ── Destroy ─────────────────────────────────────────────────────────────────
  function destroy() {
    destroyed = true;
    stars = [];
    clouds = [];
  }

  return { init, update, resize, destroy };
}
