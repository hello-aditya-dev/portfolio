'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
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
  uniform float uScale;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vFresnel;
  varying float vRingPos;

  ${noiseGLSL}

  void main() {
    vUv = uv;
    vRingPos = uv.x;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;

    float ring = uv.x;        // 0 = tail, 1 = head
    float around = uv.y;      // 0-1 around the circumference

    // VERY solid body profile — nearly uniform thickness with minimal taper
    float bodyRadius = sin(ring * 3.14159);
    bodyRadius = pow(bodyRadius, 0.25); // extremely uniform — almost a tube

    // Ring segment bumps — Dune-style crystalline armor plates (sharper, more defined)
    float seg1 = sin(ring * 120.0) * 0.03 * bodyRadius;
    float seg2 = sin(ring * 180.0 + 1.5) * 0.015 * bodyRadius;
    float segments = seg1 + seg2;

    // Very smooth, subtle undulation — barely-there for maximum solidity
    float wave1 = sin(ring * 6.28318 * 1.2 - uTime * uWormSpeed) * 0.18 * bodyRadius;
    float wave2 = sin(ring * 6.28318 * 2.0 - uTime * uWormSpeed * 1.1) * 0.08 * bodyRadius;
    float wave3 = sin(ring * 6.28318 * 0.6 - uTime * uWormSpeed * 0.5 + 2.0) * 0.25 * bodyRadius;

    // Apply radius to ring position
    float angle = around * 6.28318;
    float px = cos(angle) * bodyRadius;
    float py = sin(angle) * bodyRadius;

    // Add segment bumps radially
    float bumpDir = 1.0 + segments;
    px *= bumpDir;
    py *= bumpDir;

    // The worm travels in a sinusoidal path across the screen
    float pathX = (ring - 0.5) * 24.0;
    float pathY = wave1 + wave2 * 0.4;
    float pathZ = wave3 + sin(ring * 2.5 - uTime * uWormSpeed * 0.35) * 0.25;

    // Mouth opening at the head — wider, more menacing
    float mouthOpen = 0.0;
    if (ring > 0.91) {
      mouthOpen = (ring - 0.91) / 0.09;
      float innerRadius = bodyRadius * (1.0 - mouthOpen * 0.5);
      px = cos(angle) * innerRadius;
      py = sin(angle) * innerRadius;
      float jawSplit = sin(angle) * mouthOpen * 0.4 * bodyRadius;
      py += jawSplit;
    }

    // Tail taper — smoother, more gradual
    if (ring < 0.1) {
      float tailTaper = ring / 0.1;
      tailTaper = tailTaper * tailTaper * (3.0 - 2.0 * tailTaper); // smoothstep
      px *= tailTaper;
      py *= tailTaper;
    }

    pos = vec3(pathX + px, pathY + py, pathZ);

    // Extremely subtle per-vertex noise for organic feel without breaking solidity
    float vertNoise = snoise(vec3(ring * 3.0, around * 1.5, uTime * 1.0)) * 0.01 * bodyRadius;
    pos += normalize(vec3(px, py, 0.001)) * vertNoise;

    // Apply scale
    pos *= uScale;

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
  varying float vRingPos;

  void main() {
    float ring = vRingPos;
    float around = vUv.y;

    // Dune-accurate color palette — deep earthy sand tones
    vec3 deepDark = vec3(0.08, 0.05, 0.02);      // dark interior — slightly warmer
    vec3 baseSand = vec3(0.55, 0.38, 0.18);       // warm desert sand
    vec3 lightSand = vec3(0.82, 0.65, 0.38);      // sunlit sand
    vec3 crystalBlue = vec3(0.1, 0.18, 0.32);     // Dune blue crystal
    vec3 mouthGlow = vec3(0.9, 0.4, 0.1);         // hot orange mouth
    vec3 armorHighlight = vec3(0.7, 0.52, 0.28);  // armor plate highlight
    vec3 ridgeGold = vec3(0.85, 0.7, 0.4);        // golden ridge highlights

    // Solid body coloring — very consistent
    float bodyColor = sin(ring * 3.14159);
    vec3 color = mix(deepDark * 1.5, baseSand, pow(bodyColor, 0.25));

    // Segment ring pattern — pronounced, Dune-like armor plates
    float ringPattern = sin(ring * 120.0) * 0.5 + 0.5;
    float ringPattern2 = sin(ring * 180.0 + 1.5) * 0.5 + 0.5;
    float ringGroove = smoothstep(0.45, 0.5, ringPattern) * smoothstep(0.55, 0.5, ringPattern);
    color = mix(color, armorHighlight, ringPattern * 0.14 + ringPattern2 * 0.07);
    // Dark groove between plates
    color = mix(color, color * 0.65, ringGroove * 0.25);

    // Crystal/blue accent bands — Dune-style
    float crystalBands = smoothstep(0.47, 0.5, fract(ring * 30.0)) * smoothstep(0.53, 0.5, fract(ring * 30.0));
    color = mix(color, crystalBlue, crystalBands * 0.2);

    // Belly shading — softer transition
    float belly = smoothstep(0.25, 0.65, sin(around * 6.28318));
    color = mix(color * 0.5, color, belly);

    // Top ridge armor — wider, more defined ridges
    float ridge = pow(max(sin(around * 6.28318), 0.0), 8.0);
    color += ridgeGold * ridge * 0.4;

    // Side armor plate grooves — deeper, more defined
    float groove = pow(abs(cos(around * 6.28318)), 16.0);
    color = mix(color, color * 0.6, groove * 0.2);

    // Longitudinal ridge lines (like Dune worm segments)
    float longRidge1 = smoothstep(0.0, 0.15, abs(around - 0.0)) * smoothstep(0.3, 0.15, abs(around - 0.0));
    float longRidge2 = smoothstep(0.0, 0.15, abs(around - 0.25)) * smoothstep(0.3, 0.15, abs(around - 0.25));
    float longRidge3 = smoothstep(0.0, 0.15, abs(around - 0.5)) * smoothstep(0.3, 0.15, abs(around - 0.5));
    float longRidge4 = smoothstep(0.0, 0.15, abs(around - 0.75)) * smoothstep(0.3, 0.15, abs(around - 0.75));
    float longRidges = longRidge1 + longRidge2 + longRidge3 + longRidge4;
    color += ridgeGold * longRidges * 0.08;

    // Mouth interior glow
    if (ring > 0.87) {
      float mouthFactor = smoothstep(0.87, 1.0, ring);
      color = mix(color, mouthGlow, mouthFactor * 0.9);
      // Teeth-like bright crystal edges — sharper
      float teeth = pow(sin(around * 60.0) * 0.5 + 0.5, 0.8);
      color = mix(color, vec3(0.95, 0.9, 0.7), teeth * mouthFactor * 0.65);
      // Inner mouth darkness
      float innerMouth = sin(around * 6.28318) * 0.5 + 0.5;
      color = mix(color, vec3(0.12, 0.04, 0.02), innerMouth * mouthFactor * 0.5);
    }

    // Fresnel edge glow — subtle
    color += vec3(0.1, 0.18, 0.32) * vFresnel * 0.4;

    // Bioluminescent veins — very subtle
    float veins = sin(ring * 60.0 + around * 18.0) * sin(ring * 30.0 - uTime * 2.0);
    veins = smoothstep(0.8, 0.95, veins);
    color += vec3(0.2, 0.35, 0.6) * veins * 0.06;

    // Strong diffuse lighting for solid, 3D feel
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.6));
    float diff = max(dot(vNormal, lightDir), 0.0);
    color *= 0.55 + diff * 0.55;

    // Fill light from below — warmer
    vec3 fillLight = normalize(vec3(-0.4, -0.6, 0.3));
    float fill = max(dot(vNormal, fillLight), 0.0);
    color += vec3(0.12, 0.08, 0.04) * fill * 0.5;

    // Broad specular for solid surface
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(vNormal, halfDir), 0.0), 20.0);
    color += vec3(1.0, 0.9, 0.7) * spec * 0.4;

    // Second specular for armor plates
    vec3 halfDir2 = normalize(vec3(-0.5, 0.8, -0.3) + viewDir);
    float spec2 = pow(max(dot(vNormal, halfDir2), 0.0), 36.0);
    color += vec3(0.8, 0.65, 0.4) * spec2 * 0.2;

    // Third specular — rim light
    vec3 halfDir3 = normalize(vec3(0.0, 0.3, -1.0) + viewDir);
    float spec3 = pow(max(dot(vNormal, halfDir3), 0.0), 48.0);
    color += vec3(0.15, 0.22, 0.35) * spec3 * 0.3;

    // Subtle shimmer on armor
    float shimmer = sin(ring * 300.0 + uTime * 3.0) * 0.015;
    color += shimmer;

    // Ensure minimum brightness
    color = max(color, vec3(0.04, 0.03, 0.015));

    gl_FragColor = vec4(color, 1.0);
  }
`;

/* ──────────────── ENHANCED SAND DUST PARTICLES ──────────────── */
function SandParticles({ wormScale }: { wormScale: number }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 1200; // Doubled for denser, richer effect

  const [positions, velocities, sizes, opacities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const op = new Float32Array(count);
    const col = new Float32Array(count * 3); // RGB per particle

    // Sand color palette
    const sandColors = [
      [0.85, 0.65, 0.35],  // bright sand
      [0.7, 0.5, 0.25],   // mid sand
      [0.6, 0.42, 0.2],   // warm sand
      [0.5, 0.35, 0.18],  // deep sand
      [0.9, 0.75, 0.45],  // golden sand
      [0.4, 0.28, 0.15],  // dark sand
    ];

    for (let i = 0; i < count; i++) {
      // Distribute in a wider, more organic pattern following worm path
      const spreadX = 35;
      const spreadY = 10;
      const spreadZ = 10;
      pos[i * 3] = (Math.random() - 0.5) * spreadX;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spreadY;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;

      // Velocities — more varied, organic
      vel[i * 3] = (Math.random() - 0.5) * 0.006;
      vel[i * 3 + 1] = Math.random() * 0.003 + 0.0005;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.006;

      // Varied sizes — from fine dust to visible grains
      sz[i] = Math.random() * 0.08 + 0.01;

      // Varied opacities
      op[i] = Math.random() * 0.6 + 0.15;

      // Assign sand color
      const c = sandColors[Math.floor(Math.random() * sandColors.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    return [pos, vel, sz, op, col];
  }, []);

  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aOpacity;
        attribute vec3 aColor;
        varying float vOpacity;
        varying float vDist;
        varying vec3 vColor;
        void main() {
          vOpacity = aOpacity;
          vColor = aColor;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vDist = -mvPos.z;
          // Soft size falloff with distance
          gl_PointSize = aSize * (250.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 0.5, 12.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        varying float vDist;
        varying vec3 vColor;
        void main() {
          // Soft circular particle with glow
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          // Soft edge + bright core
          float alpha = smoothstep(0.5, 0.2, d) * vOpacity;
          float core = smoothstep(0.3, 0.0, d);
          vec3 finalColor = mix(vColor, vColor * 1.4, core * 0.5);
          // Fade with distance
          alpha *= smoothstep(30.0, 10.0, vDist);
          // Near-camera fade to avoid popping
          alpha *= smoothstep(1.0, 3.0, vDist);
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    particleMaterial.uniforms.uTime.value = time;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Organic drift — follows worm motion pattern
      posArr[i3] += velocities[i3] + Math.sin(time * 0.4 + i * 0.12) * 0.0015;
      posArr[i3 + 1] += velocities[i3 + 1] + Math.sin(time * 0.6 + i * 0.08) * 0.0005;
      posArr[i3 + 2] += velocities[i3 + 2] + Math.cos(time * 0.35 + i * 0.2) * 0.001;

      // Subtle turbulence
      posArr[i3] += Math.sin(time * 0.25 + posArr[i3 + 1] * 0.3) * 0.0008;
      posArr[i3 + 2] += Math.cos(time * 0.2 + posArr[i3] * 0.2) * 0.0005;

      // Gentle swirling motion (desert wind)
      posArr[i3] += Math.cos(time * 0.15 + i * 0.01) * 0.0003;
      posArr[i3 + 2] += Math.sin(time * 0.15 + i * 0.01) * 0.0003;

      // Reset if out of bounds
      if (posArr[i3 + 1] > 6) {
        posArr[i3] = (Math.random() - 0.5) * 35;
        posArr[i3 + 1] = -5;
        posArr[i3 + 2] = (Math.random() - 0.5) * 10;
      }
      if (Math.abs(posArr[i3]) > 18) {
        posArr[i3] = (Math.random() - 0.5) * 35;
        posArr[i3 + 1] = (Math.random() - 0.5) * 10;
        posArr[i3 + 2] = (Math.random() - 0.5) * 10;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aOpacity" count={count} array={opacities} itemSize={1} />
        <bufferAttribute attach="attributes-aColor" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <primitive object={particleMaterial} />
    </points>
  );
}

/* ──────────────── ENHANCED SAND TRAIL ──────────────── */
function SandTrail() {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 400; // More trail particles

  const [positions, trailSizes, trailOpacities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const op = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      pos[i * 3] = (t - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.0 - 0.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
      // Larger near head, smaller at tail
      sz[i] = Math.max(0.5, (1.0 - t) * 4.0 + Math.random() * 1.5);
      op[i] = (1.0 - t * 0.7) * (Math.random() * 0.3 + 0.2);
    }
    return [pos, sz, op];
  }, []);

  const trailMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        attribute float aSize;
        attribute float aOpacity;
        varying float vAlpha;
        varying float vDist;
        void main() {
          vec3 pos = position;
          pos.y -= 0.6;
          pos.y += sin(pos.x * 0.4 + uTime * 0.7) * 0.15;
          pos.z += cos(pos.x * 0.25 + uTime * 0.4) * 0.12;
          vAlpha = smoothstep(-12.0, 0.0, pos.x) * smoothstep(12.0, 0.0, pos.x) * aOpacity;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          vDist = -mvPos.z;
          gl_PointSize = aSize * (180.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 0.5, 10.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying float vDist;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d) * vAlpha;
          vec3 col = mix(vec3(0.6, 0.42, 0.2), vec3(0.85, 0.68, 0.4), smoothstep(15.0, 5.0, vDist));
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    trailMaterial.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={trailSizes} itemSize={1} />
        <bufferAttribute attach="attributes-aOpacity" count={count} array={trailOpacities} itemSize={1} />
      </bufferGeometry>
      <primitive object={trailMaterial} />
    </points>
  );
}

/* ──────────────── AMBIENT SAND CLOUD ──────────────── */
function AmbientSandCloud() {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 300;

  const [positions, cloudSizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Large, diffuse cloud — very spread out
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 3;
      sz[i] = Math.random() * 0.12 + 0.04;
    }
    return [pos, sz];
  }, []);

  const cloudMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        attribute float aSize;
        varying float vAlpha;
        void main() {
          vec3 pos = position;
          pos.x += sin(uTime * 0.1 + position.y * 0.05) * 0.5;
          pos.y += cos(uTime * 0.08 + position.x * 0.03) * 0.3;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          float dist = -mvPos.z;
          vAlpha = smoothstep(35.0, 15.0, dist) * smoothstep(2.0, 6.0, dist) * 0.15;
          gl_PointSize = aSize * (300.0 / -mvPos.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 20.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
          vec3 col = vec3(0.65, 0.5, 0.3);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame((state) => {
    cloudMaterial.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={cloudSizes} itemSize={1} />
      </bufferGeometry>
      <primitive object={cloudMaterial} />
    </points>
  );
}

/* ──────────────── SANDWORM MESH (with grow animation) ──────────────── */
function SandwormMesh() {
  const groupRef = useRef<THREE.Group>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const scaleRef = useRef(0.05); // start very small

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWormSpeed: { value: 1.2 },
    uScale: { value: 0.05 },
  }), []);

  useEffect(() => {
    // Dramatic grow animation: tiny → full size over ~3 seconds
    const startTime = performance.now();
    const duration = 3000; // ms — longer for more dramatic reveal
    const targetScale = 1.35; // slightly bigger than before

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // Custom ease: slow start, explosive middle, settle at end
      let ease: number;
      if (progress < 0.3) {
        // Slow emergence from sand
        const t = progress / 0.3;
        ease = t * t * 0.15; // 0 → 0.15
      } else if (progress < 0.7) {
        // Explosive growth
        const t = (progress - 0.3) / 0.4;
        ease = 0.15 + t * t * 0.85; // 0.15 → 1.0
      } else {
        // Settle with slight overshoot
        const t = (progress - 0.7) / 0.3;
        ease = 1.0 + Math.sin(t * Math.PI) * 0.05; // 1.0 → 1.05 → 1.0
      }

      const currentScale = 0.05 + (targetScale - 0.05) * ease;

      scaleRef.current = currentScale;
      if (materialRef.current) {
        materialRef.current.uniforms.uScale.value = currentScale;
      }
      if (groupRef.current) {
        groupRef.current.scale.setScalar(currentScale);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    // Delay start to sync with preloader finish
    const timeout = setTimeout(() => requestAnimationFrame(animate), 1800);
    return () => clearTimeout(timeout);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
    }
    if (groupRef.current) {
      // Very subtle bob — barely noticeable for solid feel
      groupRef.current.position.y = Math.sin(t * 0.25) * 0.08;
      // Extremely slow rotation
      groupRef.current.rotation.y = Math.sin(t * 0.08) * 0.1;
      groupRef.current.rotation.x = Math.sin(t * 0.06) * 0.03;
    }
  });

  return (
    <group ref={groupRef} scale={0.05}>
      <mesh>
        <cylinderGeometry args={[1, 1, 24, 56, 350, true]} />
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

/* ──────────────── SCENE CONTROLLER ──────────────── */
function SceneController({ onScaleUpdate }: { onScaleUpdate: (s: number) => void }) {
  const frameCount = useRef(0);
  useFrame(() => {
    frameCount.current++;
    const elapsed = performance.now() - 1800;
    const duration = 3000;
    const progress = Math.min(Math.max(elapsed / duration, 0), 1);

    let ease: number;
    if (progress < 0.3) {
      const t = progress / 0.3;
      ease = t * t * 0.15;
    } else if (progress < 0.7) {
      const t = (progress - 0.3) / 0.4;
      ease = 0.15 + t * t * 0.85;
    } else {
      const t = (progress - 0.7) / 0.3;
      ease = 1.0 + Math.sin(t * Math.PI) * 0.05;
    }

    const scale = 0.05 + (1.35 - 0.05) * ease;
    if (frameCount.current % 10 === 0) {
      onScaleUpdate(scale);
    }
  });
  return null;
}

/* ──────────────── MAIN HERO SCENE ──────────────── */
export function Scene3D() {
  const [wormScale, setWormScale] = useState(0.05);

  return (
    <Canvas
      camera={{ position: [0, 2.5, 13], fov: 50 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      {/* Fog for depth */}
      <fog attach="fog" args={['#000000', 12, 35]} />

      {/* Desert lighting — warm, dramatic, strong for solid look */}
      <ambientLight intensity={0.4} color="#c4a265" />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffd4a0" />
      <pointLight position={[-4, 2, 4]} intensity={0.8} color="#ff8844" distance={20} />
      <pointLight position={[6, -1, 3]} intensity={0.6} color="#aa6633" distance={16} />
      {/* Rim light from behind for silhouette edge */}
      <pointLight position={[0, 3, -8]} intensity={0.5} color="#88aacc" distance={22} />
      {/* Extra warm fill from front-below */}
      <pointLight position={[0, -3, 8]} intensity={0.3} color="#c49040" distance={18} />

      <SceneController onScaleUpdate={setWormScale} />
      <SandwormMesh />
      <SandTrail />
      <AmbientSandCloud />
      <SandParticles wormScale={wormScale} />
    </Canvas>
  );
}