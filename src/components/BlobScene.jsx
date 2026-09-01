import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { blobVert } from '../shaders/blob.vert';
import { blobFrag } from '../shaders/blob.frag';
import { useStore, MODES, HUBERMAN_PHASES } from '../store';

// ── Colour helpers ────────────────────────────────────────────────────────────
function modeColors(mode) {
  const cfg = MODES[mode] || HUBERMAN_PHASES[mode] || MODES.focus;
  const { h, s, lb } = cfg;
  const hsl = (l) => new THREE.Color(`hsl(${h},${s}%,${l}%)`);
  return {
    colorA:    hsl(lb - 18),
    colorB:    hsl(lb + 8),
    darkColor: new THREE.Color('#0b0d18'),
    rimColor:  hsl(lb + 5),
  };
}

// ── 1. Blob Mesh ──────────────────────────────────────────────────────────────
function BlobMesh({ hubermanPhase }) {
  const mode    = useStore(s => s.mode);
  const elapsed = useStore(s => s.elapsed);
  const dur     = useStore(s => s.durations[s.mode]);

  // If in Huberman mode, use phase info instead
  const h = useStore(s => s.huberman);
  const activeMode = hubermanPhase || mode;
  const activeElapsed = hubermanPhase ? h.elapsed : elapsed;
  const activeDur = hubermanPhase
    ? (h.phase === 'warmup' ? h.warmupDuration : h.phase === 'focus' ? h.focusDuration : h.nsdrDuration)
    : dur;

  const matRef = useRef();
  const meshRef = useRef();
  const progress = Math.min(1, Math.max(0, activeElapsed / Math.max(activeDur, 1)));

  const uniforms = useMemo(() => ({
    u_time:      { value: 0 },
    u_fill:      { value: 0 },
    u_colorA:    { value: modeColors('focus').colorA },
    u_colorB:    { value: modeColors('focus').colorB },
    u_darkColor: { value: modeColors('focus').darkColor },
    u_rimColor:  { value: modeColors('focus').rimColor },
  }), []);

  const currentFill = useRef(0);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const isWarmup = hubermanPhase === 'warmup' || (!hubermanPhase && false);
      const targetScale = isWarmup ? 0.15 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.02);
    }

    if (!matRef.current) return;
    const u = matRef.current.uniforms;

    const isWarmup = hubermanPhase === 'warmup';
    const isNsdr = hubermanPhase === 'nsdr';
    const timeMultiplier = isWarmup ? 0.2 : isNsdr ? 0.4 : 1.0;
    u.u_time.value = clock.getElapsedTime() * timeMultiplier;

    currentFill.current = THREE.MathUtils.lerp(currentFill.current, progress, 0.035);
    u.u_fill.value = currentFill.current;

    const tc = modeColors(activeMode);
    u.u_colorA.value.lerp(tc.colorA, 0.04);
    u.u_colorB.value.lerp(tc.colorB, 0.04);
    u.u_darkColor.value.lerp(tc.darkColor, 0.04);
    u.u_rimColor.value.lerp(tc.rimColor, 0.04);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={blobVert}
        fragmentShader={blobFrag}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

// ── Main exported scene ───────────────────────────────────────────────────────
export default function BlobScene({ hubermanPhase }) {
  const mode               = useStore(s => s.mode);
  const activeMode         = hubermanPhase || mode;
  const cfg                = MODES[activeMode] || HUBERMAN_PHASES[activeMode] || MODES.focus;
  const { h, s, lb }       = cfg;
  const glowColor          = `hsla(${h}, ${s}%, ${lb}%, 0.45)`;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        filter: `drop-shadow(0 0 32px ${glowColor})`,
        transition: 'filter 0.5s ease',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.4], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1.2} />

        <BlobMesh hubermanPhase={hubermanPhase} />
      </Canvas>
    </div>
  );
}
