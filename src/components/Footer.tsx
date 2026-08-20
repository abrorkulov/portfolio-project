import { motion } from 'framer-motion'
import { fadeUp, staggerParent, inView, spring } from '../lib/motion'

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
import { profile } from '../data/content'
import {
  Mail,
  MapPin,
  Heart,
  Github,
  Linkedin,
  Send,
  Instagram,
} from 'lucide-react'
import ContactForm from './ContactForm'

export default function Footer() {
  return (
    <footer id="contact" className="relative section-rule py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerParent(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mb-12 grid grid-cols-1 gap-10 lg:mb-16 lg:grid-cols-2 lg:gap-12"
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
            <motion.h2
              variants={fadeUp}
              className="mt-4 font-display font-semibold leading-[1.1] text-[clamp(2rem,6vw,3rem)]"
            >
              Let&apos;s build
              <span className="text-gradient"> something extraordinary</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-5 text-[15px] leading-relaxed text-ink-muted sm:mt-6 sm:text-lg"
            >
              Open to internships, collaborations, and interesting challenges —
              frontend, systems, AI, or somewhere in between.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8"
            >
              <div className="flex min-h-[44px] items-center gap-2 rounded-full glass-card border border-white/10 px-4 py-2.5 sm:px-5 sm:py-3">
                <Mail className="h-4 w-4 text-signal" />
                <a
                  href={`mailto:${profile.email}`}
                  className="break-all font-mono text-xs text-ink transition-colors hover:text-signal sm:text-sm"
                >
                  {profile.email}
                </a>
              </div>
              <div className="flex min-h-[44px] items-center gap-2 rounded-full glass-card border border-white/10 px-4 py-2.5 sm:px-5 sm:py-3">
                <MapPin className="h-4 w-4 text-pulse" />
                <span className="font-mono text-xs text-ink-muted sm:text-sm">
                  {profile.location}
                </span>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-2">
              {configuredSocials().map(({ key, url, Icon }) => (
                <motion.a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={spring.snappy}
                  aria-label={key}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.02] text-ink-muted transition-colors hover:border-signal/40 hover:text-signal"
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
