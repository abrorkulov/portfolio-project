import { motion } from 'framer-motion'
import SectionHeader from './SectionHeader'
import { skillCategories } from '../data/content'
import { Layout, Cpu, Zap } from 'lucide-react'

const categoryIcons = {
  'Frontend': Layout,
  'Systems & Tools': Cpu,
}

export default function Skills() {
  return (
    <section id="skills" className="relative border-t border-white/5 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="skills_and_technologies"
          title="Tools I reach for"
          description="Split across the interface layer I ship with, and the systems layer I study underneath it."
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {skillCategories.map((category, ci) => {
            const Icon = categoryIcons[category.label as keyof typeof categoryIcons] || Zap
            return (
              <motion.div
                key={category.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: ci * 0.1 }}
                className="glass-card glow-border rounded-2xl p-5 sm:p-8"
              >
                <div className="mb-8 flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-signal/20 to-pulse/20 p-3 border border-signal/30">
                    <Icon className="h-6 w-6 text-signal" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-semibold text-ink">{category.label}</h3>
                    <span className="font-mono text-xs text-ink-muted">{category.eyebrow}</span>
                  </div>
                </div>

                <ul className="space-y-6">
                  {category.items.map((item, i) => (
                    <li key={item.name}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-mono text-sm text-ink">{item.name}</span>
                        <span className="font-mono text-xs text-signal">{item.level}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-void-surface border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.level}%` }}
                          viewport={{ once: true, margin: '-60px' }}
                          transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-signal via-signal-bright to-pulse shadow-glow"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
