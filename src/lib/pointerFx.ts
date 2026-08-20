import { useEffect, useRef } from 'react'
import { useMotionProfile } from './useMotionProfile'

/**
 * Pointer-driven effects for the desktop tier.
 *
 * Both hooks write straight to the element's style inside a single rAF frame
 * and keep every mutable value in a ref. None of this may go through React
 * state: a pointermove fires up to 120 times a second, and re-rendering a card
 * grid at that rate is precisely the kind of thing that took the page from
 * "smooth" to "unusable" — the same mistake the particle canvas made before it
 * was rewritten.
 *
 * On the `lite` tier every listener is skipped entirely. Touch devices have no
 * hover to respond to, so the work would be pure overhead.
 */

/**
 * Pulls an element gently toward the cursor while it is nearby, then releases.
 * Used on the hero calls-to-action and the nav button.
 *
 * @param strength How far the element may travel, as a fraction of the cursor
 *   offset. 0.3 is a clear pull; above ~0.5 the element outruns the pointer.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.3) {
  const ref = useRef<T>(null)
  const { isFull } = useMotionProfile()

  useEffect(() => {
    const element = ref.current
    if (!element || !isFull) return

    let frame = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    // Ease toward the target rather than snapping to it. Without this the
    // element jitters one-to-one with every raw pointer sample.
    const tick = () => {
      currentX += (targetX - currentX) * 0.18
      currentY += (targetY - currentY) * 0.18
      element.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`

      // Stop the loop once it has effectively arrived, so an idle button is
      // not holding a rAF open for the life of the page.
      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        frame = requestAnimationFrame(tick)
      } else {
        frame = 0
      }
    }

    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }

    const handleMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      targetX = (event.clientX - (rect.left + rect.width / 2)) * strength
      targetY = (event.clientY - (rect.top + rect.height / 2)) * strength
      start()
    }

    const handleLeave = () => {
      targetX = 0
      targetY = 0
      start()
    }

    element.addEventListener('pointermove', handleMove)
    element.addEventListener('pointerleave', handleLeave)

    return () => {
      element.removeEventListener('pointermove', handleMove)
      element.removeEventListener('pointerleave', handleLeave)
      if (frame) cancelAnimationFrame(frame)
      element.style.transform = ''
    }
  }, [isFull, strength])

  return ref
}

/**
 * Card tilt plus a light that tracks the cursor across the surface.
 *
 * The hook only writes custom properties — `--rx`/`--ry` for the rotation and
 * `--px`/`--py` for the highlight position. The stylesheet decides what to do
 * with them (`.tilt-surface` in index.css), which keeps the transform out of
 * JavaScript's hands and lets the same hook drive a card that wants only the
 * highlight and no rotation at all.
 *
 * Attach it to an element Framer Motion is not animating. Framer writes an
 * inline `transform`, and an inline transform beats anything a class can say.
 */
export function useTilt<T extends HTMLElement>(maxDegrees = 6) {
  const ref = useRef<T>(null)
  const { isFull } = useMotionProfile()

  useEffect(() => {
    const element = ref.current
    if (!element || !isFull) return

    let frame = 0
    let pending: { x: number; y: number } | null = null

    const apply = () => {
      frame = 0
      if (!pending) return
      const { x, y } = pending
      element.style.setProperty('--px', `${(x * 100).toFixed(1)}%`)
      element.style.setProperty('--py', `${(y * 100).toFixed(1)}%`)
      element.style.setProperty('--ry', `${((x - 0.5) * 2 * maxDegrees).toFixed(2)}deg`)
      element.style.setProperty('--rx', `${((0.5 - y) * 2 * maxDegrees).toFixed(2)}deg`)
    }

    const handleMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      pending = {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      }
      // Coalesce to one write per frame. Chrome delivers pointer events faster
      // than it paints, and every extra style write is a wasted style recalc.
      if (!frame) frame = requestAnimationFrame(apply)
    }

    const handleLeave = () => {
      pending = null
      if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
      element.style.setProperty('--rx', '0deg')
      element.style.setProperty('--ry', '0deg')
    }

    element.addEventListener('pointermove', handleMove)
    element.addEventListener('pointerleave', handleLeave)

    return () => {
      element.removeEventListener('pointermove', handleMove)
      element.removeEventListener('pointerleave', handleLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [isFull, maxDegrees])

  return ref
}
