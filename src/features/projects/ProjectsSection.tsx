import { motion } from 'framer-motion'
import SectionHeader from '@/shared/ui/SectionHeader'
import TechIcon from '@/shared/ui/TechIcon'
import { driftIn, staggerParent, inView } from '@/shared/motion/motion'
import { useTilt } from '@/shared/motion/pointerFx'
import { playTick } from '@/shared/lib/fx'
import { projects, type Project } from '@/data/content'
import { cn } from '@/shared/lib/utils'
import {
  ArrowUpRight,
  Boxes,
  Cpu,
  FolderOpen,
  GraduationCap,
  Rocket,
  Store,
} from 'lucide-react'

const tagIcons = {
  ai_edtech: GraduationCap,
  startup: Rocket,
  platform: Boxes,
  web_app: FolderOpen,
  marketplace: Store,
  systems: Cpu,
}

export default function Projects() {
  const shipped = projects.filter((p) => p.status === 'shipped').length

  return (
    <section
      id="projects"
      className="section-rule relative py-16 sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          section="projects"
          eyebrow="projects"
          title="Things I've built"
          description="Products with users, platforms with schemas behind them, and one long-running excuse to read disassembly."
          aside={
            <dl className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
              <div>
                <dt>total</dt>
                <dd className="text-gradient-cool mt-1 font-display text-2xl font-semibold tracking-normal">
                  {projects.length}
                </dd>
              </div>
              <span aria-hidden="true" className="h-8 w-px bg-white/10" />
              <div>
                <dt>shipped</dt>
                <dd className="text-gradient-cool mt-1 font-display text-2xl font-semibold tracking-normal">
                  {shipped}
                </dd>
              </div>
            </dl>
          }
        />

        {/* The first project leads at double width. A six-up grid of equal
            cards says every project weighs the same, which is never true —
            one of them is the flagship and the layout should say so. */}
        <motion.div
          variants={staggerParent(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project, i) => (
            <ProjectCard
              key={project.title}
              project={project}
              index={i}
              featured={i === 0}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function ProjectCard({
  project,
  index,
  featured,
}: {
  project: Project
  index: number
  featured: boolean
}) {
  const Icon = tagIcons[project.tag as keyof typeof tagIcons] ?? FolderOpen
  const isShipped = project.status === 'shipped'
  // The tilt owns `transform`, so it goes on the inner surface. The motion
  // wrapper keeps the entrance; the two never touch the same property.
  const tiltRef = useTilt<HTMLDivElement>(featured ? 3 : 5)

  return (
    <motion.article
      variants={driftIn}
      className={cn('h-full', featured && 'md:col-span-2')}
    >
      <div
        ref={tiltRef}
        className={cn(
          'glass-card card-sheen tilt-surface group flex h-full flex-col rounded-3xl p-5 transition-colors duration-300 hover:border-white/20 sm:p-6',
          featured && 'lg:p-8',
        )}
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
          className={cn(
            'pointer-events-none absolute -bottom-4 right-2 font-display font-bold leading-none text-white/[0.03] transition-colors duration-500 group-hover:text-white/[0.055]',
            featured ? 'text-[8rem]' : 'text-[5.5rem]',
          )}
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
          <h3
            className={cn(
              'text-gradient-ocean font-display font-semibold leading-snug',
              featured ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl',
            )}
          >
            {project.href ? (
              // Only the title is a link, but its ::after covers the card —
              // the whole surface is clickable while assistive tech still
              // hears one link with a real name, not a bare "link".
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => playTick('click')}
                className="after:absolute after:inset-0 after:rounded-3xl after:content-['']"
              >
                {project.title}
              </a>
            ) : (
              project.title
            )}
          </h3>

          <ArrowUpRight
            aria-hidden="true"
            className={cn(
              'mt-1 h-5 w-5 shrink-0 -translate-x-1 translate-y-1 transition-all duration-500 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-signal',
              project.href
                ? 'text-ink-faint opacity-60 group-hover:opacity-100'
                : 'text-ink-faint opacity-0 group-hover:opacity-100',
            )}
          />
        </div>

        {project.role && (
          <p className="relative mt-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-faint">
            {project.role}
          </p>
        )}

        <p
          className={cn(
            'relative mt-3 flex-1 leading-relaxed text-ink-muted',
            featured ? 'text-[15px] sm:text-base' : 'text-sm sm:text-[15px]',
          )}
        >
          {project.description}
        </p>

        {/* Logos rather than bare text: the stack is scannable at a glance,
            and it ties the card to the same brand marks the skills grid uses. */}
        <div className="relative mt-6 border-t border-white/[0.06] pt-4">
          <ul className="flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <li
                key={tech}
                className="flex items-center gap-1.5 rounded-full border border-white/5 bg-void-surface px-2.5 py-1.5 font-mono text-[11px] text-ink-muted transition-colors hover:border-pulse/30 hover:text-pulse"
              >
                <TechIcon name={tech} className="h-3.5 w-3.5" />
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.article>
  )
}
