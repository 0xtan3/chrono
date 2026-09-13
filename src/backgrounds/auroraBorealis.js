/**
 * Aurora Borealis Background Renderer
 * 
 * Flowing northern lights curtain effect with sine-wave ribbon bands,
 * translucent layered gradients, and subtle shimmer particles.
 * Colors shift based on the current timer mode accent.
 */

export function createAuroraBorealis() {
  let canvas, ctx, w, h, dpr;
  let bands = [];
  let particles = [];
  let accent = { r: 56, g: 189, b: 248 };
  let quality = 'high';
  let destroyed = false;
  let time = 0;

  const BAND_COUNT = 5;
  const PARTICLE_COUNT_HIGH = 60;
  const PARTICLE_COUNT_LOW = 25;

  // ── Band ────────────────────────────────────────────────────────────────────
  function createBand(i) {
    return {
      yBase: 0.08 + (i / BAND_COUNT) * 0.3,
      amplitude: 20 + Math.random() * 35,
      frequency: 0.002 + Math.random() * 0.003,
      phase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.25,
      width: 40 + Math.random() * 60,
      opacity: 0.06 + Math.random() * 0.08,
      hueShift: (Math.random() - 0.5) * 40,
    };
  }

  // ── Shimmer Particle ────────────────────────────────────────────────────────
  function createParticle() {
    return {
      x: Math.random() * w,
      y: Math.random() * h * 0.45,
      radius: 0.8 + Math.random() * 1.5,
      opacity: 0,
      maxOpacity: 0.3 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.5 + Math.random() * 1.5,
      drift: {
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.1,
      },
    };
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init(cvs, opts = {}) {
    canvas = cvs;
    ctx = canvas.getContext('2d');
    quality = opts.quality || 'high';
    dpr = quality === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    resize(canvas.clientWidth, canvas.clientHeight);

    bands = [];
    for (let i = 0; i < BAND_COUNT; i++) {
      bands.push(createBand(i));
    }

    const pCount = quality === 'high' ? PARTICLE_COUNT_HIGH : PARTICLE_COUNT_LOW;
    particles = [];
    for (let i = 0; i < pCount; i++) {
      particles.push(createParticle());
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

    // Update particles
    for (const p of particles) {
      p.x += p.drift.x * dt * 60;
      p.y += p.drift.y * dt * 60;
      p.opacity = p.maxOpacity * (0.5 + 0.5 * Math.sin(time * p.pulseSpeed + p.phase));

      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h * 0.45;
      if (p.y > h * 0.5) p.y = -10;
    }

    draw();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, w, h);

    const r = accent.r, g = accent.g, b = accent.b;

    // Draw aurora bands
    for (const band of bands) {
      // Compute shifted hue color
      const br = Math.min(255, Math.max(0, r + band.hueShift));
      const bg = Math.min(255, Math.max(0, g + band.hueShift * 0.5));
      const bb = Math.min(255, Math.max(0, b - band.hueShift * 0.3));

      ctx.beginPath();

      // Build the flowing curtain shape using sine waves
      const yCenter = band.yBase * h;
      const points = [];
      const step = quality === 'high' ? 3 : 6;

      for (let x = -20; x <= w + 20; x += step) {
        const wave1 = Math.sin(x * band.frequency + time * band.speed + band.phase) * band.amplitude;
        const wave2 = Math.sin(x * band.frequency * 1.7 + time * band.speed * 0.6 + band.phase * 2) * band.amplitude * 0.4;
        const wave3 = Math.sin(x * band.frequency * 0.5 + time * band.speed * 0.3) * band.amplitude * 0.6;
        const y = yCenter + wave1 + wave2 + wave3;
        points.push({ x, y });
      }

      // Draw the band with gradient fill
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y - band.width);
      for (const p of points) {
        ctx.lineTo(p.x, p.y - band.width * 0.5);
      }
      for (let i = points.length - 1; i >= 0; i--) {
        ctx.lineTo(points[i].x, points[i].y + band.width * 0.5);
      }
      ctx.closePath();

      // Vertical gradient within the band
      const grad = ctx.createLinearGradient(0, yCenter - band.width, 0, yCenter + band.width);
      grad.addColorStop(0, `rgba(${br}, ${bg}, ${bb}, 0)`);
      grad.addColorStop(0.3, `rgba(${br}, ${bg}, ${bb}, ${band.opacity})`);
      grad.addColorStop(0.5, `rgba(${br}, ${bg}, ${bb}, ${band.opacity * 1.3})`);
      grad.addColorStop(0.7, `rgba(${br}, ${bg}, ${bb}, ${band.opacity})`);
      grad.addColorStop(1, `rgba(${br}, ${bg}, ${bb}, 0)`);

      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Draw shimmer particles
    for (const p of particles) {
      if (p.opacity < 0.02) continue;
      const pr = Math.min(255, r + 60);
      const pg = Math.min(255, g + 60);
      const pb = Math.min(255, b + 60);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${p.opacity})`;
      ctx.fill();

      // Soft glow
      if (quality === 'high' && p.opacity > 0.15) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${p.opacity * 0.15})`;
        ctx.fill();
      }
    }
  }

  // ── Destroy ─────────────────────────────────────────────────────────────────
  function destroy() {
    destroyed = true;
    bands = [];
    particles = [];
  }

  return { init, update, resize, destroy };
}
