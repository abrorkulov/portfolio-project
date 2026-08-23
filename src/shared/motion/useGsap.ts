import { useEffect, useRef } from 'react'
import type { gsap as GsapType } from 'gsap'
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger'
import { isLiteMotion } from '@/shared/motion/motion'

/**
 * GSAP + ScrollTrigger, kept entirely off the critical path.
 *
 * Framer Motion owns the entrances on this site — declarative variants, one
 * shared vocabulary, an inert `lite` tier. GSAP is here for the one thing
 * Framer is genuinely worse at: a *scrubbed* timeline, where a sequence of
 * unrelated properties on unrelated elements is driven by scroll position
 * rather than played on a trigger. The staircase climb is that.
 *
 * Two rules follow from the performance work already in this repo, and both
 * are load-bearing:
 *
 * 1. **Never import `gsap` at module scope from anything the entry reaches.**
 *    A static import puts ~70 kB into the first paint's graph, on every
 *    device, including the phones where none of it will ever run. The dynamic
 *    `import()` below means GSAP is a chunk of its own, fetched when — and
 *    only when — a full-tier browser mounts a component that asked for it.
 *
 * 2. **Nothing runs on `lite`.** Same reasoning as `motion.ts`: that tier has
 *    no animation at all, and a scroll-linked timeline is the most expensive
 *    kind there is. On `lite` this hook returns before it even resolves the
 *    import, so a phone never downloads the library.
 */

export type GsapContext = {
  gsap: typeof GsapType
  ScrollTrigger: typeof ScrollTriggerType
  /** The element the hook was scoped to. Never null inside `setup`. */
  root: HTMLElement
}

type Setup = (context: GsapContext) => void

type Loaded = { gsap: typeof GsapType; ScrollTrigger: typeof ScrollTriggerType }

let modulePromise: Promise<Loaded> | null = null

/**
 * Resolves GSAP with ScrollTrigger registered, once per page.
 *
 * The promise is memoised rather than the module, so several components
 * mounting in the same frame share one network request instead of racing to
 * register the plugin three times.
 */
function loadGsap(): Promise<Loaded> {
  if (!modulePromise) {
    modulePromise = Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([core, plugin]) => {
        const gsap = core.gsap ?? core.default
        gsap.registerPlugin(plugin.ScrollTrigger)
        return { gsap, ScrollTrigger: plugin.ScrollTrigger }
      })
      .catch((error) => {
        // A failed chunk must not take the section down with it: every
        // component using this hook renders correctly with no animation at
        // all, which is exactly what the lite tier already ships.
        modulePromise = null
        throw error
      })
  }
  return modulePromise
}

/**
 * Runs a GSAP setup function scoped to an element, on the full tier only.
 *
 * Everything the setup creates is collected by `gsap.context()`, so a single
 * `revert()` on unmount kills the tweens, the ScrollTriggers and any inline
 * styles GSAP wrote — no manual bookkeeping, and no ScrollTrigger left
 * measuring an element React has already removed.
 *
 * `setup` is read from a ref rather than listed as a dependency: it is almost
 * always an inline closure, so depending on it would tear down and rebuild
 * every ScrollTrigger on every render.
 */
export function useGsapScroll<T extends HTMLElement>(setup: Setup) {
  const ref = useRef<T>(null)
  const setupRef = useRef(setup)
  setupRef.current = setup

  useEffect(() => {
    if (isLiteMotion) return

    const root = ref.current
    if (!root) return

    let context: { revert: () => void } | null = null
    let cancelled = false

    loadGsap()
      .then(({ gsap, ScrollTrigger }) => {
        // The component can unmount while the chunk is in flight, which on a
        // slow connection is common — building a ScrollTrigger against a
        // detached node leaves a permanent listener measuring nothing.
        if (cancelled) return
        context = gsap.context(
          () => setupRef.current({ gsap, ScrollTrigger, root }),
          root,
        )
      })
      .catch(() => {
        // Already handled: the section stays in its authored, static state.
      })

    return () => {
      cancelled = true
      context?.revert()
    }
  }, [])

  return ref
}
