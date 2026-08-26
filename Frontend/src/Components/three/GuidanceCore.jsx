import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

function Core() {
  const meshRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#D4AF67'),
    metalness: 0.7,
    roughness: 0.2,
    envMapIntensity: 1.2,
  }), []);

  const silverMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#D9D9D6'),
    metalness: 0.6,
    roughness: 0.3,
    envMapIntensity: 1.0,
  }), []);

  const ringMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#BFC1C4'),
    metalness: 0.5,
    roughness: 0.4,
    envMapIntensity: 0.8,
    transparent: true,
    opacity: 0.7,
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15 + mouse.current.x * 0.15;
      meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.1 + mouse.current.y * 0.1;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.25;
      ring1Ref.current.rotation.z = t * 0.08;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = t * 0.2;
      ring2Ref.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.15) * 0.1;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = t * 0.18;
      ring3Ref.current.rotation.y = -Math.PI / 4 + Math.cos(t * 0.12) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={meshRef} material={goldMaterial}>
        <icosahedronGeometry args={[0.9, 1]} />
      </mesh>
      <mesh ref={ring1Ref} material={ringMaterial}>
        <torusGeometry args={[1.4, 0.015, 16, 64]} />
      </mesh>
      <mesh ref={ring2Ref} material={ringMaterial}>
        <torusGeometry args={[1.6, 0.012, 16, 64]} />
      </mesh>
      <mesh ref={ring3Ref} material={silverMaterial}>
        <torusGeometry args={[1.8, 0.01, 16, 64]} />
      </mesh>
    </Float>
  );
}

export default function GuidanceCore({ size = 400, className = '', style = {} }) {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (prefersReduced) {
    return (
      <div className={className} style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="30" fill="none" stroke="#D4AF67" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="8" fill="#D4AF67" />
        </svg>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: size, height: size, ...style }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#FFFFFF" />
        <directionalLight position={[-3, 2, 4]} intensity={0.3} color="#D4AF67" />
        <pointLight position={[0, 0, 3]} intensity={0.2} color="#E5C98A" />
        <Core />
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}
