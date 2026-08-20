import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import SectionHeader from './SectionHeader'
import { driftIn, staggerParent, inViewEarly } from '../lib/motion'
import { useTilt } from '../lib/pointerFx'
import { timelineEvents } from '../data/content'
import { Rocket, Code, Brain, Train, Gamepad2 } from 'lucide-react'

const iconMap = {
  rocket: Rocket,
  code: Code,
  brain: Brain,
  gamepad: Gamepad2,
}

type TimelineEvent = (typeof timelineEvents)[number]

export default function TrainTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [railHeight, setRailHeight] = useState(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  // Spring the raw numeric progress FIRST, then map it to a distance.
  // Springing an already-mapped percentage string is not a numeric animation
  // and gives the train a travel distance unrelated to the rail's height.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    mass: 0.6,
  })

  // The train used to drive `top`, which meant the browser laid the element
  // out again on every frame of the scroll. Measuring the rail once and driving
  // `y` in pixels puts it on the compositor instead, with identical travel:
  // the mapping still resolves against the rail's height, not the train's.
  useEffect(() => {
    const rail = containerRef.current
    if (!rail) return

    const observer = new ResizeObserver(([entry]) => {
      setRailHeight(entry.contentRect.height)
    })
    observer.observe(rail)
    return () => observer.disconnect()
  }, [])

  const trainY = useTransform(smoothProgress, [0.08, 0.92], [0, railHeight])
  const trainRotation = useTransform(smoothProgress, [0, 1], [0, 360])

  return (
    <section
      id="trajectory"
      className="section-rule relative overflow-hidden py-16 sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          index="02"
          eyebrow="my_learning_journey"
          title="A Train Through Time"
          description="Key milestones from 2023 to today — the courses, the builds, and the turns that shaped what I work on now."
        />

        <div ref={containerRef} className="relative mt-12 sm:mt-16">
          {/* Track line */}
          <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-gradient-to-b from-signal/25 via-pulse/25 to-transparent sm:left-8" />

          {/* Track glow effect */}
          <div className="absolute bottom-0 left-4 top-0 w-8 -translate-x-1/2 bg-gradient-to-b from-signal/5 via-pulse/5 to-signal/5 blur-xl sm:left-8" />

          {/* Train node */}
          <motion.div
            style={{ y: trainY, rotate: trainRotation }}
            className="absolute left-0 top-0 z-10 sm:left-4"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-signal/20 blur-xl" />
              <div className="glass-card relative rounded-full border-2 border-signal/50 p-2.5 shadow-glow sm:p-3">
                <Train className="h-4 w-4 text-signal sm:h-6 sm:w-6" />
              </div>
            </div>
          </motion.div>

          {/* Timeline events */}
          <motion.div
            variants={staggerParent(0.12)}
            initial="hidden"
            whileInView="show"
            viewport={inViewEarly}
            className="ml-10 space-y-10 sm:ml-20 sm:space-y-20"
          >
            {timelineEvents.map((event) => (
              <TimelineCard key={`${event.year}-${event.title}`} event={event} />
            ))}
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-1/4 h-64 w-64 rounded-full bg-signal/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-pulse/5 blur-3xl" />
      </div>
    </section>
  )
}

function TimelineCard({ event }: { event: TimelineEvent }) {
  const Icon = iconMap[event.icon as keyof typeof iconMap] || Rocket
  const tiltRef = useTilt<HTMLDivElement>(3)

  return (
    <motion.div variants={driftIn} className="relative">
      {/* Node on the rail, aligned to this card. */}
      <span
        aria-hidden="true"
        className="absolute -left-[26px] top-7 grid h-3 w-3 place-items-center sm:-left-[49px]"
      >
        <span className="absolute h-3 w-3 rounded-full bg-signal/25" />
        <span className="h-1.5 w-1.5 rounded-full bg-signal" />
      </span>

      <div
        ref={tiltRef}
        className="glass-card glow-border tilt-surface max-w-3xl rounded-2xl p-5 sm:p-7"
      >
        <div className="flex flex-col items-start gap-4 sm:flex-row">
          <div className="flex w-full items-center justify-between sm:w-auto">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-signal/30 bg-gradient-to-br from-signal/20 to-pulse/20 sm:h-12 sm:w-12">
              <Icon
                className="h-5 w-5 text-signal sm:h-6 sm:w-6"
                aria-hidden="true"
              />
            </div>
            <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 font-mono text-xs font-semibold text-signal sm:hidden">
              {event.year}
            </span>
          </div>

          <div className="flex-1">
            <div className="mb-2 hidden items-center justify-between sm:flex">
              <h3 className="font-display text-lg font-semibold text-ink lg:text-xl">
                {event.title}
              </h3>
              <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 font-mono text-sm font-semibold text-signal">
                {event.year}
              </span>
            </div>
            <h3 className="mb-2 font-display text-lg font-semibold text-ink sm:hidden">
              {event.title}
            </h3>
            <p className="text-sm leading-relaxed text-ink-muted sm:text-base">
              {event.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
