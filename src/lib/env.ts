/**
 * The environment questions the whole site asks.
 *
 * Read live rather than cached at import: the OS-level reduced-motion switch
 * can be flipped while the tab is open.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Small screen or a finger: no pinned stacking, no parallax on the panels. */
export function isCompact(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 820px), (pointer: coarse)').matches
}
