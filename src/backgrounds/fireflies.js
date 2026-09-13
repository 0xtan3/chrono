/**
 * Fireflies Background Renderer
 * 
 * Floating bioluminescent particles with gentle random-walk movement,
 * pulsing opacity (like real fireflies), and soft trailing glow.
 * Warm amber/green for Recovery mode, cool blue/purple for focus modes.
 */

export function createFireflies() {
  let canvas, ctx, w, h, dpr;
  let flies = [];
  let accent = { r: 168, g: 85, b: 247 };
  let quality = 'high';
  let destroyed = false;
  let time = 0;

  const COUNT_HIGH = 65;
  const COUNT_LOW = 30;

  // ── Firefly ─────────────────────────────────────────────────────────────────
  function createFly() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.4,
      radius: 2 + Math.random() * 3.5,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.3 + Math.random() * 0.8,
      maxOpacity: 0.3 + Math.random() * 0.55,
      opacity: 0,
      // Random walk steering
      steerTimer: 0,
      steerInterval: 1.5 + Math.random() * 3,
      targetVx: 0,
      targetVy: 0,
      // Trail
      trail: [],
      trailMax: quality === 'high' ? 8 : 4,
    };
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init(cvs, opts = {}) {
    canvas = cvs;
    ctx = canvas.getContext('2d');
    quality = opts.quality || 'high';
    dpr = quality === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    resize(canvas.clientWidth, canvas.clientHeight);

    const count = quality === 'high' ? COUNT_HIGH : COUNT_LOW;
    flies = [];
    for (let i = 0; i < count; i++) {
      flies.push(createFly());
    }
  }

  // ── Resize ──────────────────────────────────────────────────────────────────
  function resize(width, height) {
    w = width;
    h = height;
    dpr = quality === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt, state = {}) {
    if (destroyed) return;
    if (state.accent) accent = state.accent;
    time += dt;

    for (const f of flies) {
      // Pulse opacity
      const pulse = 0.5 + 0.5 * Math.sin(time * f.pulseSpeed + f.phase);
      f.opacity = f.maxOpacity * pulse * pulse; // Squared for sharper blink

      // Random walk: periodically pick new direction
      f.steerTimer += dt;
      if (f.steerTimer >= f.steerInterval) {
        f.steerTimer = 0;
        f.steerInterval = 1.5 + Math.random() * 3;
        f.targetVx = (Math.random() - 0.5) * 0.8;
        f.targetVy = (Math.random() - 0.5) * 0.6;
      }

      // Smooth steer toward target velocity
      f.vx += (f.targetVx - f.vx) * 0.02 * dt * 60;
      f.vy += (f.targetVy - f.vy) * 0.02 * dt * 60;

      f.x += f.vx * dt * 60;
      f.y += f.vy * dt * 60;

      // Wrap around edges softly
      const margin = 30;
      if (f.x < -margin) f.x = w + margin;
      if (f.x > w + margin) f.x = -margin;
      if (f.y < -margin) f.y = h + margin;
      if (f.y > h + margin) f.y = -margin;

      // Store trail position
      if (quality === 'high') {
        f.trail.push({ x: f.x, y: f.y, opacity: f.opacity });
        if (f.trail.length > f.trailMax) f.trail.shift();
      }
    }

    draw();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, w, h);

    const r = accent.r, g = accent.g, b = accent.b;
    // Brighten slightly for glow
    const gr = Math.min(255, r + 40);
    const gg = Math.min(255, g + 40);
    const gb = Math.min(255, b + 40);

    for (const f of flies) {
      // Draw trail
      if (quality === 'high') {
        for (let i = 0; i < f.trail.length; i++) {
          const t = f.trail[i];
          const trailFade = (i / f.trail.length) * 0.3;
          if (trailFade < 0.02) continue;
          ctx.beginPath();
          ctx.arc(t.x, t.y, f.radius * 0.6 * (i / f.trail.length), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, ${trailFade * t.opacity})`;
          ctx.fill();
        }
      }

      if (f.opacity < 0.03) continue;

      // Outer glow
      const glowRadius = f.radius * 4;
      const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowRadius);
      glow.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, ${f.opacity * 0.35})`);
      glow.addColorStop(0.4, `rgba(${gr}, ${gg}, ${gb}, ${f.opacity * 0.12})`);
      glow.addColorStop(1, `rgba(${gr}, ${gg}, ${gb}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(f.x - glowRadius, f.y - glowRadius, glowRadius * 2, glowRadius * 2);

      // Core bright dot
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.min(255, gr + 50)}, ${Math.min(255, gg + 50)}, ${Math.min(255, gb + 30)}, ${f.opacity})`;
      ctx.fill();
    }
  }

  // ── Destroy ─────────────────────────────────────────────────────────────────
  function destroy() {
    destroyed = true;
    flies = [];
  }

  return { init, update, resize, destroy };
}
