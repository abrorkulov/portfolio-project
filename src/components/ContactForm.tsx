import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Send,
  CheckCircle2,
  User,
  Mail,
  MessageSquare,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { profile } from '../data/content'
import { fadeUp, scaleIn, staggerParent } from '../lib/motion'

type Fields = { name: string; email: string; message: string }

const EMPTY: Fields = { name: '', email: '', message: '' }

/**
 * `sent`   — Telegram accepted it.
 * `mailed` — the endpoint was unreachable or unconfigured, so the visitor's
 *            mail client was opened instead. Never claim delivery here.
 * `error`  — the endpoint rejected the input; the visitor can fix and retry.
 */
type Status = 'idle' | 'sending' | 'sent' | 'mailed' | 'error'

export default function ContactForm() {
  const [values, setValues] = useState<Fields>(EMPTY)
  const [status, setStatus] = useState<Status>('idle')

  /**
   * The fallback. This was the *only* behaviour until the Telegram endpoint
   * existed, and it stays as the safety net: if `/api/contact` is missing
   * (a local preview, a deploy before the env vars are set) or unreachable,
   * the message still has somewhere to go. The one thing this must never do
   * is tell the visitor a message was delivered when it was not — hence the
   * separate `mailed` state.
   */
  const openMailClient = () => {
    const subject = `Portfolio enquiry from ${values.name}`
    const body = `${values.message}\n\n—\n${values.name}\n${values.email}`
    window.location.href =
      `mailto:${profile.email}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (status === 'sending') return
    setStatus('sending')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, company: '' }),
      })

      if (response.ok) {
        setStatus('sent')
        setValues(EMPTY)
        return
      }

      // 400 means the input itself was rejected — worth telling the visitor,
      // since retrying is on them. Everything else is our problem, not theirs,
      // so hand them the mail client rather than an apology.
      if (response.status === 400) {
        setStatus('error')
        return
      }

      openMailClient()
      setStatus('mailed')
      setValues(EMPTY)
    } catch {
      openMailClient()
      setStatus('mailed')
      setValues(EMPTY)
    }
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (status === 'error') setStatus('idle')
  }

  const isDone = status === 'sent' || status === 'mailed'

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
              straight to my Telegram
            </p>
          </div>
        </div>

        {isDone ? (
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
              {status === 'sent'
                ? 'Message delivered.'
                : 'Your mail app should be open.'}
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="mt-2 max-w-xs font-mono text-xs leading-relaxed text-ink-muted"
            >
              {status === 'sent' ? (
                <>It landed in my Telegram — I usually reply within a day.</>
              ) : (
                <>
                  If nothing happened, write to{' '}
                  <a
                    href={`mailto:${profile.email}`}
                    className="text-signal underline underline-offset-4"
                  >
                    {profile.email}
                  </a>
                </>
              )}
            </motion.p>
            <motion.button
              variants={fadeUp}
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-6 min-h-[44px] rounded-xl border border-white/10 px-5 font-mono text-xs text-ink-muted transition-colors hover:border-signal/40 hover:text-signal"
            >
              write another
            </motion.button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Honeypot. Hidden from sight and from assistive tech, skipped by
                the tab order, and never autofilled — so anything that arrives
                in it came from a bot. */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="cf-company">Company</label>
              <input
                id="cf-company"
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

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
                maxLength={80}
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
                maxLength={120}
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
                maxLength={4000}
                required
                className="font-mono text-sm"
              />
            </Field>

            {status === 'error' && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 font-mono text-xs leading-relaxed text-amber-300"
              >
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                />
                That did not go through — check the email address and try again.
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="btn-primary w-full font-mono text-sm"
            >
              {status === 'sending' ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Send message
                </>
              )}
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
