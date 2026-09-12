/**
 * The two environment questions the whole site asks.
 *
 * Both are read live rather than cached at import: the OS-level
 * reduced-motion switch can be flipped while the tab is open, and this site
 * is short enough that a visitor really can be on the first scene when it
 * happens.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Whether the WebGL star field is worth mounting.
 *
 * A failed `getContext` is the expensive case to avoid: without this the
 * three.js chunk downloads on a device that can never paint a single frame of
 * it. The probe canvas is thrown away immediately — contexts are a limited
 * resource and the real one is created by the renderer a moment later.
 */
export function canRunWebGL(): boolean {
  if (typeof window === 'undefined') return false
  if (prefersReducedMotion()) return false

  try {
    const probe = document.createElement('canvas')
    const gl =
      probe.getContext('webgl2') ||
      probe.getContext('webgl') ||
      probe.getContext('experimental-webgl')
    if (!gl) return false
    const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')
    if (lose) lose.loseContext()
    return true
  } catch {
    return false
  }
}

/** Coarse pointer or small screen. Thins the star field; never skips it. */
export function isCompact(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches
}
