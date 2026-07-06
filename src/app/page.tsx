'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { motion, useInView, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

/* ──────────────── DATA ──────────────── */
const PROJECTS = [
  {
    id: 1,
    title: 'IBS Commerce',
    category: 'E-Commerce · Web App',
    description: 'A premium e-commerce platform with sub-second interactions, instant filtering, and a checkout flow engineered to remove every unnecessary click.',
    tech: ['NEXT.JS', 'TYPESCRIPT', 'TAILWIND CSS'],
    link: 'https://ibs-com-aadi.vercel.app/',
    color: '#6e7bff',
  },
  {
    id: 2,
    title: 'Corporate Lead-Gen Platform',
    category: 'B2B · Marketing Site',
    description: 'A high-conversion marketing platform with modular content system, built for a sales team to launch campaign pages without touching code.',
    tech: ['REACT', 'NEXT.JS', 'FRAMER MOTION'],
    link: 'https://corporate-leadgen-platform-jet.vercel.app/',
    color: '#ff6b6b',
  },
  {
    id: 3,
    title: 'Aadi Card',
    category: 'Interactive · Web App',
    description: 'An interactive digital card experience with stunning micro-animations, gesture-driven interactions, and a polished visual design system.',
    tech: ['REACT', 'CSS ANIMATIONS', 'JAVASCRIPT'],
    link: 'https://aadi-card.vercel.app/',
    color: '#4ecdc4',
  },
  {
    id: 4,
    title: 'Pulse Dashboard',
    category: 'SaaS · Analytics',
    description: 'A real-time analytics dashboard handling dense data — designed for legibility under load and built to stay smooth with live data streams.',
    tech: ['NEXT.JS', 'REACT', 'WEBSOCKET'],
    link: 'https://pulse-aadi-project.vercel.app/',
    color: '#f7b731',
  },
];

const FRONTEND_TOOLS = ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'GSAP'];
const BACKEND_TOOLS = ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'REST APIs'];

/* ──────────────── HOOKS ──────────────── */
function useMagneticHover(ref: React.RefObject<HTMLElement | null>, strength = 0.3) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };
    const onLeave = () => { el.style.transform = 'translate(0px, 0px)'; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, [ref, strength]);
}

/* ──────────────── 3D OBJECT ──────────────── */
function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} scale={1.8}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color="#6e7bff"
          roughness={0.2}
          metalness={0.8}
          distort={0.3}
          speed={2}
          transparent
          opacity={0.6}
        />
      </mesh>
    </Float>
  );
}

function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#6e7bff" />
      <pointLight position={[-5, -5, 5]} intensity={0.4} color="#ff6b6b" />
      <AnimatedSphere />
    </Canvas>
  );
}

/* ──────────────── PRELOADER ──────────────── */
function Preloader({ onComplete }: { onComplete: () => void }) {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const tl = gsap.timeline({ onComplete });
    tl.to(counterRef.current, {
      innerText: 100,
      duration: 1.6,
      ease: 'power2.inOut',
      snap: { innerText: 1 },
      onUpdate() {
        if (counterRef.current) counterRef.current.textContent = Math.round(parseFloat(counterRef.current.textContent || '0'));
      },
    }).to(preloaderRef.current, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '+=0.15');
  }, [onComplete]);

  return (
    <div ref={preloaderRef} className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <div className="text-center">
        <span ref={counterRef} className="block font-mono text-6xl font-light tracking-widest text-white md:text-8xl">0</span>
        <div className="mt-4 h-px w-32 overflow-hidden bg-white/10 mx-auto">
          <motion.div className="h-full bg-white/60" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.8, ease: 'easeInOut' }} />
        </div>
      </div>
    </div>
  );
}

/* ──────────────── CUSTOM CURSOR ──────────────── */
function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (cursorRef.current) gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.12, ease: 'power2.out' });
      if (followerRef.current) gsap.to(followerRef.current, { x: e.clientX, y: e.clientY, duration: 0.45, ease: 'power2.out' });
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (
    <>
      <div ref={cursorRef} className="custom-cursor pointer-events-none fixed top-0 left-0 z-[9998] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white mix-blend-difference" />
      <div ref={followerRef} className="custom-cursor pointer-events-none fixed top-0 left-0 z-[9997] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 mix-blend-difference" />
    </>
  );
}

/* ──────────────── NAVIGATION ──────────────── */
function Navigation({ activeSection }: { activeSection: string }) {
  const navRef = useRef<HTMLElement>(null);
  const [time, setTime] = useState('');
  useEffect(() => {
    if (navRef.current) gsap.fromTo(navRef.current, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 2.4 });
  }, []);
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const items = [
    { label: 'HOME', id: 'hero' },
    { label: 'ABOUT', id: 'about' },
    { label: 'WORK', id: 'work' },
    { label: 'CONTACT', id: 'contact' },
  ];
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <nav ref={navRef} className="fixed top-0 left-0 z-50 hidden w-full items-center justify-between px-8 py-5 opacity-0 md:flex lg:px-16">
      <button onClick={() => scrollTo('hero')} className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-white hover:text-white/70 transition-colors">ADITYA.</button>
      <div className="flex items-center gap-10">
        {items.map((item) => (
          <button key={item.id} onClick={() => scrollTo(item.id)} className={`relative font-mono text-[11px] uppercase tracking-[0.15em] transition-colors duration-300 ${activeSection === item.id ? 'text-white' : 'text-white/35 hover:text-white/70'}`}>
            {item.label}
            {activeSection === item.id && (
              <motion.span layoutId="nav-indicator" className="absolute -bottom-1 left-0 h-px w-full bg-white" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
          </button>
        ))}
      </div>
      <div className="font-mono text-[11px] tracking-wider text-white/25">{time}</div>
    </nav>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const scrollTo = (id: string) => { setOpen(false); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300); };
  const items = [
    { label: 'HOME', id: 'hero' },
    { label: 'ABOUT', id: 'about' },
    { label: 'WORK', id: 'work' },
    { label: 'CONTACT', id: 'contact' },
  ];
  return (
    <div className="fixed top-0 right-0 z-50 p-5 md:hidden">
      <button onClick={() => setOpen(!open)} className="relative z-[60] flex h-10 w-10 items-center justify-center">
        <div className="flex flex-col gap-1.5">
          <motion.span animate={open ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }} className="block h-px w-6 bg-white" />
          <motion.span animate={open ? { opacity: 0 } : { opacity: 1 }} className="block h-px w-6 bg-white" />
          <motion.span animate={open ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }} className="block h-px w-6 bg-white" />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ clipPath: 'circle(0% at 100% 0%)' }} animate={{ clipPath: 'circle(150% at 100% 0%)' }} exit={{ clipPath: 'circle(0% at 100% 0%)' }} transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }} className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-black">
            {items.map((item, i) => (
              <motion.button key={item.id} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }} onClick={() => scrollTo(item.id)} className="text-2xl font-light uppercase tracking-[0.25em] text-white/60 hover:text-white transition-colors">{item.label}</motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────── HERO SECTION ──────────────── */
function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 2.0 });

      // Left column - role text
      tl.fromTo('.hero-left', { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' })
        // Center - name
        .fromTo('.hero-name', { y: 100, opacity: 0, skewY: 3 }, { y: 0, opacity: 1, skewY: 0, duration: 1.2, ease: 'power4.out' }, '-=0.4')
        // 3D canvas fade
        .fromTo('.hero-3d', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1, ease: 'power3.out' }, '-=0.8')
        // Right column
        .fromTo('.hero-right', { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        // Scroll indicator
        .fromTo('.hero-scroll', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.2');
    }, heroRef);
    return () => ctx.revert();
  }, []);

  // Parallax
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.hero-parallax', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1 } });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const ctaRef = useRef<HTMLAnchorElement>(null);
  useMagneticHover(ctaRef, 0.2);

  return (
    <section ref={heroRef} id="hero" className="relative grid-bg flex min-h-screen items-center overflow-hidden px-6 md:px-12 lg:px-16">
      {/* Gradient orb */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(110,123,255,0.06)_0%,transparent_60%)]" />

      <div className="hero-parallax relative z-10 mx-auto w-full max-w-7xl">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-12">

          {/* LEFT COLUMN */}
          <div className="hero-left opacity-0 order-2 lg:order-1 text-center lg:text-left">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">Available for Projects</span>
            </div>
            <p className="text-sm leading-relaxed text-white/45 md:text-base max-w-sm mx-auto lg:mx-0">
              I currently work as a <span className="text-white/80">Front-End Developer</span>, crafting high-performance digital interfaces and experiences.
            </p>
            <div className="mt-8">
              <a ref={ctaRef} href="#work" onClick={(e) => { e.preventDefault(); document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }); }} className="magnetic-hover inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-7 py-3 font-mono text-xs uppercase tracking-[0.15em] text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08]">
                View Projects
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
              </a>
            </div>
          </div>

          {/* CENTER - 3D + NAME */}
          <div className="hero-3d opacity-0 order-1 lg:order-2 flex flex-col items-center">
            <div className="relative h-[300px] w-[300px] md:h-[400px] md:w-[400px] lg:h-[450px] lg:w-[450px]">
              <div className="absolute inset-0">
                <Suspense fallback={null}>
                  <Scene3D />
                </Suspense>
              </div>
            </div>
            <h1 className="hero-name absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(4rem,10vw,9rem)] font-bold leading-[0.85] tracking-tighter text-center pointer-events-none select-none" style={{ opacity: 0, mixBlendMode: 'difference' }}>
              <span className="gradient-text">ADITYA</span>
            </h1>
          </div>

          {/* RIGHT COLUMN */}
          <div className="hero-right opacity-0 order-3 text-center lg:text-right">
            <p className="text-sm leading-relaxed text-white/45 md:text-base max-w-sm mx-auto lg:ml-auto lg:mr-0">
              Focused on interfaces and experiences, working remotely from <span className="text-white/80">India</span>.
            </p>
            <div className="mt-6 flex flex-col gap-2 items-center lg:items-end">
              <a href="https://github.com/witejackel-eng" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] uppercase tracking-wider text-white/30 hover:text-white/70 transition-colors">GitHub ↗</a>
              <a href="mailto:hi.aditya.dev@gmail.com" className="font-mono text-[11px] uppercase tracking-wider text-white/30 hover:text-white/70 transition-colors">Email ↗</a>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll */}
      <div className="hero-scroll absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ opacity: 0 }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/15">Scroll</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} className="h-8 w-px bg-gradient-to-b from-white/20 to-transparent" />
      </div>
    </section>
  );
}

/* ──────────────── MARQUEE DIVIDER ──────────────── */
function MarqueeDivider() {
  const text = 'CRAFTING HIGH PERFORMANCE DIGITAL INTERFACES  ·  FRONTEND ENGINEER  ·  ';
  return (
    <div className="border-y border-white/[0.04] py-4 overflow-hidden">
      <div className="animate-marquee flex whitespace-nowrap">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/15">{text}{text}</span>
      </div>
    </div>
  );
}

/* ──────────────── ABOUT / STORY SECTION ──────────────── */
function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section ref={sectionRef} id="about" className="relative grid-bg-subtle px-6 py-28 md:px-12 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <motion.span initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }} className="mb-12 inline-block font-mono text-[11px] uppercase tracking-[0.3em] text-white/25">
          01 / About
        </motion.span>

        <div className="grid gap-16 lg:grid-cols-[1.5fr_1fr]">
          {/* LEFT - Story */}
          <div>
            <motion.h2 initial={{ opacity: 0, y: 50, skewY: 2 }} animate={isInView ? { opacity: 1, y: 0, skewY: 0 } : {}} transition={{ duration: 0.8, delay: 0.1, ease: 'power4.out' }} className="text-2xl font-bold uppercase leading-tight tracking-tight text-white md:text-4xl lg:text-[2.8rem]">
              Building interfaces that make ambitious products feel inevitable
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }} className="mt-6 text-sm leading-relaxed text-white/40 md:text-base max-w-xl">
              I&apos;m a Front-End Developer & UI/UX Designer specializing in building high-performance, accessible, and visually compelling digital products. Every project starts from the same question: what does this interface need to do, and what is the fastest, clearest way to let it do that.
            </motion.p>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.45 }} className="mt-4 text-sm leading-relaxed text-white/40 md:text-base max-w-xl">
              When I&apos;m not coding, you&apos;ll find me exploring new design trends, gaming, or experimenting with creative coding and 3D web experiences.
            </motion.p>
          </div>

          {/* RIGHT - Tools */}
          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: 30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }}>
              <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Frontend Tools</h3>
              <div className="flex flex-wrap gap-2">
                {FRONTEND_TOOLS.map((tool, i) => (
                  <motion.span key={tool} initial={{ opacity: 0, scale: 0.8 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white/50">
                    {tool}
                  </motion.span>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.5 }}>
              <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Backend Tools</h3>
              <div className="flex flex-wrap gap-2">
                {BACKEND_TOOLS.map((tool, i) => (
                  <motion.span key={tool} initial={{ opacity: 0, scale: 0.8 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.4, delay: 0.6 + i * 0.06 }} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white/50">
                    {tool}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Experience highlights */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.7 }} className="grid grid-cols-2 gap-4 pt-4">
              <div className="border-t border-white/[0.06] pt-4">
                <div className="text-2xl font-bold text-white">4+</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/30">Projects Shipped</div>
              </div>
              <div className="border-t border-white/[0.06] pt-4">
                <div className="text-2xl font-bold text-white">India</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/30">Based · Remote</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────── PROJECT CARD ──────────────── */
function ProjectCard({ project, index }: { project: (typeof PROJECTS)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 80 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: 'power4.out', delay: index * 0.2 }}
    >
      <a href={project.link} target="_blank" rel="noopener noreferrer" className="group block">
        <div
          className="card-glow relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d1117] transition-all duration-500 hover:border-white/[0.12]"
          onMouseMove={handleMouse}
          style={{ '--mouse-x': `${springX.get()}px`, '--mouse-y': `${springY.get()}px` } as React.CSSProperties}
        >
          <div className="grid md:grid-cols-[1fr_1.2fr]">
            {/* LEFT - Content */}
            <div className="relative z-10 flex flex-col justify-between p-8 md:p-10">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">
                  {String(index + 1).padStart(2, '0')} — {project.category}
                </span>
                <h3 className="mt-3 text-2xl font-bold text-white md:text-3xl">{project.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/35 max-w-md">{project.description}</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white/40">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT - Laptop mockup */}
            <div className="relative hidden md:flex items-center justify-center p-8">
              <div className="laptop-mockup w-full max-w-sm aspect-video relative">
                {/* Screen content - abstract UI */}
                <div className="absolute inset-2 rounded bg-[#0a0a0a] overflow-hidden p-3">
                  <div className="flex gap-1 mb-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 h-[calc(100%-20px)]">
                    <div className="rounded bg-white/[0.04] col-span-1" />
                    <div className="rounded bg-white/[0.06] col-span-2 flex flex-col gap-2">
                      <div className="h-1/3 rounded bg-white/[0.04]" />
                      <div className="h-2/3 rounded bg-white/[0.03]" />
                    </div>
                  </div>
                </div>
                {/* Color accent glow on screen */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-20 w-20 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-20" style={{ background: project.color }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/[0.04] px-8 py-4 md:px-10">
            <div className="flex items-center gap-3">
              {/* GitHub icon */}
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/40 hover:text-white hover:border-white/20 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
              </span>
              {/* Link icon */}
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/40 hover:text-white hover:border-white/20 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
              </span>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/30 transition-colors group-hover:text-white/60">
              View Project →
            </span>
          </div>
        </div>
      </a>
    </motion.div>
  );
}

/* ──────────────── WORK SECTION ──────────────── */
function WorkSection() {
  return (
    <section id="work" className="relative px-6 py-28 md:px-12 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <motion.span initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-4 inline-block font-mono text-[11px] uppercase tracking-[0.3em] text-white/25">
          02 / Selected Work
        </motion.span>
        <motion.h2 initial={{ opacity: 0, y: 50, skewY: 2 }} whileInView={{ opacity: 1, y: 0, skewY: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1, ease: 'power4.out' }} className="mb-16 text-3xl font-bold tracking-tight text-white md:text-5xl">
          Projects
        </motion.h2>

        <div className="space-y-8">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────── CONTACT SECTION ──────────────── */
function ContactSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const emailRef = useRef<HTMLAnchorElement>(null);
  useMagneticHover(emailRef, 0.12);

  return (
    <section ref={sectionRef} id="contact" className="relative grid-bg-subtle px-6 py-28 md:px-12 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: 'power4.out' }}
          className="text-[clamp(3rem,8vw,8rem)] font-bold leading-[0.9] tracking-tighter text-white uppercase"
        >
          LET&apos;S TALK
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }} className="mt-6 max-w-lg text-sm leading-relaxed text-white/40 md:text-base">
          Got a project in mind, a question, or just want to connect? I&apos;m always open to discussing new opportunities and creative ideas.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.5 }} className="mt-10 flex flex-wrap items-center gap-6">
          <a ref={emailRef} href="mailto:hi.aditya.dev@gmail.com" className="magnetic-hover font-mono text-sm uppercase tracking-[0.1em] text-white/70 underline underline-offset-4 decoration-white/20 hover:decoration-white/60 transition-colors">
            Send me an email
          </a>
          <span className="text-white/20 font-mono text-sm">OR</span>
          <a href="https://github.com/witejackel-eng" target="_blank" rel="noopener noreferrer" className="font-mono text-sm uppercase tracking-[0.1em] text-white/70 underline underline-offset-4 decoration-white/20 hover:decoration-white/60 transition-colors">
            Book a call
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.7 }} className="mt-12 flex items-center gap-8">
          <a href="https://github.com/witejackel-eng" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] uppercase tracking-wider text-white/25 hover:text-white/60 transition-colors">
            GitHub ↗
          </a>
          <a href="mailto:hi.aditya.dev@gmail.com" className="font-mono text-[11px] uppercase tracking-wider text-white/25 hover:text-white/60 transition-colors">
            Email ↗
          </a>
          <span className="font-mono text-[11px] uppercase tracking-wider text-white/25">
            India · Remote
          </span>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────── FOOTER ──────────────── */
function Footer() {
  const footerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(footerRef, { once: true, margin: '-50px' });

  return (
    <footer ref={footerRef} className="px-6 pb-8 pt-0 md:px-12 lg:px-16">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: 'power4.out' }}
        className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d1117] p-8 md:p-12"
      >
        <div className="grid items-center gap-10 md:grid-cols-[1fr_1fr]">
          {/* LEFT - Branding */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black font-bold text-lg">A</div>
              <div>
                <h3 className="text-xl font-bold text-white">ADITYA</h3>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/30">Front-End Developer & Designer</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/35 max-w-md">
              Building high-performance digital interfaces with precision engineering and intentional design. Every pixel, every animation, every interaction — crafted with purpose.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['NEXT.JS', 'REACT', 'TYPESCRIPT', 'GSAP', 'FRAMER MOTION'].map((t) => (
                <span key={t} className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white/30">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT - Visual / Info */}
          <div className="flex flex-col items-center md:items-end gap-6">
            {/* Mini laptop mockup */}
            <div className="relative w-full max-w-xs">
              <div className="laptop-mockup aspect-video relative">
                <div className="absolute inset-1.5 rounded bg-[#050505] overflow-hidden flex items-center justify-center">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white/15">Portfolio Preview</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-wider text-white/25">
              <a href="https://github.com/witejackel-eng" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">GitHub</a>
              <span className="text-white/10">|</span>
              <a href="mailto:hi.aditya.dev@gmail.com" className="hover:text-white/60 transition-colors">Email</a>
              <span className="text-white/10">|</span>
              <span>India</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] pt-6 sm:flex-row">
          <span className="font-mono text-[11px] text-white/20">
            © {new Date().getFullYear()} ADITYA — Built with Next.js, Three.js, GSAP & Framer Motion
          </span>
          <button
            onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}
            className="font-mono text-[11px] uppercase tracking-wider text-white/20 hover:text-white/50 transition-colors"
          >
            Back to top ↑
          </button>
        </div>
      </motion.div>
    </footer>
  );
}

/* ──────────────── MAIN PAGE ──────────────── */
export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  const handlePreloaderComplete = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    if (!loaded) return;
    const sections = [
      { id: 'hero', el: document.getElementById('hero') },
      { id: 'about', el: document.getElementById('about') },
      { id: 'work', el: document.getElementById('work') },
      { id: 'contact', el: document.getElementById('contact') },
    ];
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight / 3;
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].el && sections[i].el!.offsetTop <= y) { setActiveSection(sections[i].id); break; }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loaded]);

  return (
    <>
      <Preloader onComplete={handlePreloaderComplete} />
      <CustomCursor />
      <div className="noise-overlay" />
      <Navigation activeSection={activeSection} />
      <MobileNav />
      <main className={loaded ? '' : 'overflow-hidden'}>
        <HeroSection />
        <MarqueeDivider />
        <AboutSection />
        <WorkSection />
        <MarqueeDivider />
        <ContactSection />
        <Footer />
      </main>
    </>
  );
}