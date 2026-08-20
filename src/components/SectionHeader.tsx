import { motion } from 'framer-motion'
import {
  blurUp,
  ease,
  fadeUp,
  lineReveal,
  staggerParent,
  inView,
} from '../lib/motion'

type SectionHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  /** Two-digit section index, e.g. "01". Renders a rule beside the eyebrow. */
  index?: string
  /** Optional controls (filters, toggles) pinned to the right on desktop. */
  aside?: React.ReactNode
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  index,
  aside,
}: SectionHeaderProps) {
  return (
    <motion.div
      variants={staggerParent(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      className="mb-10 flex flex-col gap-6 sm:mb-12 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="max-w-2xl">
        <motion.div variants={fadeUp} className="flex items-center gap-3">
          {index && (
            <span className="section-index font-mono text-[10px] text-ink-faint sm:text-xs">
              {index}
            </span>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-signal sm:text-xs">
            // {eyebrow}
          </span>
          {/* Hairline that draws itself out from the eyebrow toward the
              margin. Scaling from the left edge keeps it on the compositor —
              animating `width` would relayout the row on every frame. */}
          <motion.span
            aria-hidden="true"
            variants={{
              hidden: { scaleX: 0 },
              show: {
                scaleX: 1,
                transition: { duration: 1, ease: ease.out },
              },
            }}
            className="h-px flex-1 origin-left bg-gradient-to-r from-signal/40 to-transparent"
          />
        </motion.div>

        {/* The title wipes up from behind its own baseline, matching the hero
            headline so every section opens the same way. */}
        <span className="reveal-line mt-3 block">
          <motion.h2
            variants={lineReveal}
            // Fluid type: scales continuously between phone and desktop instead
            // of jumping at one breakpoint.
            className="font-display text-[clamp(1.75rem,5vw,2.5rem)] font-semibold leading-[1.15]"
          >
            {title}
          </motion.h2>
        </span>

        {description && (
          <motion.p
            variants={blurUp}
            className="mt-4 text-sm leading-relaxed text-ink-muted sm:text-base"
          >
            {description}
          </motion.p>
        )}
      </div>

      {aside && (
        <motion.div variants={fadeUp} className="shrink-0">
          {aside}
        </motion.div>
      )}
    </motion.div>
  )
}
