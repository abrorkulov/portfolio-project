import { motion } from 'framer-motion'
import { statement } from '../data/content'
import { blurUp, fadeUp, inView, lineReveal, staggerParent } from '../lib/motion'

/**
 * A pull-quote band between the journey and the skills grid.
 *
 * Every other block on this page is a left-aligned section with a numbered
 * header, a heading and a grid. Six of those in a row read as one long run of
 * the same shape, and the reader stops seeing where one ends. This is the
 * page's only centred, unnumbered, single-idea block — it exists to break
 * that rhythm and to give the section rule either side of it something to
 * separate.
 *
 * It is an `aside`, not a `section`: it has no place in the navigation, the
 * scroll spy or the 01–06 numbering, and the lite tier's
 * `content-visibility` rule deliberately does not match it — the band is
 * short enough that skipping its layout would buy nothing and risk a
 * scroll-height correction.
 */
export default function Statement() {
  return (
    <aside
      aria-label="Working principle"
      className="section-rule relative py-16 sm:py-20 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/2 h-[320px] w-[min(880px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pulse/[0.07] blur-[120px]" />
      </div>

      <motion.div
        variants={staggerParent(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8"
      >
        <motion.p
          variants={fadeUp}
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint sm:text-xs"
        >
          // {statement.eyebrow}
        </motion.p>

        <div className="reveal-line mt-6 block">
          <motion.p
            variants={lineReveal}
            className="font-display text-[clamp(1.7rem,5.5vw,3.15rem)] font-semibold leading-[1.14]"
          >
            {statement.lead}{' '}
            <span className="accent-em text-gradient">{statement.accent}</span>
          </motion.p>
        </div>

        <motion.p
          variants={blurUp}
          className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-ink-muted sm:text-lg"
        >
          {statement.body}
        </motion.p>

        <motion.span
          variants={fadeUp}
          aria-hidden="true"
          className="mx-auto mt-9 block h-px w-24 bg-gradient-to-r from-transparent via-signal/60 to-transparent"
        />
      </motion.div>
    </aside>
  )
}
