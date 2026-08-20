import { motion } from 'framer-motion'
import SectionHeader from './SectionHeader'
import { fadeUp, slideIn, staggerParent, inView, spring } from '../lib/motion'
import { profile } from '../data/content'
import {
  Globe,
  Code,
  Terminal,
  Brain,
  MapPin,
  Cake,
  Target,
} from 'lucide-react'

const categoryIcons = {
  'Frontend & Design': Code,
  'Backend & Core': Terminal,
  'Systems & AI': Brain,
}

export default function About() {
  return (
    <section
      id="about"
      className="relative section-rule py-16 sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          index="01"
          eyebrow="about_me"
          title="A developer who reads the whole stack"
          description="Sixteen, based in Tashkent, and equally interested in the pixel and the process that painted it."
        />

        {/* At a glance — the facts a visitor scans for before reading prose. */}
        <motion.dl
          variants={staggerParent(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mb-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {[
            { icon: Cake, label: 'age', value: `${profile.age}` },
            { icon: MapPin, label: 'based in', value: 'Tashkent, UZ' },
            { icon: Target, label: 'focus', value: 'AI Engineering' },
            {
              icon: Globe,
              label: 'languages',
              value: `${profile.languages.length}`,
            },
          ].map((fact) => (
            <motion.div
              key={fact.label}
              variants={fadeUp}
              className="glass-card rounded-2xl p-4 sm:p-5"
            >
              <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
                <fact.icon
                  className="h-3.5 w-3.5 text-signal"
                  aria-hidden="true"
                />
                {fact.label}
              </dt>
              <dd className="mt-2 font-display text-lg font-semibold text-ink sm:text-xl">
                {fact.value}
              </dd>
            </motion.div>
          ))}
        </motion.dl>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
          <motion.div
            variants={staggerParent(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={inView}
            className="space-y-6"
          >
            {profile.bio.map((paragraph, i) => (
              <motion.p
                key={i}
                variants={fadeUp}
                className="text-[15px] leading-relaxed text-ink-muted sm:text-lg"
              >
                {paragraph}
              </motion.p>
            ))}

            <motion.div
              variants={fadeUp}
              className="glass-card rounded-2xl p-5 sm:p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-5 w-5 text-signal" />
                <h3 className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                  languages
                </h3>
              </div>
              <ul className="space-y-3">
                {profile.languages.map((lang) => (
                  <motion.li
                    key={lang.name}
                    whileHover={{ x: 5 }}
                    transition={spring.snappy}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-ink group-hover:text-signal transition-colors">
                      {lang.name}
                    </span>
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      className="glow-border rounded-full bg-signal/10 border border-signal/20 px-3 py-1 font-mono text-xs text-signal cursor-default"
                    >
                      {lang.level}
                    </motion.span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          <motion.div
            variants={staggerParent(0.1)}
            initial="hidden"
            whileInView="show"
            viewport={inView}
            className="space-y-5 sm:space-y-6"
          >
            {profile.expertise.map((category) => {
              const Icon =
                categoryIcons[
                  category.category as keyof typeof categoryIcons
                ] || Code
              return (
                <motion.div
                  key={category.category}
                  variants={slideIn}
                  custom={1}
                  className="group glass-card glow-border rounded-2xl p-5 transition-colors duration-300 hover:border-pulse/30 sm:p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="h-5 w-5 text-pulse" />
                    <h3 className="font-display font-semibold text-gradient-warm">
                      {category.category}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map((item) => (
                      <motion.span
                        key={item}
                        whileHover={{ scale: 1.06, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        transition={spring.snappy}
                        className="cursor-default rounded-full border border-white/5 bg-void-surface px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-signal/30 hover:text-signal"
                      >
                        {item}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
