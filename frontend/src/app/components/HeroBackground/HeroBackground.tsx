'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import styles from './HeroBackground.module.scss';

function RotatingIcosahedron() {
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.08;
    ref.current.rotation.y += delta * 0.12;
  });

  return (
    <mesh ref={ref} position={[-1.5, 0.3, 0]}>
      <icosahedronGeometry args={[1.6, 1]} />
      <meshBasicMaterial color="#b8a400" wireframe opacity={0.15} transparent />
    </mesh>
  );
}

function RotatingTorusKnot() {
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x -= delta * 0.06;
    ref.current.rotation.y += delta * 0.1;
  });

  return (
    <mesh ref={ref} position={[2, -0.2, 0]}>
      <torusKnotGeometry args={[1, 0.3, 80, 12]} />
      <meshBasicMaterial color="#b8a400" wireframe opacity={0.15} transparent />
    </mesh>
  );
}

export function HeroBackground() {
  return (
    <div className={styles.container} aria-hidden="true">
      <Canvas
        gl={{ alpha: true, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 50 }}
      >
        <RotatingIcosahedron />
        <RotatingTorusKnot />
      </Canvas>
    </div>
  );
}
