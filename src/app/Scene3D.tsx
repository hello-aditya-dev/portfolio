'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

/* ──────────────── FLAME SHADERS ──────────────── */
const flameVertexShader = `
  uniform float uTime;
  uniform float uDistortion;
  uniform float uSpeed;
  varying vec2 vUv;
  varying float vElevation;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float heightFactor = uv.y;
    float taper = 1.0 - pow(heightFactor, 0.6) * 0.85;
    float noiseFreq = 2.5;
    float noise1 = snoise(vec3(pos.x * noiseFreq, pos.y * noiseFreq * 0.8, uTime * uSpeed)) * uDistortion;
    float noise2 = snoise(vec3(pos.x * noiseFreq * 2.0, pos.y * noiseFreq * 1.5, uTime * uSpeed * 1.3)) * uDistortion * 0.5;
    float swirl = sin(heightFactor * 3.14159 + uTime * uSpeed * 0.5) * 0.15 * heightFactor;
    float displacement = (noise1 + noise2) * taper;
    pos.x += displacement + swirl;
    pos.z += (noise1 * 0.7 + noise2 * 0.3) * taper;
    pos.y += heightFactor * heightFactor * 0.3;
    vElevation = pos.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const flameFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    float h = clamp(vUv.y, 0.0, 1.0);
    float core = smoothstep(0.0, 0.3, h) * (1.0 - smoothstep(0.5, 1.0, h));
    vec3 color = mix(uColor1, uColor2, smoothstep(0.0, 0.5, h));
    color = mix(color, uColor3, smoothstep(0.5, 1.0, h));
    color += vec3(1.0, 0.95, 0.8) * core * 0.4;
    float edgeFade = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 2.0);
    edgeFade *= edgeFade;
    float topFade = 1.0 - smoothstep(0.75, 1.0, h);
    float bottomFade = smoothstep(0.0, 0.1, h);
    float flicker = 0.85 + 0.15 * sin(uTime * 8.0 + vUv.y * 10.0) * sin(uTime * 5.7 + vUv.x * 6.0);
    float alpha = edgeFade * topFade * bottomFade * flicker * 0.9;
    color *= 1.3;
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ──────────────── FLAME MESH ──────────────── */
function FlameMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDistortion: { value: 0.25 },
    uSpeed: { value: 1.5 },
    uColor1: { value: new THREE.Color('#ff4500') },
    uColor2: { value: new THREE.Color('#ff8c00') },
    uColor3: { value: new THREE.Color('#fffae6') },
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.4}>
      <mesh ref={meshRef} scale={2.2}>
        <coneGeometry args={[1, 3, 32, 64, true]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={flameVertexShader}
          fragmentShader={flameFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </Float>
  );
}

/* ──────────────── FLAME PARTICLES ──────────────── */
function FlameParticles() {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 80;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 1] = Math.random() * 4 - 1.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    return pos;
  }, []);

  const speeds = useMemo(() => {
    return Array.from({ length: count }, () => 0.3 + Math.random() * 0.7);
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] += speeds[i] * 0.02;
      if (posArray[i * 3 + 1] > 3) {
        posArray[i * 3 + 1] = -1.5;
        posArray[i * 3] = (Math.random() - 0.5) * 1.0;
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
      }
      posArray[i * 3] += Math.sin(time * 2 + i) * 0.002;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#ff6a00"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ──────────────── MAIN HERO SCENE ──────────────── */
export function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 5], fov: 45 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 2, 3]} intensity={1.5} color="#ff6a00" distance={10} />
      <pointLight position={[0, -1, 2]} intensity={0.5} color="#ff4500" distance={8} />
      <FlameMesh />
      <FlameParticles />
    </Canvas>
  );
}