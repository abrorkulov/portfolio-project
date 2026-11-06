import Album from './Album'
import BrandIcon from './BrandIcon'
import { useNow } from '../lib/useNow'
import { about, clauding, contact, hero, legs, meta, socials, stack, work } from '../data/site'
import type { Project } from '../data/site'

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="arrow">
      <path d="M6 18 18 6M9 6h9v9" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

/** The empty stretch of a flight, with one thing to read on the way past. */
export function Leg({ index }: { index: number }) {
  const leg = legs[index]
  return (
    <div className="leg">
      <p className="leg-text">
        <span className="leg-line">{leg.line}</span>
        <span className="leg-sub">{leg.sub}</span>
      </p>
    </div>
  )
}

export function Hero() {
  return (
    <section id="top" className="stop stop-hero">
      <div className="stop-hold">
        <div className="panel panel-hero">
          <h1 className="hero-name" aria-label={`${meta.name}, ${meta.role}`}>
            {hero.name}
          </h1>
          <p className="hero-title">{hero.title}</p>
          <p className="body">{hero.body}</p>
          <p className="hero-note">{hero.note}</p>
          <p className="hero-scroll">{hero.scroll}</p>
        </div>
      </div>
    </section>
  )
}

export function About() {
  return (
    <section id="about" className="stop">
      <div className="stop-hold">
        <div className="panel">
          <p className="label">{about.label}</p>
          <h2 className="title">{about.title}</h2>
          <p className="body">{about.body}</p>
          <dl className="spec">
            {about.spec.map((row) => (
              <div key={row.key}>
                <dt>{row.key}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

export function ProjectStop({ project, index }: { project: Project; index: number }) {
  return (
    <section id={project.id} className={project.album ? 'stop stop-album' : 'stop'}>
      <div className="stop-hold">
        <article className="panel">
          <p className="label">
            {project.world}, {String(index + 1).padStart(2, '0')} of{' '}
            {String(work.projects.length).padStart(2, '0')}
          </p>
          <h2 className="title title-project">{project.title}</h2>
          <p className="kind">
            {project.kind}. {project.status}.
          </p>
          <p className="body">{project.summary}</p>
          {project.image ? (
            <img
              className="shot"
              src={project.image}
              alt={project.imageAlt ?? ''}
              width={1920}
              height={1080}
              loading="lazy"
              decoding="async"
            />
          ) : null}
          {project.roles ? (
            <ul className="roles">
              {project.roles.map((role) => (
                <li key={role.name}>
                  <b>{role.name}</b>
                  <span>{role.does}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="tools">{project.stack.join(', ')}</p>
          {project.live || project.repo ? (
            <p className="links">
              {project.live ? (
                <a href={project.live} target="_blank" rel="noreferrer">
                  {work.liveLabel}
                  <Arrow />
                </a>
              ) : null}
              {project.repo ? (
                <a href={project.repo} target="_blank" rel="noreferrer">
                  {work.sourceLabel}
                  <Arrow />
                </a>
              ) : null}
            </p>
          ) : null}
          {project.album ? <Album title={project.title} photos={project.album} /> : null}
        </article>
      </div>
    </section>
  )
}

export function Also() {
  return (
    <section id="also" className="stop">
      <div className="stop-hold">
        <div className="panel">
          <p className="label">{work.also.label}</p>
          <h2 className="title">{work.also.title}</h2>
          <ul className="also">
            {work.also.items.map((item) => (
              <li key={item.title}>
                <a href={item.href} target="_blank" rel="noreferrer">
                  <b>
                    {item.title}
                    <Arrow />
                  </b>
                  <span>{item.does}</span>
                  <small>{item.stack}</small>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function Clauding() {
  return (
    <section id="clauding" className="stop">
      <div className="stop-hold">
        <div className="panel">
          <p className="label">{clauding.label}</p>
          <h2 className="title title-project">{clauding.title}</h2>
          <p className="body">{clauding.body}</p>
          <dl className="spec">
            {clauding.spec.map((row) => (
              <div key={row.key}>
                <dt>{row.key}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className="hero-note">{clauding.note}</p>
        </div>
      </div>
    </section>
  )
}

export function Stack() {
  return (
    <section id="stack" className="stop">
      <div className="stop-hold">
        <div className="panel">
          <p className="label">{stack.label}</p>
          <h2 className="title">{stack.title}</h2>
          <dl className="layers">
            {stack.layers.map((layer) => (
              <div key={layer.title}>
                <dt>{layer.title}</dt>
                <dd>{layer.tools}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

export function Contact({ cracked }: { cracked: boolean }) {
  const { time, sky } = useNow()
  return (
    <section id="contact" className="stop stop-contact">
      <div className="stop-hold">
        <div className="panel panel-center">
          <h2 className="title title-contact">{cracked ? contact.crackedTitle : contact.title}</h2>
          <p className="body">{cracked ? contact.crackedNote : contact.note}</p>
          <ul className="socials">
            {socials.map((social) => (
              <li key={social.id}>
                <a href={social.href} target="_blank" rel="noreferrer">
                  <BrandIcon id={social.id} className="social-icon" />
                  <b>{social.label}</b>
                  <span>{social.handle}</span>
                </a>
              </li>
            ))}
          </ul>
          <a className="return" href="#top">
            {contact.back}
          </a>
          <p className="credits">
            {time ? `${contact.now} ${time}${sky ? `, ${sky}` : ''}. ` : ''}
            {contact.credits}{' '}
            <a href={contact.source} target="_blank" rel="noreferrer">
              {contact.sourceLabel}
            </a>
            . © {new Date().getFullYear()} {meta.name}.
          </p>
        </div>
      </div>
    </section>
  )
}
