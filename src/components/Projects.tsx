import { motion } from 'framer-motion'
import SectionHeader from './SectionHeader'
import { projects } from '../data/content'
import { cn } from '../lib/utils'
import { ExternalLink, FolderOpen, Rocket, Wrench } from 'lucide-react'

const tagIcons = {
  web_app: FolderOpen,
  systems: Wrench,
  tools: Rocket,
}

export default function Projects() {
  return (
    <section id="projects" className="relative border-t border-white/5 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="projects"
          title="Things I've built"
          description="A mix of shipped web apps and ongoing systems research."
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => {
            const Icon = tagIcons[project.tag as keyof typeof tagIcons] || FolderOpen
            return (
              <motion.article
                key={project.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -8, rotate: 0.5 }}
                className="group relative flex flex-col overflow-hidden glass-card glow-border rounded-2xl p-6 transition-all duration-300"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-signal/10 blur-3xl transition-opacity group-hover:opacity-100 opacity-0" />

                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-gradient-to-br from-signal/20 to-pulse/20 p-2 border border-signal/30">
                      <Icon className="h-4 w-4 text-signal" />
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                      {project.tag}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider',
                      project.status === 'shipped'
                        ? 'border-signal/30 bg-signal/10 text-signal'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-400',
                    )}
                  >
                    {project.status === 'shipped' ? 'shipped' : 'in progress'}
                  </span>
                </div>

                <motion.h3 
                  whileHover={{ scale: 1.02 }}
                  className="font-display text-xl font-semibold leading-snug text-gradient-ocean mb-3"
                >
                  {project.title}
                </motion.h3>
                <p className="flex-1 text-base leading-relaxed text-ink-muted">
                  {project.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {project.stack.map((tech) => (
                    <motion.span
                      key={tech}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-full bg-void-surface border border-white/5 px-3 py-1.5 font-mono text-xs text-ink-muted cursor-pointer hover:border-pulse/30 hover:text-pulse transition-all"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-void/90 backdrop-blur-sm opacity-0 transition-opacity"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(94, 234, 212, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    className="glow-border rounded-full bg-gradient-to-r from-signal/20 to-pulse/20 border border-signal/30 px-6 py-3 font-mono text-sm text-signal flex items-center gap-2 hover:from-signal/30 hover:to-pulse/30 transition-all relative overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View Project
                    </span>
                  </motion.button>
                </motion.div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
