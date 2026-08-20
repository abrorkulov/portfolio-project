import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Mail,
  MapPin,
  Heart,
  Github,
  Linkedin,
  Send,
  Instagram,
  Clock,
} from 'lucide-react'
import {
  blurUp,
  fadeUp,
  lineReveal,
  scaleIn,
  staggerParent,
  inView,
  spring,
  hoverOnly,
} from '../lib/motion'
import { profile } from '../data/content'
import ContactForm from './ContactForm'

const socialIcons = {
  github: Github,
  linkedin: Linkedin,
  telegram: Send,
  instagram: Instagram,
} as const

/**
 * A social entry counts as configured only once its URL points somewhere past
 * the domain root — several in content.ts are still bare placeholders like
 * `https://t.me/`, and linking those would just dump visitors on a homepage.
 * Filling one in makes it appear here automatically.
 */
function configuredSocials() {
  return (Object.keys(socialIcons) as (keyof typeof socialIcons)[])
    .map((key) => ({ key, url: profile.socials[key], Icon: socialIcons[key] }))
    .filter(({ url }) => {
      if (!url) return false
      try {
        return new URL(url).pathname.replace(/\/+$/, '').length > 0
      } catch {
        return false
      }
    })
}

export default function Footer() {
  const socials = configuredSocials()

  return (
    <footer id="contact" className="section-rule relative py-16 sm:py-24">
      {/* Closing wash. The page opened on a glow behind the hero; it should
          close on one too, rather than trailing off into flat black. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden"
      >
        <div className="absolute left-1/2 top-0 h-[420px] w-[min(900px,90vw)] -translate-x-1/2 rounded-full bg-signal/[0.06] blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerParent(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mb-12 grid grid-cols-1 gap-10 lg:mb-16 lg:grid-cols-2 lg:gap-14"
        >
          <div>
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <span className="section-index font-mono text-[10px] text-ink-faint sm:text-xs">
                06
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-signal sm:text-xs">
                // get_in_touch
              </span>
              <span
                aria-hidden="true"
                className="h-px flex-1 bg-gradient-to-r from-signal/30 to-transparent"
              />
            </motion.div>

            {/* Same wipe as every other section title, so the last heading on
                the page arrives the way the first one did. */}
            <span className="reveal-line mt-4 block">
              <motion.h2
                variants={lineReveal}
                className="font-display text-[clamp(2rem,6vw,3.25rem)] font-semibold leading-[1.08]"
              >
                Let&apos;s build
                <span className="text-gradient"> something extraordinary</span>
              </motion.h2>
            </span>

            <motion.p
              variants={blurUp}
              className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:mt-6 sm:text-lg"
            >
              Open to internships, collaborations, and interesting challenges —
              frontend, systems, AI, or somewhere in between.
            </motion.p>

            {/* Availability strip. Mirrors the hero badge so the page's first
                and last promises look like the same promise. */}
            <motion.div
              variants={fadeUp}
              className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-8"
            >
              <span className="inline-flex items-center gap-2.5 font-mono text-xs text-signal">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
                </span>
                available for collaborations
              </span>
              <span className="inline-flex items-center gap-2 font-mono text-xs text-ink-faint">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                replies within 24 hours
              </span>
            </motion.div>

            {/* The email is the point of this whole section, so it gets to be
                a full-width row rather than a chip lost in a wrap. */}
            <motion.a
              variants={scaleIn}
              href={`mailto:${profile.email}`}
              {...hoverOnly({ whileHover: { x: 4 } })}
              transition={spring.snappy}
              className="glass-card group mt-6 flex min-h-[64px] items-center gap-4 rounded-2xl border border-white/10 px-4 py-3 transition-colors duration-300 hover:border-signal/40 sm:px-5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-signal/25 bg-signal/10 transition-colors duration-300 group-hover:bg-signal/20">
                <Mail className="h-4 w-4 text-signal" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                  email
                </span>
                <span className="block truncate font-mono text-sm text-ink transition-colors duration-300 group-hover:text-signal">
                  {profile.email}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-ink-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal"
              />
            </motion.a>

            <motion.div
              variants={fadeUp}
              className="mt-4 flex flex-wrap items-center gap-3"
            >
              <span className="flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 font-mono text-xs text-ink-muted">
                <MapPin className="h-4 w-4 text-pulse" aria-hidden="true" />
                {profile.location}
              </span>

              {socials.length > 0 && (
                <span
                  aria-hidden="true"
                  className="hidden h-6 w-px bg-white/10 sm:block"
                />
              )}

              {socials.map(({ key, url, Icon }) => (
                <motion.a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  {...hoverOnly({ whileHover: { y: -3 } })}
                  whileTap={{ scale: 0.95 }}
                  transition={spring.snappy}
                  aria-label={key}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.02] text-ink-muted transition-colors duration-300 hover:border-signal/40 hover:bg-signal/5 hover:text-signal"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </motion.a>
              ))}
            </motion.div>
          </div>

          <ContactForm />
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-8 text-center font-mono text-[11px] text-ink-faint sm:flex-row sm:gap-4 sm:text-left sm:text-xs"
        >
          <p className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span>
              © {new Date().getFullYear()} {profile.name}.
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1">
              Built with <Heart className="h-3 w-3 text-pulse" /> React,
              TypeScript & Three.js
            </span>
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            {profile.location}
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
