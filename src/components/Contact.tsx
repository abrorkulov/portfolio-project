import { useEffect, useRef } from 'react'
import BrandIcon from './BrandIcon'
import Scramble from './Scramble'
import { useNow } from '../lib/useNow'
import { contact, meta, socials } from '../data/site'

/** Stretched to the measure, however long the words turn out to be. */
function useFitLines(deps: unknown) {
  const host = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    const el = host.current
    if (!el) return
    const fit = () => {
      const available = el.clientWidth
      el.querySelectorAll<HTMLElement>('.contact-line').forEach((line) => {
        line.style.fontSize = '100px'
        const width = line.getBoundingClientRect().width
        const size = (available / width) * 100
        line.style.fontSize = `${Math.min(size, window.innerHeight * 0.5)}px`
      })
    }
    fit()
    void document.fonts.ready.then(fit)
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [deps])
  return host
}

export default function Contact({ cracked }: { cracked: boolean }) {
  const lines = cracked ? contact.crackedTitle : contact.title
  const title = useFitLines(lines)
  const { time, sky } = useNow()

  return (
    <section id="contact" className="contact" data-theme="ember">
      <p className="kicker">
        <Scramble text={contact.kicker} />
      </p>
      <h2 ref={title} className="contact-title">
        <span className="contact-line">
          {lines[0]} <br className="only-narrow" />
          {lines[1]}
        </span>
      </h2>
      <div className="contact-bottom">
        <p className="contact-note">{cracked ? contact.crackedNote : contact.note}</p>
        <ul className="contact-links">
          {socials.map((social) => (
            <li key={social.id}>
              <a href={social.href} target="_blank" rel="noreferrer">
                <BrandIcon id={social.id} className="contact-icon" />
                <span className="contact-label">{social.label}</span>
                <span className="contact-handle">{social.handle}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <footer className="contact-foot">
        <span>
          {time ? `${contact.now} ${time}` : contact.now}
          {sky ? `, ${sky}` : ''}
        </span>
        <span className="contact-colophon">{contact.colophon}</span>
        <span>
          © {new Date().getFullYear()} {meta.name} ·{' '}
          <a href={contact.source} target="_blank" rel="noreferrer">
            {contact.sourceLabel}
          </a>
        </span>
      </footer>
    </section>
  )
}
