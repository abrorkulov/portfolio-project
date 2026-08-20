import { useEffect, useState } from 'react'

/**
 * Two motion budgets, picked once from the device.
 *
 * The page used to run one animation vocabulary everywhere, which is why it
 * stuttered on phones: the same blur filters, 70-particle canvas, per-card
 * hover springs and backdrop blurs that a desktop GPU composites for free are
 * the exact things a mid-range phone repaints on the CPU, every frame, while
 * the user is scrolling.
 *
 * `full`  — pointer device, wide viewport, healthy hardware. Everything on.
 * `lite`  — touch, narrow, low-memory, or reduced-motion. Shorter distances,
 *           no filter animation, no per-frame pointer work, no backdrop blur.
 */
export type MotionTier = 'lite' | 'full'

type NavigatorWithHints = Navigator & {
  deviceMemory?: number
  hardwareConcurrency?: number
}

const COARSE_POINTER = '(hover: none) and (pointer: coarse)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/** Viewport below this is treated as a phone/small tablet regardless of input. */
const LITE_MAX_WIDTH = 1024

function detectTier(): MotionTier {
  if (typeof window === 'undefined' || !window.matchMedia) return 'full'

  if (window.matchMedia(REDUCED_MOTION).matches) return 'lite'
  if (window.matchMedia(COARSE_POINTER).matches) return 'lite'
  if (window.innerWidth < LITE_MAX_WIDTH) return 'lite'

  // Client hints are Chromium-only; absent means "assume capable" rather than
  // penalising Safari and Firefox, which report neither.
  const nav = navigator as NavigatorWithHints
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return 'lite'
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) {
    return 'lite'
  }

  return 'full'
}

let cachedTier: MotionTier | null = null

/**
 * The tier, resolved once and memoised.
 *
 * `src/lib/motion.ts` builds its variants from this at import time, so the
 * value has to be stable for the lifetime of the page — a variant object that
 * changed identity mid-session would restart every animation using it.
 */
export function getMotionTier(): MotionTier {
  if (cachedTier === null) cachedTier = detectTier()
  return cachedTier
}

export const isLiteTier = () => getMotionTier() === 'lite'

/**
 * Publishes the tier as `data-motion` on <html> so the stylesheet can gate the
 * expensive paint work — backdrop blur, the fixed grain, huge blur radii —
 * without waiting for React to hydrate and without a flash of the heavy style.
 * Call this before the first render.
 */
export function syncMotionTier(): MotionTier {
  const tier = getMotionTier()
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.motion = tier
  }
  return tier
}

/**
 * Live tier for components that branch at runtime (the particle field, tilt
 * and magnet hooks, the hero). Unlike `getMotionTier` this re-evaluates when
 * the window crosses the width threshold or the pointer type changes, so
 * resizing a desktop window down actually drops the heavy effects.
 */
export function useMotionProfile() {
  const [tier, setTier] = useState<MotionTier>(getMotionTier)

  useEffect(() => {
    const evaluate = () => {
      // Bypass the cache: this hook is the one place that wants a fresh read.
      cachedTier = null
      const next = getMotionTier()
      document.documentElement.dataset.motion = next
      setTier(next)
    }

    const queries = [
      window.matchMedia(COARSE_POINTER),
      window.matchMedia(REDUCED_MOTION),
      window.matchMedia(`(max-width: ${LITE_MAX_WIDTH - 1}px)`),
    ]

    queries.forEach((query) => query.addEventListener('change', evaluate))
    return () =>
      queries.forEach((query) => query.removeEventListener('change', evaluate))
  }, [])

  return {
    tier,
    isLite: tier === 'lite',
    isFull: tier === 'full',
  }
}
