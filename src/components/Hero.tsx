import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import Hero3DFallback from './Hero3DFallback'
import { useCanSupport3D } from '../lib/useCanSupport3D'
import { profile } from '../data/content'
import { ArrowDown, Sparkles, Zap } from 'lucide-react'
import { ease, spring, staggerParent } from '../lib/motion'

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

export default function Hero() {
  const canSupport3D = useCanSupport3D()

  return (
    <section
      id="top"
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

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        <motion.div
          variants={staggerParent(0.1, 0.15)}
          initial="hidden"
          animate="show"
          className="max-w-xl py-6"
        >
          <motion.div
            variants={heroItem}
            className="mb-6 inline-flex items-center gap-3 rounded-full glass-card border border-signal/20 px-3.5 py-1.5 sm:mb-8 sm:px-4 sm:py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            <span className="font-mono text-[11px] text-signal sm:text-xs">
              available for collaborations
            </span>
          </motion.div>

          <motion.h1
            variants={heroItem}
            // Fluid clamp beats three breakpoint jumps — the headline never
            // wraps awkwardly at any width between 320px and 1920px.
            className="font-display font-semibold leading-[1.05] text-[clamp(2.5rem,8vw,4.5rem)]"
          >
            <span className="bg-gradient-to-r from-signal via-signal-bright to-pulse bg-clip-text text-transparent">
              Frontend
            </span>
            <br />
            <span className="bg-gradient-to-r from-pulse via-signal to-signal-bright bg-clip-text text-transparent">
              &amp; AI/Systems
            </span>
            <br />
            <span className="bg-gradient-to-r from-ink to-signal bg-clip-text text-transparent">
              Developer
            </span>
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
            <motion.a
              href="#projects"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              className="glow-border group relative min-h-[44px] overflow-hidden rounded-full border border-signal/30 bg-gradient-to-r from-signal/20 to-pulse/20 px-6 py-3 font-mono text-xs font-medium text-signal transition-colors hover:from-signal/30 hover:to-pulse/30 sm:px-8 sm:py-3.5 sm:text-sm"
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
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={spring.snappy}
              className="min-h-[44px] rounded-full glass-card border border-white/10 px-6 py-3 font-mono text-xs text-ink transition-colors hover:border-pulse/50 hover:bg-pulse/10 hover:text-pulse sm:px-8 sm:py-3.5 sm:text-sm"
            >
              Get in touch
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

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
