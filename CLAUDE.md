# CLAUDE.md — Signal Portfolio

Personal portfolio for **Jahongir Abrorkulov** (16, Tashkent, Uzbekistan) — Full-Stack & AI
engineer. Single-page React site, dark "terminal / systems lab" aesthetic, deployed on Vercel at
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

Vite + React 18 SPA. One page, several `<section>` elements; the navbar scroll-spies
between them. There is no router — nav links are `#hash` anchors.

The tree is **feature-sliced**. A section owns its own directory, and anything two
sections need lives in `shared/`. Cross-module imports go through the `@/` alias
(mirrored in `tsconfig.json` and `vite.config.ts`) — relative chains like
`../../shared/motion/motion` are how a sliced tree quietly turns back into
spaghetti, because moving a file silently rewrites what its neighbours mean.

```
index.html            Meta/SEO/JSON-LD, Google Fonts <link>, favicon, PWA manifest link
src/main.tsx          Entry. Stamps the motion tier, registers the service worker (PROD only).
src/app/
  App.tsx             Section list + <MotionConfig> + per-section <ErrorBoundary>.
  sections.ts         THE SECTION REGISTRY — read this before adding a section.
src/features/         One directory per section, plus `chrome/` for page furniture.
  hero/ about/ journey/ skills/ ai/ playground/ projects/ contact/ chrome/
src/shared/
  ui/                 SectionHeader, Panel, PanelSkeleton, TechIcon, ErrorBoundary
  motion/             motion.ts, useMotionProfile.ts, pointerFx.ts, useGsap.ts
  hooks/              useScrollSpy.ts, useNearViewport.ts
  lib/                fx.ts, techMeta.ts, analytics.ts, utils.ts
src/data/             The data layer (see below).
src/styles/index.css  Tailwind layers + all custom classes (.glass-card, .text-gradient-*, …).
tailwind.config.ts    Design tokens: void/signal/pulse/claude/ink colours, display/body/mono fonts.
vite.config.ts        Build config + the `@` alias. Read the manualChunks comment before touching it.
public/sw.js          Service worker. Read the fetch-handler comment before touching it.
```

### `src/app/sections.ts` — the section registry

**Adding, removing or reordering a section means editing this file and nothing
else.** The array order is the page order; the `01`-style indices are derived
from it, and `navSections` / `railSections` / `spyIds` all fall out of the same
list. `SectionId` is a closed union, so a typo in a nav link or a scroll-spy id
is a compile error rather than a dead anchor discovered by a visitor.

This replaced four copies of the same knowledge: the link array in `Navbar`, the
label array in `ScrollProgress`, a hardcoded `index="03"` string on every
`SectionHeader`, and a hand-written `07` in the contact footer. Nothing verified
that they agreed, and they had already drifted once.

`SectionHeader` takes `section="skills"`, not `index="03"`.

### `src/data/` — the data layer

Every string, skill, project and journey step lives here so components stay
presentational. **To change site content, edit these files, not the components.**

| File | Holds |
|---|---|
| `profile.ts` | Name, role, bio, languages, expertise groups, email, socials, education |
| `skills.ts` | The five categories and their entries |
| `journey.ts` | The four staircase steps and the technologies picked up at each |
| `projects.ts` | The six projects |
| `ai.ts` | The AI section: copy, the two-model split, principles, terminal session |
| `content.ts` | Barrel. **Import from `@/data/content`** — the split behind it is an implementation detail. |

Technology names are typed as `TechName`, a union derived from the keys of
`techMeta`. A skill, project stack entry or journey badge naming a technology
with no brand entry is a **compile error**, not a grey `?` tile found by a
visitor. Adding a technology means adding it to `techMeta` first — which is also
where the reminder to verify its CDN slug lives.

Arrays are annotated `readonly T[]` rather than `as const satisfies` — the
latter narrows to a union of specific tuples that consumers cannot work with.
The annotation still validates every entry.

### `src/shared/` — cross-cutting code

| File | Role |
|---|---|
| `motion/useMotionProfile.ts` | **The motion tier.** Decides `full` vs `lite` once from pointer type, viewport, device memory and reduced-motion; stamps it on `<html data-motion>` before first paint. Read this before touching anything below. |
| `motion/motion.ts` | **The motion vocabulary.** `ease`, `spring`, `fadeUp`, `blurUp`, `lineReveal`, `scaleIn`, `driftIn`, `staggerParent`, `inView`, `hoverOnly`. Every value is tier-aware. |
| `motion/pointerFx.ts` | `useMagnetic` (buttons lean toward the cursor) and `useTilt` (card tilt). Full tier only; refs and rAF, never state. |
| `motion/useGsap.ts` | **GSAP + ScrollTrigger**, behind a dynamic `import()`. Never enters the entry graph and never downloads on `lite`. `useGsapScroll` runs a setup inside a `gsap.context()` scoped to a ref, so one `revert()` on unmount kills every tween, trigger and inline style. |
| `hooks/useNearViewport.ts` | Gate for work that should not happen until the reader is close to it. Holds the playground widgets back so their `lazy()` chunks are not fetched on first render. |
| `hooks/useScrollSpy.ts` | `useScrollSpy` (IntersectionObserver, shared by the navbar and the scroll rail) and `useScrolledPast` (rAF-throttled `scrollY`). |
| `lib/techMeta.ts` | Brand colour + icon-CDN slug + fallback monogram for every technology, and the `TechName` union derived from it. Also `readableAccent()`. |
| `lib/fx.ts` | The visitor's ambient-effect switches (particles, sound) as a hand-rolled external store, plus the synthesised WebAudio tick. |
| `lib/analytics.ts` | Section-view IntersectionObserver; dispatches a `portfolio_analytics` CustomEvent. No third party. **Returns a teardown function and must be called from an effect** — see the note in the file. |
| `lib/utils.ts` | `cn()` class joiner. |
| `ui/*` | `SectionHeader`, `Panel`, `PanelSkeleton`, `TechIcon`, `ErrorBoundary`. |

### `src/features/` — sections, in page order

`Hero` (+`Hero3D`/`Hero3DFallback`) → `About` → `JourneySection`
(+`JourneyScene`, `StaircaseStage`) → `SkillsSection` → `AiSection`
(+`ClaudeTerminal`) → `PlaygroundSection` (+`PacketRunner`, `CodePlayground`) →
`ProjectsSection` → `ContactSection` (+`ContactForm`).

`features/chrome/` is the page furniture that is not a section:
`Navbar`, `ScrollProgress`, `FxToggle`, `CursorGlow`, `ParticleBackground`.

The navbar switches to its drawer at **1024px**, not 768 — six links no longer
fit beside the brand and the CTA at `md`. That boundary is also where the motion
tier flips, so "drawer" and "lite" now mean the same set of devices.

---

## Stack

React 18 · TypeScript 5.6 (strict) · Vite 5 · Tailwind 3.4 · Framer Motion 11 ·
GSAP 3.15 + ScrollTrigger · three + @react-three/fiber + drei · lucide-react ·
ESLint 9 flat config.

**Framer Motion and GSAP have a division of labour, and it is not negotiable by taste.** Framer
owns every *entrance* — declarative variants from one shared vocabulary, with an inert `lite`
tier. GSAP owns *scrubbed* timelines, where scroll position drives a sequence of unrelated
properties on unrelated elements. There is exactly one of those (the staircase climb). Do not
reach for GSAP for a fade-in, and do not try to scrub with `whileInView`.

---

## Code style & patterns

- **Single quotes, no semicolons, 2-space indent.** Match surrounding code.
- **Comments explain *why*, never *what*.** Several comments in this repo record a bug that was
  fixed and why the code must stay that way — do not delete them.
- **Content lives in `content.ts`; components render it.**

### Motion tiers — the page animates on desktop and holds still on phones

`useMotionProfile.ts` picks one of two budgets at startup and never changes it:

- **`full`** — fine pointer, ≥1024px, healthy hardware. Backdrop blur, animated gradients, card
  tilt, magnetic buttons, the 3D hero, the particle canvas, blur reveals, staggered entrances.
- **`lite`** — touch, narrow, low device memory, or reduced-motion. **No animation at all.**

`lite` used to mean "the same choreography, cheaper" — shorter travel, tighter staggers, a
half-rate canvas. That was not enough, and it is worth knowing why before anyone reintroduces it:

- Every entrance still meant Framer holding an animation for each of a few hundred elements.
- An element that starts at `opacity: 0` **cannot be the Largest Contentful Paint** until its
  observer has fired and its animation has run. The hero headline is the LCP element on a phone,
  and it was costing seconds.
- The canvas still cleared the full viewport and filled a few hundred particles every frame, on
  the same main thread as the scroll, for decoration at 32% opacity.

So on `lite`: every variant in `motion.ts` collapses to `STILL` (`{hidden:{}, show:{}}`), every
CSS keyframe animation is turned off by a blanket rule in `index.css` (`.animate-spin` is the one
exemption — it means "a chunk is still loading"), `ParticleBackground` returns `null`, and
`<MotionConfig reducedMotion="always">` backstops anything that hand-rolls its own values.

Components that hand-roll `initial`/`animate` instead of using the vocabulary must guard
themselves: `initial={isLiteMotion ? false : {...}}`. `initial={false}` tells Framer to start at
the animate state, which is exactly "render it finished".

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

### Hover is a hairline, not a spotlight

`.tilt-glow` and `.tilt-surface` used to carry a 340px radial highlight that followed the pointer
across the card, which meant `useTilt` writing `--px`/`--py` on every frame of every hover. It read
as a spotlight laid over the design rather than the card reacting to you.

Hover is now one `box-shadow` transition: a 1px accent ring and a slightly brighter top edge. The
same applies to `.skill-card`, whose brand-coloured radial bloom became a 1px gradient along the
top edge. `useTilt` writes only `--rx`/`--ry` now, and `.tilt-glow` is pure CSS — **do not call
`useTilt` for it**, there is nothing for the hook to drive.

### Pointer effects own `transform` — Framer must not

`useTilt` writes `transform` (via `.tilt-surface`) straight onto its element. Framer Motion writes
an **inline** `transform` for every variant, and inline beats a class every time. So:

- `.tilt-surface` (tilt + highlight + hover lift) goes on an element **Framer is not animating** —
  give the card a `motion` wrapper for its entrance and put the surface on a plain inner div.
- `.tilt-glow` (highlight only, no transform) is safe directly on a `motion` component. Use it when
  a wrapper would break the markup — the About fact tiles are `dt`/`dd` inside a `dl`.

Same rule for `useMagnetic`: its element must be a plain `<a>`, never a `motion.a`.

### Motion — always use `shared/motion/motion.ts`

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

### The journey (section 02) — a train you drive by scrolling

Five stations, five years. Everything picked up at a station is still aboard at the end
of the line — that is the section's argument, made by the graphic rather than asserted
in copy.

| | what it is | when it renders |
|---|---|---|
| `TrainScene` | **Real WebGL.** A CatmullRom track with rails and sleepers, five platforms with lit signs, and a locomotive whose position along the curve *is* the reader's scroll position. The camera travels with it. | Full tier **and** WebGL present (`useCanSupport3D`) |
| `RouteMap` | A transit-style route diagram — the same five stations, still, vertical. No canvas, nothing fetched. | Everywhere else |

`RouteMap` is drawn as a *diagram*, not a shrunken still of the 3D scene, because a small
static render of a 3D thing always looks like a 3D thing that failed.

**The scroll position lives in a ref, never state.** `progress` is written by a
ScrollTrigger `onUpdate` and read inside `useFrame`, so driving the train costs zero React
renders. `active` (which station has been reached) *is* state — it changes about five times
per section rather than sixty times a second, and both the cards and the platform lights
need it.

Three things here are easy to get wrong and were all got wrong first:

- **`Matrix4.lookAt` aligns −Z with the target.** The locomotive is modelled nose-forward
  along +Z, so feeding it the raw curve tangent drove the train backwards along its own
  route — cab leading, headlight trailing. The tangent is negated for this reason.
- **The camera lives outside the scaled group.** Aiming it at raw `curve.getPointAt()`
  coordinates points it at where the train would be at scale 1. Multiply by the same scale.
- **Emissive is added after lighting.** On a dark material it is not a tint, it is the
  colour. Platforms at `emissiveIntensity` 0.12 read as glowing green ramps; they sit at
  ~0.06, and the reached state is carried by the sign and the lamp instead.

The last station is flagged `upcoming: true` in the data and rendered differently —
amber, dashed leg, "next stop". It is an intention, not history, and nothing in the UI
may present it as something that already happened.

### Ambient effects the visitor controls (`lib/fx.ts`, `FxToggle`)

Two switches in the navbar, persisted to `localStorage`:

- **particles** — unmounts `ParticleBackground`, `CursorGlow` and `FallingTech`. Some people find
  a moving background genuinely hard to read over, and the only previous escape was an OS-wide
  reduced-motion setting. Not rendered on `lite`, which has no particles to switch off.
- **sound** — a synthesised WebAudio tick on hover/click. **Off by default and it must stay that
  way**; it plays its own confirmation tick the instant it is enabled, so nobody can turn it on
  without immediately hearing what they agreed to. No audio files — two oscillators and a gain
  ramp ship no bytes.

The store is hand-rolled on `useSyncExternalStore` rather than context: the consumers are
scattered and the value changes almost never, so a provider would re-render the tree to deliver
two booleans. **`getSnapshot` must return a stable object identity** — a fresh object per read is
an infinite render loop, not a subtle staleness bug.

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

- **Never give the app wrapper a background.** `body::before` paints the page's entire
  ambient wash and is a `position: fixed`, `z-index: 0` child of `<body>`. The app wrapper is
  also a positioned child of `<body>` with `z-index: auto`, so both land in the same paint
  group and DOM order decides — an opaque `bg-void` on the wrapper covered the wash
  completely. It was invisible for the life of the page and the background just looked like
  flat black. The same applies to `class="bg-void"` on `<body>` in `index.html`: a utility
  class there outranks the stylesheet's base layer. The base colour belongs in `index.css`
  and nowhere else.
- **Blurred discs stop working once the background is lit.** The hero and skills sections
  each had two `blur-3xl` circles as "ambient glow". Against flat black that reads as
  ambience; against an actual gradient it reads as a grey balloon, because a 96px blur on a
  384px circle still has a findable edge. Both are radial gradients now — no filter, no
  extra layer, no edge.
- **Never `overflow-x: hidden` on an ancestor of a `position: sticky` element — use
  `overflow-x: clip`.** `hidden` computes `overflow-y: auto`, which makes the element a scroll
  container, and a sticky descendant then resolves against *that* box instead of the viewport. It
  does not warn, it does not error: the element simply never sticks. Both `body` and the `App`
  wrapper (`.clip-x`) had it, which is why the staircase scrolled away with its cards for the
  first half of session 7. `clip` clips identically without creating a scroll container. Each
  declaration is written twice — `hidden` then `clip` — so Safari < 16 keeps the old behaviour
  rather than gaining a horizontal scrollbar. Keep both lines, in that order.
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
- **Never put `three` or `gsap` in `manualChunks`.** Naming them there pulls them into the entry's
  preload graph — 270 kB gzipped on every first paint, including phones where neither ever runs.
  `Hero3D` is `lazy()`-imported and Rollup keeps three inside that chunk; GSAP is reached only
  through the dynamic `import()` in `useGsap.ts`, which is also what keeps it off `lite`
  entirely. Verify after any build change: `grep -c "<gsap chunk name>" dist/index.html` must
  be 0.
- **Never drive per-frame values through React state.** `ParticleBackground` and `Hero3D` keep
  pointer position in refs. Putting it in state re-ran the effect on every mousemove and re-seeded
  every particle dozens of times a second.
- **Nothing decorative renders on `lite`.** The particle canvas returns `null`, the 3D hero never
  loads (`useCanSupport3D` gates at 1024px), and every CSS keyframe is off. Canvases that do run
  pause when off-screen or hidden (`IntersectionObserver` + `visibilitychange`).
- **`lazy()` fetches on render, not on visibility.** The playground widgets sat in the first render
  pass, so their chunks downloaded and their canvases mounted while the hero was still painting.
  `useNearViewport` holds them until the reader is within 600px.
- **The Google Fonts `<link>` must not block rendering.** It loads as `media="print"` and is
  promoted to `all` on load, with a `<noscript>` fallback. As a plain stylesheet link it was the
  single largest delay before anything appeared.
- **`content-visibility: auto` on off-screen sections, `lite` only.** It implies paint containment,
  which clips to the border box — that is why `.section-rule::after` is repositioned inside its box
  on `lite`. It is only safe *because* nothing animates on that tier: with `whileInView` entrances
  the skipped subtrees would not reveal correctly.

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

**Session 5 — the AI section, a rebuilt contact block, more phone headroom**

- **Added section 04, "A year of building with Claude"** (`AiPractice.tsx`, `id="ai"`), between
  Skills and the playground. The copy and `ClaudeTerminal` had been written in session 4 but were
  never wired to a section or imported anywhere. Playground, Projects and the footer shifted to
  05/06/07, and the section is in the navbar and the scroll rail.
- **Drew `public/claude-code.svg`** — a depiction of the CLI (welcome banner, a Read/Update/Bash
  transcript, the prompt), not a capture, so it is ~4 kB and sharp at any size. Dropping a real
  screenshot at the same path swaps it with no code change. `aiPractice.image` in `content.ts`
  carries the src, alt and caption.
- **Added the `claude` colour** (`#D97757`) to the Tailwind palette. The AI section is the one
  place the page steps off teal/violet, so the tooling it is about is recognisable at a glance.
- **Rebuilt Get in touch.** The heading spans the full width instead of sharing a column with the
  form, and the mixed bag of pill chips became one list of equal-height channel rows (email leads,
  then each configured social with its handle read out of the URL).
- **Rebuilt the contact form.** Focus state moved from a `focusedField` in React state — animated by
  Framer across `borderColor`, `backgroundColor` and `boxShadow` — to `:focus-within` in CSS
  (`.field`). Real `<label>`s replaced the `aria-label`-only inputs.
- **Removed two forever-running animations**: the sweep on the submit button and the sweep on the
  hero CTA each kept a Framer loop alive for the life of the page, off-screen included. The hero
  scroll-arrow bounce is now full-tier only.
- **Other phone work**: dropped `text-rendering: optimizeLegibility` from `body` (full kerning and
  ligature shaping across a document this long), added `touch-action: manipulation` to tappable
  elements (the ~300ms Android tap delay), and turned off the full-viewport grain overlay on `lite`
  — it exists to stop banding on large monitors and was a composited layer over every scrolling
  pixel.
- **Navbar breakpoint moved to `lg`** — see above.
- Large surfaces (`Panel`, project cards, `ClaudeTerminal`, the screenshot card, the form) settled
  on a 24px radius; tiles and chips stay at 16px.

**Session 6 — no motion on phones, a cleaner hero, a quieter hover, and the performance work**

Lighthouse mobile (local preview, simulated throttling) went **68 → 99**:

| | before | after |
|---|---|---|
| performance | 68 | 99 |
| first contentful paint | 2.1 s | 1.7 s |
| largest contentful paint | 5.0 s | 1.7 s |
| total blocking time | 380 ms | 40 ms |
| speed index | 4.3 s | 1.7 s |
| time to interactive | 5.0 s | 2.2 s |

- **`lite` now means no animation whatsoever** — see *Motion tiers* above for the mechanism and
  the reasoning. LCP was the headline story: the hero headline started at `opacity: 0` behind a
  staggered entrance, which is why largest-contentful-paint was 5 seconds.
- **Deferred the playground widgets** behind `useNearViewport`, and **made the font stylesheet
  non-blocking**. A phone's first load is now 4 requests: HTML, CSS (10 kB), `index` (70 kB) and
  `motion-vendor` (43 kB). Neither `Hero3D` (226 kB) nor the playground chunks are fetched.
- **`content-visibility: auto`** on every off-screen section on `lite`.
- **Rebuilt the hero's 3D.** Was a shell, a counter-rotating inner wireframe, a solid centre, a
  halo, 380 drifting particles and three coplanar rings — six things moving at six speeds with no
  focal point. Now: one lattice with lit vertices, a glowing heart, and two rings at different
  tilts each carrying its own satellite. The halo and heart are **sprites with a radial-gradient
  texture**, not spheres — an unlit sphere has one colour at every pixel, so no amount of opacity
  or additive blending stops it reading as a flat grey disc, which is exactly how the old ones
  looked.
- **Replaced the hover treatment** — see *Hover is a hairline* above.
- **Copy**: the AI section is now three years with AI, all three with Claude, says Claude is one
  of the best models available, and credits the engineers at Anthropic who built it.
- **Fixed a pre-existing collision**: the left scroll rail is `fixed left-6` while the content is
  centred in a 1280px container, so between 1024px and ~1500px its expanded labels ran into the
  headline. It is `2xl:flex` now.

**Session 7 — full-stack repositioning, the staircase, GSAP, and visitor controls**

The brief was an Awwwards-level overhaul: richer motion, GSAP ScrollTrigger, a better 3D scene,
a "learning journey staircase" with falling elements, and a content rewrite around full-stack +
AI. The two-tier motion system was kept intact throughout — everything below is full-tier only.

- **Repositioned the site.** "Frontend & AI/Systems Developer" → **Full-Stack & AI Engineer**
  across the hero, `profile.role`, the page title, OG/Twitter cards and the JSON-LD. The hero
  headline went from three lines to two, because "Frontend / & AI/Systems / Developer" put a
  two-word line between two one-word lines and left a hole in the middle of the block.
- **Rewrote the content.** New stack (TypeScript, Next.js, React Native, Express.js, Prisma,
  .NET, C++, C#), the proficiencies supplied by Jahongir for databases and tools, and **six real
  projects** — MaktabHub, adblogger.uz, FarmPlatform, Job-Finder, Sotuv-Sayt, and the systems /
  reverse-engineering research. The old Typing Speed Test and Utility Toolbelt were removed at
  his request. Sass and PHP left the skills grid; they are not in the stack he works in now.
- **Replaced the journey section.** `TrainTimeline` (a vertical rail with a train icon springing
  along it) became `JourneyStaircase` — see the section above. The train was a decorated list:
  the graphic carried nothing the cards did not already say.
- **Added GSAP** for the one thing it is better at than Framer, behind a dynamic import so it
  costs the entry graph nothing and `lite` never fetches it.
- **Upgraded `Hero3D`** with `PerformanceMonitor` (resolution is negotiated with the machine
  rather than assumed — the buffer steps down when frame rate sags, `flipflops={2}` so a machine
  on the threshold cannot thrash) and **pointer *energy***: the core now swells and spins a
  little in response to how hard you are moving the mouse, not just where it is. Position alone
  made it a weathervane.
- **Added the ambient-effect switches** — particles and interface sound, documented above.
- **Fixed a real bug that had nothing to do with the new work:** `overflow-x: hidden` on `body`
  and the app wrapper silently disables `position: sticky` anywhere in the page. See the first
  entry under *Performance rules*.
- **Deleted the six dead components** and `recharts` with them, closing next-step 3 from session
  6, and removed the stray `Снимок экрана` screenshot (next-step 6).
- **Removed unreachable code in `ParticleBackground`**: it still carried a whole second
  configuration for the lite tier — half frame rate, no link pass, fewer particles — from before
  that tier stopped rendering a canvas at all. Every one of those branches was describing a mode
  that could not run.

**Session 8 — architecture overhaul, a real 3D staircase, and a QA pass**

The brief was a principal-architect pass plus a QA/performance audit, with better design
for the journey and AI sections.

**Architecture**

- **Feature-sliced `src/`.** `components/` and `lib/` became `app/`, `features/<section>/`,
  `shared/{ui,motion,hooks,lib}`, `data/` and `styles/`. Every cross-module import now goes
  through the `@/` alias.
- **Built `app/sections.ts`**, the section registry — see above. It replaced four
  independent copies of the page's section list.
- **Split the data layer** into `profile/skills/journey/projects/ai` behind a barrel, and
  typed technology names as `TechName` so a name with no brand entry cannot compile.
- **Closed the open unions**: `ProjectTag`, `JourneyIcon`, `PrincipleIcon`,
  `SessionLineKind` are unions with exhaustive icon maps, replacing
  `Record<string, Icon>` lookups with `?? fallback`.
- **Extracted `PlaygroundSection`** and `PanelSkeleton` out of `App.tsx`, which is now just
  the section list and the providers.

**Bugs found and fixed**

- **Analytics observed nothing.** `initAnalytics()` was called from `main.tsx` *before*
  `createRoot().render()`, so `querySelectorAll('section[id]')` ran against an empty
  `#root` and matched zero elements. It never fired once. It is an effect in `App` now,
  returns a teardown, and also watches `footer[id]` — which the old selector could never
  have matched, since the contact section is a `<footer>`.
- **Framer Motion dev warning**, traced to source rather than guessed: `useScroll({target})`
  warns when the scroll container is static, and the container for a window-scrolling page
  is `<html>`. Fixed with `position: relative` on `html`.
- **Two `.tilt-surface` cards had no `useTilt` ref**, so they paid for the transform stack
  and got only the hover lift. They own the hook now.
- **Pruned dead code**: the 2D `FallingTech` canvas (superseded by WebGL), `pointOnTread`,
  the `SKY` headroom constant, and the unused `aiPractice.image` entry.

**Design**

- **The journey staircase is now genuinely 3D** — see the table above. The 2D isometric
  drawing could not rotate a cube honestly and nothing cast a shadow on anything.
- **Rebuilt the AI section around its actual thesis.** The drawn CLI still and the live
  terminal replay were saying the same thing, and the replay says it far better; the still
  is gone and the terminal leads. The two-model split is now *shown* as a pipeline —
  Gemini (planning) → Claude Code (building) — rather than asserted in prose.
- **Renamed MaktabHub to Maktab AI**, described as an AI platform for private schools.

**Measured, not assumed**

- 0 long tasks and CLS of 0 across a full page walk.
- The particle field's O(n²) link pass costs **0.25 ms/frame** of a 16.7 ms budget (78
  particles, 3003 pair checks, ~89 links drawn). A batched-by-colour rewrite measured
  0.24 ms — no gain, so it was not made.
- **Real frame rate could not be measured in-harness**: the automation tab is
  rAF-suspended (0 callbacks in 4 s). ResizeObserver does not deliver there either, which
  is why R3F canvases sit at 300x150 until a `resize` event is dispatched. Both are
  automation artefacts, not page bugs — the hero canvas shows the same behaviour.

**Session 9 — the train, the background, and the screenshot that should not have gone**

- **Replaced the staircase with a train.** Jahongir's idea, and a better one: a staircase is
  a diagram, a train is a story. Five stations on a curved track, the scroll wheel as the
  throttle, a camera that travels with the locomotive, and platforms that light as they are
  reached. See the section above for the three things that were got wrong first.
- **Added a fifth station, flagged `upcoming`.** Forward-looking, rendered in amber with a
  dashed leg and "next stop". It is new copy and needs approval.
- **Fixed the background, which had never been visible.** `body::before` was painted over by
  the app wrapper's opaque `bg-void`. Two rules added to *Performance rules* above. The wash
  itself was also rebuilt — four large overlapping ellipses plus a vignette instead of three
  small circles that sat as discrete blobs — and the base colour deepened to `#07080c`.
- **Restored `claude-code.svg` to the AI section.** An earlier pass deleted it as redundant
  with the live terminal replay; that conflated two different jobs. It now opens the section
  full-width as the tool's face, with the replay lower down showing what *using* it looks
  like. No added window chrome — the drawing has its own, and wrapping it produced two
  stacked title bars.
- **Fixed journey copy that was false on phones**: it promised a train to drive in a tier
  that renders a still diagram.

### Fully operational

**Verified after session 8**, against the production build at 1920px and in a 390px
same-origin iframe.

Full tier: **no console warnings and no errors** across a full page walk plus every
interactive surface (all five skill filters, every "Show more", both FX switches, the
terminal replay). Sections numbered 01–07 with no gaps — now derived from the registry
rather than authored — no duplicate ids, no dead anchors, `scrollWidth === clientWidth`.
The 3D staircase renders with lit treads, teal rim edges and real step-to-step shadows;
the AI pipeline renders Gemini → Claude Code with both logos resolving. Analytics now
emits `view_section` events, which it never did before.

Lite tier (390px): `data-motion="lite"`, **zero canvases**, **zero running animations**,
backdrop blur off, no horizontal overflow, the SVG staircase fully lit — and **neither
three.js nor GSAP is fetched**. First load is still exactly two JS chunks, entry +
`motion-vendor`, unchanged by any of this work.

Build output: entry ~76 kB gz + `motion-vendor` 43 kB gz + CSS ~10 kB gz on first paint.
Rollup hoists three.js into one shared chunk (219 kB gz) that `Hero3D` (8 kB gz) and
`JourneyScene` (2 kB gz) both use — so the second 3D surface on the page cost ~2 kB, not
another 226. GSAP (28 kB gz) + ScrollTrigger (18 kB gz) load on demand, full tier only.
None of it is referenced from `index.html`.

Typecheck, lint and build are all clean.

### Next steps

1. **Jahongir must fact-check the project copy.** The six projects were named in his
   brief, but the descriptions, `role` lines and shipped/in-progress statuses were written
   from the names alone. `adblogger.uz` is the only one with a real `href`. This is the
   site making claims on his behalf — highest priority on this list.
2. **Confirm the proficiency numbers that were not supplied.** Databases and tools came
   from him directly; frontend, backend and AI/systems levels are inherited or inferred.
3. **Check the journey copy.** The four milestones are real but the prose was rewritten,
   and each step's `picked` list is what physically falls onto that tread.
4. **Measure real frame rate on a real machine.** The automation tab is rAF-suspended, so
   FPS could not be measured here — only per-frame work cost, long tasks and CLS. Open
   DevTools' performance panel on a real desktop and confirm the journey scene holds 60fps
   with the hero canvas also alive.
5. **Three socials in `data/profile.ts` are still bare placeholders** — `telegram`,
   `instagram`, `discord`. They are filtered out of the footer automatically; fill in the
   handles and they appear (Discord has no icon mapped).
6. **The contact form has no backend.** It opens the visitor's mail client.
7. `public/claude-code.svg` is no longer referenced — the AI section leads with the live
   terminal instead. Delete it, or bring it back as a real screenshot if a still is wanted.
8. Optional: the shared three.js chunk still trips Vite's 500 kB warning. It is lazy and
   gated, so this is cosmetic.
