# Signal — Developer Portfolio

Personal portfolio for **Jahongir Abrorkulov** — full-stack & AI engineer, Tashkent. A
single-page React site built with **React + TypeScript + Tailwind CSS**, using **React Three
Fiber** for the interactive hero core, **Framer Motion** for entrances and micro-interactions,
and **GSAP ScrollTrigger** for the scroll-scrubbed journey staircase.

## Design concept

The visual language ("Signal / Core") treats the page like a systems diagram: a near-black
background, a teal `signal` accent, a violet `pulse` accent, Anthropic's warm `claude` accent in
the AI section, monospace labels styled like code comments (`// section_name`), and a wireframe
icosahedron core in the hero standing in for architecture and low-level systems work.

## Stack

- **React 18 + TypeScript** (strict)
- **Vite 5**
- **Tailwind CSS** — custom theme in `tailwind.config.ts` (`void`, `signal`, `pulse`, `ember`,
  `claude`, `ink`)
- **@react-three/fiber** + **@react-three/drei** + **three** — the hero core and the journey
  staircase, both lazy-loaded and sharing one chunk
- **framer-motion** — the entrance vocabulary in `src/shared/motion/motion.ts`
- **gsap** + **ScrollTrigger** — the journey staircase's scrubbed climb, loaded on demand
- **lucide-react** — icons

## Project structure

Feature-sliced: a section owns its directory, anything shared lives in `shared/`, and
cross-module imports go through the `@/` alias (declared in both `tsconfig.json` and
`vite.config.ts`).

```
src/
  app/
    App.tsx              Section list, providers, per-section error boundaries
    sections.ts          THE SECTION REGISTRY — order, labels, numbers, nav & rail
  features/
    hero/                Hero, Hero3D (WebGL), Hero3DFallback, useCanSupport3D
    about/               About
    journey/             JourneySection, JourneyScene (WebGL), StaircaseStage (SVG)
    skills/              SkillsSection
    ai/                  AiSection, ClaudeTerminal
    playground/          PlaygroundSection, PacketRunner, CodePlayground
    projects/            ProjectsSection
    contact/             ContactSection, ContactForm
    chrome/              Navbar, ScrollProgress, FxToggle, CursorGlow, ParticleBackground
  shared/
    ui/                  SectionHeader, Panel, PanelSkeleton, TechIcon, ErrorBoundary
    motion/              motion.ts, useMotionProfile.ts, pointerFx.ts, useGsap.ts
    hooks/               useScrollSpy.ts, useNearViewport.ts
    lib/                 fx.ts, techMeta.ts, analytics.ts, utils.ts
  data/                  profile / skills / journey / projects / ai, behind content.ts
  styles/index.css
  main.tsx
```

### Two files worth knowing about

**`app/sections.ts`** — adding, removing or reordering a section means editing this file
and nothing else. The array order is the page order, the `01`-style header indices are
derived from it, and the navbar links, scroll rail and scroll-spy ids all come from the
same list. `SectionId` is a closed union, so a mistyped anchor is a compile error.

**`data/`** — all copy and structured data, so components stay presentational. Technology
names are typed as `TechName`, a union of the keys of `shared/lib/techMeta.ts`: naming a
technology that has no brand entry will not compile, which is what guarantees every icon
on the page resolves.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

### Build

```bash
npm run build     # runs `tsc -b` first — the build fails on type errors
npm run preview
npm run lint
```

There is no test suite. Verification is typecheck + lint + build + loading the preview.

## Motion tiers

The page has two performances, chosen once per device by `useMotionProfile` and published as
`data-motion` on `<html>`:

- **`full`** — fine pointer, ≥1024px, healthy hardware. Backdrop blur, the particle field, card
  tilt, magnetic buttons, the 3D hero, the 3D journey staircase, GSAP scroll timelines.
- **`lite`** — touch, narrow, low memory, or `prefers-reduced-motion`. **No animation at all**,
  no canvases, and neither three.js nor GSAP is ever fetched.

That split is deliberate and measured — see `CLAUDE.md` for the reasoning and the numbers.

## Visitor controls

Two switches in the navbar, persisted to `localStorage`:

- **Ambient particles** — turns the background constellation and cursor glow off for anyone who
  finds a moving background hard to read over. Not shown on the lite tier, which has neither.
- **Interface sound** — a very quiet synthesised tick on hover and click. **Off by default**, and
  it plays its own confirmation tick the moment it is switched on.

## Customizing

- **Colors / fonts**: `tailwind.config.ts`
- **Copy, skills, projects, journey steps**: `src/data/` (import via `@/data/content`)
- **Page sections and their order**: `src/app/sections.ts`
- **Hero 3D geometry/behaviour**: `src/features/hero/Hero3D.tsx`
- **Journey staircase**: `src/features/journey/JourneyScene.tsx` (WebGL) and
  `StaircaseStage.tsx` + `staircase.ts` (the SVG fallback)
