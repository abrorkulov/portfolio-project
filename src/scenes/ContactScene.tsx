import BrandIcon from '../components/BrandIcon'
import SceneHeader from '../components/SceneHeader'
import { socials } from '../data/site'
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
  return (
    <div className="scene scene-contact">
      <SceneHeader index="04" eyebrow="contact" title="Where to find me" />

      <div className="social-grid">
        {socials.map((social) => (
          <a
            key={social.id}
            href={social.href}
            target={social.id === 'email' ? undefined : '_blank'}
            rel="noreferrer"
            className="social-card"
            data-enter=""
            style={{ ['--brand' as string]: BRAND[social.id] }}
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
        ))}
      </div>

      <p className="scene-signoff" data-enter="">
        thanks for making it this far :)
      </p>
    </div>
  )
}
