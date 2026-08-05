import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import SectionHeader from './SectionHeader'
import { timelineEvents } from '../data/content'
import { Rocket, Code, Brain, Train } from 'lucide-react'

const iconMap = {
  rocket: Rocket,
  code: Code,
  brain: Brain,
}

export default function TrainTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const trainY = useTransform(scrollYProgress, [0, 1], [0, 300])
  const trainRotation = useTransform(scrollYProgress, [0, 1], [0, 360])

  return (
    <section id="trajectory" className="relative border-t border-white/5 py-20 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="my_learning_journey"
          title="A Train Through Time"
          description="Follow my development journey from 2024 to present. Watch the train travel through key milestones in my career."
        />

        <div ref={containerRef} className="relative mt-12 sm:mt-16">
          {/* Track line */}
          <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-signal/20 via-pulse/20 to-signal/20" />
          
          {/* Track glow effect */}
          <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-b from-signal/5 via-pulse/5 to-signal/5 blur-xl" />

          {/* Train node */}
          <motion.div
            style={{ y: trainY, rotate: trainRotation }}
            className="absolute left-0 sm:left-4 z-10"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-signal/20 blur-xl rounded-full" />
              <div className="relative glass-card rounded-full p-2.5 sm:p-3 border-2 border-signal/50 shadow-glow">
                <Train className="h-4 w-4 sm:h-6 sm:w-6 text-signal" />
              </div>
            </div>
          </motion.div>

          {/* Timeline events */}
          <div className="ml-10 sm:ml-20 space-y-12 sm:space-y-24">
            {timelineEvents.map((event, index) => {
              const Icon = iconMap[event.icon as keyof typeof iconMap] || Rocket
              return (
                <motion.div
                  key={event.year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  {/* Event card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, delay: index * 0.2 + 0.1 }}
                    className="glass-card glow-border rounded-2xl p-5 sm:p-8 max-w-2xl"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="flex items-center justify-between w-full sm:w-auto">
                        <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-signal/20 to-pulse/20 p-2.5 sm:p-3 border border-signal/30">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-signal" />
                        </div>
                        <span className="sm:hidden font-mono text-xs font-semibold text-signal rounded-full border border-signal/30 bg-signal/10 px-3 py-1">
                          {event.year}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="hidden sm:flex items-center justify-between mb-2">
                          <h3 className="font-display text-xl font-semibold text-ink">
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
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-signal/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pulse/5 rounded-full blur-3xl" />
      </div>
    </section>
  )
}
