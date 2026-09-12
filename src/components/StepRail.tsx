import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../lib/env'
import { pages } from '../data/site'

type Props = {
  page: number
  onGo: (page: number) => void
}

/**
 * The panel: one glass pill carrying every page, with a highlight that slides
 * between them.
 *
 * The highlight is a single element measured against the active button rather
 * than a background on each one — a background can only cross-fade, and the
 * thing that makes this panel feel built rather than assembled is that the
 * marker actually travels.
 */
export default function StepRail({ page, onGo }: Props) {
  const rail = useRef<HTMLDivElement>(null)
  const marker = useRef<HTMLSpanElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  const place = (animate: boolean) => {
    const target = buttons.current[page]
    const el = marker.current
    if (!target || !el) return

    const box = { width: target.offsetWidth, x: target.offsetLeft }
    if (!animate || prefersReducedMotion()) {
      gsap.set(el, { ...box, opacity: 1 })
      return
    }
    gsap.to(el, { ...box, opacity: 1, duration: 0.55, ease: 'power3.out' })
  }

  // First placement has to happen before paint, or the marker is briefly a
  // full-width bar sitting at the left edge of the panel.
  useLayoutEffect(() => {
    place(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    place(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Label widths change when the web font swaps in, which moves every button
  // under a marker that was measured against the fallback.
  useEffect(() => {
    const el = rail.current
    if (!el) return
    const observer = new ResizeObserver(() => place(false))
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <nav ref={rail} className="rail" aria-label="Pages">
      <span ref={marker} className="rail-marker" style={{ opacity: 0 }} aria-hidden="true" />
      {pages.map((entry, i) => (
        <button
          key={entry.id}
          type="button"
          ref={(el) => {
            buttons.current[i] = el
          }}
          className={i === page ? 'rail-item is-active' : 'rail-item'}
          aria-current={i === page ? 'page' : undefined}
          onClick={() => onGo(i)}
        >
          {entry.label}
        </button>
      ))}
    </nav>
  )
}
