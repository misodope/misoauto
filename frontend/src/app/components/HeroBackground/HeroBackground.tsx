'use client';

import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { Mesh } from 'three';
import styles from './HeroBackground.module.scss';

const MOBILE_BREAKPOINT = 3.5; // viewport width in world units (~600px)

function RotatingIcosahedron() {
  const ref = useRef<Mesh>(null);
  const { viewport } = useThree();
  const isMobile = viewport.width < MOBILE_BREAKPOINT;

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.08;
    ref.current.rotation.y += delta * 0.12;
  });

  return (
    <mesh
      ref={ref}
      position={isMobile ? [0, 0, 0] : [-1.5, 0.3, 0]}
      scale={isMobile ? 0.9 : 1}
    >
      <icosahedronGeometry args={[1.6, 1]} />
      <meshBasicMaterial color="#b8a400" wireframe opacity={0.15} transparent />
    </mesh>
  );
}

function RotatingTorusKnot() {
  const ref = useRef<Mesh>(null);
  const { viewport } = useThree();
  const isMobile = viewport.width < MOBILE_BREAKPOINT;

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x -= delta * 0.06;
    ref.current.rotation.y += delta * 0.1;
  });

  // Hide on mobile — return null so it doesn't render at all
  if (isMobile) return null;

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
