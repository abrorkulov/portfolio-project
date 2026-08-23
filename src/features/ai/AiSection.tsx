import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  CheckCircle2,
  Crosshair,
  Layers,
  Quote,
  Sparkles,
  TerminalSquare,
} from 'lucide-react'
import SectionHeader from '@/shared/ui/SectionHeader'
import TechIcon from '@/shared/ui/TechIcon'
import ClaudeTerminal from '@/features/ai/ClaudeTerminal'
import { aiPractice, type AiTool, type PrincipleIcon } from '@/data/content'
import {
  fadeUp,
  inView,
  inViewEarly,
  scaleIn,
  slideIn,
  staggerParent,
} from '@/shared/motion/motion'
import { useTilt } from '@/shared/motion/pointerFx'

/** Exhaustive: `PrincipleIcon` is a closed union, so no default branch. */
const principleIcons: Record<PrincipleIcon, LucideIcon> = {
  context: Layers,
  verify: CheckCircle2,
  depth: Crosshair,
  terminal: TerminalSquare,
}

/**
 * Accent classes per tool, written out rather than interpolated.
 *
 * Tailwind scans source text for complete class names, so a template literal
 * like `border-${accent}/25` produces a class that exists in the markup and
 * nowhere in the stylesheet. Every variant a card can use has to appear
 * literally somewhere for the compiler to emit it.
 */
const toolAccents = {
  claude: {
    ring: 'border-claude/30 hover:border-claude/50',
    tile: 'border-claude/30 bg-claude/10',
    text: 'text-claude',
    badge: 'border-claude/30 bg-claude/10 text-claude',
    glow: 'bg-claude/10',
    rule: 'from-claude/60',
  },
  pulse: {
    ring: 'border-pulse/30 hover:border-pulse/50',
    tile: 'border-pulse/30 bg-pulse/10',
    text: 'text-pulse',
    badge: 'border-pulse/30 bg-pulse/10 text-pulse',
    glow: 'bg-pulse/10',
    rule: 'from-pulse/60',
  },
} as const satisfies Record<AiTool['accent'], Record<string, string>>

/**
 * Three years of building with Claude — rebuilt around what the section is
 * actually claiming.
 *
 * The order is: what the tool *is*, what using it *looks like*, then what it
 * is *for*.
 *
 * The CLI still opens the section at full width, framed like a captured
 * application. The live terminal replay sits lower, beside the prose, because
 * it is showing something different — a transcript arriving, rather than the
 * tool's face. An earlier pass deleted the still on the grounds that the replay
 * already showed the CLI; that conflated the two jobs and left the section with
 * no opening image at all.
 *
 * The thesis is *shown* rather than asserted: two model cards with an arrow
 * between them, because "Gemini plans, Claude Code builds" is a pipeline and a
 * pipeline should look like one.
 */
export default function AiSection() {
  return (
    <section
      id="ai"
      // `overflow-hidden` is load-bearing: the warm ambient wash below is wider
      // than the container and would otherwise widen the whole document.
      className="section-rule relative overflow-hidden py-20 sm:py-28 lg:py-36"
    >
      {/* This section is the one warm room in a teal/violet page. Two static
          gradients on a single promoted layer, not a stack of blurred divs — a
          300px blur radius is the most expensive filter a phone can be handed
          and there is no reason to pay it twice. */}
      <div aria-hidden="true" className="ai-ambient" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          section="ai"
          eyebrow={aiPractice.eyebrow}
          title={aiPractice.title}
          description={aiPractice.description}
        />

        {/* ── the tool itself, as the section's opening shot ─────────────── */}
        <CliShot />

        {/* ── the live transcript, prose beside it ───────────────────────── */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          <motion.div
            variants={staggerParent(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={inView}
            className="flex flex-col gap-6"
          >
            {/* The claim the whole section exists to make, so it is the one
                element here allowed to look like a pull quote. */}
            <motion.blockquote
              variants={fadeUp}
              className="relative overflow-hidden rounded-3xl border border-claude/25 bg-gradient-to-br from-claude/[0.10] to-claude/[0.02] p-6 sm:p-7"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-5 left-0 w-[3px] rounded-full bg-gradient-to-b from-claude to-claude/10"
              />
              <Quote
                className="mb-3 h-6 w-6 text-claude/70"
                aria-hidden="true"
              />
              <p className="font-display text-lg font-medium leading-relaxed text-ink sm:text-xl">
                {aiPractice.callout}
              </p>
            </motion.blockquote>

            {aiPractice.paragraphs.map((paragraph) => (
              <motion.p
                key={paragraph.slice(0, 32)}
                variants={fadeUp}
                className="text-[15px] leading-relaxed text-ink-muted sm:text-base"
              >
                {paragraph}
              </motion.p>
            ))}

            <motion.dl
              variants={staggerParent(0.06)}
              className="grid grid-cols-2 gap-3 sm:gap-4"
            >
              {aiPractice.stats.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={scaleIn}
                  className="tilt-glow rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-claude/25"
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

          {/* A real session, replayed — the strongest thing in the section, so
              it is no longer buried under everything else. */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={inViewEarly}
            className="lg:sticky lg:top-24"
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

        {/* ── the two-model pipeline ─────────────────────────────────────── */}
        <motion.div
          variants={staggerParent(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-16 sm:mt-20"
        >
          <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint sm:text-xs">
              // two models, two jobs
            </span>
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"
            />
          </motion.div>

          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-5">
            <ToolCard tool={aiPractice.tools[1]} direction={-1} />

            {/* The arrow is the argument: planning happens before building. It
                turns down the page on a narrow screen, where the cards stack. */}
            <motion.div
              variants={scaleIn}
              aria-hidden="true"
              className="grid place-items-center py-1 md:py-0"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
                <ArrowRight className="h-4 w-4 rotate-90 text-ink-faint md:rotate-0" />
              </span>
            </motion.div>

            <ToolCard tool={aiPractice.tools[0]} direction={1} />
          </div>
        </motion.div>

        {/* ── how the tools are used, which is the part that is a skill ──── */}
        <motion.ul
          variants={staggerParent(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4"
        >
          {aiPractice.principles.map((principle) => (
            <PrincipleCard
              key={principle.title}
              icon={principleIcons[principle.icon]}
              title={principle.title}
              detail={principle.detail}
            />
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

/**
 * The CLI still, framed like a screenshot.
 *
 * It went missing for a session, on the reasoning that the live terminal replay
 * below already showed the CLI. That was wrong twice: the replay shows a
 * *transcript* scrolling in a small panel, which is what using the tool looks
 * like, while this shows the tool's actual face — the banner, the layout, the
 * thing you would recognise. A section arguing "this is what I build in"
 * deserves to open by showing it.
 *
 * No window chrome is added around it. The drawing already contains its own
 * title bar and traffic lights, and wrapping it in a second set produced two
 * stacked title bars — the classic mistake of framing a screenshot that is
 * already a screenshot. It gets a border, a shadow and a corner badge instead.
 */
function CliShot() {
  const tiltRef = useTilt<HTMLDivElement>(3)

  return (
    <motion.figure
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={inViewEarly}
      className="mb-12 sm:mb-16"
    >
      <div
        ref={tiltRef}
        className="tilt-surface card-sheen relative overflow-hidden rounded-3xl border border-claude/20 shadow-[0_30px_80px_-40px_rgba(217,119,87,0.5)]"
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
          className="block w-full"
        />

        {/* Badge sits over the drawing's own title bar, in the corner it left
            empty, rather than in a second chrome strip above it. */}
        <span className="absolute right-3 top-3 hidden items-center gap-1.5 rounded-full border border-claude/30 bg-void/70 px-2.5 py-1 font-mono text-[10px] text-claude backdrop-blur-sm sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-claude" />
          {aiPractice.image.badge}
        </span>
      </div>

      <figcaption className="mt-3 text-center font-mono text-[11px] leading-relaxed text-ink-faint">
        {aiPractice.image.caption}
      </figcaption>
    </motion.figure>
  )
}

/** One of the two models, with what it is for and what it is good at. */
function ToolCard({ tool, direction }: { tool: AiTool; direction: number }) {
  const accent = toolAccents[tool.accent]
  const tiltRef = useTilt<HTMLDivElement>(4)

  return (
    <motion.div variants={slideIn} custom={direction} className="h-full">
      <div
        ref={tiltRef}
        className={`glass-card card-sheen tilt-surface group relative flex h-full flex-col overflow-hidden rounded-3xl border p-6 transition-colors duration-300 sm:p-7 ${accent.ring}`}
      >
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent ${accent.rule}`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 ${accent.glow}`}
        />

        <div className="relative mb-5 flex items-center justify-between gap-3">
          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${accent.tile}`}
          >
            <TechIcon name={tool.tech} className="h-6 w-6" />
          </span>
          <span
            className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${accent.badge}`}
          >
            {tool.role}
          </span>
        </div>

        <h3 className="relative font-display text-xl font-semibold text-ink sm:text-2xl">
          {tool.name}
        </h3>
        <p className="relative mt-2.5 flex-1 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
          {tool.detail}
        </p>

        <ul className="relative mt-5 space-y-2 border-t border-white/[0.06] pt-4">
          {tool.points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2.5 font-mono text-[11px] leading-relaxed text-ink-muted"
            >
              <Sparkles
                className={`mt-px h-3 w-3 shrink-0 ${accent.text}`}
                aria-hidden="true"
              />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

/**
 * `.tilt-surface` needs `useTilt` to drive its `--rx`/`--ry`, and it owns
 * `transform` — so it goes on a plain inner div rather than on the Framer
 * element. These cards previously wore the class with no hook attached, which
 * meant they paid for the transform stack and got nothing but the hover lift.
 */
function PrincipleCard({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon
  title: string
  detail: string
}) {
  const tiltRef = useTilt<HTMLDivElement>(4)

  return (
    <motion.li variants={fadeUp} className="h-full">
      <div
        ref={tiltRef}
        className="tilt-surface glass-card h-full rounded-2xl p-5 transition-colors duration-300 hover:border-claude/25 sm:p-6"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-claude/25 bg-claude/10">
          <Icon className="h-5 w-5 text-claude" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-display text-base font-semibold text-ink">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{detail}</p>
      </div>
    </motion.li>
  )
}
