'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ──────────────── SIMPLE NOISE (shared) ──────────────── */
const noiseGLSL = `
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
`;

/* ──────────────── SANDWORM VERTEX SHADER ──────────────── */
const wormVertexShader = `
  uniform float uTime;
  uniform float uWormSpeed;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vFresnel;

  ${noiseGLSL}

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;

    // Ring segments: the worm body
    float ring = uv.x;        // 0 = tail, 1 = head
    float around = uv.y;      // 0-1 around the circumference

    // Worm body profile: thick in middle, tapered at ends
    float bodyRadius = sin(ring * 3.14159);
    bodyRadius = pow(bodyRadius, 0.6); // more uniform thickness

    // Ring segment bumps (like the Dune worm's crystalline segments)
    float segments = sin(ring * 80.0) * 0.04 * bodyRadius;
    segments += sin(ring * 120.0 + 1.5) * 0.02 * bodyRadius;

    // Undulating wave motion along the body
    float wave1 = sin(ring * 6.28318 * 2.0 - uTime * uWormSpeed) * 0.6 * bodyRadius;
    float wave2 = sin(ring * 6.28318 * 3.5 - uTime * uWormSpeed * 1.3) * 0.3 * bodyRadius;
    float wave3 = sin(ring * 6.28318 * 1.0 - uTime * uWormSpeed * 0.7 + 2.0) * 0.8 * bodyRadius;

    // Apply radius to the ring position
    float angle = around * 6.28318;
    float px = cos(angle) * bodyRadius;
    float py = sin(angle) * bodyRadius;

    // Add segment bumps radially
    float bumpDir = 1.0 + segments;
    px *= bumpDir;
    py *= bumpDir;

    // The worm travels in a large sinusoidal path in XZ
    // ring=0 is tail, ring=1 is head
    float pathX = (ring - 0.5) * 18.0;
    float pathY = wave1 + wave2 * 0.5;
    float pathZ = wave3 + sin(ring * 4.0 - uTime * uWormSpeed * 0.5) * 0.5;

    // Mouth opening at the head
    float mouthOpen = 0.0;
    if (ring > 0.92) {
      mouthOpen = (ring - 0.92) / 0.08;
      float innerRadius = bodyRadius * (1.0 - mouthOpen * 0.6);
      float innerAngle = angle;
      px = cos(innerAngle) * innerRadius;
      py = sin(innerAngle) * innerRadius;
      // Jaw split - upper and lower jaw
      float jawSplit = sin(angle) * mouthOpen * 0.4 * bodyRadius;
      py += jawSplit;
    }

    pos = vec3(pathX + px, pathY + py, pathZ);

    // Slight per-vertex noise for organic feel
    float vertNoise = snoise(vec3(ring * 5.0, around * 3.0, uTime * 2.0)) * 0.06 * bodyRadius;
    pos += normalize(vec3(px, py, 0.0)) * vertNoise;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;

    // Fresnel for edge glow
    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
    vFresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

/* ──────────────── SANDWORM FRAGMENT SHADER ──────────────── */
const wormFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vFresnel;

  void main() {
    float ring = vUv.x;
    float around = vUv.y;

    // Base sand/desert color palette
    vec3 deepDark = vec3(0.04, 0.02, 0.01);    // dark interior
    vec3 baseSand = vec3(0.55, 0.35, 0.15);     // warm sand
    vec3 lightSand = vec3(0.85, 0.65, 0.35);    // bright sand highlight
    vec3 crystalBlue = vec3(0.15, 0.25, 0.4);   // Dune blue crystal accents
    vec3 mouthGlow = vec3(0.9, 0.4, 0.1);       // orange mouth glow

    // Body coloring based on ring position
    float bodyColor = sin(ring * 3.14159);
    vec3 color = mix(deepDark, baseSand, pow(bodyColor, 0.5));

    // Segment ring pattern
    float ringPattern = sin(ring * 80.0) * 0.5 + 0.5;
    color = mix(color, lightSand, ringPattern * 0.15);

    // Crystal/blue accent bands (like Dune worm's blue-ish hue)
    float crystalBands = smoothstep(0.48, 0.5, fract(ring * 20.0)) * smoothstep(0.52, 0.5, fract(ring * 20.0));
    color = mix(color, crystalBlue, crystalBands * 0.3);

    // Belly (bottom of worm = lower half of circumference)
    float belly = smoothstep(0.3, 0.7, sin(around * 6.28318));
    color = mix(color * 0.6, color, belly);

    // Top ridge highlights
    float ridge = pow(max(sin(around * 6.28318), 0.0), 8.0);
    color += lightSand * ridge * 0.3;

    // Mouth interior glow
    if (ring > 0.9) {
      float mouthFactor = (ring - 0.9) / 0.1;
      color = mix(color, mouthGlow, mouthFactor * 0.8);
      // Teeth-like bright edges
      float teeth = sin(around * 40.0) * 0.5 + 0.5;
      color = mix(color, vec3(0.95, 0.9, 0.7), teeth * mouthFactor * 0.5);
    }

    // Fresnel edge glow (subtle blue rim like in the movie)
    color += vec3(0.1, 0.2, 0.35) * vFresnel * 0.6;

    // Pulsing bioluminescent veins
    float veins = sin(ring * 60.0 + around * 20.0) * sin(ring * 30.0 - uTime * 3.0);
    veins = smoothstep(0.7, 0.9, veins);
    color += vec3(0.3, 0.5, 0.8) * veins * 0.15;

    // Simple lighting
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    float diff = max(dot(vNormal, lightDir), 0.0);
    color *= 0.4 + diff * 0.6;

    // Specular highlight
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(vNormal, halfDir), 0.0), 32.0);
    color += vec3(1.0, 0.9, 0.7) * spec * 0.3;

    // Slight shimmer
    float shimmer = sin(ring * 200.0 + uTime * 5.0) * 0.03;
    color += shimmer;

    gl_FragColor = vec4(color, 1.0);
  }
`;

/* ──────────────── SAND DUST PARTICLES ──────────────── */
function SandParticles() {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 300;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = Math.random() * 0.005 + 0.002;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return [pos, vel];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posArr[i3] += velocities[i3] + Math.sin(time + i * 0.1) * 0.003;
      posArr[i3 + 1] += velocities[i3 + 1];
      posArr[i3 + 2] += velocities[i3 + 2] + Math.cos(time * 0.8 + i * 0.2) * 0.002;

      // Reset if out of bounds
      if (posArr[i3 + 1] > 4) {
        posArr[i3] = (Math.random() - 0.5) * 24;
        posArr[i3 + 1] = -3;
        posArr[i3 + 2] = (Math.random() - 0.5) * 6;
      }
      // Wave-like drift following the worm
      posArr[i3] += Math.sin(time * 0.5 + posArr[i3 + 1] * 0.5) * 0.002;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#c4a265"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ──────────────── SANDWORM MESH ──────────────── */
function SandwormMesh() {
  const groupRef = useRef<THREE.Group>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWormSpeed: { value: 1.8 },
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
    }
    if (groupRef.current) {
      // Gentle bob
      groupRef.current.position.y = Math.sin(t * 0.4) * 0.15;
      // Very slow overall rotation so it's seen from different angles
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.2;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <cylinderGeometry args={[1, 1, 18, 32, 200, true]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={wormVertexShader}
          fragmentShader={wormFragmentShader}
          uniforms={uniforms}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ──────────────── MAIN HERO SCENE ──────────────── */
export function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 3, 10], fov: 55 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      {/* Fog for depth */}
      <fog attach="fog" args={['#000000', 8, 25]} />

      {/* Desert-like warm lighting */}
      <ambientLight intensity={0.25} color="#c4a265" />
      <directionalLight position={[5, 8, 5]} intensity={0.8} color="#ffd4a0" />
      <pointLight position={[-3, 2, 4]} intensity={0.6} color="#ff8844" distance={15} />
      <pointLight position={[5, -1, 3]} intensity={0.4} color="#aa6633" distance={12} />

      <SandwormMesh />
      <SandParticles />
    </Canvas>
  );
}