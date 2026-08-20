import { useEffect, useRef } from 'react'

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

const LINK_DISTANCE = 120
const MOUSE_LINK_DISTANCE = 150
const MOUSE_FORCE_DISTANCE = 200

/**
 * Ambient constellation canvas.
 *
 * Everything mutable — pointer position, particles, the animation handle —
 * lives in refs. Keeping the pointer out of React state matters: driving it
 * through `useState` re-ran this effect on every mousemove, which tore down
 * the loop and re-seeded every particle at a random position dozens of times
 * a second.
 */
export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
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
    let dpr = 1

    const seed = () => {
      const count = width < 768 ? 28 : 70
      particles.length = 0
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
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
      dpr = Math.min(window.devicePixelRatio || 1, 2)

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
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    let frame = 0
    let paused = document.hidden

    const handleVisibility = () => {
      paused = document.hidden
      if (!paused) frame = requestAnimationFrame(animate)
    }
    document.addEventListener('visibilitychange', handleVisibility)

    function animate() {
      if (!ctx || paused) return
      ctx.clearRect(0, 0, width, height)

      for (const particle of particles) {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > width) particle.vx *= -1
        if (particle.y < 0 || particle.y > height) particle.vy *= -1

        // Push away from the pointer. Guard the divide so a particle sitting
        // exactly under the cursor doesn't turn its velocity into NaN.
        const dx = mouse.x - particle.x
        const dy = mouse.y - particle.y
        const distance = Math.hypot(dx, dy)

        if (distance > 0.001 && distance < MOUSE_FORCE_DISTANCE) {
          const force = (MOUSE_FORCE_DISTANCE - distance) / MOUSE_FORCE_DISTANCE
          particle.vx -= (dx / distance) * force * 0.6
          particle.vy -= (dy / distance) * force * 0.6
        }

        particle.vx *= 0.99
        particle.vy *= 0.99

        const speed = Math.hypot(particle.vx, particle.vy)
        if (speed < 0.2) {
          particle.vx += (Math.random() - 0.5) * 0.1
          particle.vy += (Math.random() - 0.5) * 0.1
        }

        particle.pulsePhase += 0.05
        const pulse = (Math.sin(particle.pulsePhase) + 1) / 2
        const currentAlpha = particle.alpha * (0.5 + pulse * 0.5)
        const currentSize = particle.size * (0.8 + pulse * 0.4)

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2)
        ctx.fillStyle = `${particle.color} ${currentAlpha})`
        ctx.fill()
      }

      // Links between neighbours. Indexed loops avoid allocating a sliced
      // array per particle on every single frame.
      ctx.lineWidth = 1
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distance = Math.hypot(dx, dy)
          if (distance >= LINK_DISTANCE) continue

          const opacity = 0.14 * (1 - distance / LINK_DISTANCE)
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
          const distance = Math.hypot(
            mouse.x - particle.x,
            mouse.y - particle.y,
          )
          if (distance >= MOUSE_LINK_DISTANCE) continue

          const opacity = 0.2 * (1 - distance / MOUSE_LINK_DISTANCE)
          ctx.beginPath()
          ctx.moveTo(particle.x, particle.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.strokeStyle = `rgba(94, 234, 212, ${opacity})`
          ctx.stroke()
        }
      }

      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.45 }}
    />
  )
}
