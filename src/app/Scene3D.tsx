'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════
   GLSL: Shared Simplex 3D Noise
   ═══════════════════════════════════════════════════════════ */
const NOISE_GLSL = `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

/* ═══════════════════════════════════════════════════════════
   SHADER: Accretion Disk
   ═══════════════════════════════════════════════════════════ */
const DISK_VS = `
  uniform float uTime;
  varying vec3 vLocalPos;
  varying float vNormDist;
  ${NOISE_GLSL}
  void main(){
    vLocalPos = position;
    float dist = length(position.xy);
    float innerR = 1.8;
    float outerR = 5.0;
    vNormDist = clamp((dist - innerR) / (outerR - innerR), 0.0, 1.0);

    vec3 pos = position;
    // Subtle thickness via noise — thicker near inner edge
    float thick = 0.12 * (1.0 - vNormDist);
    float n = snoise(vec3(position.x * 4.0, position.y * 4.0, uTime * 0.08));
    pos.z += n * thick;
    // Inner-edge gravitational warping — bend light upward near horizon
    float warp = exp(-vNormDist * 6.0) * 0.25;
    pos.z += warp * sin(atan(position.y, position.x) * 2.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const DISK_FS = `
  uniform float uTime;
  varying vec3 vLocalPos;
  varying float vNormDist;
  ${NOISE_GLSL}
  void main(){
    float dist = length(vLocalPos.xy);
    float angle = atan(vLocalPos.y, vLocalPos.x);
    float t = vNormDist;

    // Radial brightness falloff (brighter near center)
    float radialFalloff = exp(-t * 2.8);

    // Spiral arm structure
    float spiral1 = sin(angle * 2.0 - dist * 1.8 + uTime * 0.35) * 0.2 + 0.8;
    float spiral2 = sin(angle * 3.5 + dist * 1.0 - uTime * 0.25) * 0.12 + 0.88;
    float spirals = spiral1 * spiral2;

    // Turbulence
    float turb = snoise(vec3(angle * 1.5, dist * 0.7, uTime * 0.12)) * 0.3 + 0.7;

    // Doppler beaming — approaching side brighter
    float doppler = 0.65 + 0.35 * sin(angle - uTime * 0.2);

    // Combine
    float brightness = radialFalloff * spirals * turb * doppler;
    brightness = pow(brightness, 1.4);

    // Color: pure white → light gray → dark gray → near-black
    vec3 c1 = vec3(1.0, 1.0, 1.0);
    vec3 c2 = vec3(0.78, 0.78, 0.78);
    vec3 c3 = vec3(0.35, 0.35, 0.35);
    vec3 c4 = vec3(0.06, 0.06, 0.06);

    vec3 color;
    if(t < 0.15)      color = mix(c1, c2, t / 0.15);
    else if(t < 0.5)  color = mix(c2, c3, (t - 0.15) / 0.35);
    else               color = mix(c3, c4, (t - 0.5)  / 0.5);

    color *= brightness;

    // Alpha
    float alpha = brightness * (1.0 - smoothstep(0.7, 1.0, t));
    alpha = clamp(alpha, 0.0, 0.92);

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════
   SHADER: Photon Ring
   ═══════════════════════════════════════════════════════════ */
const PHOTON_VS = `
  varying vec3 vPos;
  void main(){
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PHOTON_FS = `
  uniform float uTime;
  varying vec3 vPos;
  void main(){
    float angle = atan(vPos.z, vPos.x);
    float b = 0.82 + 0.18 * sin(angle * 10.0 + uTime * 2.0);
    vec3 color = vec3(1.0, 1.0, 1.0) * b * 2.2;
    gl_FragColor = vec4(color, b * 0.95);
  }
`;

/* ═══════════════════════════════════════════════════════════
   SHADER: Event Horizon Glow (fresnel, BackSide)
   ═══════════════════════════════════════════════════════════ */
const GLOW_VS = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main(){
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const GLOW_FS = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main(){
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 4.0);
    vec3 color = vec3(0.85, 0.88, 0.95) * fresnel * 1.4;
    float alpha = fresnel * 0.55;
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════
   SHADER: Lensed Disk (gravitational lensing arcs)
   ═══════════════════════════════════════════════════════════ */
const LENSED_VS = `
  uniform float uTime;
  varying vec3 vLocalPos;
  varying float vNormDist;
  ${NOISE_GLSL}
  void main(){
    vLocalPos = position;
    float dist = length(position.xy);
    float innerR = 1.6;
    float outerR = 3.8;
    vNormDist = clamp((dist - innerR) / (outerR - innerR), 0.0, 1.0);
    vec3 pos = position;
    float thick = 0.06 * (1.0 - vNormDist);
    float n = snoise(vec3(position.x * 3.0, position.y * 3.0, uTime * 0.1));
    pos.z += n * thick;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const LENSED_FS = `
  uniform float uTime;
  varying vec3 vLocalPos;
  varying float vNormDist;
  ${NOISE_GLSL}
  void main(){
    float dist = length(vLocalPos.xy);
    float angle = atan(vLocalPos.y, vLocalPos.x);
    float t = vNormDist;

    // Only show top/bottom arcs — fade at the horizontal midline
    float vertFade = smoothstep(0.0, 0.35, abs(vLocalPos.y) / 3.8);

    float innerGlow = exp(-t * 3.5);
    float turb = snoise(vec3(angle * 2.0, dist * 1.2, uTime * 0.15)) * 0.25 + 0.75;
    float spiral = sin(angle * 3.0 - dist * 2.0 + uTime * 0.4) * 0.12 + 0.88;

    float brightness = innerGlow * turb * spiral * 0.55 * vertFade;
    brightness = pow(brightness, 1.5);

    vec3 c1 = vec3(1.0, 1.0, 1.0);
    vec3 c2 = vec3(0.65, 0.65, 0.65);
    vec3 c3 = vec3(0.12, 0.12, 0.12);

    vec3 color;
    if(t < 0.3) color = mix(c1, c2, t / 0.3);
    else         color = mix(c2, c3, (t - 0.3) / 0.7);
    color *= brightness;

    float alpha = brightness * (1.0 - smoothstep(0.6, 1.0, t)) * 0.75;
    alpha = clamp(alpha, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════
   SHADER: Disk Particles (spiraling inward)
   ═══════════════════════════════════════════════════════════ */
const PARTICLE_VS = `
  uniform float uTime;
  attribute float aRadius;
  attribute float aAngle;
  attribute float aSpeed;
  attribute float aOffset;
  attribute float aSize;
  varying float vBrightness;
  varying float vTemp;

  void main(){
    float innerR = 1.8;
    float totalDist = aRadius - innerR;
    float journeyTime = max(totalDist / aSpeed, 0.01);
    float progress = mod(uTime * aSpeed + aOffset * journeyTime, totalDist) / totalDist;

    float currentRadius = aRadius - progress * totalDist;
    float currentAngle = aAngle + progress * 14.0;

    vec3 pos = vec3(cos(currentAngle) * currentRadius, sin(currentAngle) * currentRadius, 0.0);

    float normDist = (currentRadius - innerR) / 3.2;
    normDist = clamp(normDist, 0.0, 1.0);
    vBrightness = (1.0 - normDist) * 0.7 + 0.05;
    vTemp = 1.0 - normDist;

    gl_PointSize = aSize * (0.6 + (1.0 - normDist) * 1.8);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const PARTICLE_FS = `
  varying float vBrightness;
  varying float vTemp;
  void main(){
    float dist = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
    alpha *= vBrightness;
    vec3 bright = vec3(1.0, 1.0, 1.0);
    vec3 dim = vec3(0.7, 0.7, 0.7);
    vec3 color = mix(dim, bright, vTemp) * vBrightness * 1.4;
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════
   SHADER: Jet Particles (polar jets)
   ═══════════════════════════════════════════════════════════ */
const JET_VS = `
  uniform float uTime;
  attribute float aJetSpeed;
  attribute float aJetOffset;
  attribute float aJetSpread;
  attribute float aJetSize;
  attribute float aJetDir;   // 1.0 = up, -1.0 = down
  varying float vJetAlpha;
  varying float vJetDist;

  void main(){
    float maxDist = 7.0;
    float progress = mod(uTime * aJetSpeed + aJetOffset, maxDist) / maxDist;

    float dist = progress * maxDist;
    float spread = aJetSpread * progress * 0.4;
    float wobble = sin(uTime * 2.0 + aJetOffset * 10.0) * 0.15 * progress;

    vec3 pos = vec3(
      wobble + sin(aJetOffset * 6.28) * spread,
      aJetDir * dist,
      cos(aJetOffset * 6.28) * spread
    );

    vJetAlpha = (1.0 - progress) * (1.0 - progress) * 0.45;
    vJetDist = progress;

    gl_PointSize = aJetSize * (1.0 - progress * 0.6);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const JET_FS = `
  varying float vJetAlpha;
  varying float vJetDist;
  void main(){
    float dist = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
    alpha *= vJetAlpha;
    vec3 color = mix(vec3(0.9, 0.9, 0.9), vec3(1.0, 1.0, 1.0), 1.0 - vJetDist);
    gl_FragColor = vec4(color * 1.2, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════
   SHADER: Background Stars
   ═══════════════════════════════════════════════════════════ */
const STAR_VS = `
  attribute float aStarSize;
  attribute float aStarBright;
  attribute float aStarPhase;
  uniform float uTime;
  varying float vStarBright;
  void main(){
    float twinkle = 0.7 + 0.3 * sin(uTime * (1.5 + aStarBright) + aStarPhase);
    vStarBright = aStarBright * twinkle;
    gl_PointSize = aStarSize * (0.8 + 0.2 * twinkle);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const STAR_FS = `
  varying float vStarBright;
  void main(){
    float dist = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
    vec3 color = vec3(0.85, 0.88, 1.0) * vStarBright;
    gl_FragColor = vec4(color, alpha * vStarBright);
  }
`;

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

/* ── Event Horizon: pure black sphere ── */
function EventHorizon() {
  return (
    <mesh>
      <sphereGeometry args={[1.3, 64, 64]} />
      <meshBasicMaterial color={0x000000} />
    </mesh>
  );
}

/* ── Glow Sphere: fresnel edge glow (BackSide, additive) ── */
function GlowSphere() {
  const uniforms = useMemo(() => ({}), []);
  return (
    <mesh scale={[1.6, 1.6, 1.6]}>
      <sphereGeometry args={[1.3, 48, 48]} />
      <shaderMaterial
        vertexShader={GLOW_VS}
        fragmentShader={GLOW_FS}
        uniforms={uniforms}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ── Photon Ring: thin bright ring at event horizon edge ── */
function PhotonRing() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, delta) => { uniforms.uTime.value += delta; });

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.55, 0.028, 16, 256]} />
      <shaderMaterial
        vertexShader={PHOTON_VS}
        fragmentShader={PHOTON_FS}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ── Accretion Disk: main tilted ring with turbulence ── */
function AccretionDisk() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, delta) => { uniforms.uTime.value += delta; });

  return (
    <mesh rotation={[0.7, 0, 0]}>
      <ringGeometry args={[1.8, 5.0, 256, 80]} />
      <shaderMaterial
        vertexShader={DISK_VS}
        fragmentShader={DISK_FS}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ── Lensed Disk: perpendicular ring for gravitational lensing arcs ── */
function LensedDisk() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, delta) => { uniforms.uTime.value += delta; });

  return (
    <mesh rotation={[0.7 + Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.6, 3.8, 256, 48]} />
      <shaderMaterial
        vertexShader={LENSED_VS}
        fragmentShader={LENSED_FS}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ── Disk Particles: 2500 points spiraling inward ── */
function DiskParticles() {
  const COUNT = 2500;
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, uniforms } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // Dummy positions (shader computes actual positions)
    const pos = new Float32Array(COUNT * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const aRadius  = new Float32Array(COUNT);
    const aAngle   = new Float32Array(COUNT);
    const aSpeed   = new Float32Array(COUNT);
    const aOffset  = new Float32Array(COUNT);
    const aSize    = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      aRadius[i]  = 1.8 + Math.random() * 3.2;
      aAngle[i]   = Math.random() * Math.PI * 2;
      aSpeed[i]   = 0.4 + Math.random() * 1.2;
      aOffset[i]  = Math.random();
      aSize[i]    = 1.0 + Math.random() * 3.5;
    }

    geo.setAttribute('aRadius',  new THREE.BufferAttribute(aRadius, 1));
    geo.setAttribute('aAngle',   new THREE.BufferAttribute(aAngle, 1));
    geo.setAttribute('aSpeed',   new THREE.BufferAttribute(aSpeed, 1));
    geo.setAttribute('aOffset',  new THREE.BufferAttribute(aOffset, 1));
    geo.setAttribute('aSize',    new THREE.BufferAttribute(aSize, 1));

    return { geometry: geo, uniforms: { uTime: { value: 0 } } };
  }, []);

  useFrame((_, delta) => { uniforms.uTime.value += delta; });

  useEffect(() => {
    if (pointsRef.current) pointsRef.current.frustumCulled = false;
  }, []);

  return (
    <points ref={pointsRef} geometry={geometry} rotation={[0.7, 0, 0]}>
      <shaderMaterial
        vertexShader={PARTICLE_VS}
        fragmentShader={PARTICLE_FS}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── Jet Particles: polar relativistic jets ── */
function JetParticles() {
  const COUNT = 500;
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, uniforms } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const aJetSpeed  = new Float32Array(COUNT);
    const aJetOffset = new Float32Array(COUNT);
    const aJetSpread = new Float32Array(COUNT);
    const aJetSize   = new Float32Array(COUNT);
    const aJetDir    = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      aJetSpeed[i]  = 1.5 + Math.random() * 2.5;
      aJetOffset[i] = Math.random() * 7.0;
      aJetSpread[i] = 0.3 + Math.random() * 1.2;
      aJetSize[i]   = 1.0 + Math.random() * 2.5;
      aJetDir[i]    = i < COUNT / 2 ? 1.0 : -1.0;
    }

    geo.setAttribute('aJetSpeed',  new THREE.BufferAttribute(aJetSpeed, 1));
    geo.setAttribute('aJetOffset', new THREE.BufferAttribute(aJetOffset, 1));
    geo.setAttribute('aJetSpread', new THREE.BufferAttribute(aJetSpread, 1));
    geo.setAttribute('aJetSize',   new THREE.BufferAttribute(aJetSize, 1));
    geo.setAttribute('aJetDir',    new THREE.BufferAttribute(aJetDir, 1));

    return { geometry: geo, uniforms: { uTime: { value: 0 } } };
  }, []);

  useFrame((_, delta) => { uniforms.uTime.value += delta; });

  useEffect(() => {
    if (pointsRef.current) pointsRef.current.frustumCulled = false;
  }, []);

  return (
    <points ref={pointsRef} geometry={geometry} rotation={[0.7, 0, 0]}>
      <shaderMaterial
        vertexShader={JET_VS}
        fragmentShader={JET_FS}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── Background Stars ── */
function BackgroundStars() {
  const COUNT = 3500;

  const { geometry, uniforms } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions  = new Float32Array(COUNT * 3);
    const aStarSize  = new Float32Array(COUNT);
    const aStarBright = new Float32Array(COUNT);
    const aStarPhase = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Random point on a large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 40 + Math.random() * 60;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      aStarSize[i]   = 0.5 + Math.random() * 2.0;
      aStarBright[i] = 0.3 + Math.random() * 0.7;
      aStarPhase[i]  = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position',    new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aStarSize',   new THREE.BufferAttribute(aStarSize, 1));
    geo.setAttribute('aStarBright', new THREE.BufferAttribute(aStarBright, 1));
    geo.setAttribute('aStarPhase',  new THREE.BufferAttribute(aStarPhase, 1));

    return { geometry: geo, uniforms: { uTime: { value: 0 } } };
  }, []);

  useFrame((_, delta) => { uniforms.uTime.value += delta; });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        vertexShader={STAR_VS}
        fragmentShader={STAR_FS}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════
   BLACK HOLE SYSTEM (container with grow animation)
   ═══════════════════════════════════════════════════════════ */
function BlackHoleSystem() {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const t = Math.min(elapsed.current / 3.5, 1);
    // Ease: slow emergence → rapid expansion → settle
    const eased = t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const scale = 0.01 + eased * 1.19; // 0.01 → 1.2

    if (groupRef.current) {
      groupRef.current.scale.setScalar(scale);
      // Subtle slow rotation for life
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={groupRef} scale={0.01}>
      <EventHorizon />
      <GlowSphere />
      <PhotonRing />
      <AccretionDisk />
      <LensedDisk />
      <DiskParticles />
      <JetParticles />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCENE EXPORT (self-contained Canvas)
   ═══════════════════════════════════════════════════════════ */
export function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
    >
      <BlackHoleSystem />
      <BackgroundStars />
    </Canvas>
  );
}

export default Scene3D;