import { route } from '../data/site'

export type Anchor = { start: number; end: number }

/**
 * Where the scrollbar puts the camera.
 *
 * While a stop's section is on screen the route holds at that integer, so a panel
 * can be read with the world standing still. The leg between two stops is the only
 * stretch of scroll that moves the camera. Anchors are measured from the DOM, so a
 * stop can be any height and nothing here has to know.
 */
export function measureAnchors(): Anchor[] {
  const vh = window.innerHeight
  return route.map(({ id }) => {
    const el = document.getElementById(id)
    if (!el) return { start: 0, end: 0 }
    const rect = el.getBoundingClientRect()
    const top = rect.top + window.scrollY
    return { start: top, end: Math.max(top, top + rect.height - vh) }
  })
}

let flight = 0

/**
 * Crossing the universe by link should be a flight, not a cut.
 *
 * The browser's own smooth scrolling covers thirty screens in under a second, which
 * shows nothing. This takes up to seven, slowly at both ends, and hands control back
 * the moment the visitor touches the wheel or the screen.
 */
export function flyTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const from = window.scrollY
  const to = el.getBoundingClientRect().top + from
  const screens = Math.abs(to - from) / window.innerHeight
  const duration = Math.min(7000, 900 + screens * 300)
  const start = performance.now()

  cancelAnimationFrame(flight)
  const stop = () => {
    cancelAnimationFrame(flight)
    window.removeEventListener('wheel', stop)
    window.removeEventListener('touchstart', stop)
  }
  window.addEventListener('wheel', stop, { passive: true })
  window.addEventListener('touchstart', stop, { passive: true })

  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    window.scrollTo({ top: from + (to - from) * eased, behavior: 'instant' as ScrollBehavior })
    if (t < 1) flight = requestAnimationFrame(frame)
    else stop()
  }
  flight = requestAnimationFrame(frame)
}

export function routePosition(anchors: Anchor[], y: number): number {
  for (let i = 0; i < anchors.length; i++) {
    if (y <= anchors[i].end) {
      if (y >= anchors[i].start || i === 0) return i
      const prev = anchors[i - 1]
      return i - 1 + (y - prev.end) / Math.max(1, anchors[i].start - prev.end)
    }
  }
  return anchors.length - 1
}
