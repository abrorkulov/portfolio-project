import { motion } from 'framer-motion'
import { profile } from '../data/content'
import { Mail, Github, Linkedin, Instagram, Send, MessageCircle, Gamepad2, MapPin, Heart } from 'lucide-react'

const socialLinks = [
  { name: 'GitHub', icon: Github, href: profile.socials.github, color: 'hover:text-white' },
  { name: 'LinkedIn', icon: Linkedin, href: profile.socials.linkedin, color: 'hover:text-blue-400' },
  { name: 'Instagram', icon: Instagram, href: profile.socials.instagram, color: 'hover:text-pink-400' },
  { name: 'Telegram', icon: Send, href: profile.socials.telegram, color: 'hover:text-blue-300' },
  { name: 'Discord', icon: MessageCircle, href: profile.socials.discord, color: 'hover:text-indigo-400' },
]

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
              Let's build something
              <span className="text-gradient"> extraordinary</span>
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

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="glass-card glow-border rounded-2xl p-8 relative z-10"
          >
            <h3 className="font-display text-xl font-semibold text-ink mb-6">
              Connect with me
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      // Explicit navigation fallback for iframe/sandbox previews
                      if (social.href && social.href !== '#') {
                        window.open(social.href, '_blank', 'noopener,noreferrer')
                      }
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="relative z-20 flex items-center gap-3 p-4 rounded-xl bg-void-surface border border-white/5 hover:border-signal/40 hover:bg-signal/5 transition-all group cursor-pointer"
                  >
                    <div className="rounded-lg bg-gradient-to-br from-signal/20 to-pulse/20 p-2 border border-signal/20 group-hover:border-signal/40 transition-colors">
                      <Icon className={`h-5 w-5 text-signal ${social.color}`} />
                    </div>
                    <span className="font-mono text-sm text-ink group-hover:text-signal transition-colors">
                      {social.name}
                    </span>
                  </motion.a>
                )
              })}
            </div>
          </motion.div>
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
