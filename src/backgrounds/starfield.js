/**
 * Starfield Background Renderer
 * 
 * Deep space parallax starfield with multiple depth layers,
 * subtle mouse-based parallax drift, occasional shooting stars,
 * and nebula color clouds that match the timer mode accent.
 */

export function createStarfield() {
  let canvas, ctx, w, h, dpr;
  let stars = [];
  let shootingStars = [];
  let nebulaClouds = [];
  let accent = { r: 168, g: 85, b: 247 };
  let quality = 'high';
  let destroyed = false;
  let time = 0;
  let mouseX = 0.5, mouseY = 0.5; // normalized 0–1

  const STAR_COUNT_HIGH = 250;
  const STAR_COUNT_LOW = 120;
  const LAYER_COUNT = 4;
  const SHOOTING_STAR_CHANCE = 0.004; // per second

  // ── Star ────────────────────────────────────────────────────────────────────
  function createStar(layer) {
    const depth = (layer + 1) / LAYER_COUNT;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      baseX: Math.random() * w,
      baseY: Math.random() * h,
      radius: (0.4 + Math.random() * 1.2) * depth,
      opacity: (0.2 + Math.random() * 0.6) * depth,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.3 + Math.random() * 1.2,
      layer,
      depth,
    };
  }

  // ── Shooting Star ───────────────────────────────────────────────────────────
  function spawnShootingStar() {
    const startX = Math.random() * w * 0.7;
    const startY = Math.random() * h * 0.4;
    const angle = 0.4 + Math.random() * 0.6; // mostly diagonal down-right
    const speed = 8 + Math.random() * 12;
    return {
      x: startX,
      y: startY,
      angle,
      speed,
      length: 60 + Math.random() * 100,
      life: 1,
      decay: 0.012 + Math.random() * 0.015,
      width: 1 + Math.random() * 1.5,
    };
  }

  // ── Nebula Cloud ────────────────────────────────────────────────────────────
  function createNebula() {
    return {
      x: Math.random() * w,
      y: Math.random() * h * 0.6,
      radiusX: 100 + Math.random() * 200,
      radiusY: 60 + Math.random() * 120,
      opacity: 0.015 + Math.random() * 0.025,
      hueShift: (Math.random() - 0.5) * 60,
      drift: (Math.random() - 0.5) * 0.08,
    };
  }

  // ── Mouse tracking ──────────────────────────────────────────────────────────
  function handleMouseMove(e) {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init(cvs, opts = {}) {
    canvas = cvs;
    ctx = canvas.getContext('2d');
    quality = opts.quality || 'high';
    dpr = quality === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    resize(canvas.clientWidth, canvas.clientHeight);

    const count = quality === 'high' ? STAR_COUNT_HIGH : STAR_COUNT_LOW;
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push(createStar(i % LAYER_COUNT));
    }

    nebulaClouds = [];
    for (let i = 0; i < 4; i++) {
      nebulaClouds.push(createNebula());
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
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

    // Parallax offset based on mouse
    const parallaxX = (mouseX - 0.5) * 15;
    const parallaxY = (mouseY - 0.5) * 10;

    // Update star positions with parallax
    for (const s of stars) {
      s.x = s.baseX + parallaxX * s.depth;
      s.y = s.baseY + parallaxY * s.depth;

      // Slow drift
      s.baseX += 0.02 * s.depth * dt * 60;
      if (s.baseX > w + 20) {
        s.baseX = -20;
        s.baseY = Math.random() * h;
      }
    }

    // Shooting stars
    if (Math.random() < SHOOTING_STAR_CHANCE * dt) {
      shootingStars.push(spawnShootingStar());
    }
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      ss.x += Math.cos(ss.angle) * ss.speed * dt * 60;
      ss.y += Math.sin(ss.angle) * ss.speed * dt * 60;
      ss.life -= ss.decay * dt * 60;
      if (ss.life <= 0 || ss.x > w + 50 || ss.y > h + 50) {
        shootingStars.splice(i, 1);
      }
    }

    // Nebula drift
    for (const n of nebulaClouds) {
      n.x += n.drift * dt * 60;
      if (n.x < -n.radiusX * 2) n.x = w + n.radiusX;
      if (n.x > w + n.radiusX * 2) n.x = -n.radiusX;
    }

    draw();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, w, h);

    const r = accent.r, g = accent.g, b = accent.b;

    // Nebula clouds (drawn first, behind stars)
    for (const n of nebulaClouds) {
      const nr = Math.min(255, Math.max(0, r + n.hueShift));
      const ng = Math.min(255, Math.max(0, g + n.hueShift * 0.4));
      const nb = Math.min(255, Math.max(0, b - n.hueShift * 0.2));

      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, Math.max(n.radiusX, n.radiusY));
      grad.addColorStop(0, `rgba(${nr}, ${ng}, ${nb}, ${n.opacity * 1.5})`);
      grad.addColorStop(0.4, `rgba(${nr}, ${ng}, ${nb}, ${n.opacity})`);
      grad.addColorStop(1, `rgba(${nr}, ${ng}, ${nb}, 0)`);

      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(n.radiusX / Math.max(n.radiusX, n.radiusY), n.radiusY / Math.max(n.radiusX, n.radiusY));
      ctx.translate(-n.x, -n.y);
      ctx.fillStyle = grad;
      ctx.fillRect(n.x - n.radiusX * 2, n.y - n.radiusY * 2, n.radiusX * 4, n.radiusY * 4);
      ctx.restore();
    }

    // Stars
    for (const s of stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinklePhase);
      const op = s.opacity * (0.6 + 0.4 * twinkle);
      if (op < 0.05) continue;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 225, 245, ${op})`;
      ctx.fill();

      // Soft glow for bright stars
      if (s.radius > 1 && quality === 'high') {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${op * 0.12})`;
        ctx.fill();
      }
    }

    // Shooting stars
    for (const ss of shootingStars) {
      const tailX = ss.x - Math.cos(ss.angle) * ss.length * ss.life;
      const tailY = ss.y - Math.sin(ss.angle) * ss.length * ss.life;

      const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
      grad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${ss.life * 0.4})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${ss.life * 0.9})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = ss.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(ss.x, ss.y);
      ctx.stroke();

      // Head glow
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, ss.width * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${ss.life * 0.5})`;
      ctx.fill();
    }
  }

  // ── Destroy ─────────────────────────────────────────────────────────────────
  function destroy() {
    destroyed = true;
    window.removeEventListener('mousemove', handleMouseMove);
    stars = [];
    shootingStars = [];
    nebulaClouds = [];
  }

  return { init, update, resize, destroy };
}
