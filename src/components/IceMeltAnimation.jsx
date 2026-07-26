import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import styles from './IceMelt.module.css';

// ── Math helpers ──────────────────────────────────────────────────────────────
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rnd   = (a, b) => a + Math.random() * (b - a);
const PI2   = Math.PI * 2;

// ── Ice crystal polygon (jagged asymmetric monolith) ─────────────────────────
// Returns normalized points [0..1] that will be scaled to canvas size.
// These define the silhouette of the ice block — not a plain rectangle.
function makeIceShape(cx, top, w, h) {
  // 8-point polygon that looks like a natural shard/monolith
  const hw = w / 2;
  return [
    [cx - hw * 0.55, top],                      // top-left inner
    [cx - hw * 0.30, top - h * 0.06],           // top peak-left
    [cx + hw * 0.15, top - h * 0.04],           // top peak-right
    [cx + hw * 0.60, top + h * 0.02],           // right shoulder
    [cx + hw * 0.65, top + h * 0.85],           // bottom-right
    [cx + hw * 0.20, top + h * 0.98],           // bottom-right inner
    [cx - hw * 0.25, top + h * 0.96],           // bottom-left inner
    [cx - hw * 0.70, top + h * 0.80],           // bottom-left outer
  ];
}

// ── Fracture line (spawns from edges inward) ──────────────────────────────────
function makeFracture(cx, top, w, h) {
  const startX = cx + rnd(-w * 0.42, w * 0.42);
  const startY = top + rnd(h * 0.05, h * 0.85);
  const segs = Math.floor(rnd(2, 5));
  const pts = [{ x: startX, y: startY }];
  let ax = startX, ay = startY;
  for (let i = 0; i < segs; i++) {
    ax += rnd(-w * 0.12, w * 0.12);
    ay += rnd(-h * 0.06, h * 0.14);
    pts.push({ x: ax, y: ay });
  }
  return {
    pts,
    opacity: rnd(0.08, 0.22),
    width: rnd(0.6, 1.4),
    born: 0,        // progress% at which this crack appears
    glow: Math.random() > 0.6,
  };
}

// ── Steam puff ────────────────────────────────────────────────────────────────
function makeSteam(cx, y, intensity) {
  const spread = 40 + intensity * 60;
  return {
    x: cx + rnd(-spread, spread),
    y: y + rnd(-8, 8),
    vx: rnd(-0.35, 0.35),
    vy: rnd(-0.7, -1.8) * (0.5 + intensity * 0.5),
    life: 1,
    decay: rnd(0.003, 0.007),
    r: rnd(10, 32) * (0.7 + intensity * 0.5),
    wobble: rnd(0, PI2),
    wobbleSpd: rnd(0.02, 0.06),
  };
}

// ── Natural drip system — 3 lifecycle objects ─────────────────────────────────

// Phase 1: pendant drop forming on the ice surface
function makePendant(x, iceY) {
  return {
    x, anchorY: iceY,       // where it hangs from
    size: 0,               // grows 0 → 1 (normalised radius max 5px)
    growRate: rnd(0.004, 0.012),
    maxSize: rnd(3.5, 6.0),
    released: false,
    wobble: rnd(0, PI2),
    wobbleSpd: rnd(0.04, 0.09),
  };
}

// Phase 2: drop in free-fall
function makeFallingDrop(x, y, sz) {
  return {
    x,
    y,
    vy: rnd(1.0, 2.2),
    vx: rnd(-0.18, 0.18),
    r: sz,                  // pixel radius
    trail: [],              // array of {x,y} for trailing motion-blur streak
    life: 1,
    landed: false,
  };
}

// Phase 3: tiny splash on impact
function makeSplash(x, y) {
  const rings = [];
  const count = Math.floor(rnd(3, 6));
  for (let i = 0; i < count; i++) {
    rings.push({
      r: rnd(2, 5),
      maxR: rnd(12, 28),
      life: 1,
      decay: rnd(0.04, 0.08),
      speed: rnd(0.6, 1.4),
    });
  }
  // Tiny spatter droplets
  const spatter = [];
  const sc = Math.floor(rnd(3, 7));
  for (let i = 0; i < sc; i++) {
    const ang = rnd(0, PI2);
    const spd = rnd(1.2, 3.5);
    spatter.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - rnd(1, 2.5),
      r: rnd(0.8, 2.2),
      life: 1,
      decay: rnd(0.05, 0.1),
    });
  }
  return { x, y, rings, spatter };
}

// ── Caustic light blob ────────────────────────────────────────────────────────
function makeCaustic(cx, top, w, h) {
  return {
    x: cx + rnd(-w * 0.35, w * 0.35),
    y: top + rnd(h * 0.05, h * 0.88),
    rx: rnd(8, 36),
    ry: rnd(4, 14),
    angle: rnd(0, Math.PI),
    baseOp: rnd(0.04, 0.14),
    spd: rnd(0.0012, 0.004),
    phase: rnd(0, PI2),
    hue: rnd(180, 220),   // blue-cyan range
  };
}

// ── Snowflake particle (ambient ambience around ice) ──────────────────────────
function makeSnowflake(W) {
  return {
    x: rnd(0, W),
    y: rnd(-20, -80),
    vx: rnd(-0.15, 0.15),
    vy: rnd(0.2, 0.6),
    r: rnd(0.8, 2.5),
    op: rnd(0.2, 0.65),
    wobble: rnd(0, PI2),
    wobbleSpd: rnd(0.01, 0.04),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function IceMeltAnimation() {
  const elapsed = useStore(s => s.elapsed);
  const dur     = useStore(s => s.durations[s.mode]);
  const mode    = useStore(s => s.mode);

  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  const liveRef = useRef({ elapsed, dur, mode });
  liveRef.current = { elapsed, dur, mode };

  const S = useRef(null);   // full mutable state object

  function initState(CW, CH) {
    const cx   = CW / 2;
    const ICE_W = CW * 0.58;
    const ICE_H = CH * 0.68;
    const top   = CH * 0.10;

    const fractures = [];
    for (let i = 0; i < 18; i++) {
      const f = makeFracture(cx, top, ICE_W, ICE_H);
      f.born = rnd(0, 0.95);
      fractures.push(f);
    }

    const caustics = [];
    for (let i = 0; i < 16; i++) caustics.push(makeCaustic(cx, top, ICE_W, ICE_H));

    const snowflakes = [];
    for (let i = 0; i < 22; i++) {
      const sf = makeSnowflake(CW);
      sf.y = rnd(0, CH);  // start scattered
      snowflakes.push(sf);
    }

    return {
      cx, ICE_W, ICE_H, top,
      shape: makeIceShape(cx, top, ICE_W, ICE_H),

      // Smooth interpolated values
      scaleY: 1,       scaleYT: 1,
      puddle: 0,       puddleT: 0,
      crackProg: 0,    crackProgT: 0,
      glowIntensity: 0, glowT: 0,

      fractures, caustics, snowflakes,

      // Natural drip system
      // Fixed drip points along the ice bottom edge (3-5 spots)
      dripPoints: [
        { xOff: -ICE_W * 0.30, cooldown: rnd(60, 180), timer: rnd(0, 60) },
        { xOff: -ICE_W * 0.05, cooldown: rnd(80, 200), timer: rnd(0, 80) },
        { xOff:  ICE_W * 0.20, cooldown: rnd(50, 150), timer: rnd(0, 50) },
        { xOff:  ICE_W * 0.40, cooldown: rnd(90, 220), timer: rnd(0, 90) },
      ],
      pendants:     [],   // forming drops
      fallingDrops: [],   // drops in flight
      splashes:     [],   // impact ripples
      // streak marks on the ice surface (water run-off paths)
      streakMarks: Array.from({ length: 5 }, () => ({
        xOff: rnd(-ICE_W * 0.42, ICE_W * 0.42),
        startFrac: rnd(0.25, 0.65),  // start Y fraction down from ice top
        len: rnd(0.08, 0.22),        // fraction of ice height
        op: rnd(0.04, 0.12),
      })),

      steam: [],

      meltStart: null,
      frame: 0,
      steamTimer: 0,
      snowTimer: 0,
      CW, CH,
    };
  }

  // Reset on mode change
  useEffect(() => { S.current = null; }, [mode]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cancelAnimationFrame(rafRef.current);

    const ctx = cv.getContext('2d');
    const DPR = window.devicePixelRatio || 1;
    const CW  = cv.offsetWidth  || 360;
    const CH  = cv.offsetHeight || 360;
    cv.width  = CW * DPR;
    cv.height = CH * DPR;
    ctx.scale(DPR, DPR);

    if (!S.current) S.current = initState(CW, CH);

    // ── Helper: draw polygon path ─────────────────────────────────────────────
    function shapePath(pts, scaleY, pivotY) {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const [px, py] = pts[i];
        const sy = pivotY + (py - pivotY) * scaleY;
        if (i === 0) ctx.moveTo(px, sy);
        else ctx.lineTo(px, sy);
      }
      ctx.closePath();
    }

    // ── Helper: map point Y through scaleY ────────────────────────────────────
    function mapY(py, scaleY, pivotY) {
      return pivotY + (py - pivotY) * scaleY;
    }

    const draw = (ts) => {
      ctx.clearRect(0, 0, CW, CH);
      const s = S.current;
      s.frame++;

      // ── Live values ─────────────────────────────────────────────────────────
      const { elapsed: el, dur: d, mode: m } = liveRef.current;
      const prog   = d > 0 ? clamp(el / d, 0, 1) : 0;
      const remaining = Math.max(0, d - el);
      const isDone = remaining === 0 && m === 'focus';

      // ── Derive targets ───────────────────────────────────────────────────────
      const pivotY = s.top + s.ICE_H;  // bottom of ice — stays fixed

      if (isDone) {
        if (!s.meltStart) s.meltStart = ts;
        const meltT  = clamp((ts - s.meltStart) / 5000, 0, 1);
        const ease   = 1 - Math.pow(1 - meltT, 2.5);
        s.scaleYT     = clamp(1 - ease * 0.97, 0.02, 1);
        s.puddleT     = ease;
        s.crackProgT  = 1;
        s.glowT       = ease;
      } else {
        s.meltStart  = null;
        s.scaleYT    = 1 - prog * 0.08;
        s.puddleT    = prog * 0.05;
        s.crackProgT = prog * 0.6;   // cracks appear as session progresses
        s.glowT      = prog * 0.2;
      }

      // Smooth lerp
      s.scaleY       = lerp(s.scaleY,       s.scaleYT,     0.028);
      s.puddle       = lerp(s.puddle,        s.puddleT,     0.025);
      s.crackProg    = lerp(s.crackProg,     s.crackProgT,  0.03);
      s.glowIntensity= lerp(s.glowIntensity, s.glowT,       0.03);

      const { cx, ICE_W, ICE_H, top, shape, scaleY, puddle } = s;
      const scaledTop = mapY(top, scaleY, pivotY);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // LAYER 1 — Ambient outer glow (behind everything)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const glowAlpha = 0.12 + s.glowIntensity * 0.35;
      const glowR = ICE_W * 0.7;
      const outerGlow = ctx.createRadialGradient(cx, pivotY - ICE_H * scaleY * 0.5, 0, cx, pivotY - ICE_H * scaleY * 0.5, glowR);
      outerGlow.addColorStop(0,   `rgba(100,200,255,${(glowAlpha * 0.8).toFixed(3)})`);
      outerGlow.addColorStop(0.4, `rgba(60,160,240,${(glowAlpha * 0.4).toFixed(3)})`);
      outerGlow.addColorStop(1,   'rgba(40,120,200,0)');
      ctx.beginPath();
      ctx.ellipse(cx, pivotY - ICE_H * scaleY * 0.4, glowR, glowR * 0.85, 0, 0, PI2);
      ctx.fillStyle = outerGlow;
      ctx.fill();

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // LAYER 2 — Puddle
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (puddle > 0.008) {
        const pW = ICE_W * (0.9 + puddle * 1.2);
        const pH = clamp(ICE_H * 0.08 * puddle + 4, 4, 32);
        const pY = pivotY + 4;

        const puddleGrad = ctx.createRadialGradient(cx, pY, 0, cx, pY, pW / 2);
        puddleGrad.addColorStop(0,   `rgba(160,225,255,${clamp(puddle * 0.7, 0, 0.65).toFixed(3)})`);
        puddleGrad.addColorStop(0.5, `rgba(120,200,250,${clamp(puddle * 0.45, 0, 0.4).toFixed(3)})`);
        puddleGrad.addColorStop(1,   'rgba(80,170,240,0)');
        ctx.beginPath();
        ctx.ellipse(cx, pY, pW / 2, pH / 2, 0, 0, PI2);
        ctx.fillStyle = puddleGrad;
        ctx.fill();

        // Specular highlight on puddle
        const specW = pW * 0.22;
        const specGrad = ctx.createRadialGradient(cx - pW * 0.1, pY - pH * 0.15, 0, cx - pW * 0.1, pY - pH * 0.15, specW);
        specGrad.addColorStop(0, `rgba(255,255,255,${clamp(puddle * 0.55, 0, 0.45).toFixed(3)})`);
        specGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.ellipse(cx - pW * 0.1, pY - pH * 0.15, specW, specW * 0.35, 0, 0, PI2);
        ctx.fillStyle = specGrad;
        ctx.fill();

        // Ripple rings when melting actively
        if (isDone || puddle > 0.1) {
          for (let r = 1; r <= 4; r++) {
            const t = (s.frame * 0.042 + r * 0.7) % (PI2);
            const rAlpha = clamp(Math.sin(t) * 0.18 * puddle, 0, 0.2);
            const rScale = 0.25 + r * 0.18;
            ctx.beginPath();
            ctx.ellipse(cx, pY, (pW / 2) * rScale, (pH / 2) * rScale, 0, 0, PI2);
            ctx.strokeStyle = `rgba(140,215,255,${rAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // LAYER 3 — Ground shadow under ice
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      {
        const sA = clamp(0.28 * scaleY, 0, 0.28);
        const sg = ctx.createRadialGradient(cx, pivotY + 8, 0, cx, pivotY + 8, ICE_W * 0.55);
        sg.addColorStop(0,   `rgba(30,80,160,${sA.toFixed(3)})`);
        sg.addColorStop(0.6, `rgba(20,60,130,${(sA * 0.35).toFixed(3)})`);
        sg.addColorStop(1,   'rgba(20,60,130,0)');
        ctx.beginPath();
        ctx.ellipse(cx, pivotY + 8, ICE_W * 0.55, 12, 0, 0, PI2);
        ctx.fillStyle = sg;
        ctx.fill();
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // LAYER 4 — Ice body (multi-pass for depth)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (scaleY > 0.02) {
        // 4a — deep interior (dark blue core)
        shapePath(shape, scaleY, pivotY);
        const coreGrad = ctx.createRadialGradient(cx, mapY(top + ICE_H * 0.55, scaleY, pivotY), 0, cx, mapY(top + ICE_H * 0.5, scaleY, pivotY), ICE_W * 0.55);
        coreGrad.addColorStop(0,   'rgba(10, 40,  90, 0.92)');
        coreGrad.addColorStop(0.35,'rgba(15, 65, 130, 0.88)');
        coreGrad.addColorStop(0.7, 'rgba(30, 100,170, 0.82)');
        coreGrad.addColorStop(1,   'rgba(60, 150,210, 0.78)');
        ctx.fillStyle = coreGrad;
        ctx.fill();

        // 4b — translucent ice body (layered transparency)
        shapePath(shape, scaleY, pivotY);
        const bodyGrad = ctx.createLinearGradient(cx - ICE_W * 0.5, scaledTop, cx + ICE_W * 0.5, pivotY);
        bodyGrad.addColorStop(0,    'rgba(200, 240, 255, 0.22)');
        bodyGrad.addColorStop(0.3,  'rgba(160, 215, 248, 0.16)');
        bodyGrad.addColorStop(0.65, 'rgba(120, 190, 240, 0.12)');
        bodyGrad.addColorStop(1,    'rgba( 80, 160, 225, 0.18)');
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // 4c — caustic light blobs (clipped to shape)
        ctx.save();
        shapePath(shape, scaleY, pivotY);
        ctx.clip();

        for (const c of s.caustics) {
          c.phase += c.spd;
          const pulse  = 0.55 + 0.45 * Math.sin(c.phase);
          const shimmer= 0.5  + 0.5  * Math.sin(c.phase * 1.7 + 1.2);
          const a      = c.baseOp * pulse;
          const cy_    = mapY(c.y, scaleY, pivotY);

          // Main caustic
          const cg = ctx.createRadialGradient(c.x, cy_, 0, c.x, cy_, c.rx);
          cg.addColorStop(0,   `hsla(${c.hue}, 90%, 85%, ${a.toFixed(3)})`);
          cg.addColorStop(0.5, `hsla(${c.hue}, 80%, 70%, ${(a * 0.4).toFixed(3)})`);
          cg.addColorStop(1,   `hsla(${c.hue}, 70%, 60%, 0)`);
          ctx.beginPath();
          ctx.ellipse(c.x, cy_, c.rx * (0.9 + 0.1 * shimmer), c.ry, c.angle + c.phase * 0.15, 0, PI2);
          ctx.fillStyle = cg;
          ctx.fill();
        }

        // 4d — fracture cracks (progressively revealed)
        for (const f of s.fractures) {
          if (f.born > s.crackProg) continue;
          const pts = f.pts;
          if (pts.length < 2) continue;

          const baseOp = f.opacity * clamp((s.crackProg - f.born) / 0.15, 0, 1);
          if (baseOp < 0.01) continue;

          // Glow halo behind crack
          if (f.glow) {
            ctx.beginPath();
            ctx.moveTo(pts[0].x, mapY(pts[0].y, scaleY, pivotY));
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, mapY(pts[i].y, scaleY, pivotY));
            ctx.strokeStyle = `rgba(140,220,255,${(baseOp * 0.3).toFixed(3)})`;
            ctx.lineWidth = f.width * 3.5;
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          // Crack line
          ctx.beginPath();
          ctx.moveTo(pts[0].x, mapY(pts[0].y, scaleY, pivotY));
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, mapY(pts[i].y, scaleY, pivotY));
          ctx.strokeStyle = `rgba(180,235,255,${baseOp.toFixed(3)})`;
          ctx.lineWidth = f.width;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        ctx.restore(); // end clip

        // 4e — Left bright specular face (strong fresnel)
        shapePath(shape, scaleY, pivotY);
        const leftSpec = ctx.createLinearGradient(cx - ICE_W * 0.5, 0, cx - ICE_W * 0.05, 0);
        leftSpec.addColorStop(0,   'rgba(255,255,255,0.48)');
        leftSpec.addColorStop(0.5, 'rgba(220,245,255,0.18)');
        leftSpec.addColorStop(1,   'rgba(200,240,255,0)');
        ctx.fillStyle = leftSpec;
        ctx.fill();

        // 4f — Top bright glint
        shapePath(shape, scaleY, pivotY);
        const topSpec = ctx.createLinearGradient(0, scaledTop - ICE_H * 0.04 * scaleY, 0, scaledTop + ICE_H * 0.18 * scaleY);
        topSpec.addColorStop(0,   'rgba(255,255,255,0.65)');
        topSpec.addColorStop(0.3, 'rgba(230,250,255,0.22)');
        topSpec.addColorStop(1,   'rgba(200,240,255,0)');
        ctx.fillStyle = topSpec;
        ctx.fill();

        // 4g — Right edge depth shadow
        shapePath(shape, scaleY, pivotY);
        const rightShad = ctx.createLinearGradient(cx + ICE_W * 0.25, 0, cx + ICE_W * 0.5, 0);
        rightShad.addColorStop(0, 'rgba(10,30,80,0)');
        rightShad.addColorStop(1, 'rgba(10,30,80,0.42)');
        ctx.fillStyle = rightShad;
        ctx.fill();

        // 4h — Frosted outline
        shapePath(shape, scaleY, pivotY);
        ctx.strokeStyle = 'rgba(180,230,255,0.55)';
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // 4i — Bottom melt tint (warm water edge when melting)
        if (s.glowIntensity > 0.05) {
          shapePath(shape, scaleY, pivotY);
          const meltEdge = ctx.createLinearGradient(0, pivotY - ICE_H * scaleY * 0.3, 0, pivotY);
          meltEdge.addColorStop(0, 'rgba(100,200,255,0)');
          meltEdge.addColorStop(1, `rgba(140,220,255,${clamp(s.glowIntensity * 0.45, 0, 0.38).toFixed(3)})`);
          ctx.fillStyle = meltEdge;
          ctx.fill();
        }
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // LAYER 5 — Natural Drip System (3 phases)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      // Speed multiplier: slow during session, fast on completion
      const dripSpeed = isDone ? 3.5 : (0.15 + prog * 1.2);

      // ── Draw streak/run-off paths on ice surface ─────────────────────────────
      if (prog > 0.05 && scaleY > 0.1) {
        ctx.save();
        shapePath(shape, scaleY, pivotY);
        ctx.clip();
        for (const sm of s.streakMarks) {
          const startY = mapY(top + ICE_H * sm.startFrac, scaleY, pivotY);
          const endY   = mapY(top + ICE_H * Math.min(sm.startFrac + sm.len, 0.98), scaleY, pivotY);
          const sx     = cx + sm.xOff;
          const streamOp = sm.op * clamp(prog * 2, 0, 1);
          const sg = ctx.createLinearGradient(sx, startY, sx, endY);
          sg.addColorStop(0,   `rgba(160,230,255,0)`);
          sg.addColorStop(0.4, `rgba(180,238,255,${streamOp.toFixed(3)})`);
          sg.addColorStop(1,   `rgba(140,220,255,0)`);
          ctx.beginPath();
          ctx.moveTo(sx - 1.5, startY);
          ctx.bezierCurveTo(
            sx + rnd(-4, 4), (startY + endY) * 0.4,
            sx + rnd(-4, 4), (startY + endY) * 0.7,
            sx, endY
          );
          ctx.lineWidth = rnd(1.2, 2.8);
          ctx.strokeStyle = `rgba(200,240,255,${streamOp.toFixed(3)})`;
          ctx.stroke();
        }
        ctx.restore();
      }

      // ── Phase 1: spawn & grow pendant drops at fixed drip points ─────────────
      for (const dp of s.dripPoints) {
        dp.timer += dripSpeed;
        if (dp.timer < dp.cooldown) continue;

        // Find if there's already a pendant at this point
        const hasPendant = s.pendants.some(p => Math.abs(p.x - (cx + dp.xOff)) < 3);
        if (!hasPendant && scaleY > 0.08) {
          const anchorY = mapY(top + ICE_H * 0.98, scaleY, pivotY) + 2;
          s.pendants.push(makePendant(cx + dp.xOff, anchorY));
          dp.timer = 0;
          dp.cooldown = isDone ? rnd(20, 60) : rnd(60, 220);
        }
      }

      // ── Phase 1 render & release logic ───────────────────────────────────────
      for (const p of s.pendants) {
        p.wobble += p.wobbleSpd;
        const anchorY = mapY(top + ICE_H * 0.98, scaleY, pivotY) + 2;
        p.anchorY = anchorY; // track as ice shrinks

        if (!p.released) {
          p.size += p.growRate * dripSpeed;

          // Sway slightly while forming
          const sway = Math.sin(p.wobble) * 0.6;
          const px   = p.x + sway;
          const r    = p.size;

          // Neck connecting to ice
          const neckH = clamp(r * 0.6, 2, 6);
          const neckG = ctx.createLinearGradient(px, anchorY, px, anchorY + neckH + r);
          neckG.addColorStop(0,   'rgba(160,228,255,0.55)');
          neckG.addColorStop(1,   'rgba(180,238,255,0.70)');
          ctx.beginPath();
          ctx.moveTo(px - 1.2, anchorY);
          ctx.bezierCurveTo(px - r * 0.4, anchorY + neckH * 0.5, px - r * 0.5, anchorY + neckH, px, anchorY + neckH + r * 0.1);
          ctx.bezierCurveTo(px + r * 0.5, anchorY + neckH, px + r * 0.4, anchorY + neckH * 0.5, px + 1.2, anchorY);
          ctx.fillStyle = neckG;
          ctx.fill();

          // Pendant bulb (teardrop)
          const bulbY = anchorY + neckH + r;
          const bdG = ctx.createRadialGradient(px - r * 0.25, bulbY - r * 0.2, 0, px, bulbY, r);
          bdG.addColorStop(0,   'rgba(230,248,255,0.92)');
          bdG.addColorStop(0.45,'rgba(180,232,255,0.80)');
          bdG.addColorStop(0.8, 'rgba(140,210,255,0.68)');
          bdG.addColorStop(1,   'rgba(100,185,245,0.50)');
          ctx.beginPath();
          ctx.ellipse(px, bulbY, r * 0.82, r, 0, 0, PI2);
          ctx.fillStyle = bdG;
          ctx.fill();

          // Specular glint on bulb
          ctx.beginPath();
          ctx.ellipse(px - r * 0.28, bulbY - r * 0.28, r * 0.22, r * 0.14, -0.5, 0, PI2);
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fill();

          // Release when heavy enough
          if (p.size >= p.maxSize) {
            p.released = true;
            s.fallingDrops.push(makeFallingDrop(px, bulbY, r));
          }
        }
      }
      // Remove released pendants
      s.pendants = s.pendants.filter(p => !p.released);

      // ── Phase 2: falling drops ────────────────────────────────────────────────
      const puddleY = CH - 18; // approximate puddle surface Y for splash detection

      s.fallingDrops = s.fallingDrops.filter(d => !d.landed && d.y < CH + 30);
      for (const fd of s.fallingDrops) {
        // Record trail
        fd.trail.push({ x: fd.x, y: fd.y });
        if (fd.trail.length > 12) fd.trail.shift();

        fd.vy  += 0.15;   // gravity
        fd.x   += fd.vx;
        fd.y   += fd.vy;

        // Detect landing on puddle / bottom
        if (fd.y >= puddleY - fd.r && s.puddle > 0.008) {
          fd.landed = true;
          s.splashes.push(makeSplash(fd.x, puddleY));
          continue;
        }

        // Draw motion-blur trail
        for (let ti = 0; ti < fd.trail.length - 1; ti++) {
          const t0 = fd.trail[ti];
          const t1 = fd.trail[ti + 1];
          const frac = ti / fd.trail.length;
          const ta = frac * 0.35;
          ctx.beginPath();
          ctx.moveTo(t0.x, t0.y);
          ctx.lineTo(t1.x, t1.y);
          ctx.strokeStyle = `rgba(170,228,255,${ta.toFixed(3)})`;
          ctx.lineWidth = fd.r * 0.6 * frac;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Drop teardrop body
        const speed = Math.min(fd.vy / 6, 1);
        const elongation = 1 + speed * 1.4;  // stretches as it speeds up
        const dg = ctx.createRadialGradient(fd.x - fd.r * 0.25, fd.y - fd.r * 0.2, 0, fd.x, fd.y, fd.r);
        dg.addColorStop(0,   'rgba(235,250,255,0.95)');
        dg.addColorStop(0.4, 'rgba(190,235,255,0.82)');
        dg.addColorStop(0.8, 'rgba(150,215,250,0.65)');
        dg.addColorStop(1,   'rgba(110,190,240,0.40)');
        ctx.beginPath();
        // Pointy top, round bottom — real teardrop
        ctx.save();
        ctx.translate(fd.x, fd.y);
        ctx.scale(1, elongation);
        ctx.beginPath();
        ctx.arc(0, 0, fd.r, 0, PI2);
        ctx.restore();
        ctx.fillStyle = dg;
        ctx.fill();

        // Glint
        ctx.beginPath();
        ctx.ellipse(fd.x - fd.r * 0.3, fd.y - fd.r * 0.25, fd.r * 0.25, fd.r * 0.15, -0.4, 0, PI2);
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.fill();
      }

      // ── Phase 3: splash rings & spatter ──────────────────────────────────────
      s.splashes = s.splashes.filter(sp => sp.rings.some(r => r.life > 0) || sp.spatter.some(p => p.life > 0));
      for (const sp of s.splashes) {
        // Rings
        for (const ring of sp.rings) {
          if (ring.life <= 0) continue;
          ring.r    += ring.speed;
          ring.life -= ring.decay;
          const a = clamp(ring.life * 0.55, 0, 0.55);
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, ring.r, ring.r * 0.32, 0, 0, PI2);
          ctx.strokeStyle = `rgba(180,232,255,${a.toFixed(3)})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
        // Spatter micro-drops
        for (const pt of sp.spatter) {
          if (pt.life <= 0) continue;
          pt.x  += pt.vx;
          pt.y  += pt.vy;
          pt.vy += 0.18;  // gravity
          pt.life -= pt.decay;
          const a = clamp(pt.life, 0, 1);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.r, 0, PI2);
          ctx.fillStyle = `rgba(200,242,255,${(a * 0.75).toFixed(3)})`;
          ctx.fill();
        }
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // LAYER 6 — Steam / vapour (on completion)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (isDone || prog > 0.85) {
        s.steamTimer++;
        const intensity = isDone ? 1 : (prog - 0.85) / 0.15;
        if (s.steamTimer % 4 === 0 && s.steam.length < 40) {
          s.steam.push(makeSteam(cx, scaledTop, intensity));
        }
      }

      s.steam = s.steam.filter(p => p.life > 0);
      for (const p of s.steam) {
        p.x  += p.vx + Math.sin(p.wobble) * 0.5;
        p.y  += p.vy;
        p.wobble += p.wobbleSpd;
        p.life   -= p.decay;
        const a = clamp(p.life * 0.48, 0, 0.48);
        const r = p.r * (1 + (1 - p.life) * 0.8);

        const sg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        sg.addColorStop(0,    `rgba(210,242,255,${a.toFixed(3)})`);
        sg.addColorStop(0.45, `rgba(180,228,255,${(a * 0.4).toFixed(3)})`);
        sg.addColorStop(1,    'rgba(160,220,255,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, PI2);
        ctx.fillStyle = sg;
        ctx.fill();
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // LAYER 7 — Ambient snowflakes (gentle atmosphere)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (!isDone) {
        for (const sf of s.snowflakes) {
          sf.x += sf.vx + Math.sin(sf.wobble) * 0.18;
          sf.y += sf.vy;
          sf.wobble += sf.wobbleSpd;
          if (sf.y > CH + 10) { sf.y = -10; sf.x = rnd(0, CW); }

          const fade = clamp(1 - prog * 0.8, 0.1, 1);
          ctx.beginPath();
          ctx.arc(sf.x, sf.y, sf.r, 0, PI2);
          ctx.fillStyle = `rgba(220,245,255,${(sf.op * fade).toFixed(3)})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className={styles.wrapper}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
