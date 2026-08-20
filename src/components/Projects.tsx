import { motion } from 'framer-motion'
import SectionHeader from './SectionHeader'
import { fadeUp, staggerParent, inView, spring } from '../lib/motion'
import { projects } from '../data/content'
import { cn } from '../lib/utils'
import { FolderOpen, Rocket, Wrench } from 'lucide-react'

const tagIcons = {
  web_app: FolderOpen,
  systems: Wrench,
  tools: Rocket,
}

export default function Projects() {
  return (
    <section
      id="projects"
      className="relative section-rule py-16 sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          index="05"
          eyebrow="projects"
          title="Things I've built"
          description="A mix of shipped web apps and ongoing systems research."
        />

        <motion.div
          variants={staggerParent(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project, i) => {
            const Icon =
              tagIcons[project.tag as keyof typeof tagIcons] || FolderOpen
            return (
              <motion.article
                key={project.title}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={spring.snappy}
                className="group relative flex flex-col overflow-hidden rounded-2xl glass-card glow-border p-5 sm:p-6"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-signal/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-signal/30 bg-gradient-to-br from-signal/20 to-pulse/20">
                      <Icon
                        className="h-4 w-4 text-signal"
                        aria-hidden="true"
                      />
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

                {/* Oversized index sits behind the title as a watermark. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-3 font-display text-5xl font-bold leading-none text-white/[0.035] transition-colors duration-500 group-hover:text-white/[0.06]"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                <h3 className="mb-3 font-display text-lg font-semibold leading-snug text-gradient-ocean sm:text-xl">
                  {project.title}
                </h3>
                <p className="flex-1 text-sm leading-relaxed text-ink-muted sm:text-base">
                  {project.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {project.stack.map((tech) => (
                    <motion.span
                      key={tech}
                      whileHover={{ scale: 1.06, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      transition={spring.snappy}
                      className="cursor-default rounded-full border border-white/5 bg-void-surface px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-pulse/30 hover:text-pulse"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
