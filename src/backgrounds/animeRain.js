/**
 * Anime Rain Background Renderer
 * 
 * A moody anime-style rainstorm with slanted rain streaks, splash particles,
 * occasional lightning flashes, and a soft fog layer at the bottom.
 * Colors tint based on the current timer mode accent.
 */

const DEFAULTS = {
  dropCount: 320,
  splashCount: 40,
  windAngle: 0.18,          // radians slant
  baseSpeed: 12,
  layerCount: 3,
  lightningChance: 0.015,   // per second
  fogHeight: 0.18,          // fraction of canvas height
};

export function createAnimeRain() {
  let canvas, ctx, w, h, dpr;
  let drops = [];
  let splashes = [];
  let lightning = { active: false, opacity: 0, decay: 0 };
  let accent = { r: 168, g: 85, b: 247 };
  let quality = 'high';
  let animId = null;
  let lastTime = 0;
  let destroyed = false;

  // ── Drop Pool ───────────────────────────────────────────────────────────────
  function createDrop(layer) {
    const depth = (layer + 1) / DEFAULTS.layerCount;
    const speed = (DEFAULTS.baseSpeed + Math.random() * 8) * depth;
    const length = (14 + Math.random() * 26) * depth;
    const opacity = (0.15 + Math.random() * 0.35) * depth;
    return {
      x: Math.random() * (w + 200) - 100,
      y: Math.random() * -h * 1.5,
      speed,
      length,
      opacity,
      layer,
      depth,
      width: depth > 0.7 ? 1.5 : 1,
    };
  }

  function resetDrop(drop) {
    drop.x = Math.random() * (w + 200) - 100;
    drop.y = -drop.length - Math.random() * h * 0.5;
  }

  // ── Splash Pool ─────────────────────────────────────────────────────────────
  function spawnSplash(x, y) {
    for (let i = 0; i < 3; i++) {
      splashes.push({
        x: x + (Math.random() - 0.5) * 6,
        y,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -(1.5 + Math.random() * 2),
        life: 1,
        decay: 0.03 + Math.random() * 0.04,
        radius: 1 + Math.random() * 1.5,
      });
    }
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init(cvs, opts = {}) {
    canvas = cvs;
    ctx = canvas.getContext('2d');
    quality = opts.quality || 'high';
    dpr = quality === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    resize(canvas.clientWidth, canvas.clientHeight);

    const count = quality === 'high' ? DEFAULTS.dropCount : Math.round(DEFAULTS.dropCount * 0.5);
    drops = [];
    for (let i = 0; i < count; i++) {
      const layer = i % DEFAULTS.layerCount;
      const drop = createDrop(layer);
      drop.y = Math.random() * h; // Start distributed across screen
      drops.push(drop);
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

    const windX = Math.sin(DEFAULTS.windAngle) * 4;

    // Update drops
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.y += d.speed * dt * 60;
      d.x += windX * d.depth * dt * 60;

      if (d.y > h) {
        // Spawn splash at impact point
        if (d.depth > 0.5 && Math.random() < 0.3) {
          spawnSplash(d.x, h - 2);
        }
        resetDrop(d);
      }
    }

    // Update splashes
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      s.x += s.vx * dt * 60;
      s.y += s.vy * dt * 60;
      s.vy += 0.15 * dt * 60;
      s.life -= s.decay * dt * 60;
      if (s.life <= 0) splashes.splice(i, 1);
    }

    // Lightning
    if (!lightning.active && Math.random() < DEFAULTS.lightningChance * dt) {
      lightning.active = true;
      lightning.opacity = 0.3 + Math.random() * 0.25;
      lightning.decay = 0.015 + Math.random() * 0.02;
    }
    if (lightning.active) {
      lightning.opacity -= lightning.decay * dt * 60;
      if (lightning.opacity <= 0) {
        lightning.active = false;
        lightning.opacity = 0;
      }
    }

    // Draw
    draw();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, w, h);

    const r = accent.r, g = accent.g, b = accent.b;

    // Lightning flash
    if (lightning.active) {
      ctx.fillStyle = `rgba(200, 210, 240, ${lightning.opacity})`;
      ctx.fillRect(0, 0, w, h);
    }

    // Rain drops
    ctx.lineCap = 'round';
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      const mixR = Math.round(180 + (r - 180) * 0.3 * d.depth);
      const mixG = Math.round(195 + (g - 195) * 0.3 * d.depth);
      const mixB = Math.round(220 + (b - 220) * 0.3 * d.depth);

      ctx.strokeStyle = `rgba(${mixR}, ${mixG}, ${mixB}, ${d.opacity})`;
      ctx.lineWidth = d.width;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(
        d.x + Math.sin(DEFAULTS.windAngle) * d.length,
        d.y + Math.cos(DEFAULTS.windAngle) * d.length
      );
      ctx.stroke();
    }

    // Splashes
    for (let i = 0; i < splashes.length; i++) {
      const s = splashes[i];
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${s.life * 0.5})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius * s.life, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bottom fog / mist
    const fogH = h * DEFAULTS.fogHeight;
    const fogGrad = ctx.createLinearGradient(0, h - fogH, 0, h);
    fogGrad.addColorStop(0, `rgba(${Math.round(r * 0.15)}, ${Math.round(g * 0.15)}, ${Math.round(b * 0.2)}, 0)`);
    fogGrad.addColorStop(0.5, `rgba(${Math.round(r * 0.15)}, ${Math.round(g * 0.15)}, ${Math.round(b * 0.2)}, 0.12)`);
    fogGrad.addColorStop(1, `rgba(${Math.round(r * 0.15)}, ${Math.round(g * 0.15)}, ${Math.round(b * 0.2)}, 0.25)`);
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, h - fogH, w, fogH);
  }

  // ── Destroy ─────────────────────────────────────────────────────────────────
  function destroy() {
    destroyed = true;
    drops = [];
    splashes = [];
  }

  return { init, update, resize, destroy };
}
