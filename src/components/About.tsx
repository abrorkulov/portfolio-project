import { motion } from 'framer-motion'
import SectionHeader from './SectionHeader'
import { profile } from '../data/content'
import { Globe, Code, Terminal, Brain } from 'lucide-react'

const categoryIcons = {
  'Frontend & Design': Code,
  'Backend & Core': Terminal,
  'Systems & AI': Brain,
}

export default function About() {
  return (
    <section id="about" className="relative border-t border-white/5 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="about_me" title="A developer who reads the whole stack" />

        <div className="grid grid-cols-1 gap-8 sm:gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {profile.bio.map((paragraph, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="text-base sm:text-lg leading-relaxed text-ink-muted"
              >
                {paragraph}
              </motion.p>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-5 w-5 text-signal" />
                <h3 className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                  languages
                </h3>
              </div>
              <ul className="space-y-3">
                {profile.languages.map((lang) => (
                  <motion.li 
                    key={lang.name} 
                    whileHover={{ x: 5 }}
                    className="flex items-center justify-between transition-transform"
                  >
                    <span className="text-sm text-ink group-hover:text-signal transition-colors">{lang.name}</span>
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      className="glow-border rounded-full bg-signal/10 border border-signal/20 px-3 py-1 font-mono text-xs text-signal cursor-default"
                    >
                      {lang.level}
                    </motion.span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {profile.expertise.map((category, i) => {
              const Icon = categoryIcons[category.category as keyof typeof categoryIcons] || Code
              return (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="glass-card glow-border rounded-2xl p-6 group hover:border-pulse/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="h-5 w-5 text-pulse" />
                    <h3 className="font-display font-semibold text-gradient-warm">
                      {category.category}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <motion.span
                        key={item}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-full bg-void-surface border border-white/5 px-3 py-1.5 font-mono text-xs text-ink-muted cursor-pointer hover:border-signal/30 hover:text-signal transition-all"
                      >
                        {item}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
