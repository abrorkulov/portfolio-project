# CLAUDE.md — abrorkulov.uz

Personal site for **Jahongir Abrorkulov** (16, Tashkent, Uzbekistan): full-stack engineer who also
goes below the API (C++, process memory, reverse engineering). React + Vite + raw WebGL2, deployed
on Vercel at `abrorkulov.uz`.

All copy is in **English**.

---

## The idea

**Full stack, actually full.** Most full-stack stops at the database; this one goes down to the
register. The page is laid out as that descent, and every design decision serves it:

| # | id | component | ground | what it is |
|---|---|---|---|---|
| 0 | `#top` | `Hero.tsx` | black | The name, huge. Compiles from bytes on arrival, breaks into its own hex under the pointer, melts on scroll. |
| 1 | `#about` | `About.tsx` | black | One sentence read by scrolling, then a spec table. |
| 2 | `#work` | `Work.tsx` | bone | Four sticky project panels, then a list. Real screenshots. |
| 3 | `#stack` | `Descent.tsx` | black | L6 Interface to L0 Machine: 3D plates peel away as you scroll. |
| 4 | `#lab` | `Lab.tsx` | black | A working crackme on a real x86 emulator, and field notes on `cs2-cheat`. |
| 5 | `#contact` | `Contact.tsx` | ember | The whole page finally spends the accent. Changes if the crackme was beaten. |

---

## Commands

| Task | Command |
|---|---|
| Dev server (HMR) | `npm run dev` → http://localhost:5173 |
| Production build | `npm run build` (runs `tsc -b` first — build fails on type errors) |
| Preview the build | `npm run preview` → http://localhost:4173 |
| Lint | `npm run lint` |
| Typecheck only | `npx tsc --noEmit -p tsconfig.json` |
| Format a file | `npx prettier --no-semi --single-quote --print-width 100 --write <file>` |

There is **no test suite**. Verification = typecheck + lint + build + looking at the preview.

> **Prettier has no config file.** Always pass those flags, or it rewrites the file to double quotes
> and semicolons, which does not match this codebase.

---

## Architecture

Vite + React 18. **No router, no CSS framework, no animation library, no 3D library.** The only
runtime dependencies are `react` and `react-dom`. Do not add GSAP, Framer Motion, three.js or
Tailwind back without a reason the existing tools cannot cover: leaving them out is why the first
load is about 64 kB of gzipped JS.

```
index.html            Meta/SEO/JSON-LD, font preloads, the .js class set before first paint
api/contact.ts        Vercel edge function forwarding to a Telegram bot. Nothing posts to it; kept
                      because its environment variables exist and a contact form may come back.
src/main.tsx          Entry. Registers the service worker (PROD only). The devtools greeting.
src/App.tsx           Section order, the one reveal observer, the `cracked` state.
src/index.css         The entire stylesheet. Hand-written.
src/data/site.ts      Every string on the site.
public/fonts/         Self-hosted variable woff2 (see Performance).
public/work/          Project screenshots, 1920x1080 webp.
public/sw.js          Service worker. Read the fetch-handler comment before touching it.
```

### `src/lib/`

| File | Role |
|---|---|
| `heroGL.ts` | The hero in raw WebGL2: a feedback pass for the pointer trail and a main pass for letters and bytes. |
| `x86.ts` | The emulator: real encodings, decoded at EIP every step. `decode`, `disassemble`, `step`. |
| `scroll.ts` | `useScrollProgress`: one rAF loop for everything the scrollbar drives. Stops itself when settled. |
| `useNow.ts` | Tashkent time and weather (Open-Meteo, no key, once per visit) for the contact footer. |
| `env.ts` | `prefersReducedMotion`, `isCompact`. Read live. |

### `src/components/`

`Hud` (top bar and the descending address), `Hero`, `About`, `Work`, `Descent`, `Lab`, `Contact`,
`Scramble` (a label that decodes itself once, and on hover), `BrandIcon` (inlined brand marks).

---

## Content rule: nothing invented

**Every claim on the site must be checkable against a public repo.** This site is read by engineers,
and a single made-up number costs all of it. No metrics, no client names, no tools he has not used.

- Routes, tables and function names on the stack plates come from the real repos (Hamshira README,
  `cs2-cheat/Core/MemoryMgr.h`).
- The projects' own landing pages contain demo figures (students, tonnage). Screenshots are framed
  on inner pages or cropped above those rows so they are not presented as this site's claims.
- **Check that a `*.vercel.app` URL is his before linking it.** Short names belong to strangers:
  `hackaton`, `job-finder`, `farm-platform`, `sotuv-sayt`, `hamshirago-web` and `bozor-marketplace`
  on vercel.app are all other people's sites. Compare against the repo's stack and `<title>`.
- JobFinder is deliberately linked to source only: its live `/jobs` page calls `localhost:5000`.
  Add `live` to it in `site.ts` once the production API is connected.

---

## Code style

- **Single quotes, no semicolons, 2-space indent.** Match surrounding code.
- **Comments explain *why*, never *what*.** Several record a bug that was fixed and why the code must
  stay that way. Do not delete them.
- **Content lives in `site.ts`; components render it.**

---

## Design rules

### Type

| Family | Variable | Used for |
|---|---|---|
| Archivo, 900, `font-stretch: 62%` | `--display` | Everything set large. |
| Archivo, wider and lighter | `--display` | The hero statement and the about sentence. |
| Martian Mono, `font-stretch: 75%` | `--mono` | Everything a machine would print, and all small copy. |

No third face. Emphasis is a size, a weight or ember.

### Colour

`--ink #050505`, `--bone #ece7dc`, `--ember #ff4a1c`. **One accent.** Ember marks what is live or hot;
it only becomes a ground in `#contact` (and the ACCESS GRANTED band). The chromatic edge in the hero
was RGB and looked cheap; it is an ember ghost now. Do not add a second accent, glass, gradients as
decoration, or rounded cards: those are what made the previous versions read as a template.

### Not on this site, on purpose

Snow, handwritten script, glass panes, a drawn cursor, a comet, fog behind the content. All were here
in earlier versions. The system pointer is the pointer.

### The hero (`heroGL.ts`, `Hero.tsx`)

- The real `<h1>` stays in the DOM, sized by `fitLines`. It is what a screen reader, reduced-motion
  visitor or machine without WebGL2 gets, and the shader rasterises from its measured rects. With GL
  running its colour is `transparent`.
- Each **character cell** samples the trail at its centre and picks solid letter or bytes, which is
  what makes the edge break up per character instead of fading like a brush.
- The bytes are the hex of `heroBytes` in `site.ts`, not noise. It can actually be read.
- The canvas font must use the keyword form (`900 extra-condensed …`); it is the only way to reach the
  width axis from a 2D context.
- **Phones get a different break:** JAHON / GIR / ABROR / KULOV, at `window.innerWidth < 720`.
- Nothing waits for the shader. `painted` is forced after 1.8 s whatever happens.
- With no pointer activity for 2.6 s the stroke wanders by itself, so the effect is found on a phone.
- It drops to DPR 1 once, if it cannot hold frame rate. Once only, so the picture never pulses.

### Scroll

`useScrollProgress` modes: `pin` (tall section with a sticky child), `through`, `enter`. Rects are all
read before any callback writes. **Nothing scroll-driven touches React state.** `body` uses
`overflow-x: clip`, not `hidden`: `hidden` makes it a scroll container and kills every sticky.

### Plates (`Descent.tsx`)

`preserve-3d` lives on `.plates`. No `opacity` or `filter` on that element or it flattens to a plane;
opacity belongs on each `.plate`. Each layer gets a plateau in the scroll mapping so the reader rests
on a layer instead of sliding through at constant speed.

### Crackme (`Lab.tsx`, `x86.ts`)

```
int check(int key) { return (key ^ 0x5A5A) == 0x1337 }   // key is 0x496D
```

Two ways in, both real: the key, or the one-byte patch `75 → 74` (JNE → JE) at `0x40100D`. Unknown
bytes fault as `#UD`; a jump outside the image is an access violation; runs stop at 256 steps, and
after 24 steps a run stops animating so a patched loop never holds the visitor.

The verdict is reported from **one effect watching `cpu`**, never from a state updater, because
StrictMode runs updaters twice.

---

## Bugs worth remembering

Each of these happened, and each comes back the moment someone tidies the code:

- **`data-reveal` nodes must not have a state-driven `className`.** The observer adds `is-in` directly
  to the node; React then overwrites `className` on the next render and the element goes back to
  `opacity: 0`. The debugger vanished at the exact moment it was beaten. The hero lost `is-gl` the same
  way. Observed nodes get static classes; stateful classes go on a child, or through state.
- **Reduced motion is `transition: none`, not `transition-duration: 0.01ms`.** A tiny duration still
  starts a transition on every property including `font-size`, and `fitLines` measures straight after
  writing a size. It read stale values and set the name at a fraction of its size.
- **Never `loseContext()` in `dispose`.** StrictMode remounts; `getContext` on the same canvas would
  hand back the dead context.

---

## Performance

- First load: HTML + CSS (~6.5 kB gz) + JS (~64 kB gz) + two fonts (128 kB, preloaded). Images are lazy.
- **Fonts are self-hosted on purpose.** The hero rasterises from the real font, so a late font is not a
  flash of the wrong type but a shader drawing the wrong letters. `heroGL` waits on `document.fonts.load`.
- The hero loop stops when off screen or hidden. The scroll loop stops when settled.
- On a phone the sticky stacking in `Work` is off: a panel cannot promise to fit the screen.

---

## Service worker (`public/sw.js`) — read before editing

Navigation requests are **network-first**; only `/assets/*` (content-hashed) is cache-first. It was
cache-first on everything with a fixed cache name, which meant every deploy served returning visitors a
stale `index.html` pointing at asset hashes that no longer existed → **blank white page**. If you change
the strategy, bump `CACHE_NAME` (currently `signal-portfolio-v5`).

---

## Verifying

Driven over CDP from a Node script using the built-in `WebSocket` (no puppeteer), against
`--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader`, which runs rAF and WebGL2.

- Phones: `Emulation.setDeviceMetricsOverride` with `mobile: true`. `--window-size` has a 500 px minimum
  and crops, which looks exactly like a broken layout.
- Reduced motion: `Emulation.setEmulatedMedia`.
- The Chrome extension's automation tab sits in a background window where rAF never ticks, so everything
  looks frozen there. That is not a bug in the site.
- Scrolling in a script: set `scrollBehavior = 'auto'` first, or a long smooth scroll is still in flight
  when the screenshot fires.

---

## Next steps

1. **Real screenshots for HamshiraGo.** It has a drawn roles panel only because there is no public build.
   Set `image` on the project in `site.ts` to replace it.
2. **Connect JobFinder's production API**, then add its `live` URL.
3. **Name the reversing tools** he actually uses (debugger, disassembler) in the L0 layer. Left out
   because no repo shows them.
4. **Decide about `api/contact.ts`.** Nothing posts to it. Either bring a form back or delete the file and
   its two Vercel environment variables (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
