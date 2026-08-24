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
api/contact.ts        Serverless endpoint: contact form → Telegram. Reads the bot token.
src/main.tsx          Entry. Registers the service worker (PROD only), boots analytics.
src/App.tsx           Section order + <MotionConfig> + per-section <ErrorBoundary>.
src/index.css         Tailwind layers + all custom classes (.glass-card, .text-gradient-*, …).
tailwind.config.ts    Design tokens: void/signal/pulse/azure/ink colours, display/body/mono/accent fonts.
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
| `pointerFx.ts` | `useMagnetic` (buttons lean toward the cursor) and `useTilt` (card tilt). Full tier only; refs and rAF, never state. |
| `useNearViewport.ts` | Gate for work that should not happen until the reader is close to it. Holds the playground widgets back so their `lazy()` chunks are not fetched on first render. |
| `useScrollSpy.ts` | `useScrollSpy` (IntersectionObserver, shared by the navbar and the scroll rail) and `useScrolledPast` (rAF-throttled `scrollY`). |
| `techMeta.ts` | Brand colour + icon-CDN slug + fallback monogram for all 41 technologies. Also `readableAccent()`. |
| `useCanSupport3D.ts` | Gates the WebGL hero: ≥1024px, WebGL present, not reduced-motion. |
| `analytics.ts` | Section-view IntersectionObserver; dispatches a `portfolio_analytics` CustomEvent. No third party. |
| `utils.ts` | `cn()` class joiner. |

### `src/components/` — rendered sections, in page order

`Navbar` → `Hero` (+`Hero3D`/`Hero3DFallback`) → `About` → `Journey`
(+`JourneyDeck` / `JourneyRail`) → `Statement` → `Skills` →
`AiPractice` (+`ClaudeTerminal`) →
playground (`PacketRunner`, `CodePlayground`) → `Footer` (+`ContactForm`).

Cross-cutting: `ParticleBackground` (fixed canvas), `CursorGlow` (full tier only),
`ScrollProgress` (top bar, side rail, FABs),
`SectionHeader` (numbered eyebrow/title/description/aside), `Panel` (shared chrome for the
playground widgets), `ErrorBoundary`, `TechIcon`.

Sections are numbered 01–06 via `SectionHeader`'s `index` prop (the footer hand-rolls its own 06).
Keep them in order if you add or remove a section. `Statement` is deliberately outside the
numbering — it is an `aside`, not a section, and has no nav or scroll-rail entry.

The navbar switches to its drawer at **1024px**, not 768 — the links no longer fit beside the
brand and the CTA at `md`. That boundary is also where the motion tier flips, so "drawer" and
"lite" now mean the same set of devices.

**Currently unrendered** (present but not imported by `App.tsx`): `LearningTrajectory`, `Gaming`,
`DinoGame`, `Cert3DBackground`, `LoadingScreen`. `LearningTrajectory` also uses `id="trajectory"`,
which would now collide with `Journey`, and it is the only thing in the repo that imports
`recharts` — a dependency declared in `package.json` but absent from `node_modules`, so
`tsc -b` failed until `npm install` was re-run. Deleting the component and the dependency
together would remove both problems.

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

### Typography — four faces, and the rule for the fourth

| Family | Tailwind | Used for |
|---|---|---|
| Space Grotesk | `font-display` | Headings, card titles |
| Inter | `font-body` | Body copy |
| JetBrains Mono | `font-mono` | Eyebrows, labels, the terminal |
| **Instrument Serif** | `font-accent` | One emphasised phrase per heading, and display numerals |

The first three are all technical faces, which is coherent but flat — nothing on the page had a
different voice. Instrument Serif is the editorial accent that fixes that, and it comes with
rules:

- **Italic only, one phrase per line, never body copy.** Its 400 is far too fine at 15px on a
  near-black background.
- Use **`.accent-em`**, not raw Tailwind classes. It carries two corrections that matter: a
  `font-size: 1.1em` nudge, because Instrument Serif's x-height sits well under Space Grotesk's
  and at a shared size the emphasis reads as a word that fell out of the line; and a
  `padding-right`, because an italic's top-right terminal overhangs its glyph box and
  `background-clip: text` crops to that box — without it the last letter loses its tail inside
  a gradient.
- **`.display-numeral`** is the same face for the journey's years. It sets tabular figures on
  purpose: the numeral swaps as the reader travels, and proportional digits would shift the
  whole thing sideways on every change.

It loads in the same non-blocking `<link>` as the other three and ships one weight in roman and
italic — only the italic is used. There are exactly eight `.accent-em` on the page; keep it
that way, the effect dies if it is everywhere.

### The journey deck — read before touching `JourneyDeck.tsx`

Section 02 has two implementations and the motion tier picks one (`Journey.tsx` dispatches).
`lite` gets `JourneyRail`: a flat spine with a station per milestone and no animation of any
kind — there is deliberately not one Framer component in that file. `full` gets
`JourneyDeck`: five milestones standing on a 3D arc, the front one square on and readable, its
neighbours turned inward and set back. Arrows, the year buttons, the left/right arrow keys and a
sideways drag all move the same spring.

**There was a scroll-driven version in between, and it is not coming back.** It was a ~500vh
track with a pinned stage that flew a camera down a corridor of gates as the reader scrolled. It
looked genuinely good and it read badly, for reasons that apply to any scroll-linked stage:
the reader could not get past the section without playing the whole animation, could not step
back a milestone without scrolling up, and lost control of their own scrolling for five screens.
The depth was the good part; binding it to the scrollbar was not. Do not reintroduce a
scroll-linked stage in this section. Both current versions are about one screen tall and scroll
past like anything else on the page.

Three rules keep the deck working:

1. **`transform-style: preserve-3d` on `.deck-stage`.** A `perspective` parent still places
   its children in 3D without it, but paints them in **DOM order** — so the card two steps back
   draws over the one at the front.
2. **Anything that is not part of the scene must be a sibling of the stage, never a child.** The
   ambient glow and the floor sit outside it: a plain child of a `preserve-3d` element sits at
   `z: 0` and occludes every card behind it.
3. **A faded card must stop accepting the pointer.** `pointerEvents` is driven off React state
   (`isReachable`), not off the opacity motion value — an invisible card at `opacity: 0` still
   swallows clicks meant for the one in front of it.

4. **The edge fade is a mask (`.deck-viewport`), not an overlay.** It used to be a strip
   painted in the page's background colour down either side, which worked only for as long as
   the page background really was that one flat colour. The moment the colour field behind it
   became a tinted, vignetted gradient, the strip showed up as what it always was: a hard-edged
   grey rectangle sitting on top of the page. A mask removes pixels instead of covering them.
   It needs its own element because a mask forces `transform-style` back to `flat`, and it
   must not wrap the arrows, which sit exactly where it fades out. `mask-repeat: no-repeat` is
   load-bearing: left at the default the gradient tiles, and a card that has travelled outside
   the box meets a fresh opaque copy of it.

That last one generalises, now that the page has a real background: **nothing may fake the page
colour.** Any full-bleed layer painted `#09090b` to hide something will read as a box the
moment it sits over the colour field. Fade with a mask, or with the element's own opacity.

The drag writes straight to the position motion value and never through React state; only
`isActive` / `isReachable` are React inputs, and both change once per settle. `setPointerCapture`
is wrapped in try/catch because it throws if the pointer is no longer active by the time it runs.

`.deck-card` is an opaque fill rather than `.glass-card` on purpose: backdrop blur inside a
subtree that a spring is rotating and scaling is the one place on this page the compositor
genuinely cannot afford it.

### `position: sticky` and the page wrapper

The App wrapper is `.clip-x`, not `overflow-x-hidden`, and it must stay that way.
`overflow-x: hidden` on a real element forces the other axis from `visible` to `auto`, which
makes the element a scroll container — and a scroll container that never scrolls is a
scrollport that sticky children pin to and then ride away with. It silently broke every
`position: sticky` on the page; nobody had noticed, because nothing needed to pin until the
journey did. `overflow-x: clip` clips identically without creating one, with a `hidden` line
above it as the fallback for browsers that predate it. `body` keeps `overflow-x: hidden` and
is fine — a body's overflow propagates to the viewport, so the body itself stays `visible`.

### The atmosphere — and the class that was hiding it

Three fixed layers sit under the whole document:

| Layer | What it is | Tier |
|---|---|---|
| `body::before` | the colour field: five radial gradients | all (drifts on full) |
| `.page-veil` | a light from above, and a vignette | full only |
| `body::after` | film grain | full only |

**The app wrapper must stay transparent.** It used to carry `bg-void`, an opaque fill over the
entire document — and because a positioned element paints above an earlier sibling's fixed
pseudo-element, that one utility class hid the colour field completely, for as long as it had
existed. The page was flat black with a handful of section-local glows doing all the work, while
the stylesheet carried a carefully commented ambient wash that never rendered a pixel. The base
colour belongs on `body`, which already sets it. If the background ever goes flat again, check
for a background utility on that wrapper first.

Everything here paints on fixed, promoted pseudo-elements rather than on `body` itself. A
`background-attachment: fixed` cannot be moved by the compositor, so every scroll frame
repaints the whole gradient stack across the viewport — see *Performance rules*.

### The contact form — `api/contact.ts`

The form posts to `/api/contact`, a Vercel edge function that forwards the message to a
Telegram bot. Two environment variables, both set in the Vercel project:

| Variable | Where it comes from |
|---|---|
| `TELEGRAM_BOT_TOKEN` | @BotFather, after `/newbot` |
| `TELEGRAM_CHAT_ID` | the numeric id of the destination chat |

A bot cannot open a conversation with a person and cannot address one by @username, so the
destination has to be a numeric chat id, and that person must have sent the bot `/start` first.
`https://api.telegram.org/bot<TOKEN>/getUpdates` returns it, as does @userinfobot. A channel
works as `@channelname`.

Three things in that file are load-bearing:

- **The token never reaches the browser.** That is the entire reason the endpoint exists rather
  than the form calling api.telegram.org directly — anything in the client bundle is public,
  and a leaked bot token lets anyone send as the bot or read what it receives.
- **Telegram's error bodies are never forwarded.** They can echo the request URL, which contains
  the token; the endpoint answers with its own opaque error string instead.
- **Visitor text is HTML-escaped** before it goes out with `parse_mode: HTML`.

With either variable unset the endpoint answers **503**, and the form falls back to opening the
visitor's mail client — so a deploy before the variables are configured degrades instead of
swallowing messages. The form has three end states and they are deliberately distinct:
`sent` (Telegram accepted it), `mailed` (the mail client was opened — never claim delivery
here) and `error` (a 400; the visitor can fix it and retry). A hidden honeypot field named
`company` is answered with 200 and dropped.

`api/` is outside `tsconfig.json`'s `include`, so `tsc -b` does not typecheck it; the
`process` declaration at the top of the file is what types the environment. There is a runnable
check for the endpoint's behaviour — transpile it with esbuild and drive it with a stubbed
`fetch`; ten cases covering validation, escaping, the honeypot and the failure paths.

### Shared design pieces

- **`Panel`** — icon tile + title + subtitle + `meta`/`actions` header, used by Packet Runner and
  the Code Playground. Both had hand-rolled the same header as one flex row that broke under
  ~600px. New widgets should use it rather than re-rolling the chrome.
- **`.section-rule`** — the fading gradient hairline between sections. Replaces flat
  `border-t border-white/5`, which chopped the page into hard slabs. Needs `position: relative` on
  the element (it draws via `::before`), so don't put it on unpositioned inner dividers.
- **`.inset-surface`** — recessed panel for editor/console/HUD surfaces.
- **`.dot-grid`** — a dot field, as an alternative texture to `.grid-overlay`'s ruled lines.
  Static, one paint, and it gives a section a floor to sit on.
- **`.btn-sweep`** — a highlight that crosses a button once, on hover, in CSS. The hero CTA ran
  this as a Framer loop on `repeat: Infinity`, which keeps a repaint scheduled for the life of
  the page, the whole time the hero is scrolled away included.
- **`Statement`** — the centred pull-quote band between 02 and 03. Every other block on the
  page is a left-aligned numbered section with a heading and a grid; this is the one that breaks
  the rhythm. It is an `aside`, so the lite tier's `content-visibility` rule does not match it.
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

### What was accomplished across these sessions

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

**Session 7 — a new typeface, the projects section removed, and the journey rebuilt twice**

The brief was: better design, add a Google font, do something far more interesting with the
learning journey, delete the projects section, and stop claiming an IELTS score.

- **Added Instrument Serif** as `font-accent` and `.accent-em` — see *Typography* above for
  the rules and the two optical corrections it carries. It appears exactly eight times: the
  hero's second headline line, all five section titles, the statement band and the footer.
- **Deleted the projects section** — the component, the `projects` and `Project` exports in
  `content.ts`, the nav link and the scroll-rail entry. Sections renumbered 01–06, and the
  hero's primary call to action, which pointed at `#projects`, now reads "Try the playground"
  and points at `#playground`.
- **Removed the IELTS score.** `profile.languages` now reads English / Good, and the 2026
  timeline entry no longer mentions it.
- **Rebuilt the journey three times.** A flat spine with a pinned year panel (too quiet); then a
  scroll-driven 3D corridor (dramatic, but it took the page hostage — see *The journey deck*);
  finally `JourneyDeck`, which keeps the depth and drops the scroll binding entirely. The flat
  version survives as `JourneyRail` and is what `lite` renders.
- **Fixed a page-wide `position: sticky` bug** while building the first version — see
  *`position: sticky` and the page wrapper*. It had been latent since the App wrapper was
  written, because nothing on the page had needed to pin before.
- **Added the `Statement` band** between 02 and 03, and the `azure` colour token (the journey
  walks signal –> azure –> pulse –> ember, one accent per milestone, so the corridor and
  the rail both change hue as the reader descends).
- **Replaced the hero CTA's infinite Framer sweep** with `.btn-sweep`, a CSS hover animation.
  Session 5 claimed this had already been done; it had not, and the loop was still scheduling a
  repaint for the life of the page.
- **Fixed a stale hard-coded age**: the About section's description opened with "Sixteen," while
  `profile.age` said something else. It no longer states the age at all — the fact tile
  directly beneath it already does, from the data.
- `npm install` had to be re-run: `recharts` was declared but missing, so `tsc -b` failed on
  the unrendered `LearningTrajectory` before any of this work could be verified.

**Session 8 — a background that was never visible, and a contact form that now delivers**

- **Found and fixed the background.** `body::before` had been covered by `bg-void` on the app
  wrapper since it was written — see *The atmosphere* above. The wrapper is transparent now,
  the colour field was rebuilt as five gradients including the azure and a warm bleed at the
  foot of the page, and a new `.page-veil` adds a light from above and a vignette on the full
  tier. Phones gain the colour field at no animation cost and are otherwise unchanged.
- **Wired the contact form to Telegram** through `api/contact.ts` — see above for the
  environment variables and why the token cannot live in the client. The mail-client path is
  kept as the fallback, and the success copy no longer claims delivery unless Telegram accepted
  the message.
- **Filled in the Telegram social**, so the footer now renders a Telegram channel row alongside
  GitHub and LinkedIn.
- Softened the hero's bottom fade from `to-void` to `to-void/85`; at full opacity it cut a
  flat band across the newly visible colour field.
- **Then found the second half of the same bug.** With the background no longer flat, the
  journey deck's edge fade — a strip painted in the old page colour — became a visible grey
  rectangle over the colour field. It is a mask now; see rule 4 under *The journey deck*.

### Fully operational

Verified after session 7, in a real browser, at 1440px wide (full) and 390px (lite).

Full tier: sections 01–06 in order with no gaps, no duplicate IDs, no dead anchors,
`scrollWidth === clientWidth`, no console output of any kind, Instrument Serif loaded and
resolving on all eight `.accent-em`, and the deck working — the arrows, the year buttons and a
synthetic 600px drag all land on the right card and snap cleanly (opacity falls 1.00 / 0.62 /
0.23 across the arc), with the ambient glow and the card ring taking the milestone's accent.
The journey section is 1.24vh tall and the whole page is 12vh, down from 5.4vh and 16.1vh when
the same content was a scroll-driven corridor.

Lite tier at 390px: `data-motion="lite"`, **zero** `.deck-stage` elements, zero canvases,
the flat rail with its four stations and its "now" terminus, the grain overlay `display: none`,
no horizontal overflow, and no running CSS keyframe animations (the only entries in
`getAnimations()` are the navbar's one-shot colour transition and one Framer WAAPI fade on a
floating action button).

Two automation notes for whoever verifies this next, both of which cost time this session:

- The driven tab reports `visibilityState: 'hidden'`, so the rendering pipeline is throttled.
  **Scroll events are not dispatched at all**, which freezes anything built on `useScroll` or
  `IntersectionObserver` — the scroll-driven journey looked completely broken until this was understood.
  `window.dispatchEvent(new Event('scroll'))` after a programmatic `scrollTo` is enough:
  Framer only needs the notification and re-reads the real `scrollY` itself.
- The `setTimeout`-backed `requestAnimationFrame` shim from session 6 is throttled to ~1Hz in
  a background tab, so springs appear frozen mid-flight. Backing the shim with a
  `MessageChannel` instead is not throttled and lets them settle in real time.



Typecheck, lint and build are all clean. Verified in a real browser: all 41 skill cards render, all
5 filters work, no console errors, no duplicate IDs, no dead anchor links, no horizontal overflow,
and the service-worker deploy regression test passes.

Verified again after session 3: 20 skill cards collapsed / 41 expanded, 5 "Show more" toggles,
2 social links rendered (GitHub + LinkedIn — the rest are still placeholders), 13 panels, no
duplicate IDs, no dead anchors, no horizontal overflow. The Code Playground runs and prints output.

Verified after session 6, in a real browser. Note the automation workaround that finally made
animated content inspectable: the driven tab reports `visibilityState: 'hidden'`, which pauses
rAF, so Framer and the R3F render loop freeze part-way through and screenshots catch entrances
mid-flight. Re-serving `index.html` into a same-origin iframe with a `<base href="/">` and a
`requestAnimationFrame` backed by `setTimeout` injected ahead of the app's own scripts makes the
page run normally, and sizing that iframe picks the tier. That is how both the full-tier hero and
the 390px layout below were actually seen rather than inferred.

At the full tier: the new hero renders as intended (lattice, glowing core, two crossed orbits with
satellites), headline entrances complete, and the projects hover shows the hairline ring with no
radial pool — `::after` computes to `background-image: none` and `340px circle` appears zero times
in the built CSS.

At 390px: `data-motion="lite"`, **zero canvases**, headline transforms `none` and opacity 1 with no
entrance, the grain overlay `display: none`, `content-visibility: auto` on all six non-hero
sections plus the footer, and exactly **two** running CSS animations — both the `animate-spin`
loaders in the deferred playground skeletons. The AI copy reads three years / one of the best /
respect for the Anthropic engineers.

Verified after session 5, in a real browser: no console output, sections in order with indices
01–07 and no gaps, no duplicate IDs, no dead anchors, `scrollWidth === clientWidth`, the CLI image
loads, all three form labels resolve to real inputs, and the scroll rail lists all seven sections.
The phone layout was checked by rendering the built site in a 390px same-origin iframe, which gets
its own viewport for media queries — `data-motion` resolves to `lite`, the grain overlay computes
to `display: none`, the AI stats sit 2-up, the principle cards stack full-width, and all three
contact rows stay exactly 68px (the email fits on one line rather than truncating).

Note the automation caveat from session 4 still holds and now has a workaround: the driven tab
reports `visibilityState: 'hidden'`, which throttles rAF, so Framer freezes mid-stagger and
screenshots catch entrances part-way. Injecting
`*{opacity:1!important;transform:none!important;filter:none!important}` shows the settled layout.
`resize_window` still does not change the rendered viewport — hence the iframe.

Verified again after session 4, in a real browser at the full tier: no console output of any
kind, no duplicate IDs, no dead anchors, `scrollWidth === clientWidth` (no horizontal overflow),
20 collapsed skill cards, 34 tilt surfaces, 9 line-reveal headings. Forcing
`data-motion="lite"` confirmed the overrides land: opaque card fill, `backdrop-filter: none`,
background animation off, tilt highlight removed.

Build output: `index` ~68 kB gz + `motion-vendor` 43 kB gz + CSS ~9 kB gz on first paint;
`Hero3D` 227 kB gz loads lazily and only on ≥1024px WebGL devices.

### Next steps

1. **Verify the skill entries.** Session 2 added ~21 technologies with **assumed** proficiency
   levels and notes. Jahongir must confirm or prune these — they are currently claims the site
   makes on his behalf.
2. **Flip through the deck on a real trackpad and mouse.** Drag feel is the one thing a harness
   cannot judge: `DRAG_STEP` in `JourneyDeck.tsx` (currently 300px per card) is the number to
   change if it feels heavy or twitchy, and `SPREAD` / `TILT` / `DEPTH` above it control how
   far the neighbouring cards sit out and turn.
3. **`statement` in `content.ts` is copy written on Jahongir's behalf**, derived from the
   "pixels to kernel" line already in his bio. Reword or replace it.
4. **Decide on the unrendered components** listed above — wire them in or delete them. Deleting
   `LearningTrajectory` also lets `recharts` go.
5. **Three socials in `content.ts` are still bare placeholders** — `telegram`, `instagram`,
   `discord`. They are filtered out of the footer automatically; fill in the handles and they
   appear (Discord has no icon mapped yet).
6. **Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in Vercel.** Until both exist the
   contact endpoint answers 503 and the form falls back to opening a mail client. See
   *The contact form* above for how to get each value.
7. **`public/Снимок экрана 2026-07-24 111904.png`** is a stray screenshot that ships to
   production on every deploy. Delete it unless it is deliberate.
8. Optional: `Hero3D` at 839 kB raw still trips Vite's chunk-size warning. It is lazy and
   gated, so this is cosmetic, but importing narrower three.js modules would quiet it.
