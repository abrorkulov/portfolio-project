import { useEffect } from 'react'

/** Wheel travel that counts as a deliberate flick, in pixels. */
const WHEEL_STEP = 90
/** A wheel gesture is over once the events stop for this long. */
const WHEEL_GAP = 160
/** Finger travel that counts as a swipe, in pixels. */
const SWIPE = 64
/** Nothing else may flip a page for this long after one does. */
const COOLDOWN = 900

function atTop(): boolean {
  return window.scrollY <= 2
}

function atBottom(): boolean {
  const root = document.documentElement
  return window.scrollY + window.innerHeight >= root.scrollHeight - 2
}

/**
 * A swipe on a phone and a wheel flick on a desktop both turn the page.
 *
 * Both are discrete: one gesture is one page, and the scrollbar is never
 * bound to anything. A page that is taller than the screen still scrolls the
 * ordinary way — the gesture only counts when the document was *already* at
 * the edge it is being pushed past when the gesture began, so a swipe that
 * scrolls a long card to its end does not also turn the page in the same
 * motion.
 *
 * Trackpad inertia is the trap. It arrives as a stream of shrinking deltas
 * with no gap between them, so a gesture only begins after `WHEEL_GAP` of
 * silence, and the cooldown swallows whatever the last one is still emitting.
 */
export function usePageGestures(go: (delta: number) => void) {
  useEffect(() => {
    let lockedUntil = 0
    let wheelSum = 0
    let wheelLast = 0
    let wheelSpent = false
    let touch: { y: number; x: number; top: boolean; bottom: boolean } | null = null

    const flip = (delta: number) => {
      const now = performance.now()
      if (now < lockedUntil) return
      lockedUntil = now + COOLDOWN
      go(delta)
    }

    const onWheel = (event: WheelEvent) => {
      // A horizontal scroller (the stack row on a phone) owns its own axis.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const now = performance.now()
      if (now - wheelLast > WHEEL_GAP) {
        wheelSum = 0
        wheelSpent = false
      }
      wheelLast = now
      if (wheelSpent) return
      wheelSum += event.deltaY
      if (wheelSum > WHEEL_STEP && atBottom()) {
        wheelSpent = true
        flip(1)
      } else if (wheelSum < -WHEEL_STEP && atTop()) {
        wheelSpent = true
        flip(-1)
      }
    }

    const onTouchStart = (event: TouchEvent) => {
      const t = event.touches[0]
      touch = { y: t.clientY, x: t.clientX, top: atTop(), bottom: atBottom() }
    }

    const onTouchEnd = (event: TouchEvent) => {
      const start = touch
      touch = null
      if (!start) return
      const t = event.changedTouches[0]
      const dy = start.y - t.clientY
      const dx = start.x - t.clientX
      // Mostly vertical, or it is the deck being dragged.
      if (Math.abs(dy) < SWIPE || Math.abs(dy) < Math.abs(dx) * 1.6) return
      if (dy > 0 && start.bottom) flip(1)
      if (dy < 0 && start.top) flip(-1)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [go])
}
