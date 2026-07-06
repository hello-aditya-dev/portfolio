# Aditya — Portfolio

A high-performance, animated portfolio website built with **Next.js 16**, **Three.js**, **GSAP**, and **Framer Motion**. Designed with a cinematic dark aesthetic featuring WebGL 3D elements, scroll-driven animations, and a grid background.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js)
![GSAP](https://img.shields.io/badge/GSAP-3-green?logo=greensock)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-React-purple?logo=framer)

## ✨ Features

- **WebGL 3D Hero** — Animated icosahedron with distortion material built using React Three Fiber
- **Grid Background** — Subtle grid overlay on dark background for a technical aesthetic
- **GSAP ScrollTrigger** — Scroll-driven text reveals, parallax effects, and staggered animations
- **Framer Motion** — Component-level enter/exit animations, layout transitions, and spring physics
- **Preloader** — Animated counter (0→100) with curtain slide-up reveal
- **Custom Cursor** — Dot + follower with `mix-blend-difference` effect
- **Magnetic Hover** — Buttons that subtly follow mouse movement
- **Responsive Design** — Mobile-first with hamburger nav using circle clip-path animation
- **Project Showcase** — 4 projects with laptop mockup cards, hover glow effects, and direct links

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| 3D / WebGL | Three.js, React Three Fiber, Drei |
| Animation | GSAP + ScrollTrigger, Framer Motion |
| Styling | Tailwind CSS 4 |
| Font | Geist Sans + Geist Mono |

## 📂 Project Structure

```
src/
├── app/
│   ├── globals.css     # Global styles, grid bg, custom cursor
│   ├── layout.tsx      # Root layout with dark theme
│   └── page.tsx        # Main portfolio page
└── components/
    └── ui/             # shadcn/ui components
```

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/witejackel-eng/portfolio.git
cd portfolio

# Install dependencies
bun install

# Run development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📸 Sections

1. **Hero** — 3-column layout with WebGL 3D icosahedron, name reveal, role & location
2. **About** — Two-column story section with bold headline + frontend/backend tool tags
3. **Projects** — 4 project cards with laptop mockups, tech stacks, and live links
4. **Contact** — "LET'S TALK" CTA with email and social links
5. **Footer** — Branded footer with logo, description, tech tags, and mini laptop mockup

## 🔗 Projects

- [IBS Commerce](https://ibs-com-aadi.vercel.app/) — Premium E-Commerce Platform
- [Corporate Lead-Gen Platform](https://corporate-leadgen-platform-jet.vercel.app/) — B2B Marketing Site
- [Aadi Card](https://aadi-card.vercel.app/) — Interactive Digital Card
- [Pulse Dashboard](https://pulse-aadi-project.vercel.app/) — Real-Time Analytics

## 📄 License

MIT © Aditya