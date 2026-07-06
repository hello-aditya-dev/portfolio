'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Dynamic imports for Three.js to avoid SSR issues
const Scene3DSmall = dynamic(() => import('./Scene3DSmall').then(mod => ({ default: mod.Scene3DSmall })), { ssr: false });
const DottedSurface = dynamic(() => import('@/components/ui/dotted-surface').then(mod => ({ default: mod.DottedSurface })), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

/* ──────────────── DATA ──────────────── */
const PROJECTS = [
  {
    id: 1,
    title: 'IBS',
    category: 'Corporate · Business Website',
    description: 'A corporate business website showcasing company services, team, and brand identity with a refined professional design system, smooth scroll animations, and a responsive layout engineered for credibility and clarity.',
    tech: ['NEXT.JS', 'TYPESCRIPT', 'TAILWIND CSS'],
    link: 'https://ibs-com-aadi.vercel.app/',
    color: '#6e7bff',
    gradient: 'from-blue-600/20 via-indigo-600/10 to-purple-600/20',
    accentGlow: '#4f46e5',
    abstractBg: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.1) 0%, transparent 50%)',
    image: '/project-1.jpg',
  },
  {
    id: 2,
    title: 'Corporate Lead-Gen Platform',
    category: 'B2B · Marketing Site',
    description: 'A high-conversion marketing platform with modular content system, built for a sales team to launch campaign pages without touching code.',
    tech: ['REACT', 'NEXT.JS', 'FRAMER MOTION'],
    link: 'https://corporate-leadgen-platform-jet.vercel.app/',
    color: '#ff6b6b',
    gradient: 'from-red-500/20 via-orange-500/10 to-amber-500/20',
    accentGlow: '#ef4444',
    abstractBg: 'radial-gradient(ellipse at 70% 40%, rgba(239,68,68,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(249,115,22,0.1) 0%, transparent 50%)',
    image: '/project-2.jpg',
  },
  {
    id: 3,
    title: 'Aadi Card',
    category: 'Interactive · Web App',
    description: 'An interactive digital card experience with stunning micro-animations, gesture-driven interactions, and a polished visual design system.',
    tech: ['REACT', 'CSS ANIMATIONS', 'JAVASCRIPT'],
    link: 'https://aadi-card.vercel.app/',
    color: '#4ecdc4',
    gradient: 'from-teal-500/20 via-emerald-500/10 to-cyan-500/20',
    accentGlow: '#14b8a6',
    abstractBg: 'radial-gradient(ellipse at 40% 60%, rgba(20,184,166,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(6,182,212,0.1) 0%, transparent 50%)',
    image: '/project-3.jpg',
  },
  {
    id: 4,
    title: 'Pulse Dashboard',
    category: 'Dashboard · Analytics',
    description: 'A real-time analytics dashboard with live data visualization, interactive charts, and a responsive design that works across all devices.',
    tech: ['NEXT.JS', 'CHART.JS', 'TAILWIND CSS'],
    link: 'https://pulse-aadi-project.vercel.app/',
    color: '#a855f7',
    gradient: 'from-purple-500/20 via-violet-500/10 to-fuchsia-500/20',
    accentGlow: '#a855f7',
    abstractBg: 'radial-gradient(ellipse at 60% 30%, rgba(168,85,247,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 70%, rgba(217,70,239,0.1) 0%, transparent 50%)',
    image: '/project-4.jpg',
  },
];

const FRONTEND_TOOLS = ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'GSAP', 'Three.js', 'WebGL'];
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
          <motion.div className="h-full bg-gradient-to-r from-orange-500/60 via-yellow-400/60 to-white/60" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.8, ease: 'easeInOut' }} />
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
  const videoRef = useRef<HTMLVideoElement>(null);

  // Robust video playback — auto-recover from stalls, pauses, errors
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 5;

    const forcePlay = () => {
      const p = video.play();
      if (p) p.catch(() => {});
    };

    const handleCanPlay = () => { retryCount = 0; forcePlay(); };
    const handleStalled = () => {
      retryCount++;
      if (retryCount <= MAX_RETRIES) {
        // Reload from current position to unstick
        const t = video.currentTime;
        video.load();
        video.addEventListener('canplay', () => { video.currentTime = t; forcePlay(); }, { once: true });
      }
    };
    const handleWaiting = () => {
      // Browser is buffering — set a safety timeout
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => {
        if (video.paused) forcePlay();
      }, 3000);
    };
    const handlePlaying = () => {
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
      retryCount = 0;
    };
    const handleEnded = () => { video.currentTime = 0; forcePlay(); };
    const handleError = () => {
      retryCount++;
      if (retryCount <= MAX_RETRIES) {
        setTimeout(() => { video.load(); }, 1000 * retryCount);
      }
    };
    const handlePause = () => {
      // Auto-resume if paused unexpectedly (not by user)
      if (!video.ended && retryCount < MAX_RETRIES) {
        setTimeout(() => { if (video.paused && !video.ended) forcePlay(); }, 100);
      }
    };
    const handleVisibility = () => {
      if (!document.hidden && video.paused && !video.ended) forcePlay();
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('pause', handlePause);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('pause', handlePause);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 2.0 });
      tl.fromTo('.hero-role', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
        .fromTo('.hero-name', { y: 100, opacity: 0, skewY: 3 }, { y: 0, opacity: 1, skewY: 0, duration: 1.2, ease: 'power4.out' }, '-=0.3')
        .fromTo('.hero-3d', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, '-=0.9')
        .fromTo('.hero-left', { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.8')
        .fromTo('.hero-right', { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        .fromTo('.hero-scroll', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.2');
    }, heroRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.hero-parallax', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: 1 } });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const ctaRef = useRef<HTMLAnchorElement>(null);
  useMagneticHover(ctaRef, 0.2);

  return (
    <section ref={heroRef} id="hero" className="relative flex min-h-screen items-center overflow-hidden">
      {/* Full-screen black hole video background */}
      <video
        ref={videoRef}
        className="hero-3d absolute inset-0 z-0 h-full w-full object-cover opacity-0"
        src="/blackhole.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* Cosmic black hole ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[900px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(200,210,255,0.04)_0%,rgba(120,130,160,0.02)_30%,transparent_60%)]" />

      {/* Content overlay */}
      <div className="hero-parallax relative z-10 mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">

          {/* LEFT COLUMN */}
          <div className="hero-left opacity-0 text-center lg:text-left">
            <div className="hero-role opacity-0 mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-amber-300/80">Available for Projects</span>
            </div>
            <p className="text-sm leading-relaxed text-white/45 md:text-base max-w-md mx-auto lg:mx-0">
              I craft <span className="text-amber-300/90">high-performance</span> digital interfaces and immersive 3D web experiences that leave a lasting impression.
            </p>
            <div className="mt-8">
              <a ref={ctaRef} href="#work" onClick={(e) => { e.preventDefault(); document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }); }} className="magnetic-hover inline-flex items-center gap-3 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-7 py-3 font-mono text-xs uppercase tracking-[0.15em] text-amber-200/90 backdrop-blur-sm transition-all duration-300 hover:border-amber-400/40 hover:bg-amber-500/[0.12] hover:shadow-[0_0_30px_rgba(196,162,101,0.15)]">
                <span>Discover My Projects</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN - Name + Links */}
          <div className="hero-right opacity-0 text-center lg:text-right">
            <h1 className="hero-name text-[clamp(3rem,8vw,7.5rem)] font-extralight leading-[0.9] tracking-[0.25em] pointer-events-none select-none uppercase" style={{ opacity: 0, fontFamily: 'var(--font-inter)' }}>
              <span className="gradient-text-dune">ADITYA</span>
            </h1>
            <p className="mt-6 text-sm leading-relaxed text-white/40 md:text-base max-w-sm mx-auto lg:ml-auto lg:mr-0">
              Focused on <span className="text-amber-300/80">immersive experiences</span>, working remotely from India. Turning ideas into interactive reality.
            </p>
            <div className="mt-6 flex flex-col gap-3 items-center lg:items-end">
              <a href="https://github.com/witejackel-eng" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] uppercase tracking-wider text-white/30 hover:text-amber-300/80 transition-colors">GitHub ↗</a>
              <a href="mailto:hi.aditya.dev@gmail.com" className="font-mono text-[11px] uppercase tracking-wider text-white/30 hover:text-amber-300/80 transition-colors">Email ↗</a>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ opacity: 0 }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/15">Scroll</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} className="h-8 w-px bg-gradient-to-b from-amber-400/30 to-transparent" />
      </div>
    </section>
  );
}

/* ──────────────── MARQUEE DIVIDER ──────────────── */
function MarqueeDivider() {
  const text = 'CRAFTING IMMERSIVE DIGITAL EXPERIENCES  ·  FRONTEND ENGINEER & DESIGNER  ·  WEBGL & 3D  ·  ';
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

        <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr]">
          {/* LEFT - Story with face image */}
          <div>
            {/* Face image with artistic styling */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease: 'power4.out' }}
              className="relative mb-10 w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 mx-auto lg:mx-0"
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/[0.08]">
                <img
                  src="/face.jpg"
                  alt="Aditya"
                  className="w-full h-full object-cover"
                  style={{ filter: 'contrast(1.1) saturate(0.9) brightness(0.95)' }}
                />
                {/* Abstract color overlay matching the reference */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 mix-blend-overlay" />
                {/* Subtle animated border glow */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(110,123,255,0.2), rgba(168,85,247,0.2), rgba(236,72,153,0.2))',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                    padding: '1px',
                  }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </motion.div>

            <motion.h2 initial={{ opacity: 0, y: 50, skewY: 2 }} animate={isInView ? { opacity: 1, y: 0, skewY: 0 } : {}} transition={{ duration: 0.8, delay: 0.2, ease: 'power4.out' }} className="text-2xl font-bold uppercase leading-tight tracking-tight text-white md:text-4xl lg:text-[2.8rem]">
              Building interfaces that make ambitious products feel inevitable
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.35 }} className="mt-6 text-sm leading-relaxed text-white/40 md:text-base max-w-xl">
              I&apos;m a Front-End Developer & UI/UX Designer specializing in building high-performance, accessible, and visually compelling digital products. Every project starts from the same question: what does this interface need to do, and what is the fastest, clearest way to let it do that.
            </motion.p>
            <motion.p initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.45 }} className="mt-4 text-sm leading-relaxed text-white/40 md:text-base max-w-xl">
              When I&apos;m not coding, you&apos;ll find me exploring new design trends, gaming, or experimenting with creative coding and 3D web experiences.
            </motion.p>
          </div>

          {/* RIGHT - Tools + WebGL */}
          <div className="space-y-8">
            {/* Mini WebGL canvas */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-48 md:h-56 rounded-xl overflow-hidden border border-white/[0.06] bg-black/50"
            >
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-white/15">Loading WebGL...</span>
                </div>
              }>
                <Scene3DSmall />
              </Suspense>
              <div className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-wider text-white/20">WebGL — Real-time</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }}>
              <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Frontend & Creative Tools</h3>
              <div className="flex flex-wrap gap-2">
                {FRONTEND_TOOLS.map((tool, i) => (
                  <motion.span
                    key={tool}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                    whileHover={{ scale: 1.08, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.06)' }}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white/50 cursor-default transition-colors"
                  >
                    {tool}
                  </motion.span>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.5 }}>
              <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">Backend Tools</h3>
              <div className="flex flex-wrap gap-2">
                {BACKEND_TOOLS.map((tool, i) => (
                  <motion.span
                    key={tool}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.06 }}
                    whileHover={{ scale: 1.08, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.06)' }}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white/50 cursor-default transition-colors"
                  >
                    {tool}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Location only - no "4 projects shipped" */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.7 }} className="border-t border-white/[0.06] pt-4">
              <div className="text-2xl font-bold text-white">India</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/30">Based · Remote</div>
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
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  const gridRow = Math.floor(index / 2);
  const gridCol = index % 2;
  const fromX = gridCol === 0 ? -30 : 30;
  const fromY = gridRow === 0 ? 25 : -25;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: fromX, y: fromY, scale: 0.95 }}
      animate={isInView ? { opacity: 1, x: 0, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.12 }}
    >
      <a href={project.link} target="_blank" rel="noopener noreferrer" className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0f] transition-all duration-500 hover:border-white/[0.12] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">

          {/* ═══ MACBOOK FRAME ═══ */}
          <div className="relative px-3 pt-3">
            {/* Screen bezel */}
            <div className="relative rounded-xl border border-white/[0.08] bg-[#1c1c1e] overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">

              {/* macOS traffic lights + URL bar */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 bg-[#1c1c1e]/80 backdrop-blur-sm border-b border-white/[0.04]">
                <div className="flex items-center gap-1.5">
                  <span className="h-[9px] w-[9px] rounded-full bg-[#ff5f57]" />
                  <span className="h-[9px] w-[9px] rounded-full bg-[#febc2e]" />
                  <span className="h-[9px] w-[9px] rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.04] px-3 py-[3px] max-w-[200px] w-full">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-25">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" className="text-white" />
                    </svg>
                    <span className="font-mono text-[8px] text-white/20 truncate">{project.link.replace('https://', '').replace('/', '')}</span>
                  </div>
                </div>
              </div>

              {/* Screen content — project screenshot */}
              <div className="relative bg-[#000]" style={{ height: '200px' }}>
                <img
                  src={project.image}
                  alt={project.title}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  loading="lazy"
                />
                {/* Bottom fade to blend into card */}
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none z-10" />

                {/* Category badge */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                  className="absolute top-2.5 right-2.5 rounded-full border border-white/[0.08] bg-black/50 backdrop-blur-md px-2.5 py-0.5 z-20"
                >
                  <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/50">{project.category}</span>
                </motion.div>
              </div>
            </div>

            {/* Camera notch */}
            <div className="flex justify-center py-1.5">
              <div className="relative">
                <div className="w-3 h-1 rounded-full bg-gradient-to-b from-[#2a2a2e] to-[#222225]" />
              </div>
            </div>

            {/* MacBook base */}
            <div className="relative mx-1 rounded-b-xl bg-gradient-to-b from-[#2a2a2e] to-[#1a1a1e] pt-0.5 pb-2">
              {/* Keyboard area */}
              <div className="flex justify-center pt-1 pb-1.5">
                <div className="w-14 h-[3px] rounded-full bg-white/[0.04]" />
              </div>
            </div>
          </div>

          {/* ═══ CONTENT ═══ */}
          <div className="relative px-5 pt-4 pb-5">
            <h3 className="text-lg font-bold text-white leading-tight group-hover:text-white transition-colors">
              {project.title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-white/30 line-clamp-2">
              {project.description}
            </p>

            {/* Tech stack */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className="rounded border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/30 transition-all duration-300 group-hover:text-white/50 group-hover:border-white/10"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Bottom row */}
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-6 rounded-full" style={{ background: project.color, opacity: 0.4 }} />
                <div className="h-1 w-3 rounded-full" style={{ background: project.color, opacity: 0.15 }} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/20 group-hover:text-white/50 transition-colors duration-300">
                  View
                </span>
                <motion.div
                  whileHover={{ scale: 1.15, x: 2, y: -2 }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] transition-all duration-300 group-hover:border-white/15 group-hover:bg-white/[0.05]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 group-hover:text-white/70 transition-colors">
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Top accent line */}
          <motion.div
            className="absolute top-0 left-0 h-px z-20"
            style={{ background: `linear-gradient(90deg, transparent, ${project.color}, transparent)` }}
            initial={{ width: '0%' }}
            whileInView={{ width: '100%' }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.4 + index * 0.15, ease: 'easeInOut' }}
          />
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
        <motion.h2 initial={{ opacity: 0, y: 50, skewY: 2 }} whileInView={{ opacity: 1, y: 0, skewY: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1, ease: 'power4.out' }} className="mb-12 text-3xl font-bold tracking-tight text-white md:text-5xl">
          Projects
        </motion.h2>

        {/* 2×2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      {/* Warm glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.05)_0%,transparent_60%)]" />

      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: 'power4.out' }}
          className="text-[clamp(3rem,9vw,9rem)] font-extralight leading-[0.95] tracking-[0.2em] text-white uppercase" style={{ fontFamily: 'var(--font-inter)' }}
        >
          LET&apos;S TALK
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }} className="mt-6 max-w-lg text-sm leading-relaxed text-white/40 md:text-base">
          Got a project in mind, a question, or just want to connect? I&apos;m always open to discussing new opportunities and creative ideas.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.5 }} className="mt-10 flex flex-wrap items-center gap-6">
          <a ref={emailRef} href="mailto:hi.aditya.dev@gmail.com" className="magnetic-hover font-mono text-sm uppercase tracking-[0.1em] text-orange-300/80 underline underline-offset-4 decoration-orange-400/30 hover:decoration-orange-400/60 transition-colors">
            Send me an email
          </a>
          <span className="text-white/20 font-mono text-sm">OR</span>
          <a href="https://github.com/witejackel-eng" target="_blank" rel="noopener noreferrer" className="font-mono text-sm uppercase tracking-[0.1em] text-white/70 underline underline-offset-4 decoration-white/20 hover:decoration-white/60 transition-colors">
            Book a call
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.7 }} className="mt-12 flex items-center gap-8">
          <a href="https://github.com/witejackel-eng" target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] uppercase tracking-wider text-white/25 hover:text-orange-300/70 transition-colors">
            GitHub ↗
          </a>
          <a href="mailto:hi.aditya.dev@gmail.com" className="font-mono text-[11px] uppercase tracking-wider text-white/25 hover:text-orange-300/70 transition-colors">
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
    <footer ref={footerRef} className="px-6 pb-10 pt-0 md:px-12 lg:px-16">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: 'power4.out' }}
        className="mx-auto max-w-6xl rounded-2xl border border-white/[0.06] bg-[#0c0c10] p-8 md:p-12 relative"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start">
          {/* LEFT — Branding + Bio + Tech */}
          <div>
            <div className="flex items-center gap-3.5 mb-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(251,191,36,0.15)]">A</div>
              <div>
                <h3 className="text-xl font-bold tracking-[0.12em] text-white uppercase leading-tight" style={{ fontFamily: 'var(--font-inter)' }}>ADITYA</h3>
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/35 mt-0.5">Front-End Developer & Designer</p>
              </div>
            </div>
            <p className="text-[13px] leading-[1.7] text-white/40 max-w-lg">
              Building high-performance digital interfaces with precision engineering and intentional design. Every pixel, every animation, every interaction — crafted with purpose.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['NEXT.JS', 'REACT', 'TYPESCRIPT', 'THREE.JS', 'GSAP', 'FRAMER MOTION'].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-white/30 transition-colors hover:text-white/50 hover:border-white/12 cursor-default"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — Availability + Links */}
          <div className="flex flex-col items-center md:items-end gap-5">
            {/* Status badge */}
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-300/80">Available for work</span>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-1">
              <a
                href="https://github.com/witejackel-eng"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-lg px-3.5 py-2 transition-colors hover:bg-white/[0.04]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white/30 group-hover:text-white/70 transition-colors">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/30 group-hover:text-white/70 transition-colors">GitHub</span>
              </a>
              <a
                href="mailto:hi.aditya.dev@gmail.com"
                className="group flex items-center gap-2 rounded-lg px-3.5 py-2 transition-colors hover:bg-white/[0.04]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30 group-hover:text-white/70 transition-colors">
                  <rect x="2" y="4" width="20" height="16" rx="3"/>
                  <path d="M22 7l-10 7L2 7"/>
                </svg>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/30 group-hover:text-white/70 transition-colors">Email</span>
              </a>
              <span className="flex items-center gap-2 rounded-lg px-3.5 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                  <circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m0-10.14l2.83 2.83m4.48 4.48l2.83 2.83"/>
                </svg>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/25">India</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom divider + copyright */}
        <div className="mt-8 border-t border-white/[0.05] pt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <span className="font-mono text-[10px] tracking-wider text-white/20">
            © {new Date().getFullYear()} ADITYA — Built with Next.js, Three.js, GSAP & Framer Motion
          </span>
          <button
            onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/20 hover:text-white/50 transition-colors flex items-center gap-1.5"
          >
            Back to top
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
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
      <DottedSurface />
      <div className="noise-overlay" />
      <Navigation activeSection={activeSection} />
      <MobileNav />
      <main className={loaded ? 'relative z-10' : 'overflow-hidden relative z-10'}>
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