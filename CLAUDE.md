# CLAUDE.md — Signal Portfolio

Personal portfolio for **Jahongir Abrorkulov** (16, Tashkent, Uzbekistan) — Frontend & AI/Systems
developer. Single-page React site, dark "terminal / systems lab" aesthetic, deployed on Vercel at
`abrorkulov.uz`.

---

## Commands

| Task | Command |
|---|---|
| Dev server (HMR) | `npm run dev` → http://localhost:5173 |
| Production build | `npm run build` (runs `tsc -b` first — build fails on type errors) |
| Preview the build | `npm run preview` → http://localhost:4173 |
| Lint | `npm run lint` |
| Typecheck only | `npx tsc --noEmit -p tsconfig.json` |
| Format a file | `npx prettier --no-semi --single-quote --write <file>` |

There is **no test suite**. Verification = typecheck + lint + build + loading the preview in a browser.

> **Prettier has no config file.** Always pass `--no-semi --single-quote`. Running bare `npx prettier`
> rewrites the whole file to double quotes + semicolons, which does not match this codebase.

---

## Architecture

Vite + React 18 SPA. One page, several `<section>` elements; the navbar scroll-spies between them.
There is no router — nav links are `#hash` anchors.

```
index.html            Meta/SEO/JSON-LD, Google Fonts <link>, favicon, PWA manifest link
src/main.tsx          Entry. Registers the service worker (PROD only), boots analytics.
src/App.tsx           Section order + <MotionConfig> + per-section <ErrorBoundary>.
src/index.css         Tailwind layers + all custom classes (.glass-card, .text-gradient-*, …).
tailwind.config.ts    Design tokens: void/signal/pulse/ink colours, display/body/mono fonts.
vite.config.ts        Build config. Read the manualChunks comment before touching it.
public/sw.js          Service worker. Read the fetch-handler comment before touching it.
```

### `src/data/content.ts` — the single source of all copy

Every string, skill, project and timeline entry lives here so components stay presentational.
**To change site content, edit this file, not the components.** Exports: `profile`,
`skillCategories`, `trajectory`, `education`, `timelineEvents`, `projects`, `interests`.

### `src/lib/` — shared logic

| File | Role |
|---|---|
| `useMotionProfile.ts` | **The motion tier.** Decides `full` vs `lite` once from pointer type, viewport, device memory and reduced-motion; stamps it on `<html data-motion>` before first paint. Read this before touching anything below. |
| `motion.ts` | **The motion vocabulary.** `ease`, `spring`, `fadeUp`, `blurUp`, `lineReveal`, `scaleIn`, `driftIn`, `staggerParent`, `inView`, `hoverOnly`. Every value is tier-aware. |
| `pointerFx.ts` | `useMagnetic` (buttons lean toward the cursor) and `useTilt` (card tilt + pointer-tracked highlight). Full tier only; refs and rAF, never state. |
| `useScrollSpy.ts` | `useScrollSpy` (IntersectionObserver, shared by the navbar and the scroll rail) and `useScrolledPast` (rAF-throttled `scrollY`). |
| `techMeta.ts` | Brand colour + icon-CDN slug + fallback monogram for all 41 technologies. Also `readableAccent()`. |
| `useCanSupport3D.ts` | Gates the WebGL hero: ≥1024px, WebGL present, not reduced-motion. |
| `analytics.ts` | Section-view IntersectionObserver; dispatches a `portfolio_analytics` CustomEvent. No third party. |
| `utils.ts` | `cn()` class joiner. |

### `src/components/` — rendered sections, in page order

`Navbar` → `Hero` (+`Hero3D`/`Hero3DFallback`) → `About` → `TrainTimeline` → `Skills` →
playground (`PacketRunner`, `CodePlayground`) → `Projects` → `Footer` (+`ContactForm`).

Cross-cutting: `ParticleBackground` (fixed canvas), `CursorGlow` (full tier only),
`ScrollProgress` (top bar, side rail, FABs),
`SectionHeader` (numbered eyebrow/title/description/aside), `Panel` (shared chrome for the
playground widgets), `ErrorBoundary`, `TechIcon`.

Sections are numbered 01–06 via `SectionHeader`'s `index` prop (the footer hand-rolls its own 06).
Keep them in order if you add or remove a section.

**Currently unrendered** (present but not imported by `App.tsx`): `LearningTrajectory`, `Gaming`,
`DinoGame`, `Cert3DBackground`, `LoadingScreen`. Note `LearningTrajectory` also uses
`id="trajectory"` — it would collide with `TrainTimeline` if both were mounted.

---

## Stack

React 18 · TypeScript 5.6 (strict) · Vite 5 · Tailwind 3.4 · Framer Motion 11 ·
three + @react-three/fiber + drei · lucide-react · recharts (only used by the unrendered
`LearningTrajectory`) · ESLint 9 flat config.

---

## Code style & patterns

- **Single quotes, no semicolons, 2-space indent.** Match surrounding code.
- **Comments explain *why*, never *what*.** Several comments in this repo record a bug that was
  fixed and why the code must stay that way — do not delete them.
- **Content lives in `content.ts`; components render it.**

### Motion tiers — the page has two performances

`useMotionProfile.ts` picks one of two budgets at startup and never changes it:

- **`full`** — fine pointer, ≥1024px, healthy hardware. Backdrop blur, animated gradients,
  cursor-tracked highlights, card tilt, magnetic buttons, longer travel, blur reveals.
- **`lite`** — touch, narrow, low device memory, or reduced-motion. Same choreography, expensive
  parts removed: no `filter`/`clip-path` animation, no backdrop blur, no pointer listeners,
  shorter travel, tighter staggers, half-rate particle canvas.

There are **two gates and you usually want both**:

1. `@media (hover: hover) and (pointer: fine) and (min-width: 1024px)` in `index.css`. No
   JavaScript, correct on the first frame. This is where paint-cost decisions belong.
2. `html[data-motion='lite']`, stamped by `syncMotionTier()` in `main.tsx` before React mounts.
   It outranks the media query and catches what CSS cannot see — low memory, reduced-motion.

In TypeScript: `motion.ts` reads the tier **once at import** and bakes it into the variants. That
is deliberate — a variant object whose identity changed mid-session would restart every animation
using it. Components that need a live value call `useMotionProfile()`, which does re-evaluate on
resize and pointer change.

Wrap hover gestures in `hoverOnly({ whileHover: … })`. A `whileHover` prop makes Framer attach
pointer listeners a touch device can never fire, and the skills grid was paying for 41 of them.

### Pointer effects own `transform` — Framer must not

`useTilt` writes `transform` (via `.tilt-surface`) straight onto its element. Framer Motion writes
an **inline** `transform` for every variant, and inline beats a class every time. So:

- `.tilt-surface` (tilt + highlight + hover lift) goes on an element **Framer is not animating** —
  give the card a `motion` wrapper for its entrance and put the surface on a plain inner div.
- `.tilt-glow` (highlight only, no transform) is safe directly on a `motion` component. Use it when
  a wrapper would break the markup — the About fact tiles are `dt`/`dd` inside a `dl`.

Same rule for `useMagnetic`: its element must be a plain `<a>`, never a `motion.a`.

### Motion — always use `src/lib/motion.ts`

Do not hand-write durations or easing curves. The pattern is a staggered parent with declarative
children — no per-item `delay: i * 0.1` arithmetic:

```tsx
<motion.div variants={staggerParent(0.08)} initial="hidden" whileInView="show" viewport={inView}>
  {items.map((item) => <motion.div key={item.id} variants={fadeUp} />)}
</motion.div>
```

Three hard-won rules:

1. **`AnimatePresence mode="popLayout"` absolutely positions its children** — it collapsed the
   entire skills grid into one stack. Use `mode="wait"` on a keyed wrapper instead.
2. **`layout` on the same element as `whileInView` stops the reveal firing** (it stays at
   `initial`). Don't combine them.
3. **Content that can mount while already on screen must use `animate`, not `whileInView`** — e.g.
   the skill cards and progress bars, which remount when a filter is clicked.

`<MotionConfig reducedMotion="user">` in `App.tsx` handles reduced-motion for JS animation; the CSS
media query alone could never cover Framer.

### Shared design pieces

- **`Panel`** — icon tile + title + subtitle + `meta`/`actions` header, used by Packet Runner and
  the Code Playground. Both had hand-rolled the same header as one flex row that broke under
  ~600px. New widgets should use it rather than re-rolling the chrome.
- **`.section-rule`** — the fading gradient hairline between sections. Replaces flat
  `border-t border-white/5`, which chopped the page into hard slabs. Needs `position: relative` on
  the element (it draws via `::before`), so don't put it on unpositioned inner dividers.
- **`.inset-surface`** — recessed panel for editor/console/HUD surfaces.
- **`body::after`** carries a fixed SVG noise overlay at 3.5% opacity. Large flat dark areas band on
  cheap panels; the grain gives them material. It is `pointer-events: none` and `z-index: 1`.

### Responsive

Mobile-first. `sm:` = 640, `md:` = 768, `lg:` = 1024.

- Headings use fluid `text-[clamp(...)]`, not breakpoint jumps.
- Hero uses `min-h-[100svh]` — **not `100vh`**, which is taller than the visible area on phones.
- Everything tappable clears `min-h-[44px]`.
- Inputs are forced to 16px under 640px, or iOS Safari zooms the page on focus.
- `.scrollbar-none` and `.safe-bottom` utilities live in `index.css`.

### Skills collapse

`PREVIEW_COUNT = 4` in `Skills.tsx` caps each category at one desktop row; a "Show N more" button
expands it. Selecting a single discipline in the filter counts as asking for that group, so it
opens fully without a second click. 41 cards expanded is roughly five screens of grid.

Cards below the preview cut use an explicit `initial`/`animate` pair instead of `variants={fadeUp}`.
That is deliberate: they mount while the parent is already in its `show` state, so inheriting the
variant would snap them in with no animation.

### Icons — `TechIcon` / `techMeta.ts`

Logos come from `cdn.simpleicons.org`. **That CDN drops brands** (C#, VS Code and OpenAI were all
removed over trademark requests) and throttles when ~29 requests fire at once. So:

- Every entry carries a `mono` monogram and/or a lucide `icon` fallback.
- `TechIcon` paints the fallback **first** and cross-fades the logo over it on load — a tile is
  never blank, never a broken-image glyph, works offline.
- **Verify any new slug returns 200 before adding it:** `curl -o /dev/null -w "%{http_code}" https://cdn.simpleicons.org/<slug>`
- `readableAccent()` lightens dark brand colours (C++ navy, SQLite navy) so text and progress bars
  stay legible on the near-black background. Logos keep their true colour; UI accents use the
  lightened value.

### Performance rules

These five are the mobile-jank list. Each one was measured, not guessed.

- **Never `background-attachment: fixed`.** The ambient wash used to sit on `body` that way. A
  fixed background cannot be moved by the compositor, so every scroll frame repainted three
  radial gradients across the whole viewport — the single largest cause of stutter on phones.
  It now lives on a `position: fixed` `body::before`, which the compositor just slides.
- **Backdrop blur is full-tier only.** `.glass-card` has a dozen instances on screen at once and
  each one makes the compositor re-read the pixels behind it every frame it moves. On `lite` the
  translucency is faked with a slightly lighter opaque fill; against near-black nobody can tell.
- **Animate `transform`/`opacity`, never `width`/`top`.** The proficiency bars grew via `width`,
  relaying out twenty grid rows per frame — they now scale `scaleX` from a left origin. The
  timeline train drove `top`; it now measures the rail once and drives `y` in pixels.
- **Never read layout in a scroll handler.** The navbar and the scroll rail each ran their own
  `scroll` listener calling `element.offsetTop`, which forces a synchronous layout flush — twice
  per event, mid-scroll. Both now share `useScrollSpy` (IntersectionObserver) and
  `useScrolledPast` (rAF-throttled, reads `scrollY` only).
- **Never put `three` in `manualChunks`.** Naming it there pulls it into the entry's preload graph —
  270 kB gzipped on every first paint, including phones where the canvas never renders. `Hero3D` is
  `lazy()`-imported and Rollup keeps three inside that chunk.
- **Never drive per-frame values through React state.** `ParticleBackground` and `Hero3D` keep
  pointer position in refs. Putting it in state re-ran the effect on every mousemove and re-seeded
  every particle dozens of times a second.
- Canvases pause when off-screen or hidden (`IntersectionObserver` + `visibilitychange`). The
  particle field also halves its frame rate, drops the O(n²) link pass, caps DPR at 1.5 and wires
  up no pointer listeners at all on `lite`.

### Service worker (`public/sw.js`) — read before editing

Navigation requests are **network-first**; only `/assets/*` (content-hashed) is cache-first. It was
cache-first on everything with a fixed cache name, which meant every deploy served returning
visitors a stale `index.html` pointing at asset hashes that no longer existed → **blank white page**.
If you change the strategy, bump `CACHE_NAME`.

---

## Current Status & Next Steps

### What was accomplished across these two sessions

**Session 1 — bug hunt and skills rebuild**

- **Fixed the deploy-breaking service worker.** Cache-first navigation served stale HTML referencing
  deleted asset hashes; returning visitors got a white page. Reproduced it, rewrote the SW
  network-first, and regression-tested a rebuild-then-reload.
- **Fixed the skills icons.** 7 of 21 CDN URLs were 404ing. Built `TechIcon` + `techMeta` with
  verified slugs and guaranteed fallbacks.
- **Fixed a latent crash:** unguarded `categoryConfig[label]` would throw on any new category.
- **Rewrote `ParticleBackground`** — the effect depended on mouse state, so every mousemove tore
  down the loop and re-seeded all particles.
- **Lazy-loaded Three.js**: first load ~340 kB → ~113 kB gzipped.
- Fixed: dead `#telemetry` link, duplicate `id="top"`, doubled hero location string, invisible-but-
  clickable FABs, a "View Project" button wired to nothing, a contact form that faked success while
  sending nothing (now opens a prefilled email), missing form labels, missing favicon, timeline
  copy/keys/icon-map, footer heading and icon, prod console logging.
- Added the ESLint flat config (`npm run lint` had been failing outright) and fixed everything it found.

**Session 2 — design, motion, responsive**

- **Removed System Telemetry** entirely (component, section, nav entries).
- **Rewrote `Hero3D`**: volumetric halo, orbiting satellites, three orbit rings, damped pointer
  parallax, breathing scale, viewport-aware scaling, geometry disposal, and `frameloop` that stops
  when the hero scrolls off-screen.
- **Built `src/lib/motion.ts`** and migrated every section to it — consistent easing and declarative
  staggers replace ad-hoc per-item delays.
- **Expanded skills from 20 → 41** across **5** categories (added a Databases group; new entries in
  Frontend, Backend, AI & Systems, Tools).
- **Skills UX**: shared-element filter pill that slides between tabs, horizontally scrollable filter
  row on phones, whole-group cross-fade on filter change.
- **Responsive pass**: fluid `clamp()` typography, `100svh`, 44px tap targets, redesigned mobile nav
  drawer (staggered links, scroll lock, Escape to close, CTA), safe-area insets, iOS zoom fix,
  overscroll containment.
- Added `<MotionConfig reducedMotion="user">`.

**Session 3 — design system, section redesigns**

- **Skills collapse.** 41 cards shown at once was the section's main problem; it now previews 4 per
  category (20 on screen) behind per-category "Show N more" toggles, with a count badge on each
  heading.
- **Removed** nothing this session; **added** `Panel` and pulled Packet Runner and the Code
  Playground onto it.
- **Packet Runner**: HUD moved above the canvas (the floating overlay covered the runner on narrow
  screens), `aspect-ratio` on the canvas so it never letterboxes, and real touch buttons for
  Jump / Set checkpoint / Respawn — the keyboard shortcuts were unreachable on a phone.
- **Code Playground**: proper editor chrome (traffic lights, filename, live line count), a separate
  console pane with its own header and a `clear` action, typed output lines (log / error / info)
  that animate in, a labelled Reset that previously wore a Terminal icon, a working `sr-only` label
  on the textarea, and a clipboard fallback for non-secure contexts.
- **Section identity**: numbered 01–06 headers with a hairline running out to the margin,
  `.section-rule` separators, and a page-wide grain overlay.
- **About**: added an at-a-glance stat strip (age / location / focus / languages) above the prose.
- **Journey**: a node on the rail per event, tidier cards, wider measure. Also fixed the train —
  `useSpring` was being handed an already-mapped percentage string, so its travel had no relation to
  the rail's height. It now springs the numeric progress first and drives `top`.
- **Projects**: oversized index watermark per card, tighter header row, fluid type.
- **Get in touch**: numbered header, plus the social links from `profile.socials` that had been
  defined in `content.ts` but never rendered anywhere. Only entries whose URL points past the domain
  root are shown, so the bare placeholders stay hidden until they are filled in.

**Session 4 — two-tier motion: smoother phones, richer desktop**

The brief was "phone stutters, desktop should be more animated, and the whole thing should look
more modern." That is two problems, so the page now has two performances.

- **Built the tier system.** `useMotionProfile.ts`, `html[data-motion]`, and a matching media-query
  gate in `index.css`. `motion.ts` variants, viewport thresholds, travel distances and stagger
  gaps are all derived from the tier.
- **Fixed the four things that were actually costing frames on a phone**: the fixed-attachment
  background wash, backdrop blur on every card, `width`-animated progress bars, and two scroll
  handlers reading `offsetTop` on every event. See *Performance rules* above for each.
- **Rewrote the particle field per tier.** Density now scales with viewport area; `lite` runs at
  30fps, skips the O(n²) link pass entirely, caps DPR at 1.5 and registers no pointer listeners.
  Squared-distance comparisons keep the square root off the inner loop on `full`.
- **Added the desktop layer**: `CursorGlow` (a lagging pool of light, transform-only), `useMagnetic`
  on the hero CTAs and nav button, `useTilt` on 34 card surfaces, a sheen that crosses the project
  cards on hover, a slow drift on the background wash, and a highlight that travels the headline.
- **Reworked the entrances.** New `blurUp`, `lineReveal`, `scaleIn` and `driftIn` variants; every
  heading on the page — hero, all five section headers, the footer — now wipes up from behind its
  own baseline, and each section header's hairline draws itself out.
- **Navigation**: the nav's active state is a pill that slides between items, and the left rail is
  a table of contents whose labels expand for the active section instead of six anonymous dots.
- **Extracted components** where the tilt hook needed a non-Framer element: `SkillCard`,
  `ProjectCard`, `TimelineCard`, `FactTile`, `ExpertiseCard`, `MagneticLink`.

### Fully operational

Typecheck, lint and build are all clean. Verified in a real browser: all 41 skill cards render, all
5 filters work, no console errors, no duplicate IDs, no dead anchor links, no horizontal overflow,
and the service-worker deploy regression test passes.

Verified again after session 3: 20 skill cards collapsed / 41 expanded, 5 "Show more" toggles,
2 social links rendered (GitHub + LinkedIn — the rest are still placeholders), 13 panels, no
duplicate IDs, no dead anchors, no horizontal overflow. The Code Playground runs and prints output.

Verified again after session 4, in a real browser at the full tier: no console output of any
kind, no duplicate IDs, no dead anchors, `scrollWidth === clientWidth` (no horizontal overflow),
20 collapsed skill cards, 34 tilt surfaces, 9 line-reveal headings. Forcing
`data-motion="lite"` confirmed the overrides land: opaque card fill, `backdrop-filter: none`,
background animation off, tilt highlight removed.

Build output: `index` ~68 kB gz + `motion-vendor` 43 kB gz + CSS ~9 kB gz on first paint;
`Hero3D` 227 kB gz loads lazily and only on ≥1024px WebGL devices.

### Next steps

1. **Verify the new skill entries.** Session 2 added ~21 technologies (Python, SQL, PostgreSQL,
   MySQL, MongoDB, SQLite, Express, REST APIs, HTML5, CSS3, Sass, GitHub, npm, Bash, Vercel, Figma,
   Vite, Machine Learning, Networking, Data Structures, Windows Internals) with **assumed**
   proficiency levels and notes. Jahongir must confirm or prune these — they are currently claims
   the site makes on his behalf.
2. **Phone layout and the scroll spy were never visually confirmed.** Browser-window emulation
   still does not take effect in the automation session, and the automated tab reports
   `visibilityState: 'hidden'`, which suspends IntersectionObserver callbacks and smooth scrolling
   — so the `lite` tier and `useScrollSpy` are verified by forcing `data-motion` and by geometry,
   not by watching them. On a real phone, check: the hero, the nav drawer, the skills filter row,
   and that scrolling now feels smooth. On any real browser, scroll the page and confirm the navbar
   pill and the left rail track the section you are looking at.
3. **Decide on the unrendered components** listed above — wire them in or delete them. Watch the
   `id="trajectory"` collision.
4. **Three socials in `content.ts` are still bare placeholders** — `telegram: 'https://t.me/'`,
   `instagram: 'https://instagram.com/'`, `discord: 'https://discord.com'`. They are filtered out of
   the footer automatically; fill in the handles and they appear (Discord has no icon mapped yet).
5. **The contact form has no backend.** It opens the visitor's mail client. If a real inbox
   submission is wanted, wire up Formspree / Resend / a Vercel function.
6. **`public/Снимок экрана 2026-07-24 111904.png`** is a stray screenshot that ships to production
   on every deploy. Delete it unless it is deliberate.
7. Optional: `Hero3D` at 842 kB raw still trips Vite's chunk-size warning. It is lazy and gated, so
   this is cosmetic, but importing narrower three.js modules would quiet it.
