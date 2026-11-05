# CLAUDE.md — abrorkulov.uz

Personal site for **Jahongir Abrorkulov** (16, Tashkent, Uzbekistan): full-stack engineer who also
goes below the API (C++, process memory, reverse engineering). React + Vite + raw WebGL2, deployed
on Vercel at `abrorkulov.uz`.

All copy is in **English**.

---

## The idea

**Not a space-themed website: space, rendered live, with a website floating in it.** The page is one
continuous camera flight. Scrolling moves the camera; there are no sections sliding past.

| at | id | world | what is there |
|---|---|---|---|
| 0 | `#top` | Earth | The real Earth now: the night side is where night is. Tashkent is pinned, with live time and weather. |
| 1 | `#about` | Moon | Earthrise over the lunar horizon. The one sentence that says who he is. |
| 2 | `#hamshira` | Mars | HamshiraGo |
| 3 | `#agrovest` | Jupiter | AgroVest |
| 4 | `#maktab` | Saturn | Maktab AI |
| 5 | `#jobfinder` | Uranus | JobFinder |
| 6 | `#also` | Neptune | Everything else |
| 7 | `#lab` | Pluto | The x86 crackme and `cs2-cheat`. "Not officially a planet. Not officially allowed." |
| 8 | `#stack` | Milky Way | The camera pulls out of the disc until the whole galaxy is in frame. |
| 9 | `#contact` | Deep field | Thousands of galaxies, the contact links, and a button that flies back to Tashkent. |

The previous version was huge type in black and orange. The owner rated it 5/10: "just a style".
**Do not bring back big type or neon.** The wow is the world; type stays small and quiet.

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

Vite + React 18. **No router, no CSS framework, no animation library, no 3D library.** The only runtime
dependencies are `react` and `react-dom`. Do not add three.js, GSAP or Tailwind back without a reason
the existing tools cannot cover.

```
index.html            Meta/SEO/JSON-LD, preloads, the .js class set before first paint
api/contact.ts        Vercel edge function forwarding to a Telegram bot. Nothing posts to it; kept
                      because its environment variables exist and a contact form may come back.
src/main.tsx          Entry. Registers the service worker (PROD only). The devtools greeting.
src/App.tsx           Stops and legs in order, `data-here`, deep links, the `cracked` state.
src/index.css         The entire stylesheet. Hand-written.
src/data/site.ts      Every string on the site, and the route.
public/space/         Planet maps as webp. public/space/stills/ is the fallback for no WebGL.
public/fonts/         Self-hosted woff2: Jost and IBM Plex Mono.
public/work/          Project screenshots.
public/sw.js          Service worker. Read the fetch-handler comment before touching it.
```

### `src/space/` (a lazy chunk, loaded after the page text is up)

| File | Role |
|---|---|
| `solar.ts` | Where everything is, today. Real planet longitudes and Earth's real spin, in doubles. |
| `path.ts` | Each stop's camera shot, and `blendPose`, the flight between two of them. |
| `engine.ts` | The WebGL2 loop: passes, textures, adaptive quality, telemetry. |
| `shaders.ts` | All GLSL. Sky, stars, Sun, Earth, other bodies, galaxy, deep field, bloom, composite. |
| `galaxy.ts` | The seeded Milky Way and deep-field point clouds. |

### `src/lib/`

`route.ts` (scroll position → position on the route), `telemetry.ts` (engine → instruments, outside
React), `x86.ts` (the emulator), `useNow.ts` (Tashkent time and weather), `env.ts`.

### `src/components/`

`Space` (mounts the engine, the pin, the stills fallback), `Hud` (bar, route rail, distance readout),
`Stops` (Hero, About, ProjectStop, Also, Stack, Contact, Leg), `Lab`, `BrandIcon`.

---

## How the flight works

- **Stops hold, legs move.** `routePosition` returns an exact integer while a stop's section is on screen
  and a fraction across a leg, measured from the DOM. So a stop can be any height (`#lab` is tall).
- **A flight is two exponential zooms, not a line** (`blendPose`). Distance from the planet left and
  closeness to the next grow exponentially, so a disc changes size at a constant rate on screen. Linear
  interpolation keeps the next planet an invisible dot until the last few percent, then slams it in.
- **Each zoom runs along the shot's own axis.** A direct line from a sunward camera to an outer planet goes
  through the planet.
- **All positions are doubles in JS; shaders only see camera-relative values.** Nothing this big fits a float.
- **The Milky Way is a second camera in kiloparsecs**, starting at the Sun's place in the disc. Past Pluto the
  solar scene fades as the galaxy fades in around it.

---

## What is true, and what is not

Claims are the point of this site, so this is worth being exact about.

**Real:** Earth's spin and day/night to the minute (GMST + the Sun's mean longitude, the subsolar point has
been checked against the clock). Planet longitudes for the date (mean elements, circular orbits, good to a few
degrees). Every distance and light-time in the readout. The bytes and instructions in the crackme.

**Deliberately not real, and never claimed:**
- The Moon is at half its real distance and held at a fixed angle to the Sun, so Earthrise is never a dark disc.
- Clouds are a fixed map that drifts slowly, not today's weather.
- Atmosphere shell is thickened threefold, with coefficients scaled to keep the colour, or it would not show.
- **Pluto is drawn procedurally.** No free map at this resolution was found.

**Everything about Jahongir must be checkable against a public repo.** No metrics, client names or tools he has
not used. And check a `*.vercel.app` URL is his before linking it: `hackaton`, `job-finder`, `farm-platform`,
`sotuv-sayt`, `hamshirago-web` and `bozor-marketplace` on vercel.app all belong to strangers. Compare against the
repo's stack and `<title>`. JobFinder links to source only, because its live `/jobs` calls `localhost:5000`.

**Texture credit is a licence condition, not a courtesy:** the maps are Solar System Scope, CC BY 4.0, via
Wikimedia Commons. The line in `contact.credits` must stay.

---

## Design rules

- **Type:** Jost (voice, weights 200–400) and IBM Plex Mono (anything an instrument would print). Body 15px, largest
  heading about 50px. If something needs emphasis it gets a weight, not a size.
- **Colour:** `--space #05060a`, `--star #ebe8e1` at three strengths, one accent `--sun #d3bf94`. Nothing glows
  that is not a star. Colour comes from the planets.
- **Panels** sit left, the world right, on a soft radial scrim (`.panel::before`), because what ends up behind the
  words depends on the hour: sometimes it is the lights of Europe.
- **Phones:** the world on top, words below over a gradient, and the readout moves to the top.
- **Earth is framed by sliding along Tashkent's latitude** toward the terminator (`orbitDirection`). A great-circle
  slide ended up over the Arctic, looking at the pole, and the map stopped looking like Earth.

---

## Bugs worth remembering

Each of these happened, and each comes back the moment someone tidies the code:

- **Never derive mip levels from screen derivatives on a sphere.** Longitude wraps, and derivatives are garbage at a
  disc's edge: a seam pole to pole and a dotted line round the limb. `mapLod` computes it from the ray.
- **Clamp `ndv` in limb darkening**, or the last pixel of the limb goes black and the disc gets a dashed outline.
- **`b*b - |ro|^2` shimmers at distance.** Sphere tests use the cross product.
- **`data-here` is written directly, never through `className`.** React rewrites className on any render that changes
  it. The debugger once vanished at the exact moment it was beaten, and its state class now lives on a child.
- **`scrollIntoView({behavior: 'auto'})` inherits CSS smooth scrolling.** Deep links use `'instant'`, twice, since fonts
  arriving moves everything.
- **Reduced motion is `transition: none`, not `0.01ms`.** A tiny duration still starts a transition on every property.
- **The crackme's verdict is reported from one effect watching `cpu`**, never from a state updater: StrictMode runs
  updaters twice.
- **Galaxy particle size is capped while inside the disc.** Uncapped, nearby ones become blurry dinner plates and the
  screen turns to white soup.

---

## Crackme (`Lab.tsx`, `x86.ts`)

```
int check(int key) { return (key ^ 0x5A5A) == 0x1337 }   // key is 0x496D
```

Two ways in, both real: the key, or the one-byte patch `75 → 74` (JNE → JE) at `0x40100D`. Unknown bytes fault as an
illegal instruction; a jump outside the image is an access violation; runs stop at 256 steps, and past 24 a run stops
animating so a patched loop never holds the visitor. Winning fires a warp through the stars and changes the contact page.

---

## Performance

- First load: HTML + CSS + about 58 kB gz of JS. The engine (15 kB gz) and Earth's maps follow; further planets load
  when the camera is about two stops away. About 4 MB in total if someone flies the whole route.
- **Quality falls before frame rate does:** render scale steps down to 0.6, one way only, so the picture never pulses.
  Each body is scissored to its own disc, so only a planet filling the screen costs a full screen of shading.
- **Holding still, every other frame is skipped.**
- No WebGL2, reduced motion, or Save-Data: `Space` shows `public/space/stills/<stop>.webp` instead.
- Regenerate stills after changing a shot; they are real captures of the engine.

---

## Service worker (`public/sw.js`) — read before editing

Navigation requests are **network-first**; only `/assets/*` (content-hashed) is cache-first. It was cache-first on
everything with a fixed cache name, which meant every deploy served returning visitors a stale `index.html` pointing
at asset hashes that no longer existed → **blank white page**. If you change the strategy, bump `CACHE_NAME`.

---

## Verifying

Driven over CDP from a Node script using the built-in `WebSocket` (no puppeteer), against
`--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader`, which runs WebGL2 in software at about 4 fps.

- **This says nothing about frame rate on a real GPU.** It checks pictures and logic only.
- At 4 fps the camera's easing takes seconds to settle. Wait 6+ seconds after scrolling before a screenshot.
- Phones: `Emulation.setDeviceMetricsOverride` with `mobile: true`. Reduced motion: `Emulation.setEmulatedMedia`.
- Set `scrollBehavior = 'auto'` first, or a long smooth scroll is still in flight when the screenshot fires.
- The Chrome extension's automation tab sits in a background window where rAF never ticks: not a bug in the site.

---

## Next steps

1. **Real screenshots for HamshiraGo.** Set `image` on the project in `site.ts`.
2. **Connect JobFinder's production API**, then add its `live` URL.
3. **A real map of Pluto**, if one with a free licence turns up (`MAPS` and `NEEDS` in `engine.ts`).
4. **Decide about `api/contact.ts`.** Nothing posts to it. Either bring a form back or delete the file and its two
   Vercel environment variables (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
