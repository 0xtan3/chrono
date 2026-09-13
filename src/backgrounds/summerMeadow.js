/**
 * Summer Meadow Background Renderer (Ghibli Countryside Vibes)
 * 
 * Inspired by classic Ghibli summer aesthetics (My Neighbor Totoro, The Wind Rises):
 * - Radiant warm summer sky with soft volumetric sunbeams
 * - Billowing, stylized cumulus clouds drifting across the blue
 * - Multiple layered rolling green hills with organic depth
 * - A solitary wind-swept summer oak tree on the ridge
 * - Swaying meadow grass blades and colorful wild flowers
 * - Realistic dandelion seeds (pappus) and golden sunlit pollen drifting in the breeze
 */

export function createSummerMeadow() {
  let canvas, ctx, w, h, dpr;
  let clouds = [];
  let dandelions = [];
  let pollen = [];
  let grassTufts = [];
  let flowers = [];
  let sunbeams = [];
  let accent = { r: 105, g: 195, b: 100 };
  let quality = 'high';
  let destroyed = false;
  let time = 0;

  // ── Init Clouds ─────────────────────────────────────────────────────────────
  function initClouds() {
    clouds = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      clouds.push({
        x: (w / count) * i + (Math.random() - 0.5) * 120,
        y: h * 0.08 + Math.random() * (h * 0.16),
        scale: 0.7 + Math.random() * 0.6,
        speed: 0.04 + Math.random() * 0.05,
        opacity: 0.75 + Math.random() * 0.2,
      });
    }
  }

  // ── Init Sunbeams ───────────────────────────────────────────────────────────
  function initSunbeams() {
    sunbeams = [
      { baseAngle: 0.75, width: 0.14, speed: 0.4, phase: 0 },
      { baseAngle: 0.88, width: 0.18, speed: 0.3, phase: 1.8 },
      { baseAngle: 1.02, width: 0.15, speed: 0.5, phase: 3.2 },
      { baseAngle: 1.18, width: 0.22, speed: 0.35, phase: 4.5 },
    ];
  }

  // ── Init Dandelions (Drifting Parachute Seeds) ───────────────────────────────
  function initDandelions() {
    dandelions = [];
    const count = quality === 'high' ? 24 : 12;
    for (let i = 0; i < count; i++) {
      dandelions.push({
        x: Math.random() * w,
        y: h * 0.2 + Math.random() * (h * 0.75),
        vx: 0.8 + Math.random() * 1.2,
        vy: -0.15 + Math.random() * 0.3,
        size: 8 + Math.random() * 7,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 1.2 + Math.random() * 1.5,
        tilt: 0.15 + Math.random() * 0.2,
        opacity: 0.55 + Math.random() * 0.35,
      });
    }
  }

  // ── Init Pollen / Golden Sun Motes ──────────────────────────────────────────
  function initPollen() {
    pollen = [];
    const count = quality === 'high' ? 40 : 20;
    for (let i = 0; i < count; i++) {
      pollen.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0.3 + Math.random() * 0.7,
        vy: -0.1 - Math.random() * 0.25,
        size: 1.0 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2,
        speed: 1.0 + Math.random() * 2.0,
        alpha: 0.3 + Math.random() * 0.5,
      });
    }
  }

  // ── Init Grass Tufts on Foreground ──────────────────────────────────────────
  function initGrassAndFlowers() {
    grassTufts = [];
    flowers = [];

    const tuftCount = quality === 'high' ? Math.floor(w / 14) : Math.floor(w / 28);
    for (let i = 0; i < tuftCount; i++) {
      const x = (w / tuftCount) * i + (Math.random() - 0.5) * 10;
      // Follow the foreground hill line roughly
      const hillBaseY = getForegroundHillY(x);
      const y = hillBaseY + Math.random() * (h - hillBaseY);
      const height = 12 + Math.random() * 22;
      const bladeCount = 3 + Math.floor(Math.random() * 4);

      grassTufts.push({
        x,
        y,
        height,
        bladeCount,
        bendOffset: (Math.random() - 0.5) * 8,
        phase: Math.random() * Math.PI * 2,
        shade: Math.random(), // 0 = lime, 1 = deep green
      });

      // Scatter flowers occasionally
      if (Math.random() < 0.28) {
        const flowerTypes = ['daisy', 'buttercup', 'cornflower', 'poppy'];
        flowers.push({
          x: x + (Math.random() - 0.5) * 15,
          y: y + (Math.random() - 0.5) * 6,
          type: flowerTypes[Math.floor(Math.random() * flowerTypes.length)],
          size: 3.5 + Math.random() * 4,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  // Hill Y curves
  function getFarHillY(x) {
    return h * 0.44 + Math.sin(x * 0.002 + 0.5) * (h * 0.05) + Math.cos(x * 0.001) * (h * 0.03);
  }

  function getMidHillY(x) {
    return h * 0.54 + Math.sin(x * 0.003 + 2.2) * (h * 0.07) + Math.sin(x * 0.0015) * (h * 0.04);
  }

  function getForegroundHillY(x) {
    return h * 0.68 + Math.sin(x * 0.0025 + 4.1) * (h * 0.08) + Math.cos(x * 0.004) * (h * 0.025);
  }

  // ── Init ────────────────────────────────────────────────────────────────────
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

    initClouds();
    initSunbeams();
    initDandelions();
    initPollen();
    initGrassAndFlowers();
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  function update(dt, state = {}) {
    if (destroyed) return;
    if (state.accent) accent = state.accent;
    time += dt;

    // Move clouds
    for (const c of clouds) {
      c.x += c.speed * dt * 45;
      if (c.x > w + 200 * c.scale) {
        c.x = -220 * c.scale;
        c.y = h * 0.06 + Math.random() * (h * 0.18);
      }
    }

    // Move dandelions (flutter on breeze)
    for (const d of dandelions) {
      const sway = Math.sin(time * d.swaySpeed + d.swayPhase);
      d.x += (d.vx + sway * 0.4) * dt * 50;
      d.y += (d.vy + Math.cos(time * d.swaySpeed * 0.8) * 0.3) * dt * 30;

      if (d.x > w + 40) {
        d.x = -30;
        d.y = h * 0.2 + Math.random() * (h * 0.7);
      }
      if (d.y < h * 0.1) d.y = h * 0.85;
      if (d.y > h + 20) d.y = h * 0.25;
    }

    // Move pollen
    for (const p of pollen) {
      p.x += (p.vx + Math.sin(time * 1.5 + p.phase) * 0.3) * dt * 40;
      p.y += (p.vy + Math.cos(time * 1.2 + p.phase) * 0.2) * dt * 30;

      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
    }

    draw();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, w, h);

    const sunX = w * 0.20;
    const sunY = h * 0.16;

    // 1. Summer Sky Gradient (Cerulean Blue -> Soft Warm Horizon Amber)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    skyGrad.addColorStop(0.0, 'rgb(56, 128, 205)');   // Clear summer blue
    skyGrad.addColorStop(0.4, 'rgb(115, 178, 235)');  // Azure mid sky
    skyGrad.addColorStop(0.75, 'rgb(192, 222, 245)'); // Pale sky
    skyGrad.addColorStop(1.0, 'rgb(255, 245, 218)');  // Warm sunlit horizon glow

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Sun Disk & Atmospheric Corona
    const corona = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 240);
    corona.addColorStop(0.0, 'rgba(255, 255, 240, 0.9)');
    corona.addColorStop(0.2, 'rgba(255, 245, 190, 0.55)');
    corona.addColorStop(0.6, 'rgba(255, 230, 160, 0.18)');
    corona.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 240, 0, Math.PI * 2);
    ctx.fill();

    // 3. Volumetric Sunbeams (God Rays)
    drawSunbeams(sunX, sunY);

    // 4. Stylized Ghibli Clouds
    for (const c of clouds) {
      drawGhibliCloud(c.x, c.y, c.scale, c.opacity);
    }

    // 5. Distant Mountain / Hill 1 (Far Hill)
    drawFarHill();

    // 6. Midground Hill 2 (With Lone Oak Tree)
    drawMidHill();

    // 7. Foreground Meadow Hill 3 (Grass, Wildflowers)
    drawForegroundHill();

    // 8. Swaying Foreground Grass Tufts & Flowers
    drawGrassAndFlowers();

    // 9. Drifting Dandelion Seeds (Pappus)
    drawDandelions();

    // 10. Sparkling Sunlit Pollen / Golden Motes
    drawPollen();
  }

  // ── Sunbeams ────────────────────────────────────────────────────────────────
  function drawSunbeams(sx, sy) {
    ctx.save();
    for (let i = 0; i < sunbeams.length; i++) {
      const beam = sunbeams[i];
      const pulse = 0.08 + Math.sin(time * beam.speed + beam.phase) * 0.04;
      const angle = beam.baseAngle + Math.sin(time * 0.2 + i) * 0.03;
      const length = h * 1.5;

      const p1x = sx + Math.cos(angle - beam.width * 0.5) * length;
      const p1y = sy + Math.sin(angle - beam.width * 0.5) * length;
      const p2x = sx + Math.cos(angle + beam.width * 0.5) * length;
      const p2y = sy + Math.sin(angle + beam.width * 0.5) * length;

      const beamGrad = ctx.createLinearGradient(sx, sy, (p1x + p2x) * 0.5, (p1y + p2y) * 0.5);
      beamGrad.addColorStop(0.0, `rgba(255, 250, 220, ${pulse * 1.8})`);
      beamGrad.addColorStop(0.4, `rgba(255, 245, 195, ${pulse})`);
      beamGrad.addColorStop(1.0, 'rgba(255, 245, 200, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Ghibli Cloud ────────────────────────────────────────────────────────────
  function drawGhibliCloud(cx, cy, scale, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Fluffy cloud puffs
    const puffs = [
      { x: -55, y: 10, r: 35 },
      { x: -25, y: -10, r: 48 },
      { x: 20,  y: -18, r: 52 },
      { x: 65,  y: 0,   r: 42 },
      { x: 95,  y: 15,  r: 28 },
      { x: 0,   y: 18,  r: 45 },
    ];

    // Shadow base (soft bluish lavender undertone)
    ctx.fillStyle = `rgba(180, 200, 230, ${alpha * 0.45})`;
    for (const p of puffs) {
      ctx.beginPath();
      ctx.arc(p.x, p.y + 6, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main body (sun-drenched bright white/cream)
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
    for (const p of puffs) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Top golden sunlight rim
    ctx.fillStyle = `rgba(255, 250, 230, ${alpha * 0.8})`;
    for (const p of puffs) {
      ctx.beginPath();
      ctx.arc(p.x - 4, p.y - 6, p.r * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ── Far Hill ────────────────────────────────────────────────────────────────
  function drawFarHill() {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, getFarHillY(0));

    const step = 20;
    for (let x = 0; x <= w; x += step) {
      ctx.lineTo(x, getFarHillY(x));
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    // Hazy soft blue-green atmospheric hill
    const farGrad = ctx.createLinearGradient(0, h * 0.4, 0, h * 0.65);
    farGrad.addColorStop(0.0, 'rgb(125, 178, 165)'); // Atmospheric haze
    farGrad.addColorStop(1.0, 'rgb(95, 155, 130)');

    ctx.fillStyle = farGrad;
    ctx.fill();
  }

  // ── Mid Hill & Lone Tree ────────────────────────────────────────────────────
  function drawMidHill() {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, getMidHillY(0));

    const step = 15;
    for (let x = 0; x <= w; x += step) {
      ctx.lineTo(x, getMidHillY(x));
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    const midGrad = ctx.createLinearGradient(0, h * 0.5, 0, h * 0.75);
    midGrad.addColorStop(0.0, 'rgb(112, 175, 95)');  // Sunlit meadow green
    midGrad.addColorStop(1.0, 'rgb(75, 138, 70)');

    ctx.fillStyle = midGrad;
    ctx.fill();

    // Draw Lone Wind-Swept Oak Tree on the hill crest (around w * 0.78)
    const treeX = w * 0.78;
    const treeY = getMidHillY(treeX);
    drawLoneTree(treeX, treeY);
  }

  // Lone Ghibli summer tree on the ridge
  function drawLoneTree(tx, ty) {
    ctx.save();

    const treeSway = Math.sin(time * 1.2) * 3;

    // Trunk
    ctx.beginPath();
    ctx.moveTo(tx - 3, ty + 2);
    ctx.quadraticCurveTo(tx + treeSway * 0.3, ty - 18, tx + treeSway - 1, ty - 32);
    ctx.lineTo(tx + treeSway + 3, ty - 32);
    ctx.quadraticCurveTo(tx + treeSway * 0.3 + 4, ty - 18, tx + 4, ty + 2);
    ctx.closePath();
    ctx.fillStyle = 'rgb(55, 45, 38)';
    ctx.fill();

    // Billowing foliage puffs (overlapping shades of sunlit green)
    const canopyX = tx + treeSway;
    const canopyY = ty - 45;

    const foliagePuffs = [
      { dx: 0,   dy: -12, r: 24, c: 'rgb(135, 195, 80)' }, // Top sunlit
      { dx: -18, dy: -2,  r: 20, c: 'rgb(110, 175, 65)' },
      { dx: 18,  dy: -4,  r: 21, c: 'rgb(125, 185, 75)' },
      { dx: -10, dy: 10,  r: 19, c: 'rgb(85, 145, 55)' },  // Under-shadow
      { dx: 12,  dy: 12,  r: 18, c: 'rgb(75, 135, 50)' },
      { dx: 0,   dy: 2,   r: 22, c: 'rgb(100, 165, 65)' },
    ];

    for (const f of foliagePuffs) {
      ctx.beginPath();
      ctx.arc(canopyX + f.dx, canopyY + f.dy, f.r, 0, Math.PI * 2);
      ctx.fillStyle = f.c;
      ctx.fill();
    }

    ctx.restore();
  }

  // ── Foreground Meadow Hill ──────────────────────────────────────────────────
  function drawForegroundHill() {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, getForegroundHillY(0));

    const step = 10;
    for (let x = 0; x <= w; x += step) {
      ctx.lineTo(x, getForegroundHillY(x));
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    // Rich, vibrant, warm sun-drenched foreground green
    const foreGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
    foreGrad.addColorStop(0.0, 'rgb(130, 205, 90)');  // Bright sunlit crest
    foreGrad.addColorStop(0.4, 'rgb(92, 168, 62)');
    foreGrad.addColorStop(1.0, 'rgb(48, 105, 42)');   // Deep grass roots

    ctx.fillStyle = foreGrad;
    ctx.fill();
  }

  // ── Grass Tufts & Wildflowers ───────────────────────────────────────────────
  function drawGrassAndFlowers() {
    const wind = Math.sin(time * 2.2) * 8 + Math.cos(time * 1.1) * 3;

    // Grass blades
    for (let i = 0; i < grassTufts.length; i++) {
      const g = grassTufts[i];
      const bladeWind = wind + Math.sin(time * 2.5 + g.phase) * 5;

      ctx.lineWidth = 1.6;
      ctx.strokeStyle = g.shade > 0.5 ? 'rgb(140, 215, 95)' : 'rgb(95, 170, 65)';

      for (let b = 0; b < g.bladeCount; b++) {
        const spread = (b - (g.bladeCount - 1) / 2) * 3;
        const bLen = g.height * (0.8 + Math.sin(b * 1.5) * 0.3);

        ctx.beginPath();
        ctx.moveTo(g.x + spread, g.y);
        ctx.quadraticCurveTo(
          g.x + spread + bladeWind * 0.4,
          g.y - bLen * 0.55,
          g.x + spread + bladeWind + g.bendOffset,
          g.y - bLen
        );
        ctx.stroke();
      }
    }

    // Wildflowers
    for (const f of flowers) {
      const swayX = f.x + Math.sin(time * 2.0 + f.phase) * 4;
      const swayY = f.y;

      ctx.save();
      ctx.translate(swayX, swayY);

      if (f.type === 'buttercup') {
        // Yellow buttercup
        ctx.fillStyle = 'rgb(255, 225, 60)';
        for (let a = 0; a < 5; a++) {
          ctx.beginPath();
          const angle = (a * Math.PI * 2) / 5;
          ctx.arc(Math.cos(angle) * (f.size * 0.5), Math.sin(angle) * (f.size * 0.5), f.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgb(230, 160, 20)';
        ctx.beginPath();
        ctx.arc(0, 0, f.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'daisy') {
        // Chamomile white daisy
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        for (let a = 0; a < 6; a++) {
          ctx.beginPath();
          const angle = (a * Math.PI * 2) / 6;
          ctx.arc(Math.cos(angle) * (f.size * 0.6), Math.sin(angle) * (f.size * 0.6), f.size * 0.32, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgb(255, 200, 30)';
        ctx.beginPath();
        ctx.arc(0, 0, f.size * 0.28, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.type === 'cornflower') {
        // Cornflower blue
        ctx.fillStyle = 'rgb(90, 150, 245)';
        ctx.beginPath();
        ctx.arc(0, 0, f.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.beginPath();
        ctx.arc(0, 0, f.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Poppy coral red
        ctx.fillStyle = 'rgb(240, 85, 80)';
        ctx.beginPath();
        ctx.arc(0, 0, f.size * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgb(40, 30, 30)';
        ctx.beginPath();
        ctx.arc(0, 0, f.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // ── Dandelion Seeds (Pappus Parachutes) ──────────────────────────────────────
  function drawDandelions() {
    ctx.save();

    for (const d of dandelions) {
      ctx.save();
      ctx.translate(d.x, d.y);

      // Slight tilt forward with flight direction
      const tilt = d.tilt + Math.sin(time * d.swaySpeed + d.swayPhase) * 0.15;
      ctx.rotate(tilt);

      const sz = d.size;
      const op = d.opacity;

      // Seed grain at base
      ctx.fillStyle = `rgba(85, 60, 40, ${op * 0.9})`;
      ctx.beginPath();
      ctx.ellipse(0, sz * 0.8, sz * 0.12, sz * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stem (bristle)
      ctx.strokeStyle = `rgba(220, 220, 210, ${op * 0.85})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, sz * 0.6);
      ctx.lineTo(0, 0);
      ctx.stroke();

      // Parachute tuft (pappus star rays)
      ctx.strokeStyle = `rgba(255, 255, 255, ${op * 0.95})`;
      ctx.lineWidth = 0.9;
      const rayCount = 9;
      for (let r = 0; r < rayCount; r++) {
        const rayAngle = -Math.PI * 0.5 + (r - (rayCount - 1) / 2) * 0.28;
        const rayLen = sz * 0.75;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(rayAngle) * rayLen, Math.sin(rayAngle) * rayLen);
        ctx.stroke();
      }

      // Fluffy center halo
      ctx.fillStyle = `rgba(255, 255, 255, ${op * 0.6})`;
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  // ── Pollen / Golden Motes ───────────────────────────────────────────────────
  function drawPollen() {
    for (const p of pollen) {
      const pulse = 0.5 + 0.5 * Math.sin(time * p.speed + p.phase);
      const alpha = p.alpha * pulse;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 245, 160, ${alpha})`;
      ctx.fill();

      if (p.size > 1.6 && quality === 'high') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 235, 120, ${alpha * 0.25})`;
        ctx.fill();
      }
    }
  }

  // ── Destroy ─────────────────────────────────────────────────────────────────
  function destroy() {
    destroyed = true;
    clouds = [];
    sunbeams = [];
    dandelions = [];
    pollen = [];
    grassTufts = [];
    flowers = [];
  }

  return { init, update, resize, destroy };
}
