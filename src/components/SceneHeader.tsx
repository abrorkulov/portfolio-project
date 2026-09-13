import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../lib/env'

type Props = {
  index: string
  eyebrow: string
  title: string
}

/**
 * Numbered eyebrow and a title that assembles itself.
 *
 * The title is split into letters that each arrive from below, out of a
 * blur, on a short stagger — so a page is not simply there but is being put
 * together as it lands. The letters are hidden from assistive tech and the
 * whole title is given back as one label, or a screen reader would spell it.
 */
export default function SceneHeader({ index, eyebrow, title }: Props) {
  const heading = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    const el = heading.current
    if (!el || prefersReducedMotion()) return
    const letters = el.querySelectorAll('span')
    const ctx = gsap.context(() => {
      gsap.from(letters, {
        y: '0.55em',
        opacity: 0,
        rotateX: -55,
        filter: 'blur(10px)',
        duration: 0.95,
        ease: 'power3.out',
        stagger: 0.032,
        delay: 0.3,
        // The blur must not be left standing: a filter on the heading's
        // letters costs nothing at rest, but a stray transform would.
        clearProps: 'all',
      })
    }, el)
    return () => ctx.revert()
  }, [title])

  return (
    <header className="scene-header" data-enter="">
      <span className="scene-ghost" aria-hidden="true">
        {index}
      </span>
      <p className="scene-eyebrow">
        <span className="scene-index">{index}</span>
        <span className="scene-rule" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 ref={heading} className="scene-title" aria-label={title}>
        {title.split('').map((char, i) => (
          <span key={`${char}-${i}`} aria-hidden="true">
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </h2>
    </header>
  )
}
