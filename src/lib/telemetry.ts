/**
 * The narrow bridge from the engine to the page. The instruments read at ten
 * frames a second, and going through React state would re-render them that often
 * for the sake of a number. Subscribers write to the DOM themselves.
 */

export type Reading = { at: number; km: number; lightYears: number }

const listeners = new Set<(t: Reading) => void>()
let pulse: (() => void) | null = null

export function emitTelemetry(reading: Reading) {
  listeners.forEach((fn) => fn(reading))
}

export function onTelemetry(fn: (t: Reading) => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function setPulse(fn: (() => void) | null) {
  pulse = fn
}

/** A short surge of speed through the stars. The crackme's reward. */
export function firePulse() {
  pulse?.()
}
