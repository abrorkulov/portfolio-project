import { useEffect, useRef } from 'react'
import Scramble from './Scramble'
import { isCompact, prefersReducedMotion } from '../lib/env'
import { work } from '../data/site'
import type { Project } from '../data/site'

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="arrow">
      <path d="M5 19 19 5M8 5h11v11" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function Roles({ project }: { project: Project }) {
  return (
    <div className="roles">
      <p className="roles-head">
        <span>One codebase</span>
        <span>Web + mobile</span>
      </p>
      <ol className="roles-list">
        {project.roles?.map((role, i) => (
          <li key={role.name}>
            <span className="roles-index">0{i + 1}</span>
            <span className="roles-name">{role.name}</span>
            <span className="roles-does">{role.does}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Panel({ project, index, total }: { project: Project; index: number; total: number }) {
  return (
    <article className="panel">
      <div className="panel-inner">
        <header className="panel-top">
          <span>
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <span>{project.kind}</span>
          <span className="panel-status">{project.status}</span>
        </header>
        <h3 className="panel-title">{project.title}</h3>
        <div className="panel-body">
          <div className="panel-text">
            <p>{project.summary}</p>
            <p className="panel-stack">{project.stack.join(' / ')}</p>
            <div className="panel-links">
              {project.live ? (
                <a href={project.live} target="_blank" rel="noreferrer">
                  {work.liveLabel}
                  <Arrow />
                </a>
              ) : null}
              <a href={project.repo} target="_blank" rel="noreferrer">
                {work.sourceLabel}
                <Arrow />
              </a>
            </div>
          </div>
          <div className="panel-media">
            {project.image ? (
              <img
                src={project.image}
                alt={project.imageAlt ?? ''}
                width={1800}
                height={1050}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <Roles project={project} />
            )}
          </div>
        </div>
        <div className="panel-shade" aria-hidden="true" />
      </div>
    </article>
  )
}

export default function Work() {
  const stack = useRef<HTMLDivElement>(null)

  // As the next panel slides over, this one sinks back. Each panel watches only
  // the one after it, and the loop only runs while the stack is on screen.
  useEffect(() => {
    const host = stack.current
    if (!host || isCompact() || prefersReducedMotion()) return
    const panels = [...host.querySelectorAll<HTMLElement>('.panel')]
    let raf = 0
    let running = false

    const frame = () => {
      raf = running ? requestAnimationFrame(frame) : 0
      const vh = window.innerHeight
      const tops = panels.map((panel) => panel.getBoundingClientRect().top)
      panels.forEach((panel, i) => {
        const inner = panel.firstElementChild as HTMLElement
        const shade = inner.querySelector<HTMLElement>('.panel-shade')
        const next = tops[i + 1]
        const t = next === undefined ? 0 : Math.min(1, Math.max(0, 1 - next / vh))
        inner.style.transform = t ? `scale(${1 - t * 0.06})` : ''
        if (shade) shade.style.opacity = String(t * 0.55)
      })
    }
    const observer = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting
      if (running && !raf) raf = requestAnimationFrame(frame)
    })
    observer.observe(host)
    return () => {
      running = false
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section id="work" className="work" data-theme="bone">
      <header className="work-head">
        <p className="kicker">
          <Scramble text={work.kicker} />
        </p>
        <h2 className="work-title" data-reveal>
          <span className="ln">
            <span>{work.title}</span>
          </span>
        </h2>
      </header>

      <div ref={stack} className="panels">
        {work.projects.map((project, i) => (
          <Panel key={project.id} project={project} index={i} total={work.projects.length} />
        ))}
      </div>

      <div className="also">
        <p className="kicker">{work.alsoLabel}</p>
        <ul>
          {work.also.map((item) => (
            <li key={item.title}>
              <a href={item.href} target="_blank" rel="noreferrer">
                <span className="also-title">{item.title}</span>
                <span className="also-does">{item.does}</span>
                <span className="also-stack">{item.stack}</span>
                <Arrow />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
