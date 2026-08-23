import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Mail,
  MapPin,
  Heart,
  Github,
  Linkedin,
  Send,
  Instagram,
  Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  blurUp,
  fadeUp,
  lineReveal,
  staggerParent,
  inView,
} from '@/shared/motion/motion'
import { profile } from '@/data/content'
import { sectionIndex } from '@/app/sections'
import ContactForm from '@/features/contact/ContactForm'

const socialMeta: Record<string, { Icon: LucideIcon; label: string }> = {
  github: { Icon: Github, label: 'GitHub' },
  linkedin: { Icon: Linkedin, label: 'LinkedIn' },
  telegram: { Icon: Send, label: 'Telegram' },
  instagram: { Icon: Instagram, label: 'Instagram' },
}

/** The last path segment of a profile URL — `/in/jane-doe` reads as `jane-doe`. */
function handleOf(url: string): string | null {
  try {
    const path = new URL(url).pathname.replace(/^\/+|\/+$/g, '')
    if (!path) return null
    return path.split('/').pop() || null
  } catch {
    return null
  }
}

/**
 * A social entry counts as configured only once its URL points somewhere past
 * the domain root — several in content.ts are still bare placeholders like
 * `https://t.me/`, and linking those would just dump visitors on a homepage.
 * Filling one in makes it appear here automatically.
 */
function configuredSocials() {
  return Object.keys(socialMeta)
    .map((key) => ({
      key,
      url: profile.socials[key as keyof typeof profile.socials],
      handle: handleOf(profile.socials[key as keyof typeof profile.socials]),
      ...socialMeta[key],
    }))
    .filter((entry): entry is typeof entry & { handle: string } =>
      Boolean(entry.url) && entry.handle !== null,
    )
}

export default function Footer() {
  const socials = configuredSocials()

  return (
    <footer
      id="contact"
      className="section-rule relative overflow-hidden py-16 sm:py-24 lg:py-28"
    >
      {/* Closing wash. The page opened on a glow behind the hero; it should
          close on one too, rather than trailing off into flat black. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden"
      >
        <div className="absolute left-1/2 top-0 h-[420px] w-[min(900px,90vw)] -translate-x-1/2 rounded-full bg-signal/[0.06] blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* The heading spans the full width rather than sharing a column with
            the form. It used to sit in a half-width cell, which is what left a
            3rem headline wrapping onto four ragged lines beside a tall card. */}
        <motion.div
          variants={staggerParent(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="max-w-3xl"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <span className="section-index font-mono text-[10px] text-ink-faint sm:text-xs">
              {sectionIndex('contact')}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-signal sm:text-xs">
              // get_in_touch
            </span>
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-gradient-to-r from-signal/30 to-transparent"
            />
          </motion.div>

          {/* Same wipe as every other section title, so the last heading on
              the page arrives the way the first one did. */}
          <span className="reveal-line mt-4 block">
            <motion.h2
              variants={lineReveal}
              className="font-display text-[clamp(1.9rem,5.5vw,3rem)] font-semibold leading-[1.1]"
            >
              Let&apos;s build
              <span className="text-gradient"> something extraordinary</span>
            </motion.h2>
          </span>

          <motion.p
            variants={blurUp}
            className="mt-5 text-[15px] leading-relaxed text-ink-muted sm:text-lg"
          >
            Open to internships, collaborations, and interesting challenges —
            frontend, systems, AI, or somewhere in between.
          </motion.p>

          {/* Availability strip. Mirrors the hero badge so the page&apos;s first
              and last promises look like the same promise. */}
          <motion.div
            variants={fadeUp}
            className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2"
          >
            <span className="inline-flex items-center gap-2.5 font-mono text-xs text-signal">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
              </span>
              available for collaborations
            </span>
            <span className="inline-flex items-center gap-2 font-mono text-xs text-ink-faint">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              replies within 24 hours
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          variants={staggerParent(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-10 grid grid-cols-1 gap-6 lg:mt-14 lg:grid-cols-2 lg:gap-10"
        >
          {/* Every way to reach him, as one list of equal rows. These used to
              be a wrap of pill-shaped chips at three different widths, which
              is what made this corner of the page look unfinished. */}
          <div className="flex flex-col gap-3">
            <ChannelRow
              href={`mailto:${profile.email}`}
              Icon={Mail}
              label="email"
              value={profile.email}
              primary
            />

            {socials.map(({ key, url, handle, Icon, label }) => (
              <ChannelRow
                key={key}
                href={url}
                Icon={Icon}
                label={label}
                value={`@${handle}`}
                external
              />
            ))}

            <motion.p
              variants={fadeUp}
              className="mt-1 flex items-center gap-2 px-1 font-mono text-xs text-ink-faint"
            >
              <MapPin className="h-4 w-4 text-pulse" aria-hidden="true" />
              {profile.location} · GMT+5
            </motion.p>
          </div>

          <ContactForm />
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-8 text-center font-mono text-[11px] text-ink-faint sm:flex-row sm:gap-4 sm:text-left sm:text-xs lg:mt-16"
        >
          <p className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span>
              © {new Date().getFullYear()} {profile.name}.
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1">
              Built with <Heart className="h-3 w-3 text-pulse" /> React,
              TypeScript &amp; Three.js
            </span>
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            {profile.location}
          </p>
        </motion.div>
      </div>
    </footer>
  )
}

type ChannelRowProps = {
  href: string
  Icon: LucideIcon
  label: string
  value: string
  /** The email row leads, so it carries the accent border and tint. */
  primary?: boolean
  external?: boolean
}

function ChannelRow({
  href,
  Icon,
  label,
  value,
  primary = false,
  external = false,
}: ChannelRowProps) {
  return (
    <motion.a
      variants={fadeUp}
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      className={`group flex min-h-[68px] items-center gap-4 rounded-2xl border px-4 transition-colors duration-300 sm:px-5 ${
        primary
          ? 'glass-card border-signal/25 hover:border-signal/50'
          : 'border-white/[0.07] bg-white/[0.02] hover:border-signal/30 hover:bg-white/[0.04]'
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors duration-300 ${
          primary
            ? 'border-signal/25 bg-signal/10 group-hover:bg-signal/20'
            : 'border-white/10 bg-white/[0.03] group-hover:border-signal/25'
        }`}
      >
        <Icon
          className={`h-4 w-4 transition-colors duration-300 ${
            primary ? 'text-signal' : 'text-ink-muted group-hover:text-signal'
          }`}
          aria-hidden="true"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
          {label}
        </span>
        {/* `truncate` used to live here, which clipped the email address on a
            390px screen — the one value someone might need to read rather
            than tap. It wraps now, and the row grows to fit. */}
        <span className="block break-all font-mono text-xs text-ink transition-colors duration-300 group-hover:text-signal sm:text-sm">
          {value}
        </span>
      </span>

      <ArrowUpRight
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-ink-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal"
      />
    </motion.a>
  )
}
