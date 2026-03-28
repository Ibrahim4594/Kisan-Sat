"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);

  // Pakistan approximate coordinates on sphere (lat: 30, lon: 70)
  const pakistanPosition = useMemo(() => {
    const lat = (30 * Math.PI) / 180;
    const lon = ((70 - 90) * Math.PI) / 180;
    const r = 1.02;
    return new THREE.Vector3(
      r * Math.cos(lat) * Math.cos(lon),
      r * Math.sin(lat),
      r * Math.cos(lat) * Math.sin(lon)
    );
  }, []);

  // Generate grid lines for the globe
  const gridGeometry = useMemo(() => {
    const points: number[] = [];
    // Latitude lines
    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lon = 0; lon <= 360; lon += 2) {
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;
        const r = 1.001;
        points.push(
          r * Math.cos(latRad) * Math.cos(lonRad),
          r * Math.sin(latRad),
          r * Math.cos(latRad) * Math.sin(lonRad)
        );
      }
    }
    // Longitude lines
    for (let lon = 0; lon < 360; lon += 20) {
      for (let lat = -90; lat <= 90; lat += 2) {
        const latRad = (lat * Math.PI) / 180;
        const lonRad = (lon * Math.PI) / 180;
        const r = 1.001;
        points.push(
          r * Math.cos(latRad) * Math.cos(lonRad),
          r * Math.sin(latRad),
          r * Math.cos(latRad) * Math.sin(lonRad)
        );
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    return geometry;
  }, []);

  // Satellite orbit particles
  const orbitGeometry = useMemo(() => {
    const points: number[] = [];
    const count = 200;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 1.4 + Math.sin(angle * 3) * 0.05;
      const tilt = 0.3;
      points.push(
        r * Math.cos(angle),
        r * Math.sin(angle) * Math.sin(tilt),
        r * Math.sin(angle) * Math.cos(tilt)
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    return geometry;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.05;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y = t * 0.05;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.08;
      pointsRef.current.rotation.x = t * 0.02;
    }
  });

  return (
    <group>
      {/* Main globe sphere */}
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <meshStandardMaterial
          color="#0a0a0f"
          roughness={0.8}
          metalness={0.2}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Grid wireframe */}
      <points geometry={gridGeometry}>
        <pointsMaterial
          color="#00ff88"
          size={0.008}
          transparent
          opacity={0.15}
          sizeAttenuation
        />
      </points>

      {/* Atmosphere glow */}
      <Sphere ref={glowRef} args={[1.04, 64, 64]}>
        <meshStandardMaterial
          color="#00ff88"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Outer glow */}
      <Sphere args={[1.15, 32, 32]}>
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.015}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Pakistan marker */}
      <mesh position={pakistanPosition}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>

      {/* Pakistan pulse ring */}
      <mesh position={pakistanPosition}>
        <ringGeometry args={[0.03, 0.05, 32]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Satellite orbit */}
      <points ref={pointsRef} geometry={orbitGeometry}>
        <pointsMaterial
          color="#3b82f6"
          size={0.015}
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

export function EarthGlobe({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-3, 2, -3]} intensity={0.3} color="#00ff88" />
        <Globe />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}
