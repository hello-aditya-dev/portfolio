'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ──────────────── DATA ──────────────── */
const PROJECTS = [
  {
    id: 1,
    title: 'IBS Commerce',
    category: 'E-Commerce · Web App',
    description:
      'A premium e-commerce platform with sub-second interactions, instant filtering, and a checkout flow engineered to remove every unnecessary click.',
    tech: ['Next.js', 'TypeScript', 'Tailwind CSS'],
    link: 'https://ibs-com-aadi.vercel.app/',
    color: '#6e7bff',
    metrics: [
      { value: '50+', label: 'Products' },
      { value: '<1s', label: 'Page Load' },
      { value: '100%', label: 'Responsive' },
    ],
  },
  {
    id: 2,
    title: 'Corporate Lead-Gen Platform',
    category: 'B2B · Marketing Site',
    description:
      'A high-conversion marketing platform with modular content system, built for a sales team to launch campaign pages without touching code.',
    tech: ['React', 'Next.js', 'Framer Motion'],
    link: 'https://corporate-leadgen-platform-jet.vercel.app/',
    color: '#ff6b6b',
    metrics: [
      { value: '38%', label: 'Reply-Rate Lift' },
      { value: '<2%', label: 'Bounce Rate' },
      { value: '0', label: 'Code Deploys' },
    ],
  },
  {
    id: 3,
    title: 'Aadi Card',
    category: 'Interactive · Web App',
    description:
      'An interactive digital card experience with stunning micro-animations, gesture-driven interactions, and a polished visual design system.',
    tech: ['React', 'CSS Animations', 'JavaScript'],
    link: 'https://aadi-card.vercel.app/',
    color: '#4ecdc4',
    metrics: [
      { value: '60fps', label: 'Animations' },
      { value: '100%', label: 'Interactive' },
      { value: '<16ms', label: 'Paint Budget' },
    ],
  },
  {
    id: 4,
    title: 'Pulse Dashboard',
    category: 'SaaS · Analytics',
    description:
      'A real-time analytics dashboard handling dense data — designed for legibility under load and built to stay smooth with live data streams.',
    tech: ['Next.js', 'React', 'WebSocket'],
    link: 'https://pulse-aadi-project.vercel.app/',
    color: '#f7b731',
    metrics: [
      { value: 'Live', label: 'Data Feed' },
      { value: '60fps', label: 'At 40+ Ticks' },
      { value: '<16ms', label: 'Under Load' },
    ],
  },
];

const SERVICES = [
  {
    num: '01',
    title: 'Front-End Engineering',
    description:
      'Production-grade builds in React, Next.js and TypeScript — accessible, type-safe, and tuned for real-world performance budgets.',
  },
  {
    num: '02',
    title: 'UI / UX Design',
    description:
      'Interface and interaction design from wireframe to high-fidelity system — grounded in usability, not just visual polish.',
  },
  {
    num: '03',
    title: 'Motion & Interaction',
    description:
      'Physics-based micro-interactions and page choreography built with Framer Motion, GSAP, and WebGL — purposeful, never gratuitous.',
  },
  {
    num: '04',
    title: 'Design Systems',
    description:
      'Component libraries and documentation that let a team ship fast without drifting from the source of truth.',
  },
];

const SKILLS = [
  { name: 'Next.js / React', level: 95 },
  { name: 'TypeScript', level: 90 },
  { name: 'Tailwind CSS', level: 95 },
  { name: 'Framer Motion / GSAP', level: 88 },
  { name: 'Three.js / WebGL', level: 75 },
  { name: 'UI / UX Design', level: 85 },
];

const NAV_ITEMS = [
  { label: 'HOME', id: 'hero' },
  { label: 'ABOUT', id: 'about' },
  { label: 'SERVICES', id: 'services' },
  { label: 'WORK', id: 'work' },
  { label: 'CONTACT', id: 'contact' },
];

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
    const onLeave = () => {
      el.style.transform = 'translate(0px, 0px)';
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [ref, strength]);
}

/* ──────────────── COMPONENTS ──────────────── */

// Preloader
function Preloader({ onComplete }: { onComplete: () => void }) {
  const preloaderRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete,
    });

    tl.to(counterRef.current, {
      innerText: 100,
      duration: 1.8,
      ease: 'power2.inOut',
      snap: { innerText: 1 },
      onUpdate: function () {
        if (counterRef.current) {
          counterRef.current.textContent = Math.round(
            parseFloat(counterRef.current.textContent || '0')
          );
        }
      },
    })
      .to(
        preloaderRef.current,
        {
          yPercent: -100,
          duration: 0.8,
          ease: 'power4.inOut',
        },
        '+=0.2'
      );
  }, [onComplete]);

  return (
    <div
      ref={preloaderRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]"
    >
      <span
        ref={counterRef}
        className="font-mono text-5xl font-light tracking-widest text-white md:text-7xl"
      >
        0
      </span>
    </div>
  );
}

// Custom Cursor
function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.15,
          ease: 'power2.out',
        });
      }
      if (followerRef.current) {
        gsap.to(followerRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.5,
          ease: 'power2.out',
        });
      }
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        className="custom-cursor pointer-events-none fixed top-0 left-0 z-[9998] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white mix-blend-difference"
      />
      <div
        ref={followerRef}
        className="custom-cursor pointer-events-none fixed top-0 left-0 z-[9997] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 mix-blend-difference"
      />
    </>
  );
}

// Navigation
function Navigation({ activeSection }: { activeSection: string }) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { y: -100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        delay: 2.6,
      }
    );
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 z-50 hidden w-full items-center justify-between px-6 py-5 opacity-0 md:flex md:px-12 lg:px-20"
    >
      <button
        onClick={() => scrollTo('hero')}
        className="font-mono text-sm font-medium uppercase tracking-[0.2em] text-white/90 hover:text-white"
      >
        ADITYA
      </button>
      <div className="flex items-center gap-8">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className={`relative font-mono text-[11px] uppercase tracking-[0.15em] transition-colors duration-300 ${
              activeSection === item.id
                ? 'text-white'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            {item.label}
            {activeSection === item.id && (
              <motion.span
                layoutId="nav-active"
                className="absolute -bottom-1 left-0 h-px w-full bg-white"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/30">
        {new Date().toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
        })}
      </div>
    </nav>
  );
}

// Mobile Nav
function MobileNav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && menuRef.current) {
      gsap.fromTo(
        menuRef.current.querySelectorAll('.mobile-link'),
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power3.out',
        }
      );
    }
  }, [open]);

  const scrollTo = (id: string) => {
    setOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  return (
    <div className="fixed top-0 right-0 z-50 p-5 md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="relative z-[60] flex h-10 w-10 items-center justify-center"
      >
        <div className="flex flex-col gap-1.5">
          <motion.span
            animate={open ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
            className="block h-px w-6 bg-white"
          />
          <motion.span
            animate={open ? { opacity: 0 } : { opacity: 1 }}
            className="block h-px w-6 bg-white"
          />
          <motion.span
            animate={open ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
            className="block h-px w-6 bg-white"
          />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-[#050505]"
          >
            <div ref={menuRef} className="flex flex-col items-center gap-8">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="mobile-link text-2xl font-light uppercase tracking-[0.2em] text-white/70 opacity-0 hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hero Section
function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 2.2 });

      // Subtitle line
      tl.fromTo(
        '.hero-subtitle-line',
        { scaleX: 0 },
        { scaleX: 1, duration: 1, ease: 'power4.inOut' }
      )
        .fromTo(
          '.hero-subtitle-text',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          '-=0.5'
        )
        // Name reveal
        .fromTo(
          nameRef.current,
          { y: 120, opacity: 0, skewY: 4 },
          { y: 0, opacity: 1, skewY: 0, duration: 1.2, ease: 'power4.out' },
          '-=0.3'
        )
        // Description
        .fromTo(
          '.hero-desc',
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.6'
        )
        // CTAs
        .fromTo(
          '.hero-cta',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out' },
          '-=0.4'
        )
        // Tech stack
        .fromTo(
          '.hero-tech',
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: 'power2.out' },
          '-=0.2'
        )
        // Scroll indicator
        .fromTo(
          '.hero-scroll',
          { opacity: 0 },
          { opacity: 1, duration: 0.5 },
          '-=0.2'
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Parallax on scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.hero-content', {
        yPercent: 30,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const viewWorkRef = useRef<HTMLAnchorElement>(null);
  useMagneticHover(viewWorkRef, 0.2);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
    >
      {/* Gradient orb */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(110,123,255,0.08)_0%,transparent_70%)]" />

      <div className="hero-content relative z-10 mx-auto w-full max-w-5xl text-center">
        {/* Subtitle */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <div className="hero-subtitle-line h-px w-8 origin-left bg-white/30 md:w-16" />
          <span className="hero-subtitle-text font-mono text-[11px] uppercase tracking-[0.3em] text-white/50 md:text-xs">
            Front-End Developer & UI/UX Designer
          </span>
          <div className="hero-subtitle-line h-px w-8 origin-right bg-white/30 md:w-16" />
        </div>

        {/* Name */}
        <h1
          ref={nameRef}
          className="text-[clamp(3rem,12vw,10rem)] font-bold leading-[0.9] tracking-tighter text-white"
          style={{ opacity: 0 }}
        >
          ADITYA
        </h1>

        {/* Description */}
        <p className="hero-desc mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/50 md:text-base" style={{ opacity: 0 }}>
          I build interfaces that make ambitious products feel inevitable —
          engineered for performance, designed for clarity.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            ref={viewWorkRef}
            href="#work"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hero-cta magnetic-hover inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3 font-mono text-xs uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10"
            style={{ opacity: 0 }}
          >
            View The Work
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>
          <a
            href="mailto:hi.aditya.dev@gmail.com"
            className="hero-cta inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-white/40 transition-colors duration-300 hover:text-white/80"
            style={{ opacity: 0 }}
          >
            Get In Touch
          </a>
        </div>

        {/* Tech stack */}
        <div
          className="hero-tech mt-12 flex flex-wrap items-center justify-center gap-3"
          style={{ opacity: 0 }}
        >
          {['NEXT.JS', 'REACT', 'TYPESCRIPT', 'FRAMER MOTION', 'GSAP', 'TAILWIND CSS'].map(
            (t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white/30"
              >
                {t}
              </span>
            )
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll absolute bottom-8 left-1/2 -translate-x-1/2" style={{ opacity: 0 }}>
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/20">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="h-8 w-px bg-gradient-to-b from-white/30 to-transparent"
          />
        </div>
      </div>
    </section>
  );
}

// Marquee Divider
function MarqueeDivider() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        marqueeRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: marqueeRef.current,
            start: 'top 90%',
          },
        }
      );
    }, marqueeRef);
    return () => ctx.revert();
  }, []);

  const text = 'CRAFTING HIGH PERFORMANCE DIGITAL INTERFACES  ·  AVAILABLE FOR PROJECTS  ·  ';

  return (
    <div ref={marqueeRef} className="overflow-hidden border-y border-white/5 py-4 opacity-0">
      <div className="animate-marquee flex whitespace-nowrap">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/20">
          {text}
          {text}
        </span>
      </div>
    </div>
  );
}

// Section Heading with scroll animation
function SectionHeading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className="mb-16">
      <motion.span
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, ease: 'power3.out' }}
        className="mb-4 inline-block font-mono text-[11px] uppercase tracking-[0.3em] text-white/30"
      >
        {label}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 60, skewY: 3 }}
        animate={isInView ? { opacity: 1, y: 0, skewY: 0 } : {}}
        transition={{ duration: 0.8, ease: 'power4.out', delay: 0.1 }}
        className="text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'power3.out', delay: 0.3 }}
          className="mt-4 max-w-2xl text-sm leading-relaxed text-white/40 md:text-base"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}

// About Section
function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const cards = [
    {
      num: '01',
      title: 'Engineering-first',
      desc: 'Component architecture, state, and rendering strategy are decided before a single pixel is polished. Performance is a design constraint, not a post-launch fix.',
    },
    {
      num: '02',
      title: 'Systemic Design',
      desc: 'Typography, spacing, and motion are treated as a system with rules — not one-off decisions per screen. Consistency compounds.',
    },
    {
      num: '03',
      title: 'Motion with Intent',
      desc: 'Animation is used to clarify hierarchy and state, never to decorate. If a transition doesn\'t help the user understand what changed, it doesn\'t ship.',
    },
  ];

  return (
    <section ref={sectionRef} id="about" className="relative px-6 py-32 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          label="01 / About"
          title="Studio"
          description="I build interfaces the way engineers build systems — and refine them the way designers refine type. Every project starts from the same question: what does this interface need to do, and what is the fastest, clearest way to let it do that."
        />

        <div className="grid gap-8 md:grid-cols-3">
          {cards.map((card, i) => (
            <AboutCard key={card.num} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutCard({ card, index }: { card: { num: string; title: string; desc: string }; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        ease: 'power3.out',
        delay: index * 0.15,
      }}
      className="group relative rounded-lg border border-white/5 bg-white/[0.02] p-6 transition-all duration-500 hover:border-white/10 hover:bg-white/[0.04] md:p-8"
    >
      <span className="mb-6 block font-mono text-3xl font-light text-white/10">
        {card.num}
      </span>
      <h3 className="mb-3 text-lg font-medium text-white">{card.title}</h3>
      <p className="text-sm leading-relaxed text-white/40">{card.desc}</p>
      <div className="glow-line absolute bottom-0 left-0 w-full scale-x-0 transition-transform duration-700 group-hover:scale-x-100" />
    </motion.div>
  );
}

// Services Section
function ServicesSection() {
  return (
    <section id="services" className="relative px-6 py-32 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading label="02 / What I Do" title="Services" />

        <div className="space-y-0">
          {SERVICES.map((service, i) => (
            <ServiceRow key={service.num} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceRow({
  service,
  index,
}: {
  service: { num: string; title: string; description: string };
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{
        duration: 0.6,
        ease: 'power3.out',
        delay: index * 0.1,
      }}
      className="group border-t border-white/5 py-8 transition-colors duration-300 hover:bg-white/[0.02]"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-12">
        <span className="shrink-0 font-mono text-sm text-white/20">{service.num}</span>
        <div className="flex-1">
          <h3 className="mb-2 text-xl font-medium text-white transition-colors duration-300 group-hover:text-white/90 md:text-2xl">
            {service.title}
          </h3>
          <p className="max-w-xl text-sm leading-relaxed text-white/35">{service.description}</p>
        </div>
        <svg
          className="mt-1 h-5 w-5 shrink-0 text-white/10 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M7 17L17 7M17 7H7M17 7V17" />
        </svg>
      </div>
    </motion.div>
  );
}

// Skills Section
function SkillsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section ref={sectionRef} className="relative px-6 py-32 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading label="03 / Skills" title="Capabilities" />

        <div className="grid gap-x-16 gap-y-8 md:grid-cols-2">
          {SKILLS.map((skill, i) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1, ease: 'power3.out' }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-white/70">{skill.name}</span>
                <span className="font-mono text-xs text-white/25">{skill.level}%</span>
              </div>
              <div className="h-px w-full overflow-hidden bg-white/5">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: skill.level / 100 } : {}}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.1 + 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="h-full origin-left bg-gradient-to-r from-white/40 to-white/10"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Project Card
function ProjectCard({
  project,
  index,
}: {
  project: (typeof PROJECTS)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const linkRef = useRef<HTMLAnchorElement>(null);
  useMagneticHover(linkRef, 0.15);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 80 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.8,
        ease: 'power4.out',
        delay: index * 0.15,
      }}
    >
      <a
        ref={linkRef}
        href={project.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] transition-all duration-500 hover:border-white/10"
      >
        {/* Project visual header */}
        <div className="relative h-48 overflow-hidden border-b border-white/5 md:h-64">
          {/* Abstract pattern representing the project */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="absolute h-40 w-40 rounded-full opacity-10 blur-3xl transition-all duration-700 group-hover:opacity-20 group-hover:scale-110"
              style={{ background: project.color }}
            />
            <div className="relative grid grid-cols-3 gap-2 p-6 opacity-30">
              <div className="h-20 rounded-md bg-white/10" />
              <div className="col-span-2 flex flex-col gap-2">
                <div className="h-12 rounded-md bg-white/10" />
                <div className="h-6 rounded-md bg-white/5" />
              </div>
              <div className="col-span-3 h-4 rounded-md bg-white/5" />
              <div className="h-8 rounded-md bg-white/10" />
              <div className="h-8 rounded-md bg-white/5" />
              <div className="h-8 rounded-md bg-white/10" />
            </div>
          </div>

          {/* Badge */}
          <div className="absolute left-4 top-4 z-10">
            <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white/60 backdrop-blur-md">
              Project
            </span>
          </div>

          {/* Metrics overlay */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap gap-x-6 gap-y-2 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent px-5 pb-4 pt-10">
            {project.metrics.map((m) => (
              <div key={m.label}>
                <div className="text-sm font-medium text-white">{m.value}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/30">
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-[#050505]/30 transition-opacity duration-500 group-hover:opacity-0" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">
            {String(index + 1).padStart(2, '0')} — {project.category}
          </span>
          <h3 className="mt-2 text-xl font-medium leading-tight text-white md:text-2xl">
            {project.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-white/35">{project.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-white/30"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-white/50 transition-colors duration-300 group-hover:text-white">
              View Project
            </span>
            <svg
              className="h-4 w-4 text-white/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </div>
        </div>

        {/* Hover glow */}
        <div
          className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(480px circle at 50% 50%, ${project.color}15, transparent 60%)`,
          }}
        />
      </a>
    </motion.div>
  );
}

// Work Section
function WorkSection() {
  return (
    <section id="work" className="relative px-6 py-32 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          label="04 / Selected Work"
          title="Projects"
          description="A selection of projects shipped with care — each one solving a real problem, each one built to perform."
        />

        <div className="grid gap-8 md:grid-cols-2">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact Section
function ContactSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const emailRef = useRef<HTMLAnchorElement>(null);
  useMagneticHover(emailRef, 0.15);
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} id="contact" className="relative px-6 py-32 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: 'power4.out' }}
          className="text-center"
        >
          <span className="mb-6 inline-block font-mono text-[11px] uppercase tracking-[0.3em] text-white/30">
            05 / Contact
          </span>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-7xl">
            Let&apos;s work
            <br />
            together
          </h2>
          <p className="mx-auto mb-10 max-w-md text-sm leading-relaxed text-white/40">
            Have an interface that needs to feel faster? A product that needs a design system?
            Let&apos;s build it.
          </p>

          <a
            ref={emailRef}
            href="mailto:hi.aditya.dev@gmail.com"
            className="magnetic-hover inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/5 px-10 py-4 font-mono text-sm uppercase tracking-[0.15em] text-white backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10"
          >
            hi.aditya.dev@gmail.com
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>

          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.15em] text-white/25">
              <span>
                Email:{' '}
                <a href="mailto:hi.aditya.dev@gmail.com" className="text-white/40 hover:text-white/70 transition-colors">
                  hi.aditya.dev@gmail.com
                </a>
              </span>
              <span>
                GitHub:{' '}
                <a
                  href="https://github.com/witejackel-eng"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  witejackel-eng
                </a>
              </span>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/20">
              Based in India · Available remote · {time}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-6 md:px-12 lg:px-20">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="font-mono text-[11px] text-white/20">
          © 2026 ADITYA — Built with Next.js, GSAP & Framer Motion
        </span>
        <button
          onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}
          className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/20 transition-colors duration-300 hover:text-white/50"
        >
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}

/* ──────────────── MAIN PAGE ──────────────── */
export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const mainRef = useRef<HTMLDivElement>(null);

  const handlePreloaderComplete = useCallback(() => {
    setLoaded(true);
  }, []);

  // Track active section
  useEffect(() => {
    if (!loaded) return;

    const sections = NAV_ITEMS.map((item) => ({
      id: item.id,
      el: document.getElementById(item.id),
    }));

    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight / 3;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.el && section.el.offsetTop <= scrollY) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loaded]);

  return (
    <>
      <Preloader onComplete={handlePreloaderComplete} />
      <CustomCursor />
      <div className="noise-overlay" />

      <Navigation activeSection={activeSection} />
      <MobileNav />

      <main ref={mainRef} className={loaded ? '' : 'overflow-hidden'}>
        <HeroSection />
        <MarqueeDivider />
        <AboutSection />
        <MarqueeDivider />
        <ServicesSection />
        <SkillsSection />
        <WorkSection />
        <ContactSection />
        <Footer />
      </main>
    </>
  );
}