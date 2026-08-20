import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Code2,
  Server,
  Brain,
  Wrench,
  Database,
  Layers,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react'
import SectionHeader from './SectionHeader'
import { skillCategories } from '../data/content'
import TechIcon from './TechIcon'
import { getTechMeta, readableAccent } from '../lib/techMeta'
import {
  ease,
  spring,
  inView,
  inViewEarly,
  fadeUp,
  scaleIn,
  staggerParent,
  hoverOnly,
} from '../lib/motion'
import { useTilt } from '../lib/pointerFx'

type CategoryStyle = { icon: LucideIcon; accent: string }

const categoryStyles: Record<string, CategoryStyle> = {
  Frontend: { icon: Code2, accent: '#5EEAD4' },
  Backend: { icon: Server, accent: '#A78BFA' },
  Databases: { icon: Database, accent: '#7DD3FC' },
  'AI & Systems': { icon: Brain, accent: '#818CF8' },
  'Tools & DevOps': { icon: Wrench, accent: '#FDBA74' },
}

// Categories added to content.ts without a style entry still render.
const defaultStyle: CategoryStyle = { icon: Layers, accent: '#5EEAD4' }

const styleFor = (label: string) => categoryStyles[label] ?? defaultStyle

/** Turns a raw score into the word a reader actually cares about. */
function proficiency(level: number) {
  if (level >= 85) return 'Advanced'
  if (level >= 70) return 'Proficient'
  if (level >= 55) return 'Working'
  return 'Learning'
}

/**
 * Cards shown per category before the reader asks for more. Four fills exactly
 * one row on xl and keeps all five categories reachable without a long scroll —
 * 41 cards expanded is roughly five screens of grid.
 */
const PREVIEW_COUNT = 4

export default function Skills() {
  const [filter, setFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleCategory = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))

  const visible = useMemo(
    () =>
      filter === 'all'
        ? skillCategories
        : skillCategories.filter((c) => c.label === filter),
    [filter],
  )

  const totals = useMemo(() => {
    const items = skillCategories.flatMap((c) => c.items)
    const average =
      items.reduce((sum, item) => sum + item.level, 0) / (items.length || 1)
    return {
      count: items.length,
      categories: skillCategories.length,
      average: Math.round(average),
      advanced: items.filter((item) => item.level >= 85).length,
    }
  }, [])

  const stats = [
    { label: 'technologies', value: totals.count },
    { label: 'disciplines', value: totals.categories },
    { label: 'avg. proficiency', value: `${totals.average}%` },
    { label: 'advanced level', value: totals.advanced },
  ]

  return (
    <section
      id="skills"
      className="relative section-rule py-16 sm:py-24 lg:py-32"
    >
      {/* Ambient wash — static, so it costs nothing per frame. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/4 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-signal/[0.07] blur-[120px] sm:h-96 sm:w-96" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 translate-x-1/2 rounded-full bg-pulse/[0.07] blur-[120px] sm:h-96 sm:w-96" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          index="03"
          eyebrow="skills_and_technologies"
          title="Tools I reach for"
          description="Split across the interface layer I ship with, and the systems layer I study underneath it."
        />

        {/* Summary strip */}
        <motion.dl
          variants={staggerParent(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mb-8 grid grid-cols-2 gap-3 sm:mb-10 sm:gap-4 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={scaleIn}
              className="glass-card rounded-2xl px-4 py-4 transition-colors duration-300 hover:border-signal/25 sm:px-5 sm:py-5"
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                {stat.label}
              </dt>
              <dd className="mt-1.5 font-display text-2xl font-semibold text-gradient-cool sm:text-3xl">
                {stat.value}
              </dd>
            </motion.div>
          ))}
        </motion.dl>

        {/* Discipline filter. Scrolls horizontally on phones rather than
            wrapping into a tall stack that pushes the grid off-screen. */}
        <div
          role="tablist"
          aria-label="Filter skills by discipline"
          className="scrollbar-none -mx-4 mb-10 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 lg:mb-12"
        >
          {['all', ...skillCategories.map((c) => c.label)].map((option) => {
            const isActive = filter === option
            const accent =
              option === 'all' ? '#5EEAD4' : styleFor(option).accent
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(option)}
                className={
                  // min-h-[44px] keeps every pill a comfortable tap target.
                  'relative min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 font-mono text-xs tracking-wide transition-colors duration-200 ' +
                  (isActive
                    ? 'font-semibold text-void'
                    : 'text-ink-muted hover:text-ink')
                }
              >
                {/* Shared-element pill: the background slides between tabs
                    instead of each one flicking its own colour on and off. */}
                {isActive ? (
                  <motion.span
                    layoutId="skillFilterPill"
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: accent }}
                    transition={spring.layout}
                  />
                ) : (
                  <span className="absolute inset-0 rounded-full border border-white/10 transition-colors duration-200 hover:border-white/25" />
                )}
                <span className="relative z-10">
                  {option === 'all' ? 'all skills' : option.toLowerCase()}
                </span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            // Keying on the filter lets the whole group cross-fade as one unit,
            // which reads far calmer than 40 cards animating independently.
            key={filter}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: ease.out }}
            className="space-y-12 sm:space-y-16"
          >
            {visible.map((category) => {
              const { icon: Icon, accent } = styleFor(category.label)
              // Filtering to a single discipline is itself a request to see
              // that group, so it opens fully without a second click.
              const isOpen =
                expanded[category.label] || filter === category.label
              const shown = isOpen
                ? category.items
                : category.items.slice(0, PREVIEW_COUNT)
              const hiddenCount = category.items.length - shown.length

              return (
                <motion.div
                  key={category.label}
                  initial="hidden"
                  whileInView="show"
                  viewport={inViewEarly}
                  variants={staggerParent(0.04, 0.05)}
                >
                  {/* Category header */}
                  <motion.div
                    variants={fadeUp}
                    className="mb-6 flex items-start gap-3 sm:mb-7 sm:gap-4"
                  >
                    <div
                      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border sm:h-12 sm:w-12"
                      style={{
                        backgroundColor: `${accent}1A`,
                        borderColor: `${accent}40`,
                        boxShadow: `0 0 28px -10px ${accent}`,
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: accent }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-2xl">
                          {category.label}
                        </h3>
                        <span
                          className="rounded-full px-2 py-0.5 font-mono text-[10px]"
                          style={{
                            color: accent,
                            backgroundColor: `${accent}14`,
                          }}
                        >
                          {category.items.length}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint sm:text-[11px]">
                          {category.eyebrow}
                        </span>
                      </div>
                      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
                        {category.summary}
                      </p>
                    </div>
                  </motion.div>

                  {/* Skill cards */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                    {shown.map((item, i) => (
                      <SkillCard
                        key={item.name}
                        name={item.name}
                        note={item.note}
                        level={item.level}
                        // Preview cards ride the parent's scroll stagger.
                        // Cards revealed by "Show more" mount while the parent
                        // is already in its `show` state, so they would
                        // otherwise snap in.
                        revealIndex={i >= PREVIEW_COUNT ? i - PREVIEW_COUNT : -1}
                      />
                    ))}
                  </div>

                  {category.items.length > PREVIEW_COUNT && (
                    <motion.div
                      variants={fadeUp}
                      className="mt-4 flex justify-center"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.label)}
                        aria-expanded={isOpen}
                        className="group flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 font-mono text-xs text-ink-muted transition-colors hover:border-white/25 hover:text-ink"
                      >
                        {isOpen ? 'Show less' : `Show ${hiddenCount} more`}
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={spring.snappy}
                          className="grid place-items-center"
                        >
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        </motion.span>
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

/**
 * One technology tile.
 *
 * Two details here are load-bearing:
 *
 * 1. Cards past the preview cut get an explicit `initial`/`animate` pair
 *    instead of `variants={fadeUp}`. They mount while the parent is already in
 *    its `show` state, so inheriting the variant would snap them in with no
 *    animation at all.
 * 2. The proficiency bar animates `scaleX`, not `width`. Width is a layout
 *    property: twenty bars growing at once relaid out twenty rows of the grid
 *    on every frame of the reveal. Scale is composited and costs nothing.
 */
function SkillCard({
  name,
  note,
  level,
  revealIndex,
}: {
  name: string
  note: string
  level: number
  /** -1 for a preview card; otherwise its position among the revealed ones. */
  revealIndex: number
}) {
  const tiltRef = useTilt<HTMLElement>()

  // Logos keep the true brand colour; text and bars use a lightened variant
  // so dark marks stay legible on near-black.
  const brand = readableAccent(getTechMeta(name).color)

  const entrance =
    revealIndex >= 0
      ? {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.35,
            delay: revealIndex * 0.04,
            ease: ease.out,
          },
        }
      : { variants: fadeUp }

  return (
    <motion.article
      ref={tiltRef}
      {...entrance}
      {...hoverOnly({ whileHover: { y: -6 } })}
      className="skill-card tilt-glow group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-white/20 sm:p-5"
      style={{ '--brand': brand } as React.CSSProperties}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14"
          style={{ boxShadow: `inset 0 0 24px -14px ${brand}` }}
        >
          <TechIcon name={name} className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>

        <span
          className="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
          style={{
            color: brand,
            borderColor: `${brand}33`,
            backgroundColor: `${brand}14`,
          }}
        >
          {proficiency(level)}
        </span>
      </div>

      <h4 className="font-display text-base font-semibold text-ink">{name}</h4>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-muted">
        {note}
      </p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-ink-faint">
          <span>proficiency</span>
          <span style={{ color: brand }}>{level}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={`${name} proficiency`}
          aria-valuenow={level}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: level / 100 }}
            transition={{ duration: 0.9, delay: 0.15, ease: ease.out }}
            className="h-full w-full origin-left rounded-full"
            style={{
              background: `linear-gradient(90deg, ${brand}66, ${brand})`,
            }}
          />
        </div>
      </div>
    </motion.article>
  )
}
