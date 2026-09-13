import { useEffect, useState } from 'react'
import BrandIcon from '../components/BrandIcon'
import SceneHeader from '../components/SceneHeader'
import { glass } from '../lib/pointer'
import { useNow } from '../lib/useNow'
import { contact, socials } from '../data/site'
import type { Social } from '../data/site'

/** Each mark's real colour, used only on hover. */
const BRAND: Record<Social['id'], string> = {
  telegram: '#2AABEE',
  github: '#FFFFFF',
  linkedin: '#0A66C2',
  instagram: '#E1306C',
  email: '#EA4335',
}

export default function ContactScene() {
  const lit = glass(4)
  const [copied, setCopied] = useState<Social['id'] | null>(null)
  const now = useNow()

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(null), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = async (social: Social) => {
    try {
      await navigator.clipboard.writeText(social.handle)
      setCopied(social.id)
    } catch {
      // No clipboard permission: the handle is still right there to select.
    }
  }

  return (
    <div className="scene scene-contact">
      <SceneHeader index="04" eyebrow="contact" title="Where to find me" />

      <div className="social-grid">
        {socials.map((social) => (
          // The copy button sits over the card rather than in it: a button
          // inside a link is not valid markup, and a nested control is read
          // out twice by a screen reader.
          <div key={social.id} className="social-row" data-enter="">
            <a
              href={social.href}
              target={social.id === 'email' ? undefined : '_blank'}
              rel="noreferrer"
              className="social-card glass tilt"
              style={{ ['--brand' as string]: BRAND[social.id] }}
              {...lit}
            >
              <span className="social-icon">
                <BrandIcon id={social.id} />
              </span>
              <span className="social-text">
                <span className="social-label">{social.label}</span>
                <span className="social-handle">{social.handle}</span>
              </span>
              <svg
                className="social-go"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>

            <button
              type="button"
              className={copied === social.id ? 'social-copy is-done' : 'social-copy'}
              onClick={() => copy(social)}
              aria-label={`Copy ${social.label} handle`}
            >
              {copied === social.id ? contact.copied : contact.copy}
            </button>
          </div>
        ))}
      </div>

      <div className="scene-foot" data-enter="">
        <p className="scene-signoff">{contact.signoff}</p>
        {/* The clock is rendered only once it has a value, so the line never
            flashes a bare prefix on the first frame. */}
        {now.time ? (
          <p className="scene-now">
            <span className="scene-now-dot" aria-hidden="true" />
            {contact.now}
            <span className="scene-now-sep" aria-hidden="true">
              —
            </span>
            <time>{now.time}</time>
            {now.sky ? <span className="scene-now-sky">· {now.sky}</span> : null}
          </p>
        ) : null}
      </div>
    </div>
  )
}
