import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from './env'

/** A mouse or a trackpad — the only pointer that can hover. */
export function hasFinePointer(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

/**
 * Glare and tilt for a pane of glass.
 *
 * Writes four custom properties straight onto the element on every move —
 * `--mx`/`--my` for where the light sits and `--rx`/`--ry` for how far the
 * pane leans toward the pointer — and lets the stylesheet draw both. Nothing
 * here touches React state: a hover would otherwise re-render the page on
 * every pointermove, which is exactly the cost the deck already avoids.
 *
 * Returns handlers to spread onto the element. A coarse pointer gets nothing
 * to spread, so a phone never pays for a hover it cannot perform.
 */
export function glass(tilt = 7) {
  if (typeof window === 'undefined' || !hasFinePointer() || prefersReducedMotion()) return {}

  return {
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      const el = event.currentTarget
      const box = el.getBoundingClientRect()
      const x = event.clientX - box.left
      const y = event.clientY - box.top
      const px = x / box.width - 0.5
      const py = y / box.height - 0.5
      el.style.setProperty('--mx', `${x}px`)
      el.style.setProperty('--my', `${y}px`)
      el.style.setProperty('--rx', `${(-py * tilt).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${(px * tilt).toFixed(2)}deg`)
      el.classList.add('is-lit')
    },
    onPointerLeave: (event: React.PointerEvent<HTMLElement>) => {
      const el = event.currentTarget
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
      el.classList.remove('is-lit')
    },
  }
}

/**
 * Pulls an element a little way toward the pointer while it is nearby, and
 * lets it spring back when the pointer leaves.
 *
 * The element the ref points at must carry no CSS transition on `transform`:
 * gsap writes the transform inline, and a transition on top of that would
 * ease the eased value a second time and lag behind the hand.
 */
export function useMagnet<T extends HTMLElement>(reach = 90, pull = 0.35) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !hasFinePointer() || prefersReducedMotion()) return

    const toX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
    const toY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
    let held = false

    const onMove = (event: PointerEvent) => {
      const box = el.getBoundingClientRect()
      const dx = event.clientX - (box.left + box.width / 2)
      const dy = event.clientY - (box.top + box.height / 2)
      const inside = Math.hypot(dx, dy) < reach + Math.max(box.width, box.height) / 2
      if (inside) {
        held = true
        toX(dx * pull)
        toY(dy * pull)
      } else if (held) {
        held = false
        toX(0)
        toY(0)
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      gsap.set(el, { x: 0, y: 0 })
    }
  }, [reach, pull])

  return ref
}
