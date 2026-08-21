import { motion } from 'framer-motion'
import SectionHeader from './SectionHeader'
import {
  driftIn,
  staggerParent,
  inView,
  spring,
  hoverOnly,
} from '../lib/motion'
import { useTilt } from '../lib/pointerFx'
import { projects } from '../data/content'
import { cn } from '../lib/utils'
import { ArrowUpRight, FolderOpen, Rocket, Wrench } from 'lucide-react'

const tagIcons = {
  web_app: FolderOpen,
  systems: Wrench,
  tools: Rocket,
}

type Project = (typeof projects)[number]

export default function Projects() {
  const shipped = projects.filter((p) => p.status === 'shipped').length

  return (
    <section
      id="projects"
      className="section-rule relative py-16 sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          index="06"
          eyebrow="projects"
          title="Things I've built"
          description="A mix of shipped web apps and ongoing systems research."
          aside={
            <dl className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
              <div>
                <dt>total</dt>
                <dd className="mt-1 font-display text-2xl font-semibold tracking-normal text-gradient-cool">
                  {projects.length}
                </dd>
              </div>
              <span aria-hidden="true" className="h-8 w-px bg-white/10" />
              <div>
                <dt>shipped</dt>
                <dd className="mt-1 font-display text-2xl font-semibold tracking-normal text-gradient-cool">
                  {shipped}
                </dd>
              </div>
            </dl>
          }
        />

        <motion.div
          variants={staggerParent(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const Icon = tagIcons[project.tag as keyof typeof tagIcons] || FolderOpen
  const isShipped = project.status === 'shipped'
  // The tilt owns `transform`, so it goes on the inner surface. The motion
  // wrapper keeps the entrance; the two never touch the same property.
  const tiltRef = useTilt<HTMLDivElement>(5)

  return (
    <motion.article variants={driftIn} className="h-full">
      <div
        ref={tiltRef}
        className="glass-card card-sheen tilt-surface group flex h-full flex-col rounded-3xl p-5 transition-colors duration-300 hover:border-white/20 sm:p-6"
      >
        {/* Accent rail across the top edge. It draws itself out on hover,
            scaling from the left so it stays on the compositor. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-signal via-pulse to-transparent transition-transform duration-500 group-hover:scale-x-100"
        />

        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-signal/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

        {/* Oversized index, low in the card so it never fights the title. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-4 right-2 font-display text-[5.5rem] font-bold leading-none text-white/[0.03] transition-colors duration-500 group-hover:text-white/[0.055]"
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="relative mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-signal/30 bg-gradient-to-br from-signal/20 to-pulse/20 transition-transform duration-500 group-hover:scale-110 group-hover:border-signal/50">
              <Icon className="h-4 w-4 text-signal" aria-hidden="true" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted">
              {project.tag}
            </span>
          </div>

          <span
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider',
              isShipped
                ? 'border-signal/30 bg-signal/10 text-signal'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400',
            )}
          >
            {/* In-progress work gets a live pulse; shipped work is a steady
                dot. The status is the first thing a reader looks for. */}
            <span className="relative flex h-1.5 w-1.5">
              {!isShipped && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex h-1.5 w-1.5 rounded-full',
                  isShipped ? 'bg-signal' : 'bg-amber-400',
                )}
              />
            </span>
            {isShipped ? 'shipped' : 'in progress'}
          </span>
        </div>

        <div className="relative flex items-start justify-between gap-3">
          <h3 className="mb-3 font-display text-xl font-semibold leading-snug text-gradient-ocean sm:text-2xl">
            {project.title}
          </h3>
          <ArrowUpRight
            aria-hidden="true"
            className="mt-1 h-5 w-5 shrink-0 -translate-x-1 translate-y-1 text-ink-faint opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-signal group-hover:opacity-100"
          />
        </div>

        <p className="relative flex-1 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
          {project.description}
        </p>

        <div className="relative mt-6 border-t border-white/[0.06] pt-4">
          <div className="flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <motion.span
                key={tech}
                {...hoverOnly({ whileHover: { scale: 1.06, y: -2 } })}
                whileTap={{ scale: 0.96 }}
                transition={spring.snappy}
                className="cursor-default rounded-full border border-white/5 bg-void-surface px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-pulse/30 hover:text-pulse"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
