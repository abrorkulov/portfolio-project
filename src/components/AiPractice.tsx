import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  CheckCircle2,
  Layers,
  Sparkles,
  TerminalSquare,
  Crosshair,
} from 'lucide-react'
import SectionHeader from './SectionHeader'
import ClaudeTerminal from './ClaudeTerminal'
import { aiPractice } from '../data/content'
import {
  fadeUp,
  scaleIn,
  staggerParent,
  inView,
  inViewEarly,
} from '../lib/motion'
import { useTilt } from '../lib/pointerFx'

const principleIcons: Record<string, LucideIcon> = {
  context: Layers,
  verify: CheckCircle2,
  depth: Crosshair,
  terminal: TerminalSquare,
}

export default function AiPractice() {
  return (
    <section
      id="ai"
      // `overflow-hidden` is load-bearing: the warm ambient orbs below are
      // wider than the container and would otherwise widen the whole document.
      className="section-rule relative overflow-hidden py-20 sm:py-28 lg:py-36"
    >
      {/* This section is the one warm room in a teal/violet page. The wash is
          two static gradients on a single promoted layer rather than a stack
          of blurred divs — a 300px blur radius is the most expensive filter a
          phone can be handed, and there is no reason to pay it twice. */}
      <div aria-hidden="true" className="ai-ambient" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          index="04"
          eyebrow={aiPractice.eyebrow}
          title={aiPractice.title}
          description={aiPractice.description}
        />

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:gap-12">
          <ScreenshotCard />

          <motion.div
            variants={staggerParent(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={inView}
            className="flex flex-col gap-6"
          >
            {aiPractice.paragraphs.map((paragraph) => (
              <motion.p
                key={paragraph.slice(0, 32)}
                variants={fadeUp}
                className="text-[15px] leading-relaxed text-ink-muted sm:text-base"
              >
                {paragraph}
              </motion.p>
            ))}

            {/* The claim the whole section exists to make, so it is the one
                element here allowed to look like a pull quote. */}
            <motion.blockquote
              variants={fadeUp}
              className="relative rounded-2xl border border-claude/25 bg-claude/[0.06] p-5 pl-6 sm:p-6 sm:pl-7"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-4 left-0 w-[3px] rounded-full bg-gradient-to-b from-claude to-claude/10"
              />
              <Sparkles
                className="mb-3 h-5 w-5 text-claude"
                aria-hidden="true"
              />
              <p className="font-display text-[15px] font-medium leading-relaxed text-ink sm:text-lg">
                {aiPractice.callout}
              </p>
            </motion.blockquote>

            <motion.dl
              variants={staggerParent(0.06)}
              className="grid grid-cols-2 gap-3 sm:gap-4"
            >
              {aiPractice.stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={scaleIn}
                  className="tilt-glow rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                >
                  <dd className="font-display text-lg font-semibold text-ink sm:text-xl">
                    {stat.value}
                  </dd>
                  <dt className="mt-1 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-ink-faint">
                    {stat.label}
                  </dt>
                </motion.div>
              ))}
            </motion.dl>
          </motion.div>
        </div>

        {/* How the tool is used, which is the part that is actually a skill. */}
        <motion.ul
          variants={staggerParent(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4"
        >
          {aiPractice.principles.map((principle) => {
            const Icon = principleIcons[principle.icon] ?? Sparkles
            return (
              <motion.li key={principle.title} variants={fadeUp}>
                {/* The tilt surface owns `transform`, so it has to sit on an
                    element Framer is not animating — hence the inner div. */}
                <div className="tilt-surface glass-card h-full rounded-2xl p-5 sm:p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-claude/25 bg-claude/10">
                    <Icon className="h-5 w-5 text-claude" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold text-ink">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {principle.detail}
                  </p>
                </div>
              </motion.li>
            )
          })}
        </motion.ul>

        {/* A real session, replayed. The still above shows what the tool looks
            like; this shows what using it looks like. */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewEarly}
          className="mt-12 sm:mt-16"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-claude sm:text-xs">
              // a real session
            </span>
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-gradient-to-r from-claude/30 to-transparent"
            />
          </div>
          <ClaudeTerminal />
        </motion.div>
      </div>
    </section>
  )
}

/** The still of the CLI, framed like a screenshot pinned to the page. */
function ScreenshotCard() {
  const tilt = useTilt<HTMLDivElement>(5)

  return (
    <motion.figure
      variants={scaleIn}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      className="lg:sticky lg:top-24"
    >
      <div
        ref={tilt}
        className="tilt-surface card-sheen glass-card overflow-hidden rounded-3xl p-2 sm:p-3"
      >
        <img
          src={aiPractice.image.src}
          alt={aiPractice.image.alt}
          // Intrinsic size stated so the browser reserves the box before the
          // file arrives; without it this card jumps the page on load.
          width={1200}
          height={720}
          loading="lazy"
          decoding="async"
          className="block w-full rounded-2xl"
        />
      </div>

      <figcaption className="mt-4 flex flex-col items-start gap-2 font-mono text-[11px] leading-relaxed text-ink-faint">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-claude/25 bg-claude/[0.07] px-2.5 py-1 text-claude">
          <span className="h-1.5 w-1.5 rounded-full bg-claude" />
          the only ai tool i use
        </span>
        <span>{aiPractice.image.caption}</span>
      </figcaption>
    </motion.figure>
  )
}
