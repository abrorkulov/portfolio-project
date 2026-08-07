import { motion } from 'framer-motion'
import SectionHeader from './SectionHeader'
import { interests, Interest } from '../data/content'
import { Gamepad2, Trophy, Clock, Target } from 'lucide-react'

export default function Gaming() {
  return (
    <section id="gaming" className="relative border-t border-white/5 py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="outside_of_code"
          title="Gaming & hobbies"
          description="Competitive and immersive games are where a lot of my curiosity about systems and performance started."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {interests.map((interest: Interest, i: number) => (
            <motion.div
              key={interest.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="glass-card glow-border rounded-2xl p-6 group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-gradient-to-br from-pulse/20 to-signal/20 p-2 border border-pulse/30 group-hover:border-signal/50 transition-colors">
                  <Gamepad2 className="h-5 w-5 text-pulse group-hover:text-signal transition-colors" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">{interest.name}</h3>
              </div>

              <p className="text-sm leading-relaxed text-ink-muted mb-6">
                {interest.detail}
              </p>

              <div className="space-y-3">
                {Object.entries(interest.stats).map(([key, value], statIndex) => {
                  const icons = {
                    rank: Trophy,
                    hours: Clock,
                    kdr: Target,
                    completion: Trophy,
                    level: Trophy,
                    cars: Target,
                    mode: Gamepad2,
                  }
                  const Icon = icons[key as keyof typeof icons] || Target
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + statIndex * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-void-surface border border-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-ink-muted" />
                        <span className="font-mono text-xs text-ink-muted capitalize">
                          {key}
                        </span>
                      </div>
                      <span className="font-mono text-sm text-signal font-semibold">
                        {String(value)}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
