import { motion } from 'framer-motion'
import { profile } from '../data/content'
import { Mail, Gamepad2, MapPin, Heart } from 'lucide-react'
import ContactForm from './ContactForm'

export default function Footer() {
  return (
    <footer id="contact" className="relative border-t border-white/5 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16"
        >
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="font-mono text-xs uppercase tracking-[0.25em] text-signal"
            >
              // get_in_touch
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-4 font-display text-4xl font-semibold sm:text-5xl leading-tight"
            >
              Get in Touch
              <span className="text-gradient"> Let's build something extraordinary</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-lg text-ink-muted leading-relaxed"
            >
              Open to internships, collaborations, and interesting challenges — 
              frontend, systems, AI, or somewhere in between.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <div className="flex items-center gap-2 glass-card rounded-full px-5 py-3 border border-white/10">
                <Mail className="h-4 w-4 text-signal" />
                <a
                  href={`mailto:${profile.email}`}
                  className="font-mono text-sm text-ink hover:text-signal transition-colors"
                >
                  {profile.email}
                </a>
              </div>
              <div className="flex items-center gap-2 glass-card rounded-full px-5 py-3 border border-white/10">
                <MapPin className="h-4 w-4 text-pulse" />
                <span className="font-mono text-sm text-ink-muted">
                  {profile.location}
                </span>
              </div>
            </motion.div>
          </div>

          <ContactForm />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 font-mono text-xs text-ink-faint sm:flex-row"
        >
          <p className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} {profile.name}.</span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1">
              Built with <Heart className="h-3 w-3 text-pulse" /> React, TypeScript & Three.js
            </span>
          </p>
          <p className="flex items-center gap-2">
            <Gamepad2 className="h-3 w-3" />
            {profile.location}
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
