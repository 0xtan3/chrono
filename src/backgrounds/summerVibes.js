/**
 * Summer Vibes Background Renderer
 * 
 * Aesthetic golden-hour coastal sunset:
 * - Rich twilight-to-golden sky gradient that responds subtly to timer mode accent
 * - Glowing low sun with warm atmospheric corona
 * - Soft drifting twilight clouds
 * - Ocean with perspective sun reflection shimmer ("sun road") and gentle rolling waves
 * - Graceful silhouetted palm trees swaying in the summer breeze
 * - Drifting warm golden sun motes
 */

export function createSummerVibes() {
  let canvas, ctx, w, h, dpr;
  let clouds = [];
  let motes = [];
  let waves = [];
  let accent = { r: 255, g: 140, b: 60 };
  let quality = 'high';
  let destroyed = false;
  let time = 0;

  // ── Init Motes (golden summer dust / fireflies) ──────────────────────────────
  function initMotes() {
    motes = [];
    const count = quality === 'high' ? 35 : 18;
    for (let i = 0; i < count; i++) {
      motes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0.15 + Math.random() * 0.35,
        vy: -0.15 - Math.random() * 0.25,
        size: 1 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.5,
        baseAlpha: 0.25 + Math.random() * 0.45,
      });
    }
  }

  // ── Init Clouds ─────────────────────────────────────────────────────────────
  function initClouds() {
    clouds = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      clouds.push({
        x: (w / count) * i + (Math.random() - 0.5) * 150,
        y: h * 0.12 + Math.random() * (h * 0.28),
        width: 140 + Math.random() * 220,
        height: 25 + Math.random() * 35,
        speed: 0.08 + Math.random() * 0.12,
        opacity: 0.2 + Math.random() * 0.22,
      });
    }
  }

  // ── Init Waves ──────────────────────────────────────────────────────────────
  function initWaves() {
    waves = [
      { yOffset: 0.02, speed: 0.6, freq: 0.008, amp: 3, alpha: 0.4 },
      { yOffset: 0.08, speed: 0.8, freq: 0.006, amp: 5, alpha: 0.5 },
      { yOffset: 0.17, speed: 1.0, freq: 0.005, amp: 7, alpha: 0.6 },
      { yOffset: 0.28, speed: 1.2, freq: 0.004, amp: 9, alpha: 0.7 },
      { yOffset: 0.42, speed: 1.4, freq: 0.0035, amp: 12, alpha: 0.85 },
    ];
  }

  // ── Setup ───────────────────────────────────────────────────────────────────
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

    initMotes();
    initClouds();
    initWaves();
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt, state = {}) {
    if (destroyed) return;
    if (state.accent) accent = state.accent;
    time += dt;

    // Move clouds
    for (const c of clouds) {
      c.x += c.speed * dt * 40;
      if (c.x > w + c.width) {
        c.x = -c.width * 1.5;
        c.y = h * 0.1 + Math.random() * (h * 0.3);
      }
    }

    // Move motes
    for (const m of motes) {
      m.x += (m.vx + Math.sin(time * 0.8 + m.phase) * 0.2) * dt * 60;
      m.y += m.vy * dt * 60;
      if (m.y < -10) {
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

    const horizonY = h * 0.58;
    const sunX = w * 0.5;
    const sunY = horizonY - h * 0.04;
    const sunR = Math.min(w, h) * 0.12;

    // Blend current mode accent with warm sunset gold/coral palette
    const ar = Math.round(accent.r * 0.4 + 255 * 0.6);
    const ag = Math.round(accent.g * 0.35 + 130 * 0.65);
    const ab = Math.round(accent.b * 0.35 + 60 * 0.65);

    // 1. Sky Gradient (Dusk Twilight -> Radiant Coral -> Golden Horizon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0.0, `rgb(18, 14, 38)`);          // Deep violet dusk
    skyGrad.addColorStop(0.35, `rgb(68, 28, 62)`);         // Twilight purple
    skyGrad.addColorStop(0.65, `rgb(${Math.min(255, ar - 10)}, ${Math.max(40, ag - 40)}, 68)`); // Coral magenta
    skyGrad.addColorStop(0.85, `rgb(${ar}, ${ag}, ${Math.max(20, ab)})`); // Warm amber
    skyGrad.addColorStop(1.0, `rgb(255, 205, 120)`);        // Golden haze at horizon

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY);

    // 2. Atmospheric Sun Corona & Sun Disk
    // Outer atmospheric glow
    const coronaGrad = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.8);
    coronaGrad.addColorStop(0.0, `rgba(255, 240, 180, 0.65)`);
    coronaGrad.addColorStop(0.25, `rgba(${ar}, ${ag}, 50, 0.45)`);
    coronaGrad.addColorStop(0.6, `rgba(240, 90, 70, 0.2)`);
    coronaGrad.addColorStop(1.0, `rgba(20, 10, 30, 0)`);

    ctx.fillStyle = coronaGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Sun Disk
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
    sunGrad.addColorStop(0.0, 'rgba(255, 255, 245, 1)');
    sunGrad.addColorStop(0.4, 'rgba(255, 240, 180, 0.95)');
    sunGrad.addColorStop(0.8, `rgba(${ar}, ${ag + 30}, 80, 0.85)`);
    sunGrad.addColorStop(1.0, `rgba(${ar}, ${ag}, 40, 0)`);

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // 3. Clouds (twilight rim-lit clouds)
    for (const c of clouds) {
      const cGrad = ctx.createLinearGradient(0, c.y - c.height * 0.5, 0, c.y + c.height * 0.5);
      cGrad.addColorStop(0, `rgba(50, 25, 45, 0)`);
      cGrad.addColorStop(0.5, `rgba(110, 45, 65, ${c.opacity})`);
      cGrad.addColorStop(1, `rgba(255, 175, 100, ${c.opacity * 1.3})`); // Golden undersides

      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.width * 0.5, c.height * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Ocean Base Gradient
    const oceanGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    oceanGrad.addColorStop(0.0, `rgb(${Math.min(255, ar - 20)}, ${Math.max(40, ag - 30)}, 55)`); // Horizon water
    oceanGrad.addColorStop(0.2, `rgb(45, 22, 50)`);   // Mid ocean twilight
    oceanGrad.addColorStop(0.6, `rgb(22, 28, 54)`);   // Deep oceanic dusk
    oceanGrad.addColorStop(1.0, `rgb(10, 15, 30)`);   // Near shore dark water

    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // 5. Sun Reflection Trail ("Sun Road") on Water
    const reflectionH = h - horizonY;
    const refGrad = ctx.createLinearGradient(sunX, horizonY, sunX, h);
    refGrad.addColorStop(0.0, 'rgba(255, 235, 160, 0.7)');
    refGrad.addColorStop(0.25, `rgba(${ar}, ${ag + 20}, 80, 0.45)`);
    refGrad.addColorStop(0.7, `rgba(240, 110, 60, 0.2)`);
    refGrad.addColorStop(1.0, 'rgba(200, 80, 50, 0.02)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sunX - sunR * 0.6, horizonY);
    ctx.lineTo(sunX + sunR * 0.6, horizonY);
    ctx.lineTo(sunX + sunR * 2.8, h);
    ctx.lineTo(sunX - sunR * 2.8, h);
    ctx.closePath();
    ctx.fillStyle = refGrad;
    ctx.fill();
    ctx.restore();

    // Shimmering ripple lines on the reflection
    const shimmerCount = quality === 'high' ? 24 : 12;
    for (let i = 0; i < shimmerCount; i++) {
      const progress = i / shimmerCount;
      const ry = horizonY + Math.pow(progress, 1.4) * reflectionH;
      const rw = (sunR * 0.8 + progress * sunR * 3.5) * (0.6 + Math.sin(time * 2.5 + i * 1.2) * 0.3);
      const rx = sunX + Math.sin(time * 1.5 + i * 0.8) * (10 + progress * 25);
      const rAlpha = (0.25 + Math.sin(time * 3 + i * 0.7) * 0.15) * (1 - progress * 0.6);

      ctx.strokeStyle = `rgba(255, 235, 170, ${Math.max(0, rAlpha)})`;
      ctx.lineWidth = 1.2 + progress * 2.5;
      ctx.beginPath();
      ctx.moveTo(rx - rw * 0.5, ry);
      ctx.lineTo(rx + rw * 0.5, ry);
      ctx.stroke();
    }

    // 6. Rolling Ocean Wave Crests
    for (let i = 0; i < waves.length; i++) {
      const wave = waves[i];
      const baseWaveY = horizonY + wave.yOffset * reflectionH;
      const waveAlpha = wave.alpha;

      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, baseWaveY);

      const step = quality === 'high' ? 12 : 24;
      for (let x = 0; x <= w; x += step) {
        const y = baseWaveY +
          Math.sin(x * wave.freq + time * wave.speed) * wave.amp +
          Math.cos(x * wave.freq * 2.2 - time * wave.speed * 0.6) * (wave.amp * 0.35);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();

      // Translucent deep crest wash
      ctx.fillStyle = `rgba(14, 18, 38, ${0.12 + i * 0.08})`;
      ctx.fill();

      // Wave highlight line
      ctx.strokeStyle = `rgba(255, 195, 130, ${waveAlpha * 0.28})`;
      ctx.lineWidth = 1.0 + i * 0.3;
      ctx.stroke();
    }

    // 7. Silhouetted Tropical Palm Trees (Right Side)
    drawPalmGrove();

    // 8. Drifting Golden Sun Motes (Breeze)
    for (const m of motes) {
      const pulse = 0.5 + 0.5 * Math.sin(time * m.speed + m.phase);
      const alpha = m.baseAlpha * pulse;

      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 225, 150, ${alpha})`;
      ctx.fill();

      // Soft halo on larger motes
      if (m.size > 1.8 && quality === 'high') {
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 180, 90, ${alpha * 0.3})`;
        ctx.fill();
      }
    }
  }

  // ── Silhouetted Palm Trees ───────────────────────────────────────────────────
  function drawPalmGrove() {
    ctx.save();

    // Two palm trees with organic curve and wind sway
    const sway = Math.sin(time * 0.9) * 8;
    const sway2 = Math.sin(time * 0.75 + 0.5) * 6;

    // Main Palm (Tall, graceful curve leaning left)
    const base1X = w * 0.94;
    const base1Y = h;
    const top1X = w * 0.86 + sway;
    const top1Y = h * 0.38;

    drawPalmTree(base1X, base1Y, top1X, top1Y, 18, 7, [
      { angle: -2.3, length: 110, bend: 0.35 },
      { angle: -1.9, length: 130, bend: 0.3 },
      { angle: -1.5, length: 140, bend: 0.25 },
      { angle: -1.1, length: 135, bend: 0.3 },
      { angle: -0.7, length: 120, bend: 0.38 },
      { angle: -0.3, length: 100, bend: 0.42 },
      { angle: 0.1,  length: 85,  bend: 0.45 },
    ], sway);

    // Second Palm (Shorter, leaning further right or left)
    const base2X = w * 0.98;
    const base2Y = h;
    const top2X = w * 0.93 + sway2;
    const top2Y = h * 0.50;

    drawPalmTree(base2X, base2Y, top2X, top2Y, 14, 5, [
      { angle: -2.4, length: 85, bend: 0.35 },
      { angle: -1.8, length: 100, bend: 0.28 },
      { angle: -1.3, length: 105, bend: 0.25 },
      { angle: -0.8, length: 95, bend: 0.32 },
      { angle: -0.3, length: 80, bend: 0.4 },
    ], sway2);

    ctx.restore();
  }

  function drawPalmTree(bx, by, tx, ty, baseW, topW, fronds, swayVal) {
    // Trunk
    ctx.beginPath();
    const ctrlX = (bx + tx) * 0.5 + 20;
    const ctrlY = (by + ty) * 0.5;

    ctx.moveTo(bx - baseW * 0.5, by);
    ctx.quadraticCurveTo(ctrlX - baseW * 0.3, ctrlY, tx - topW * 0.5, ty);
    ctx.lineTo(tx + topW * 0.5, ty);
    ctx.quadraticCurveTo(ctrlX + baseW * 0.3, ctrlY, bx + baseW * 0.5, by);
    ctx.closePath();

    ctx.fillStyle = '#0a0d18';
    ctx.fill();

    // Subtle warm rim highlight on trunk facing the sunset
    ctx.strokeStyle = 'rgba(255, 160, 90, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bx - baseW * 0.5, by);
    ctx.quadraticCurveTo(ctrlX - baseW * 0.3, ctrlY, tx - topW * 0.5, ty);
    ctx.stroke();

    // Fronds (Leaves)
    for (let i = 0; i < fronds.length; i++) {
      const f = fronds[i];
      const leafSway = Math.sin(time * 1.1 + i * 0.6) * 0.08;
      const angle = f.angle + leafSway;
      const len = f.length * (w < 768 ? 0.75 : 1.0);

      const endX = tx + Math.cos(angle) * len;
      const endY = ty + Math.sin(angle) * len + len * f.bend;
      const midCtrlX = tx + Math.cos(angle) * (len * 0.55);
      const midCtrlY = ty + Math.sin(angle) * (len * 0.35);

      // Frond stem
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(midCtrlX, midCtrlY, endX, endY);
      ctx.strokeStyle = '#0a0d18';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Leaflets along the frond
      const leaflets = quality === 'high' ? 14 : 8;
      for (let j = 2; j < leaflets; j++) {
        const t = j / leaflets;
        const lx = (1 - t) * (1 - t) * tx + 2 * (1 - t) * t * midCtrlX + t * t * endX;
        const ly = (1 - t) * (1 - t) * ty + 2 * (1 - t) * t * midCtrlY + t * t * endY;

        const leafLen = Math.sin(t * Math.PI) * (20 + (w < 768 ? 0 : 8));
        const leafAngle = angle + (i % 2 === 0 ? 1 : -1) * 0.9 + Math.sin(time * 1.5 + j * 0.3) * 0.05;

        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + Math.cos(leafAngle) * leafLen, ly + Math.sin(leafAngle) * leafLen + 6);
        ctx.strokeStyle = '#0a0d18';
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
    }
  }

  // ── Destroy ─────────────────────────────────────────────────────────────────
  function destroy() {
    destroyed = true;
    clouds = [];
    motes = [];
    waves = [];
  }

  return { init, update, resize, destroy };
}
