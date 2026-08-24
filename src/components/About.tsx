import { motion } from 'framer-motion'
import SectionHeader from './SectionHeader'
import {
  fadeUp,
  scaleIn,
  slideIn,
  staggerParent,
  inView,
  spring,
  hoverOnly,
} from '../lib/motion'
import { useTilt } from '../lib/pointerFx'
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

const facts = [
  { icon: Cake, label: 'age', value: `${profile.age}` },
  { icon: MapPin, label: 'based in', value: 'Tashkent, UZ' },
  { icon: Target, label: 'focus', value: 'AI Engineering' },
  {
    icon: Globe,
    label: 'languages',
    value: `${profile.languages.length}`,
  },
]

export default function About() {
  return (
    <section
      id="about"
      className="section-rule relative py-16 sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          index="01"
          eyebrow="about_me"
          title={
            <>
              A developer who reads the{' '}
              <span className="accent-em text-gradient">whole stack</span>
            </>
          }
          description="Based in Tashkent, and equally interested in the pixel and the process that painted it."
        />

        {/* At a glance — the facts a visitor scans for before reading prose. */}
        <motion.dl
          variants={staggerParent(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mb-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {facts.map((fact) => (
            <FactTile key={fact.label} {...fact} />
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
              <div className="mb-4 flex items-center gap-3">
                <Globe className="h-5 w-5 text-signal" />
                <h3 className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                  languages
                </h3>
              </div>
              <ul className="space-y-3">
                {profile.languages.map((lang) => (
                  <motion.li
                    key={lang.name}
                    {...hoverOnly({ whileHover: { x: 5 } })}
                    transition={spring.snappy}
                    className="group flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-ink transition-colors group-hover:text-signal">
                      {lang.name}
                    </span>
                    <span className="glow-border cursor-default rounded-full border border-signal/20 bg-signal/10 px-3 py-1 font-mono text-xs text-signal">
                      {lang.level}
                    </span>
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
                <ExpertiseCard
                  key={category.category}
                  icon={Icon}
                  category={category.category}
                  items={category.items}
                />
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/**
 * `.tilt-glow` rather than `.tilt-surface`: this element is a Framer child, so
 * it cannot also own `transform`. It gets the edge treatment on hover without
 * the rotation — and the dt/dd stay one div deep inside the dl, which they
 * would not if a tilt needed a wrapper of its own.
 */
function FactTile({ icon: Icon, label, value }: (typeof facts)[number]) {
  return (
    <motion.div
      variants={scaleIn}
      className="glass-card tilt-glow rounded-2xl p-4 transition-colors duration-300 hover:border-signal/25 sm:p-5"
    >
      <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
        <Icon className="h-3.5 w-3.5 text-signal" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-2 font-display text-lg font-semibold text-ink sm:text-xl">
        {value}
      </dd>
    </motion.div>
  )
}

function ExpertiseCard({
  icon: Icon,
  category,
  items,
}: {
  icon: typeof Code
  category: string
  items: readonly string[]
}) {
  const tiltRef = useTilt<HTMLDivElement>(4)

  return (
    <motion.div variants={slideIn} custom={1}>
      <div
        ref={tiltRef}
        className="glass-card glow-border tilt-surface group rounded-2xl p-5 transition-colors duration-300 hover:border-pulse/30 sm:p-6"
      >
        <div className="mb-4 flex items-center gap-3">
          <Icon className="h-5 w-5 text-pulse" />
          <h3 className="font-display font-semibold text-gradient-warm">
            {category}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <motion.span
              key={item}
              {...hoverOnly({ whileHover: { scale: 1.06, y: -2 } })}
              whileTap={{ scale: 0.96 }}
              transition={spring.snappy}
              className="cursor-default rounded-full border border-white/5 bg-void-surface px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-signal/30 hover:text-signal"
            >
              {item}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
