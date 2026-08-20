import { lazy, Suspense, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Hero3DFallback from './Hero3DFallback'
import { useCanSupport3D } from '../lib/useCanSupport3D'
import { useMotionProfile } from '../lib/useMotionProfile'
import { useMagnetic } from '../lib/pointerFx'
import { profile } from '../data/content'
import { ArrowDown, Sparkles, Zap } from 'lucide-react'
import { ease, lineReveal, staggerParent } from '../lib/motion'

// Three.js is ~226 kB gzipped. Loading it lazily keeps it off the critical
// path entirely — and phones, where useCanSupport3D declines to render the
// canvas at all, never fetch it.
const Hero3D = lazy(() => import('./Hero3D'))

/** Hero copy enters on a slower, more deliberate curve than the rest of the page. */
const heroItem = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: ease.slow },
  },
}

/** The three lines of the headline, each with its own gradient treatment. */
const headline = [
  { text: 'Frontend', className: 'text-sheen' },
  {
    text: '& AI/Systems',
    className:
      'bg-gradient-to-r from-pulse via-signal to-signal-bright bg-clip-text text-transparent',
  },
  {
    text: 'Developer',
    className:
      'bg-gradient-to-r from-ink to-signal bg-clip-text text-transparent',
  },
]

export default function Hero() {
  const canSupport3D = useCanSupport3D()
  const { isFull } = useMotionProfile()
  const sectionRef = useRef<HTMLElement>(null)

  // The copy sinks and dissolves as the hero leaves, so the handoff to the
  // next section is a dissolve rather than a hard edge. Transform and opacity
  // only — both run on the compositor — and the travel is zeroed on the lite
  // tier, where a scroll-linked effect competes with the scroll itself.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, isFull ? 90 : 0])
  const parallaxFade = useTransform(
    scrollYProgress,
    [0, 0.75],
    [1, isFull ? 0.15 : 1],
  )

  return (
    <section
      id="top"
      ref={sectionRef}
      // min-h-[100svh] rather than 100vh: on iOS/Android the browser chrome
      // makes vh taller than the visible area, which pushed the scroll cue
      // below the fold on every phone.
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-24 sm:pt-28"
    >
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-void/50 to-void" />

      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/5 blur-3xl sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 translate-x-1/2 translate-y-1/2 rounded-full bg-pulse/5 blur-3xl sm:h-96 sm:w-96" />

      {/* 3D / fallback visual, bleeding off the right edge on desktop.
          On phones it sits behind the copy at low opacity as texture. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full opacity-25 md:pointer-events-auto md:w-[55%] md:opacity-100">
        {canSupport3D ? (
          <Suspense fallback={<Hero3DFallback />}>
            <Hero3D />
          </Suspense>
        ) : (
          <Hero3DFallback />
        )}
      </div>

      <motion.div
        style={{ y: parallaxY, opacity: parallaxFade }}
        className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 px-4 sm:px-6 md:grid-cols-2 lg:px-8"
      >
        <motion.div
          variants={staggerParent(0.1, 0.15)}
          initial="hidden"
          animate="show"
          className="max-w-xl py-6"
        >
          <motion.div
            variants={heroItem}
            className="glass-card mb-6 inline-flex items-center gap-3 rounded-full border border-signal/20 px-3.5 py-1.5 sm:mb-8 sm:px-4 sm:py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            <span className="font-mono text-[11px] text-signal sm:text-xs">
              available for collaborations
            </span>
          </motion.div>

          {/* Each line is masked by its own overflow-hidden wrapper and wiped
              up from behind its baseline. The stagger between them is what
              makes the headline read as typeset rather than as three
              independently animated blocks. */}
          <motion.h1
            variants={staggerParent(0.12)}
            // Fluid clamp beats three breakpoint jumps — the headline never
            // wraps awkwardly at any width between 320px and 1920px.
            className="font-display text-[clamp(2.5rem,8vw,4.5rem)] font-semibold leading-[1.05]"
          >
            {headline.map((line) => (
              <span key={line.text} className="reveal-line">
                <motion.span
                  variants={lineReveal}
                  className={`block ${line.className}`}
                >
                  {line.text}
                </motion.span>
              </span>
            ))}
          </motion.h1>

          <motion.div
            variants={heroItem}
            className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-8"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-signal" />
              <span className="font-mono text-xs text-ink-muted sm:text-sm">
                {profile.name}
              </span>
            </div>
            <span className="hidden h-px w-6 bg-void-line sm:inline-block sm:w-8" />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 shrink-0 text-pulse" />
              <span className="font-mono text-xs text-ink-muted sm:text-sm">
                {profile.age} years old
              </span>
            </div>
          </motion.div>

          <motion.p
            variants={heroItem}
            className="mt-3 font-mono text-[11px] text-ink-faint sm:text-xs"
          >
            {profile.location} · {profile.role}
            <span
              aria-hidden="true"
              className="ml-1 inline-block h-3 w-1.5 translate-y-[1px] animate-blink bg-signal/70"
            />
          </motion.p>

          <motion.p
            variants={heroItem}
            className="mt-6 text-[15px] leading-relaxed text-ink-muted sm:mt-8 sm:text-lg lg:text-xl"
          >
            <span className="text-gradient">{profile.bio[0]}</span>
          </motion.p>

          <motion.div
            variants={heroItem}
            className="mt-8 flex flex-wrap items-center gap-3 sm:mt-12 sm:gap-4"
          >
            <MagneticLink
              href="#projects"
              className="glow-border group relative flex min-h-[44px] items-center overflow-hidden rounded-full border border-signal/30 bg-gradient-to-r from-signal/20 to-pulse/20 px-6 py-3 font-mono text-xs font-medium text-signal transition-colors duration-300 hover:from-signal/30 hover:to-pulse/30 sm:px-8 sm:py-3.5 sm:text-sm"
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: ease.inOut,
                }}
              />
              <span className="relative z-10">View projects</span>
            </MagneticLink>

            <MagneticLink
              href="#contact"
              className="glass-card flex min-h-[44px] items-center rounded-full border border-white/10 px-6 py-3 font-mono text-xs text-ink transition-colors duration-300 hover:border-pulse/50 hover:bg-pulse/10 hover:text-pulse sm:px-8 sm:py-3.5 sm:text-sm"
            >
              Get in touch
            </MagneticLink>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:bottom-12 sm:flex"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: ease.inOut }}
        >
          <ArrowDown className="h-5 w-5 text-ink-faint" />
        </motion.div>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">
          scroll
        </span>
      </motion.div>
    </section>
  )
}

/**
 * A call-to-action that leans toward the cursor.
 *
 * The magnet writes `transform` directly on the anchor, so the anchor cannot
 * also be a `motion` component — Framer would be writing the same property
 * from the other direction and one of them would win at random.
 */
function MagneticLink({
  href,
  className,
  children,
}: {
  href: string
  className: string
  children: React.ReactNode
}) {
  const ref = useMagnetic<HTMLAnchorElement>(0.25)
  return (
    <a ref={ref} href={href} className={className}>
      {children}
    </a>
  )
}
