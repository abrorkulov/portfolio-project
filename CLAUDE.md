# CLAUDE.md — Hello :)

Personal site for **Jahongir Abrorkulov** (15, Tashkent, Uzbekistan) — frontend, backend and AI.
Five pages, one screen each, black and milky white, snow falling behind everything. React + Vite +
GSAP + three.js, deployed on Vercel at `abrorkulov.uz`.

All copy is in **English**.

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

There is **no test suite**. Verification = typecheck + lint + build + looking at the preview.

> **Prettier has no config file.** Always pass `--no-semi --single-quote`. Running bare `npx prettier`
> rewrites the whole file to double quotes and semicolons, which does not match this codebase.

---

## Architecture

Vite + React 18. **No router, no scrolling narrative, no Tailwind.** One page is on screen at a
time; `App` holds an index into `pages` and `SceneStage` plays the hand-off between them.

```
index.html            Meta/SEO/JSON-LD, the non-blocking Google Fonts <link>, favicon, manifest
api/contact.ts        A Vercel edge function that forwards a message to a Telegram bot. Nothing
                      on the site posts to it any more — kept because the Vercel environment
                      variables for it already exist and a contact form may come back.
src/main.tsx          Entry. Registers the service worker (PROD only).
src/App.tsx           The page index, the URL hash, the keyboard and the swipe/wheel gestures.
src/index.css         The entire stylesheet. Hand-written; there is no CSS framework.
src/data/site.ts      Every string on the site.
vite.config.ts        Build config. Read the manualChunks comment before touching it.
public/sw.js          Service worker. Read the fetch-handler comment before touching it.
```

### The five pages

| # | hash | file | what it is |
|---|---|---|---|
| 0 | `#home` | `scenes/HomeScene.tsx` | "Hello :)" written out letter by letter, then `press me !` |
| 1 | `#about` | `scenes/AboutScene.tsx` | four typed lines, then the `next` pill |
| 2 | `#study` | `scenes/StudyScene.tsx` | the glass deck: Cambridge, Najot Ta'lim, MARS IT School |
| 3 | `#stack` | `scenes/StackScene.tsx` | three cards: frontend, backend, AI engineering |
| 4 | `#contact` | `scenes/ContactScene.tsx` | Telegram, GitHub, LinkedIn, email |

The hash is written with `replaceState`, not assigned — this is a label on the current page, not a
place in the visitor's history. The back button should leave the site, not walk them backwards
through five screens they already saw. A `hashchange` listener still honours a hand-edited or
linked-to hash.

### `src/components/`

| File | Role |
|---|---|
| `SceneStage.tsx` | Holds one page and plays the change. Owns the entrance stagger. |
| `Snow.tsx` | The weather. Two tiled CSS layers plus the lazy WebGL field. |
| `SnowGL.tsx` | three.js point sprites: the real snow, plus the burst pool the page throws flakes into. Lazy, and only where WebGL exists. |
| `Carousel.tsx` | The study deck — 3D arc, drag, arrows, chips, measured height. |
| `StepRail.tsx` | The bottom panel, with a highlight that slides between pages. |
| `Corners.tsx` | Name top-left, `01 ——— 05` page count top-right. On every page. |
| `Spotlight.tsx` | A pool of milky light that trails the pointer, behind the glass. Also writes `--px/--py` for the parallax. Fine pointer only. |
| `GlowArrow.tsx` | The one navigation control, in a round and a pill form. |
| `SceneHeader.tsx` | Numbered eyebrow + a title that assembles letter by letter out of a blur. |
| `BrandIcon.tsx` | Four brand marks, inlined as paths. |

### `src/lib/`

| File | Role |
|---|---|
| `useTypewriter.ts` | Types lines one character at a time off a single rAF. |
| `env.ts` | `prefersReducedMotion`, `canRunWebGL`, `isCompact`. All read live. |
| `warp.ts` | The one number the snow speeds up by during a page change (and, longer, on arrival). |
| `snowfx.ts` | The bridge from the page to the snow: pointer/ripple state, `spark()`, `trail()`, `dissolve(el)`, `useCaretSparks()`. Every call is a no-op until SnowGL has mounted. |
| `useNow.ts` | Tashkent time (ticks on the minute) and weather (Open-Meteo, no key, once per visit) for the live line on the contact page. |
| `pointer.ts` | `glass()` — glare + tilt handlers for a pane; `useMagnet()` — pulls `press me !` toward the pointer. |
| `usePageGestures.ts` | Swipe (touch) and wheel flick (desktop) turn the page. Discrete, never bound to scroll position. |

---

## Stack

React 18 · TypeScript 5.6 (strict) · Vite 5 · GSAP 3 · three (raw, no R3F) · ESLint 9 flat config.

Framer Motion, Tailwind, PostCSS, recharts, lucide-react and the React-Three ecosystem were all
removed with the previous version of the site. Do not reintroduce one without a reason that the
existing tools cannot cover.

---

## Code style

- **Single quotes, no semicolons, 2-space indent.** Match surrounding code.
- **Comments explain *why*, never *what*.** Several comments in this repo record a bug that was
  fixed and why the code must stay that way — do not delete them.
- **Content lives in `site.ts`; components render it.**

---

## Design rules

### Two faces, and one job each

| Family | Variable | Used for |
|---|---|---|
| Dancing Script | `--font-script` | the word "Hello". **Nothing else.** |
| Sora | `--font-sans` | titles, copy, labels, numbers |

The handwriting is the whole personality of the front page, and it dies the moment it appears
twice. If something else needs emphasis, it gets a weight or a size, not the script.

### One colour, and one accent that only the hand brings

Pure black, and a milky off-white (`--milk: #f4f0e8`) at four strengths. The one accent is ice
(`--ice: #b7dcff`, `--ice-rgb` for alphas) and it appears **only under the pointer**: the glowing
edge of a pane, a lit chip, the halo of a hovered button.
Nothing is ice at rest, so the page keeps its single colour until something is touched. The
brand marks on the contact page are milky at rest and find their own colour on hover. A previous
version of this site was teal and violet; that is gone on purpose, and a second accent, or the
ice used as a fill or as resting type, puts the whole palette back.

Pure `#fff` is deliberately not used for type: against pure black it glares and reads cold.

### Glass, and the rule that keeps it working

The study cards, the stack cards, the contact rows, the buttons and the panel are all real
`backdrop-filter` glass — they frost the snow falling behind them.

**`backdrop-filter` samples the nearest backdrop root, and a `filter`, `mask` or `opacity` on any
ancestor becomes one.** A card inside such an ancestor frosts its own empty box instead of the
page, and the snow behind it disappears. That is why:

- the deck has **no edge mask** — the outer cards simply run off the side of the page, and
  `html { overflow-x: hidden }` stops that widening the document;
- the neighbour blur is a `filter` on `.deck-face`, which is fine because it is *on* the card,
  not above it;
- `SceneStage` animates a blur during a page change and then `clearProps: 'filter'`, so no filter
  is left standing on an ancestor at rest.

On `(pointer: coarse)` every backdrop filter is turned off and the fills become opaque. Against
pure black nobody can tell, and a phone cannot afford the deck, the chips and the panel all making
the compositor re-read their backdrop on every frame.

### Glass that answers the pointer

Every pane (`.stack-card`, `.social-card`, `.deck-face`) carries `.glass`, and the flat ones
also `.tilt`. `glass()` in `pointer.ts` writes `--mx/--my/--rx/--ry` straight onto the element on
`pointermove` and the stylesheet draws the glare (`::after`), the icy edge that lights up where
the pointer is (`::before`, a radial gradient masked down to a one-pixel ring) and the lean —
**no React state on hover**. It returns `{}` on a coarse pointer, so a phone never binds the
handlers. `.deck-face` used to own its `::before` for a lit top edge; that is now an inset
box-shadow so the glass edge can have the pseudo-element.

Two things follow from `.tilt` owning `transform`:

- the hover lift is `--lift`, not a `transform` in the `:hover` rule;
- `SceneStage` passes `clearProps: 'transform,opacity'` on the `data-enter` stagger. Without it
  the `translate(0, 0)` gsap leaves inline outranks the class and the cards never lean.

### Gestures

`usePageGestures` turns the page on a vertical swipe or a wheel flick, one page per gesture, with
a 900 ms cooldown. A page taller than the screen still scrolls normally: the gesture only counts if
the document was **already** at the edge when it began. Trackpad inertia is handled by requiring
160 ms of wheel silence before a new gesture can start. If the wheel behaviour is ever unwanted,
delete the `wheel` listener and leave the touch ones. Keys: `↑ ↓ PgUp PgDn Home End 1–5`, and
`← →` outside the deck.

### The page change

Forward throws the current page up and out and brings the next one in from below; back does the
reverse. At the same moment `pulseWarp()` sends the snow into a short surge past the camera —
that is the part that actually sells the distance. Everything inside a page marked `data-enter`
is staggered in by `SceneStage`, so a page only has to say which of its blocks are worth
announcing.

### Home

"Hello" is painted with a gradient clipped to its glyphs so a pass of icy light can run along the
letters every seven seconds (`sheen`). Because the type is transparent, the glow is a
`drop-shadow` filter on the `h1`, not a `text-shadow` — a text-shadow would show through the
letters. The breathing animation is on the `h1` too, so the compositor fades the filtered layer
instead of re-rastering the filter every frame. On a coarse pointer the filter is one narrow
shadow and the breathing is off.

### Magnets

`press me !`, both pill arrows and both round deck arrows are pulled toward a nearby pointer by
`useMagnet`. The magnet always moves a wrapper `span.magnet`, never the button — the button has
its own transition on `transform`, and the two must not share an element.

### Reveals that must not strand

The `press me !` button and the `next` pill appear when their typing finishes, and they are
revealed by **a class and a CSS transition, not a tween**. A tween interrupted mid-flight — by a
reverted GSAP context, by a page change landing at the wrong moment — leaves the element stranded
at whatever opacity it had reached. The one control that opens the site is not left to that. This
was an actual bug, found in a headless browser where rAF ticks are sparse.

### The deck

`Carousel.tsx`. Three rules:

1. **`transform-style: preserve-3d` on `.deck-stage`.** A `perspective` parent still places its
   children in 3D without it, but paints them in DOM order — so the card behind draws over the
   one in front.
2. **The stage's height is measured, not fixed.** The cards are absolutely positioned, so the
   stage has no height of its own; a fixed one overlapped everything the moment a card wrapped to
   one more line. A `ResizeObserver` writes the tallest card's height onto the stage and onto
   `--deck-h`, which is also what hangs the side arrows level with the middle of the card.
3. **A faded card must stop accepting the pointer.** `pointerEvents` is driven off React state
   (`reachable`), not off the tween — an invisible card still swallows clicks meant for the one
   in front of it, and reading that off a live motion value would cost a render per frame.

The deck position is a float written straight onto the elements and never through React state:
a drag would otherwise re-render the page on every `pointermove`. `DRAG_STEP` (320px per card) is
the first number to change if the drag feels heavy or twitchy.

Below 640px there is no room for a control column beside a card worth reading, so the arrows drop
out of their absolute position and back into the chip row. **Below 640px the deck is also
clipped at the screen edge** (`.deck-viewport` bleeds through the shell padding with
`overflow: hidden`): a phone browser widens its layout viewport to fit the neighbour cards that
run past the screen, and the whole page zoomed out to 890px. On a coarse pointer there is no
backdrop filter for that clip to break. An iframe check does not reproduce this — only device
emulation (`Emulation.setDeviceMetricsOverride` with `mobile: true`) or a real phone does.

### Depth

Two things make the black read as a room rather than a backdrop, and both answer the pointer
through `--px/--py` (written on `<html>` by `Spotlight`, -1..1, once per frame):

- the **ghost numeral** behind every scene title (`.scene-ghost`, the page index at ~30vw and
  3.5% opacity), which drifts against the pointer;
- the **about lines**, each on its own `--depth` and sliding a little further than the one above.

On a phone there is no pointer, so both simply stand still.

### Phones

`.viewport` is `align-items: flex-start` with `margin-block: auto` on `.stage`: that centres a
short page and lets a tall one start at the top instead of overflowing both ends. Below 640px the
stack grid becomes a horizontal scroll-snap row (`.stack-grid`), because three cards on top of each
other ran under the panel. The contact `copy` buttons are always visible under `(hover: none)`.

### Snow

`SnowGL.tsx` is a few thousand additive point sprites. Both wraps — the fall and the drift toward
the camera — happen **in the vertex shader**: doing them in JavaScript would mean touching tens of
thousands of floats and re-uploading the position buffer every frame. Pointer position lives in a
local, never in state, for the same reason.

The snow answers the page, and every one of those answers goes through `lib/snowfx.ts`:

- **The pointer pushes the field apart** and the flakes it touches glow — done in screen space
  in the vertex shader after projection, so near and far flakes both move. Fine pointers only.
- **A tap sends a ring** through the field (`ripple`), any pointer, plus a few sparks.
- **A moving pointer leaves a wake** (`trail()`): two flakes per move, drifting down.
- **Bursts** are a second `Points` with a 4096-entry ring buffer. Each flake is stamped with its
  birth time and integrates its own path on the GPU, so a burst costs one buffer upload and
  nothing per frame. Sizes are roughly double the falling snow's: the burst plane (`BURST_Z`)
  is twice as far as where the visible flakes are.
- **`dissolve(el)`** rasterises an element's text with its computed font (and letter-spacing)
  onto a canvas, samples it on a grid and throws the samples outward and toward the camera.
  `App` calls it on every headline — `.home-word`, `.home-smile`, `.scene-title`,
  `.about-line` — at the moment a page change is requested, not on unmount, because by then the
  page has already been faded and thrown off the top.
- **`useCaretSparks`** fires a spark from the caret whenever the typed count grows. 36 flakes
  per letter of "Hello", 5 per character on the about page.

On arrival SnowGL calls `pulseWarp(2.8)`: the field rushes past the camera while the first word
is being written.

The tiled CSS layers in `Snow.tsx` paint on the first frame and never leave. They are the only
snow a reduced-motion or software-rendered visitor sees, and they give the GL field something to
fall in front of while its chunk arrives.

There is deliberately **no comet / shooting star**, **no fog behind the snow** and **no drawn
cursor**. All three were there, and each was asked for to be removed: the black and the snow
alone are the background, and the system pointer is the pointer.

### The live line

The contact page ends with "right now in tashkent — 19:37 · −3°, snowing". `useNow` renders the
clock only once it has a value, so the line never flashes a bare prefix; the weather is a single
Open-Meteo request per visit and the line simply carries the time alone if it fails.

---

## Performance notes

- **Never name `three` in `manualChunks`.** A manual chunk is pulled into the entry's preload
  graph, which downloads the whole renderer before the first character of "Hello" is on screen.
  Left alone, Rollup keeps it inside the lazy chunk that imports it.
- **`canRunWebGL()` probes before importing.** Without it the three.js chunk downloads on devices
  that can never paint a frame of it.
- **The Google Fonts `<link>` must not block rendering.** It loads as `media="print"` and is
  promoted on load, with a `<noscript>` fallback.
- **Nothing decorative runs per-frame through React.** The snow's pointer, the warp value, the
  deck position and the parallax properties are all plain objects or inline styles written
  outside React.

First paint is HTML + CSS (~3.5 kB gz) + `index` (~81 kB gz). `SnowGL` (~118 kB gz) arrives after,
and only where WebGL exists and reduced-motion is off.

---

## Service worker (`public/sw.js`) — read before editing

Navigation requests are **network-first**; only `/assets/*` (content-hashed) is cache-first. It was
cache-first on everything with a fixed cache name, which meant every deploy served returning
visitors a stale `index.html` pointing at asset hashes that no longer existed → **blank white
page**. If you change the strategy, bump `CACHE_NAME` (currently `signal-portfolio-v3`).

---

## Verified

Checked in a real rendering engine (headless Chrome against `npm run preview`) at 1440×900 and at
390px in an iframe:

- All five pages render, in order, with the panel highlight on the right item.
- Typecheck, lint and build are clean.
- `press me !` and the `next` pill are present and clickable once their typing lands.
- The study card's glass shows the snow softened behind it; the neighbour card is blurred and
  runs off the edge of the page as intended.
- At 390px: the deck fits one screen, the arrows sit in the chip row, and nothing is clipped —
  the page is allowed to scroll if a card runs long.

Interactive behaviour (skip-on-click, the deck's trackpad swipe, the dissolve, the pointer
wake) was driven over CDP from a Node script using the built-in `WebSocket` — no puppeteer —
against `--headless=new --use-angle=swiftshader`, which does run rAF and WebGL. The Chrome
extension's automation tab sits in a background window, so rAF never ticks there and every GSAP
tween looks frozen: it is not a bug in the site.

Two notes for whoever verifies this next, both of which cost time:

- **Headless Chrome has a minimum window width of 500px.** `--window-size=390,844` renders at 500
  and crops the screenshot to 390, which looks exactly like a broken layout. Render the site in a
  390px-wide `<iframe>` inside a wider page instead; an iframe gets its own viewport for media
  queries.
- **rAF ticks are sparse under `--virtual-time-budget`**, so anything driven by
  `requestAnimationFrame` — the typewriter, GSAP — is caught part-way through even with a 30s
  budget. `--force-prefers-reduced-motion` skips the typing and collapses the transitions, which
  is how the settled layout was actually seen. It also disables the WebGL snow, so the field looks
  thinner in those screenshots than it is.

---

## Next steps

1. **Flip through it on a real trackpad and a phone.** Drag feel is the one thing a harness cannot
   judge: `DRAG_STEP` in `Carousel.tsx` is the number to change, and `metrics()` above it controls
   how far the neighbouring cards sit out and turn.
2. **`instagram` and `discord` are still bare placeholders** in the old profile data and are not
   rendered. `socials` in `site.ts` lists only the four that are real; add a row when there is a
   handle to put in it.
3. **Decide about `api/contact.ts`.** Nothing posts to it. Either bring a contact form back or
   delete the file and the two Vercel environment variables (`TELEGRAM_BOT_TOKEN`,
   `TELEGRAM_CHAT_ID`).
4. Optional: `SnowGL` at 466 kB raw trips Vite's chunk-size warning. It is lazy and gated, so this
   is cosmetic; importing narrower three.js modules would quiet it.
