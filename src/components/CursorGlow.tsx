import { useEffect, useRef } from 'react'
import { useMotionProfile } from '../lib/useMotionProfile'

/**
 * A soft pool of light that trails the cursor across the whole page.
 *
 * It is one fixed, pre-painted radial gradient that only ever has its
 * `transform` changed, so after the first paint the browser does nothing but
 * hand a layer to the compositor at a new offset — no repaint, no layout. The
 * obvious alternative, moving a radial gradient's centre through custom
 * properties, repaints a full-viewport gradient on every pointer sample.
 *
 * Never mounted on the lite tier: there is no cursor to follow on a phone.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)
  const { isFull } = useMotionProfile()

  useEffect(() => {
    const glow = glowRef.current
    if (!glow || !isFull) return

    let frame = 0
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let currentX = targetX
    let currentY = targetY
    let revealed = false

    const tick = () => {
      // Lagging behind the pointer is what makes it read as light rather than
      // as a cursor: a 1:1 follow looks like a stuck UI element.
      currentX += (targetX - currentX) * 0.09
      currentY += (targetY - currentY) * 0.09
      glow.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0) translate(-50%, -50%)`

      if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        frame = requestAnimationFrame(tick)
      } else {
        frame = 0
      }
    }

    const handleMove = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY

      if (!revealed) {
        revealed = true
        // Snap to the first real position instead of sliding in from the
        // middle of the screen the moment the page loads.
        currentX = targetX
        currentY = targetY
        glow.style.opacity = '1'
      }

      if (!frame) frame = requestAnimationFrame(tick)
    }

    const handleLeave = () => {
      glow.style.opacity = '0'
      revealed = false
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    document.addEventListener('mouseleave', handleLeave)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      document.removeEventListener('mouseleave', handleLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [isFull])

  if (!isFull) return null

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-0 h-[46rem] w-[46rem] opacity-0 transition-opacity duration-700"
      style={{
        background:
          'radial-gradient(circle, rgba(94,233,212,0.09) 0%, rgba(167,139,250,0.05) 38%, transparent 68%)',
      }}
    />
  )
}
