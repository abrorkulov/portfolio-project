import { Suspense, lazy, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@/shared/ui/SectionHeader'
import RouteMap from '@/features/journey/RouteMap'
import TechIcon from '@/shared/ui/TechIcon'
import { useCanSupport3D } from '@/features/hero/useCanSupport3D'
import {
  driftIn,
  fadeUp,
  inViewEarly,
  isLiteMotion,
  staggerParent,
} from '@/shared/motion/motion'
import { useTilt } from '@/shared/motion/pointerFx'
import { useGsapScroll } from '@/shared/motion/useGsap'
import { journeySteps, type JourneyIcon, type JourneyStep } from '@/data/content'
import {
  Brain,
  Code,
  Flag,
  Gamepad2,
  Rocket,
  TrainFront,
  type LucideIcon,
} from 'lucide-react'

/**
 * three.js is already lazy for the hero, and Rollup hoists it into a chunk both
 * surfaces share — so the train scene costs its own code and nothing more. A
 * phone, which renders `RouteMap`, fetches neither.
 */
const TrainScene = lazy(() => import('@/features/journey/TrainScene'))

/** Exhaustive: `JourneyIcon` is a closed union, so this cannot miss a case. */
const stationIcons: Record<JourneyIcon, LucideIcon> = {
  rocket: Rocket,
  code: Code,
  brain: Brain,
  gamepad: Gamepad2,
  flag: Flag,
}

/**
 * The learning journey, as a line with five stations.
 *
 * The scroll wheel is the throttle: `progress` is written straight into a ref by
 * a ScrollTrigger and read inside the render loop, so moving the train costs
 * zero React renders. `active` is separate and *is* state, because it changes
 * about five times per section rather than every frame, and both the cards and
 * the platform lights need it.
 *
 * Two renderings, chosen by capability:
 *
 * - **`TrainScene`** (WebGL) on capable desktops.
 * - **`RouteMap`** (SVG) everywhere else — the same five stations as a transit
 *   diagram, no canvas, nothing fetched.
 */
export default function JourneySection() {
  const canRender3D = useCanSupport3D()

  // On the lite tier nothing advances this, so it starts at the last *reached*
  // station — index length-2, because the final stop is explicitly upcoming and
  // showing it as arrived would contradict the copy.
  const [active, setActive] = useState(
    isLiteMotion ? journeySteps.length - 2 : 0,
  )

  /**
   * Scroll position, 0–1 across the station list.
   *
   * A ref, not state. This updates on every scroll frame, and re-rendering the
   * section at that rate to move a train is exactly the mistake the particle
   * canvas was rewritten to stop making.
   */
  const progress = useRef(0)

  const rootRef = useGsapScroll<HTMLDivElement>(
    ({ gsap, ScrollTrigger, root }) => {
      const list = root.querySelector<HTMLElement>('[data-stations]')
      if (list) {
        ScrollTrigger.create({
          trigger: list,
          start: 'top 72%',
          end: 'bottom 78%',
          onUpdate: (self) => {
            progress.current = self.progress
          },
        })
      }

      // One trigger per card, reporting which station the reader is level with.
      // `onLeaveBack` is what makes it work in both directions — without it,
      // scrolling back up leaves every platform lit.
      root
        .querySelectorAll<HTMLElement>('[data-station]')
        .forEach((card, index) => {
          ScrollTrigger.create({
            trigger: card,
            start: 'top 68%',
            end: 'bottom 40%',
            onEnter: () => setActive(index),
            onEnterBack: () => setActive(index),
            onLeaveBack: () => setActive(Math.max(0, index - 1)),
          })
        })

      // A little counter-drift on the stage, so the scene floats against the
      // cards rather than sitting rigidly beside them.
      const stage = root.querySelector<HTMLElement>('[data-stage]')
      if (stage) {
        gsap.fromTo(
          stage,
          { y: 22 },
          {
            y: -22,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          },
        )
      }
    },
  )

  return (
    <section
      id="journey"
      // No `overflow-hidden` here, however tempting it is for containing the
      // ambient glow below. An ancestor with `overflow` other than `visible`
      // becomes the scroll container for any `position: sticky` descendant —
      // and this section does not scroll, so the stage silently stopped
      // sticking and scrolled away with the cards.
      className="section-rule relative py-16 sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          section="journey"
          eyebrow="learning_journey"
          title="Five stations, one line"
          description="Five stations, five years. Everything picked up along the way is still aboard — nothing here was learned and then put down."
        />

        <div
          ref={rootRef}
          className="relative mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-14"
        >
          {/* The stage sticks while the stations scroll past it, so the train
              is on screen for the whole section rather than scrolling away
              after the first card. */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div data-stage className="relative">
              {/* Something for the line to run through. Against flat black the
                  track reads as a sticker; one wide radial gives the scene a
                  horizon at no per-frame cost. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 scale-125 bg-[radial-gradient(ellipse_at_50%_58%,rgba(94,234,212,0.13),rgba(167,139,250,0.07)_42%,transparent_74%)]"
              />

              {canRender3D ? (
                <Suspense fallback={<StageFallback />}>
                  <TrainScene
                    steps={journeySteps}
                    active={active}
                    progress={progress}
                  />
                </Suspense>
              ) : (
                <div className="py-6">
                  <RouteMap steps={journeySteps} active={active} />
                </div>
              )}

              {/* A caption doing real work: without it nobody knows the scroll
                  wheel is the throttle, and the best thing in the section goes
                  unnoticed. Hidden where there is no train to drive. */}
              {canRender3D && (
                <p className="mt-2 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                  <TrainFront className="h-3.5 w-3.5" aria-hidden="true" />
                  scroll to drive the line
                </p>
              )}
            </div>
          </div>

          <motion.ol
            data-stations
            variants={staggerParent(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={inViewEarly}
            className="relative space-y-5 sm:space-y-7"
          >
            {journeySteps.map((step, index) => (
              <StationCard
                key={`${step.year}-${step.station}`}
                step={step}
                index={index}
                total={journeySteps.length}
                active={index === active}
                reached={index <= active}
              />
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  )
}

/**
 * Holds the stage's exact box while the WebGL chunk is in flight. Matching
 * `TrainScene`'s 4:3 aspect matters: a shorter placeholder would let the sticky
 * column collapse and then jump when the canvas mounts.
 */
function StageFallback() {
  return (
    <div className="aspect-[4/3] w-full animate-pulse rounded-3xl border border-white/[0.04] bg-white/[0.015]" />
  )
}

function StationCard({
  step,
  index,
  total,
  active,
  reached,
}: {
  step: JourneyStep
  index: number
  total: number
  active: boolean
  reached: boolean
}) {
  const Icon = stationIcons[step.icon]
  // The tilt writes `transform`, so it goes on a plain inner div — the motion
  // wrapper above owns the entrance and the two never collide.
  const tiltRef = useTilt<HTMLDivElement>(3)
  const upcoming = Boolean(step.upcoming)

  return (
    <motion.li variants={driftIn} data-station={index} className="relative">
      {/* The line running down the left of the list, with this card's stop on
          it — the same route as the 3D track, in the margin of the prose. The
          leg into the final station is dashed, because it has not happened. */}
      <span
        aria-hidden="true"
        className={
          'absolute left-[7px] top-8 hidden w-px sm:block ' +
          (index === total - 1 ? 'h-0' : 'h-[calc(100%+1.75rem)]')
        }
        style={{
          backgroundImage:
            index === total - 2
              ? 'linear-gradient(to bottom, rgba(253,186,116,0.5) 0 4px, transparent 4px 11px)'
              : 'linear-gradient(to bottom, rgba(94,234,212,0.45), rgba(167,139,250,0.25))',
          backgroundSize: index === total - 2 ? '1px 11px' : undefined,
        }}
      />
      <span
        aria-hidden="true"
        className={
          'absolute left-0 top-6 hidden h-[15px] w-[15px] rounded-full border-2 transition-colors duration-500 sm:block ' +
          (reached
            ? upcoming
              ? 'border-ember bg-void'
              : 'border-signal bg-void'
            : 'border-white/20 bg-void')
        }
      />

      <div
        ref={tiltRef}
        className={
          'glass-card tilt-surface relative overflow-hidden rounded-3xl p-5 transition-colors duration-500 sm:ml-9 sm:p-7 ' +
          (active
            ? upcoming
              ? 'border-ember/30'
              : 'border-signal/25'
            : 'hover:border-white/15')
        }
      >
        {/* Reached stations carry a lit top edge, matching the platform beside
            them — the two halves of the section stay visibly in step. */}
        <span
          aria-hidden="true"
          className={
            'absolute inset-x-6 top-0 h-px origin-left bg-gradient-to-r to-transparent transition-transform duration-700 ' +
            (upcoming ? 'from-ember via-ember/40' : 'from-signal via-pulse') +
            ' ' +
            (active ? 'scale-x-100' : 'scale-x-0')
          }
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 right-3 font-display text-[5rem] font-bold leading-none text-white/[0.028]"
        >
          {step.year}
        </span>

        <div className="relative mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={
                'grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition-colors duration-500 ' +
                (active
                  ? upcoming
                    ? 'border-ember/45 bg-ember/15'
                    : 'border-signal/45 bg-gradient-to-br from-signal/25 to-pulse/20'
                  : 'border-white/10 bg-white/[0.03]')
              }
            >
              <Icon
                className={
                  'h-5 w-5 transition-colors duration-500 ' +
                  (active
                    ? upcoming
                      ? 'text-ember'
                      : 'text-signal'
                    : 'text-ink-muted')
                }
                aria-hidden="true"
              />
            </span>
            <span className="section-index font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
              {upcoming ? 'next stop' : `station ${String(index + 1).padStart(2, '0')}`}
            </span>
          </div>

          <span
            className={
              'shrink-0 rounded-full border px-3 py-1 font-mono text-xs font-semibold ' +
              (upcoming
                ? 'border-ember/30 bg-ember/10 text-ember'
                : 'border-signal/25 bg-signal/10 text-signal')
            }
          >
            {step.year}
          </span>
        </div>

        <h3 className="relative font-display text-lg font-semibold leading-snug text-ink lg:text-xl">
          {step.title}
        </h3>

        <p className="relative mt-2.5 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
          {step.description}
        </p>

        {step.picked.length > 0 && (
          <motion.ul
            variants={staggerParent(0.05)}
            className="relative mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4"
          >
            {step.picked.map((tech) => (
              <motion.li
                key={tech}
                variants={fadeUp}
                className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-void-surface px-2.5 py-1.5 font-mono text-[11px] text-ink-muted"
              >
                <TechIcon name={tech} className="h-3.5 w-3.5" />
                {tech}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </motion.li>
  )
}
