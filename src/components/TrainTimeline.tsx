import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useRef } from 'react'
import SectionHeader from './SectionHeader'
import { fadeUp, staggerParent, inViewEarly } from '../lib/motion'
import { timelineEvents } from '../data/content'
import { Rocket, Code, Brain, Train, Gamepad2 } from 'lucide-react'

const iconMap = {
  rocket: Rocket,
  code: Code,
  brain: Brain,
  gamepad: Gamepad2,
}

export default function TrainTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  // Spring the raw numeric progress FIRST, then map it to a percentage.
  // Springing an already-mapped percentage string is not a numeric animation
  // and gives the train a travel distance unrelated to the rail's height.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    mass: 0.6,
  })
  // Driving `top` (not `y`) means the percentage resolves against the rail
  // container, so the train stays on the track for any number of events.
  const trainTop = useTransform(smoothProgress, [0.08, 0.92], ['0%', '100%'])
  const trainRotation = useTransform(smoothProgress, [0, 1], [0, 360])

  return (
    <section
      id="trajectory"
      className="relative overflow-hidden section-rule py-16 sm:py-24 lg:py-32"
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
          <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-b from-signal/5 via-pulse/5 to-signal/5 blur-xl" />

          {/* Train node */}
          <motion.div
            style={{ top: trainTop, rotate: trainRotation }}
            className="absolute left-0 z-10 sm:left-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-signal/20 blur-xl rounded-full" />
              <div className="relative glass-card rounded-full p-2.5 sm:p-3 border-2 border-signal/50 shadow-glow">
                <Train className="h-4 w-4 sm:h-6 sm:w-6 text-signal" />
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
            {timelineEvents.map((event) => {
              const Icon = iconMap[event.icon as keyof typeof iconMap] || Rocket
              return (
                <motion.div
                  key={`${event.year}-${event.title}`}
                  variants={fadeUp}
                  className="relative"
                >
                  {/* Event card */}
                  {/* Node on the rail, aligned to this card. */}
                  <span
                    aria-hidden="true"
                    className="absolute -left-[26px] top-7 grid h-3 w-3 place-items-center sm:-left-[49px]"
                  >
                    <span className="absolute h-3 w-3 rounded-full bg-signal/25" />
                    <span className="h-1.5 w-1.5 rounded-full bg-signal" />
                  </span>

                  <div className="glass-card glow-border max-w-3xl rounded-2xl p-5 sm:p-7">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="flex items-center justify-between w-full sm:w-auto">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-signal/30 bg-gradient-to-br from-signal/20 to-pulse/20 sm:h-12 sm:w-12">
                          <Icon
                            className="h-5 w-5 text-signal sm:h-6 sm:w-6"
                            aria-hidden="true"
                          />
                        </div>
                        <span className="sm:hidden font-mono text-xs font-semibold text-signal rounded-full border border-signal/30 bg-signal/10 px-3 py-1">
                          {event.year}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="hidden sm:flex items-center justify-between mb-2">
                          <h3 className="font-display text-lg font-semibold text-ink lg:text-xl">
                            {event.title}
                          </h3>
                          <span className="font-mono text-sm font-semibold text-signal rounded-full border border-signal/30 bg-signal/10 px-3 py-1">
                            {event.year}
                          </span>
                        </div>
                        <h3 className="sm:hidden font-display text-lg font-semibold text-ink mb-2">
                          {event.title}
                        </h3>
                        <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-signal/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pulse/5 rounded-full blur-3xl" />
      </div>
    </section>
  )
}
