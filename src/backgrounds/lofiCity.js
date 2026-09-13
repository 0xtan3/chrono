/**
 * Lo-fi City Background Renderer
 * 
 * Anime-style city skyline silhouette at night with flickering window lights,
 * slow-moving clouds, gradient sky, and subtle ambient glow.
 * Colors shift with the current timer mode accent.
 */

export function createLofiCity() {
  let canvas, ctx, w, h, dpr;
  let buildings = [];
  let clouds = [];
  let accent = { r: 168, g: 85, b: 247 };
  let quality = 'high';
  let destroyed = false;
  let time = 0;

  // ── Building ────────────────────────────────────────────────────────────────
  function generateBuildings() {
    buildings = [];
    const minW = 40, maxW = 100;
    let x = -20;

    while (x < w + maxW) {
      const bw = minW + Math.random() * (maxW - minW);
      const bh = 80 + Math.random() * 250;
      const windowRows = Math.floor(bh / 22);
      const windowCols = Math.floor(bw / 18);
      const windows = [];

      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          windows.push({
            rx: 6 + col * (bw / windowCols),
            ry: 8 + row * (bh / windowRows),
            w: 6 + Math.random() * 4,
            h: 5 + Math.random() * 4,
            lit: Math.random() < 0.35,
            flickerPhase: Math.random() * Math.PI * 2,
            flickerSpeed: 0.008 + Math.random() * 0.04,
            warmth: Math.random(), // 0=cool blue, 1=warm yellow
          });
        }
      }

      // Occasional antenna/spire
      const hasAntenna = Math.random() < 0.3;
      const antennaH = hasAntenna ? 15 + Math.random() * 30 : 0;

      buildings.push({
        x,
        width: bw,
        height: bh,
        windows,
        antennaH,
        shade: 0.02 + Math.random() * 0.04, // Slightly different darkness
      });

      x += bw + Math.random() * 8 - 4;
    }
  }

  // ── Cloud ───────────────────────────────────────────────────────────────────
  function createCloud() {
    return {
      x: -200 + Math.random() * (w + 400),
      y: 30 + Math.random() * h * 0.3,
      width: 120 + Math.random() * 200,
      height: 20 + Math.random() * 35,
      opacity: 0.03 + Math.random() * 0.06,
      speed: 0.1 + Math.random() * 0.25,
    };
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init(cvs, opts = {}) {
    canvas = cvs;
    ctx = canvas.getContext('2d');
    quality = opts.quality || 'high';
    dpr = quality === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    resize(canvas.clientWidth, canvas.clientHeight);

    generateBuildings();

    clouds = [];
    const cloudCount = quality === 'high' ? 8 : 4;
    for (let i = 0; i < cloudCount; i++) {
      clouds.push(createCloud());
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
    generateBuildings();
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt, state = {}) {
    if (destroyed) return;
    if (state.accent) accent = state.accent;
    time += dt;

    // Update window flickers
    for (const b of buildings) {
      for (const win of b.windows) {
        if (Math.random() < 0.0002 * dt * 60) {
          win.lit = !win.lit;
        }
      }
    }

    // Cloud drift
    for (const c of clouds) {
      c.x += c.speed * dt * 60;
      if (c.x > w + c.width) {
        c.x = -c.width;
        c.y = 30 + Math.random() * h * 0.3;
      }
    }

    draw();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, w, h);

    const r = accent.r, g = accent.g, b = accent.b;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, `rgba(${Math.round(r * 0.05)}, ${Math.round(g * 0.05)}, ${Math.round(b * 0.12)}, 0.9)`);
    skyGrad.addColorStop(0.4, `rgba(${Math.round(r * 0.08)}, ${Math.round(g * 0.06)}, ${Math.round(b * 0.15)}, 0.6)`);
    skyGrad.addColorStop(0.7, `rgba(${Math.round(r * 0.1)}, ${Math.round(g * 0.08)}, ${Math.round(b * 0.12)}, 0.3)`);
    skyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Clouds
    for (const c of clouds) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(c.x + c.width / 2, c.y, c.width / 2, c.height / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)}, ${c.opacity})`;
      ctx.fill();
      ctx.restore();
    }

    // Buildings (drawn from back to front via sort)
    for (const bld of buildings) {
      const bx = bld.x;
      const by = h - bld.height;
      const bw = bld.width;
      const bh = bld.height;

      // Building silhouette
      ctx.fillStyle = `rgba(${Math.round(8 + bld.shade * 255)}, ${Math.round(10 + bld.shade * 200)}, ${Math.round(18 + bld.shade * 150)}, 0.95)`;
      ctx.fillRect(bx, by, bw, bh);

      // Subtle roof edge highlight
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.06)`;
      ctx.fillRect(bx, by, bw, 2);

      // Antenna / spire
      if (bld.antennaH > 0) {
        const ax = bx + bw * 0.5;
        ctx.strokeStyle = `rgba(60, 65, 85, 0.8)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ax, by);
        ctx.lineTo(ax, by - bld.antennaH);
        ctx.stroke();

        // Blinking red light at top
        const blink = Math.sin(time * 2 + bld.x) > 0.3;
        if (blink) {
          ctx.beginPath();
          ctx.arc(ax, by - bld.antennaH, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 60, 60, 0.8)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ax, by - bld.antennaH, 5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 60, 60, 0.15)';
          ctx.fill();
        }
      }

      // Windows
      for (const win of bld.windows) {
        if (!win.lit) continue;

        const wx = bx + win.rx;
        const wy = by + win.ry;

        // Flicker
        const flicker = 0.7 + 0.3 * Math.sin(time * win.flickerSpeed + win.flickerPhase);

        // Window color: warm yellow to cool blue-white
        const wr = Math.round(200 + win.warmth * 55);
        const wg = Math.round(170 + win.warmth * 60);
        const wb = Math.round(100 + (1 - win.warmth) * 100);

        ctx.fillStyle = `rgba(${wr}, ${wg}, ${wb}, ${0.6 * flicker})`;
        ctx.fillRect(wx, wy, win.w, win.h);

        // Window glow bleed
        if (quality === 'high') {
          ctx.fillStyle = `rgba(${wr}, ${wg}, ${wb}, ${0.05 * flicker})`;
          ctx.fillRect(wx - 3, wy - 3, win.w + 6, win.h + 6);
        }
      }
    }

    // City ambient glow at horizon
    const horizonGlow = ctx.createLinearGradient(0, h - 80, 0, h);
    horizonGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    horizonGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.06)`);
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, h - 80, w, 80);
  }

  // ── Destroy ─────────────────────────────────────────────────────────────────
  function destroy() {
    destroyed = true;
    buildings = [];
    clouds = [];
  }

  return { init, update, resize, destroy };
}
