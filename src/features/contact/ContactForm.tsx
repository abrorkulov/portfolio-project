import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle2, User, Mail, MessageSquare } from 'lucide-react'
import { profile } from '@/data/content'
import { fadeUp, scaleIn, staggerParent } from '@/shared/motion/motion'

type Fields = { name: string; email: string; message: string }

const EMPTY: Fields = { name: '', email: '', message: '' }

export default function ContactForm() {
  const [values, setValues] = useState<Fields>(EMPTY)
  const [sent, setSent] = useState(false)

  /**
   * There is no backend behind this site, so the form hands the message to the
   * visitor's own mail client. It once ran a setTimeout and then claimed
   * "Message sent successfully!" while sending nothing at all — the copy below
   * says what actually happens instead.
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const subject = `Portfolio enquiry from ${values.name}`
    const body = `${values.message}\n\n—\n${values.name}\n${values.email}`

    window.location.href =
      `mailto:${profile.email}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`

    setSent(true)
    setValues(EMPTY)
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <motion.div
      variants={fadeUp}
      className="glass-card glow-border relative z-10 overflow-hidden rounded-3xl p-5 sm:p-7"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-signal/[0.05] via-transparent to-pulse/[0.05]"
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-signal/25 bg-signal/10">
            <Send className="h-4 w-4 text-signal" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold text-ink">
              Send a message
            </h3>
            <p className="font-mono text-[11px] text-ink-faint">
              opens in your mail app
            </p>
          </div>
        </div>

        {sent ? (
          <motion.div
            variants={staggerParent(0.08)}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center py-10 text-center sm:py-14"
          >
            <motion.span
              variants={scaleIn}
              className="grid h-16 w-16 place-items-center rounded-2xl border border-signal/30 bg-signal/10"
            >
              <CheckCircle2 className="h-8 w-8 text-signal" aria-hidden="true" />
            </motion.span>
            <motion.p
              variants={fadeUp}
              className="mt-5 font-display text-base font-semibold text-ink"
            >
              Your mail app should be open.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-2 max-w-xs font-mono text-xs leading-relaxed text-ink-muted"
            >
              If nothing happened, write to{' '}
              <a
                href={`mailto:${profile.email}`}
                className="text-signal underline underline-offset-4"
              >
                {profile.email}
              </a>
            </motion.p>
            <motion.button
              variants={fadeUp}
              type="button"
              onClick={() => setSent(false)}
              className="mt-6 min-h-[44px] rounded-xl border border-white/10 px-5 font-mono text-xs text-ink-muted transition-colors hover:border-signal/40 hover:text-signal"
            >
              write another
            </motion.button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field id="cf-name" label="your name">
              <User className="h-4 w-4" aria-hidden="true" />
              <input
                id="cf-name"
                name="name"
                type="text"
                value={values.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                autoComplete="name"
                required
                className="font-mono text-sm"
              />
            </Field>

            <Field id="cf-email" label="your email">
              <Mail className="h-4 w-4" aria-hidden="true" />
              <input
                id="cf-email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                autoComplete="email"
                required
                className="font-mono text-sm"
              />
            </Field>

            <Field id="cf-message" label="your message" alignTop>
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              <textarea
                id="cf-message"
                name="message"
                value={values.message}
                onChange={handleChange}
                placeholder="What are you building?"
                rows={4}
                required
                className="font-mono text-sm"
              />
            </Field>

            <button
              type="submit"
              className="btn-primary w-full font-mono text-sm"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Send message
            </button>
          </form>
        )}
      </div>
    </motion.div>
  )
}

type FieldProps = {
  id: string
  label: string
  /** Textareas need the icon on the first line, not vertically centred. */
  alignTop?: boolean
  children: React.ReactNode
}

function Field({ id, label, alignTop = false, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint"
      >
        {label}
      </label>
      <div className={`field${alignTop ? ' field-start' : ''}`}>{children}</div>
    </div>
  )
}
