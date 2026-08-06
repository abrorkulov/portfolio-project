import { motion } from 'framer-motion'
import Hero3D from './Hero3D'
import Hero3DFallback from './Hero3DFallback'
import { useCanSupport3D } from '../lib/useCanSupport3D'
import { profile } from '../data/content'
import { ArrowDown, Sparkles, Zap } from 'lucide-react'

export default function Hero() {
  const canSupport3D = useCanSupport3D()

  return (
    <section id="top" className="relative flex min-h-screen items-center overflow-hidden pt-24">
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-void/50 to-void" />

      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-pulse/5 blur-3xl" />

      {/* 3D / fallback visual, positioned to bleed on the right on desktop */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[55%] pointer-events-none md:pointer-events-auto opacity-30 md:opacity-100">
        {canSupport3D ? <Hero3D /> : <Hero3DFallback />}
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 px-4 sm:px-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-xl py-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6 sm:mb-8 inline-flex items-center gap-3 rounded-full glass-card border border-signal/20 px-3.5 py-1.5 sm:px-4 sm:py-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            <span className="font-mono text-[11px] sm:text-xs text-signal">
              available for collaborations
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold leading-[1.1]"
          >
            <span className="bg-gradient-to-r from-signal via-signal-bright to-pulse bg-clip-text text-transparent">
              Frontend
            </span>
            <br />
            <span className="bg-gradient-to-r from-pulse via-signal to-signal-bright bg-clip-text text-transparent">
              & AI/Systems
            </span>
            <br />
            <span className="bg-gradient-to-r from-ink to-signal bg-clip-text text-transparent">
              Developer
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-signal" />
              <span className="font-mono text-xs sm:text-sm text-ink-muted">
                {profile.name}
              </span>
            </div>
            <span className="h-px w-6 sm:w-8 bg-void-line" />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-pulse" />
              <span className="font-mono text-xs sm:text-sm text-ink-muted">
                {profile.age} years old
              </span>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-3 font-mono text-xs text-ink-faint"
          >
            {profile.location} · Tashkent, Uzbekistan
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-6 sm:mt-8 text-base sm:text-xl leading-relaxed text-ink-muted"
          >
            <span className="text-gradient">{profile.bio[0]}</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mt-8 sm:mt-12 flex flex-wrap items-center gap-3 sm:gap-4"
          >
            <motion.a
              href="#projects"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(94, 234, 212, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="glow-border rounded-full bg-gradient-to-r from-signal/20 to-pulse/20 border border-signal/30 px-6 py-3 sm:px-8 sm:py-3.5 font-mono text-xs sm:text-sm font-medium text-signal transition-all hover:from-signal/30 hover:to-pulse/30 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              />
              <span className="relative z-10">View projects</span>
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05, borderColor: 'rgba(167, 139, 250, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              className="rounded-full glass-card border border-white/10 px-6 py-3 sm:px-8 sm:py-3.5 font-mono text-xs sm:text-sm text-ink transition-all hover:border-pulse/50 hover:text-pulse hover:bg-pulse/10"
            >
              Get in touch
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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
