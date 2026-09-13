import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { hasFinePointer } from '../lib/pointer'
import { prefersReducedMotion } from '../lib/env'

/**
 * A soft pool of light that trails the pointer across the black.
 *
 * It lives behind the page with the snow, so every pane of glass frosts it
 * the same way it frosts the flakes — the light is what makes a card read as
 * glass rather than as a grey rectangle, because there is finally something
 * behind it to be seen through.
 *
 * Positioned with a transform written by gsap, never through React. A phone
 * has no pointer to follow, so it gets nothing at all.
 *
 * This is also where the pointer becomes the two custom properties the
 * ghost numerals and the about lines read for their parallax — `--px` and
 * `--py`, -1..1, written on <html> at most once per frame.
 */
export default function Spotlight() {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = el.current
    if (!node || !hasFinePointer() || prefersReducedMotion()) return

    const toX = gsap.quickTo(node, 'x', { duration: 1.1, ease: 'power3.out' })
    const toY = gsap.quickTo(node, 'y', { duration: 1.1, ease: 'power3.out' })
    let shown = false

    const root = document.documentElement
    let frame = 0
    let px = 0
    let py = 0
    const writeParallax = () => {
      frame = 0
      root.style.setProperty('--px', px.toFixed(3))
      root.style.setProperty('--py', py.toFixed(3))
    }

    const onMove = (event: PointerEvent) => {
      toX(event.clientX)
      toY(event.clientY)
      px = (event.clientX / window.innerWidth) * 2 - 1
      py = (event.clientY / window.innerHeight) * 2 - 1
      if (!frame) frame = requestAnimationFrame(writeParallax)
      if (!shown) {
        shown = true
        gsap.to(node, { opacity: 1, duration: 1.4, ease: 'power2.out' })
      }
    }
    const onLeave = () => {
      shown = false
      gsap.to(node, { opacity: 0, duration: 0.8 })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      root.style.removeProperty('--px')
      root.style.removeProperty('--py')
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <div ref={el} className="spotlight" style={{ opacity: 0 }} />
}
