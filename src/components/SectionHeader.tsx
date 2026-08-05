import { motion } from 'framer-motion'

type SectionHeaderProps = {
  eyebrow: string
  title: string
  description?: string
}

export default function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mb-12 max-w-2xl"
    >
      <span className="font-mono text-xs uppercase tracking-[0.25em] text-signal">
        // {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{title}</h2>
      {description && (
        <p className="mt-4 text-ink-muted leading-relaxed">{description}</p>
      )}
    </motion.div>
  )
}
