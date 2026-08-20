import { useEffect, useRef } from 'react'
import { useMotionProfile } from '../lib/useMotionProfile'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
  pulsePhase: number
}

const COLORS = [
  'rgba(94, 234, 212,', // signal
  'rgba(167, 139, 250,', // pulse
  'rgba(99, 102, 241,', // indigo
  'rgba(236, 72, 153,', // pink
]

const LINK_DISTANCE = 140
const MOUSE_LINK_DISTANCE = 170
const MOUSE_FORCE_DISTANCE = 220

/** Squared thresholds: the inner loops compare distances, never need them. */
const LINK_DISTANCE_SQ = LINK_DISTANCE * LINK_DISTANCE
const MOUSE_LINK_DISTANCE_SQ = MOUSE_LINK_DISTANCE * MOUSE_LINK_DISTANCE
const MOUSE_FORCE_DISTANCE_SQ = MOUSE_FORCE_DISTANCE * MOUSE_FORCE_DISTANCE

/** Frame budget per tier. Phones run at half rate; nobody can tell on drift. */
const LITE_FRAME_MS = 1000 / 30

/**
 * Ambient constellation canvas.
 *
 * Everything mutable — pointer position, particles, the animation handle —
 * lives in refs. Keeping the pointer out of React state matters: driving it
 * through `useState` re-ran this effect on every mousemove, which tore down
 * the loop and re-seeded every particle at a random position dozens of times
 * a second.
 *
 * The field has two settings. On the full tier it is what it always was: a
 * dense constellation that links neighbours, reacts to the cursor and draws
 * threads back to it. On the lite tier the link pass is dropped entirely and
 * the frame rate is halved — the linking loop is O(n²) and, together with a
 * full-viewport clear at device pixel ratio on every frame, it was the canvas
 * competing with the scroll for the same main thread.
 */
export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isLite } = useMotionProfile()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReducedMotion) return

    const particles: Particle[] = []
    // Pointer starts off-screen so nothing is attracted before the first move.
    const mouse = { x: -9999, y: -9999 }
    let width = 0
    let height = 0

    const seed = () => {
      // Density scales with area rather than a flat count, so a wide desktop
      // isn't sparse and a phone isn't crowded — capped at both ends.
      const area = width * height
      const count = isLite
        ? Math.min(18, Math.round(area / 62000))
        : Math.min(80, Math.round(area / 22000))

      particles.length = 0
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (isLite ? 0.4 : 0.8),
          vy: (Math.random() - 0.5) * (isLite ? 0.4 : 0.8),
          size: Math.random() * 2.5 + 0.5,
          alpha: Math.random() * 0.5 + 0.2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          pulsePhase: Math.random() * Math.PI * 2,
        })
      }
    }

    const resize = () => {
      const nextWidth = window.innerWidth
      const nextHeight = window.innerHeight
      // Only re-seed when the viewport genuinely changes size. Mobile browsers
      // fire resize as the URL bar collapses, which would otherwise reshuffle
      // the whole field mid-scroll.
      const changed =
        Math.abs(nextWidth - width) > 1 || Math.abs(nextHeight - height) > 80

      width = nextWidth
      height = nextHeight
      // A retina phone at dpr 3 asks the GPU to clear nine times the pixels of
      // a dpr-1 buffer every frame, for dots nobody is inspecting. 1.5 is the
      // point past which the extra resolution stops being visible here.
      const dpr = Math.min(window.devicePixelRatio || 1, isLite ? 1.5 : 2)

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      if (changed || particles.length === 0) seed()
    }

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX
      mouse.y = event.clientY
    }

    const handleMouseLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })

    // No hover on the lite tier, so none of the pointer machinery is wired up
    // at all — no listener, no force pass, no thread pass.
    if (!isLite) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseleave', handleMouseLeave)
    }

    let frame = 0
    let paused = document.hidden
    let lastFrameTime = 0

    const handleVisibility = () => {
      paused = document.hidden
      if (!paused && !frame) frame = requestAnimationFrame(animate)
    }
    document.addEventListener('visibilitychange', handleVisibility)

    function animate(now: number) {
      frame = 0
      if (!ctx || paused) return

      // Half rate on lite. The drift is slow enough that 30fps is
      // indistinguishable from 60, and it hands every other frame back to the
      // scroll.
      if (isLite && now - lastFrameTime < LITE_FRAME_MS) {
        frame = requestAnimationFrame(animate)
        return
      }
      lastFrameTime = now

      ctx.clearRect(0, 0, width, height)

      for (const particle of particles) {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > width) particle.vx *= -1
        if (particle.y < 0 || particle.y > height) particle.vy *= -1

        if (!isLite) {
          // Push away from the pointer. Guard the divide so a particle sitting
          // exactly under the cursor doesn't turn its velocity into NaN.
          const dx = mouse.x - particle.x
          const dy = mouse.y - particle.y
          const distanceSq = dx * dx + dy * dy

          if (distanceSq > 0.000001 && distanceSq < MOUSE_FORCE_DISTANCE_SQ) {
            const distance = Math.sqrt(distanceSq)
            const force = (MOUSE_FORCE_DISTANCE - distance) / MOUSE_FORCE_DISTANCE
            particle.vx -= (dx / distance) * force * 0.6
            particle.vy -= (dy / distance) * force * 0.6
          }

          particle.vx *= 0.99
          particle.vy *= 0.99

          const speedSq = particle.vx * particle.vx + particle.vy * particle.vy
          if (speedSq < 0.04) {
            particle.vx += (Math.random() - 0.5) * 0.1
            particle.vy += (Math.random() - 0.5) * 0.1
          }
        }

        particle.pulsePhase += isLite ? 0.02 : 0.05
        const pulse = (Math.sin(particle.pulsePhase) + 1) / 2
        const currentAlpha = particle.alpha * (0.5 + pulse * 0.5)
        const currentSize = particle.size * (0.8 + pulse * 0.4)

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2)
        ctx.fillStyle = `${particle.color} ${currentAlpha})`
        ctx.fill()
      }

      // Links between neighbours. Indexed loops avoid allocating a sliced
      // array per particle on every single frame, and the comparison stays in
      // squared space so the common case — a pair that is too far apart —
      // costs no square root at all.
      if (!isLite) {
        ctx.lineWidth = 1
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i]
          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j]
            const dx = a.x - b.x
            const dy = a.y - b.y
            const distanceSq = dx * dx + dy * dy
            if (distanceSq >= LINK_DISTANCE_SQ) continue

            const opacity =
              0.14 * (1 - Math.sqrt(distanceSq) / LINK_DISTANCE)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `${a.color} ${opacity})`
            ctx.stroke()
          }
        }

        // Links to the pointer.
        if (mouse.x > -9998) {
          ctx.lineWidth = 0.5
          for (const particle of particles) {
            const dx = mouse.x - particle.x
            const dy = mouse.y - particle.y
            const distanceSq = dx * dx + dy * dy
            if (distanceSq >= MOUSE_LINK_DISTANCE_SQ) continue

            const opacity =
              0.24 * (1 - Math.sqrt(distanceSq) / MOUSE_LINK_DISTANCE)
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.strokeStyle = `rgba(94, 234, 212, ${opacity})`
            ctx.stroke()
          }
        }
      }

      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isLite])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: isLite ? 0.32 : 0.45 }}
    />
  )
}
