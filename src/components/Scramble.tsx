import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/env'

const GLYPHS = '0123456789ABCDEF'

/**
 * A label that decodes itself the first time it is seen, and again on hover.
 *
 * It writes textContent directly so a run costs no renders. The real text is
 * in the DOM from the first paint and on `aria-label`, so a screen reader or a
 * reduced-motion visitor only ever gets the finished word.
 */
export default function Scramble({ text, className }: { text: string; className?: string }) {
  const el = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = el.current
    if (!node) return
    node.textContent = text
    if (prefersReducedMotion()) return

    let raf = 0
    const run = () => {
      cancelAnimationFrame(raf)
      const start = performance.now()
      const frame = (now: number) => {
        const shown = Math.floor((now - start) / 26)
        if (shown >= text.length) {
          node.textContent = text
          return
        }
        let out = text.slice(0, shown)
        for (let i = shown; i < text.length; i++) {
          out += text[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * 16)]
        }
        node.textContent = out
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run()
          observer.disconnect()
        }
      },
      { threshold: 1 },
    )
    observer.observe(node)
    node.addEventListener('pointerenter', run)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      node.removeEventListener('pointerenter', run)
      node.textContent = text
    }
  }, [text])

  return (
    <span ref={el} className={className} aria-label={text}>
      {text}
    </span>
  )
}
