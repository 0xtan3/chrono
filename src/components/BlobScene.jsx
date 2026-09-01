import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { blobVert } from '../shaders/blob.vert';
import { blobFrag } from '../shaders/blob.frag';
import { useStore, MODES } from '../store';

// ── Colour Palette Engine ─────────────────────────────────────────────────────
function getModeColors(mode, phase) {
  if (phase === 'warmup') {
    return {
      colorA:    new THREE.Color('#ffffff'),
      colorB:    new THREE.Color('#e2e8f0'),
      darkColor: new THREE.Color('#020617'),
      rimColor:  new THREE.Color('#f8fafc'),
    };
  }

  const cfg = MODES[mode] || MODES.deep;
  const { h, s, lb } = cfg;
  const hsl = (l) => new THREE.Color(`hsl(${h},${s}%,${l}%)`);

  return {
    colorA:    hsl(lb - 18),
    colorB:    hsl(lb + 8),
    darkColor: new THREE.Color('#0b0d18'),
    rimColor:  hsl(lb + 5),
  };
}

// ── Liquid Mesh ───────────────────────────────────────────────────────────────
function BlobMesh() {
  const mode          = useStore((s) => s.mode);
  const protocolPhase = useStore((s) => s.protocolPhase);
  const elapsed       = useStore((s) => s.elapsed);
  const durations     = useStore((s) => s.durations);

  const isWarmup = mode === 'deep' && protocolPhase === 'warmup';
  const activeDur = isWarmup ? durations.warmup : (durations[mode] || 1);

  const matRef = useRef();
  const meshRef = useRef();
  const progress = Math.min(1, Math.max(0, elapsed / Math.max(activeDur, 1)));

  const uniforms = useMemo(() => ({
    u_time:      { value: 0 },
    u_fill:      { value: 0 },
    u_colorA:    { value: getModeColors('deep', 'idle').colorA },
    u_colorB:    { value: getModeColors('deep', 'idle').colorB },
    u_darkColor: { value: getModeColors('deep', 'idle').darkColor },
    u_rimColor:  { value: getModeColors('deep', 'idle').rimColor },
  }), []);

  const currentFill = useRef(0);

  useFrame(({ clock }) => {
    // 1. Adaptive Mesh Scale (Shrinks to pinpoint for visual primer warmup)
    if (meshRef.current) {
      const targetScale = isWarmup ? 0.14 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.035);
    }

    if (!matRef.current) return;
    const u = matRef.current.uniforms;

    // 2. Liquid Speed Modulation
    const speedMult = isWarmup ? 0.15 : mode === 'recovery' ? 0.45 : 1.0;
    u.u_time.value = clock.getElapsedTime() * speedMult;

    // 3. Progress Filling Lerp
    currentFill.current = THREE.MathUtils.lerp(currentFill.current, progress, 0.035);
    u.u_fill.value = currentFill.current;

    // 4. Color Transitions
    const tc = getModeColors(mode, protocolPhase);
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

// ── Main 3D Canvas ────────────────────────────────────────────────────────────
export default function BlobScene() {
  const mode          = useStore((s) => s.mode);
  const protocolPhase = useStore((s) => s.protocolPhase);

  const cfg = MODES[mode] || MODES.deep;
  const isWarmup = mode === 'deep' && protocolPhase === 'warmup';
  const glowColor = isWarmup
    ? 'rgba(255, 255, 255, 0.6)'
    : `hsla(${cfg.h}, ${cfg.s}%, ${cfg.lb}%, 0.45)`;

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

        <BlobMesh />
      </Canvas>
    </div>
  );
}
