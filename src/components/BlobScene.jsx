import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { blobVert } from '../shaders/blob.vert';
import { blobFrag } from '../shaders/blob.frag';
import { useStore, MODES } from '../store';
import IceMeltAnimation from './IceMeltAnimation';


// ── Colour helpers ────────────────────────────────────────────────────────────
function modeColors(mode) {
  const { h, s, lb } = MODES[mode];
  const hsl = (l) => new THREE.Color(`hsl(${h},${s}%,${l}%)`);
  return {
    colorA:    hsl(lb - 18),
    colorB:    hsl(lb + 8),
    darkColor: new THREE.Color('#0b0d18'),
    rimColor:  hsl(lb + 5),
  };
}

// ── 1. Blob Mesh ──────────────────────────────────────────────────────────────
function BlobMesh() {
  const mode    = useStore(s => s.mode);
  const elapsed = useStore(s => s.elapsed);
  const dur     = useStore(s => s.durations[s.mode]);

  const matRef = useRef();
  const progress = Math.min(1, Math.max(0, elapsed / Math.max(dur, 1)));

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
    if (!matRef.current) return;
    const u = matRef.current.uniforms;
    u.u_time.value = clock.getElapsedTime();

    currentFill.current = THREE.MathUtils.lerp(currentFill.current, progress, 0.035);
    u.u_fill.value = currentFill.current;

    const tc = modeColors(mode);
    u.u_colorA.value.lerp(tc.colorA, 0.04);
    u.u_colorB.value.lerp(tc.colorB, 0.04);
    u.u_darkColor.value.lerp(tc.darkColor, 0.04);
    u.u_rimColor.value.lerp(tc.rimColor, 0.04);
  });

  return (
    <mesh>
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

// ── 2. Neon Torus Mesh (Unlocked at 3-day streak) ────────────────────────────
function NeonTorusMesh() {
  const meshRef = useRef();
  const mode    = useStore(s => s.mode);
  const { h }   = MODES[mode];
  const color   = useMemo(() => new THREE.Color(`hsl(${h}, 90%, 65%)`), [h]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.4;
    meshRef.current.rotation.y = t * 0.6;
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[0.9, 0.28, 32, 100]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        wireframe={true}
        roughness={0.2}
      />
    </mesh>
  );
}

// ── 3. Cosmic Orb Mesh (Unlocked at 7-day streak) ────────────────────────────
function CosmicOrbMesh() {
  const pointsRef = useRef();
  const mode      = useStore(s => s.mode);
  const { h }     = MODES[mode];
  const color     = useMemo(() => new THREE.Color(`hsl(${h}, 95%, 70%)`), [h]);

  const [positions] = useMemo(() => {
    const count = 1200;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 0.95 + (Math.random() - 0.5) * 0.2;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return [pos];
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.2;
    pointsRef.current.rotation.z = t * 0.15;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={color}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ── Main exported scene ───────────────────────────────────────────────────────
export default function BlobScene() {
  const mode               = useStore(s => s.mode);
  const selectedVisualizer = useStore(s => s.selectedVisualizer);
  const { h, s, lb }       = MODES[mode];
  const glowColor          = `hsla(${h}, ${s}%, ${lb}%, 0.45)`;

  // Blank template -> NO visualizer canvas
  if (selectedVisualizer === 'blank') {
    return null;
  }

  // Ice Melt -> HTML5 Canvas visualizer (no WebGL needed)
  if (selectedVisualizer === 'ice_melt') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IceMeltAnimation />
      </div>
    );
  }

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

        {selectedVisualizer === 'neon_ring' ? (
          <NeonTorusMesh />
        ) : selectedVisualizer === 'cosmic_orb' ? (
          <CosmicOrbMesh />
        ) : (
          <BlobMesh />
        )}
      </Canvas>
    </div>
  );
}
