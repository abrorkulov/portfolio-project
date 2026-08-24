# Signal — Developer Portfolio

A modern, dark-mode, 3D-accented portfolio built with **React + TypeScript + Tailwind CSS**,
using **React Three Fiber** for the interactive hero core, **Framer Motion** for scroll and
micro-interactions, and **Recharts** for the learning trajectory chart.

## Design concept

The visual language ("Signal / Core") treats the page like a systems diagram: a near-black
background, a teal "signal" accent, a violet "pulse" accent for AI-related content, monospace
labels styled like code comments (`// section_name`), and a wireframe icosahedron core in the
hero standing in for architecture and low-level systems work.

## Stack

- **React 18 + TypeScript**
- **Tailwind CSS** — custom theme in `tailwind.config.ts` (colors: `void`, `signal`, `pulse`, `ember`, `ink`)
- **@react-three/fiber** + **@react-three/drei** + **three** — the hero's 3D core
- **framer-motion** — scroll reveals, hover states, page-load sequence
- **recharts** — the learning trajectory area chart

## Project structure

```
src/
  components/
    Navbar.tsx
    Hero.tsx              # headline + CTA + mounts the 3D core
    Hero3D.tsx             # React Three Fiber canvas (desktop/capable devices)
    Hero3DFallback.tsx     # CSS/SVG fallback for mobile & no-WebGL
    About.tsx
    LearningTrajectory.tsx # Recharts area chart + education highlights
    Skills.tsx
    Journey.tsx
    JourneyDeck.tsx
    JourneyRail.tsx
    Statement.tsx
    Gaming.tsx
    Footer.tsx
    SectionHeader.tsx      # shared eyebrow/heading pattern
  data/
    content.ts              # all copy & structured data — edit this to update the site
  lib/
    utils.ts
    useCanSupport3D.ts       # decides WebGL vs fallback per device/viewport/reduced-motion
  App.tsx
  main.tsx
  index.css
```

All page content — bio, skills, timeline milestones, education, hobbies — lives in
`src/data/content.ts`, so you can update the site without touching component code.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

### Build

```bash
npm run build
npm run preview
```

## Responsiveness & fallbacks

- The 3D canvas only mounts when the viewport is ≥ 640px, WebGL is available, and the user
  hasn't requested reduced motion (`useCanSupport3D`). Otherwise a lightweight CSS/SVG core
  (`Hero3DFallback`) renders instead — same visual idea, no WebGL cost.
- All grid layouts collapse to a single column on small screens.
- `prefers-reduced-motion` is respected globally in `index.css`.

## Customizing

- **Colors / fonts**: `tailwind.config.ts`
- **Copy, skills, timeline milestones**: `src/data/content.ts`
- **3D core geometry/behavior**: `src/components/Hero3D.tsx`
