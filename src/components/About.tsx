import { useCallback, useMemo, useRef } from 'react'
import Scramble from './Scramble'
import { useScrollProgress } from '../lib/scroll'
import { about } from '../data/site'

/**
 * A sentence read by scrolling: each word comes up as the reader reaches it.
 * The words are written to directly, so the scrub never touches React.
 */
export default function About() {
  const root = useRef<HTMLElement>(null)
  const text = useRef<HTMLParagraphElement>(null)

  const words = useMemo(
    () =>
      about.statement.split(/\s+/).map((word, index, all) => {
        const opens = word.startsWith('*')
        const closes = word.replace(/[.,:]$/, '').endsWith('*')
        return { raw: word.replace(/\*/g, ''), opens, closes, index, total: all.length }
      }),
    [],
  )

  // The accent runs over several words, so it is worked out in one pass.
  const lit = useMemo(() => {
    let inside = false
    return words.map((word) => {
      if (word.opens) inside = true
      const hit = inside
      if (word.closes) inside = false
      return hit
    })
  }, [words])

  const onProgress = useCallback((p: number) => {
    const nodes = text.current?.children
    if (!nodes) return
    // The sentence finishes well before the section leaves, so the last word
    // gets to sit on screen instead of lighting up on its way out.
    const head = p * 1.45 * nodes.length
    for (let i = 0; i < nodes.length; i++) {
      const v = Math.max(0.1, Math.min(1, head - i + 1))
      ;(nodes[i] as HTMLElement).style.opacity = String(v)
    }
  }, [])
  useScrollProgress(root, onProgress, { mode: 'through', smooth: 0.16 })

  return (
    <section id="about" ref={root} className="about" data-theme="dark">
      <p className="kicker">
        <Scramble text={about.kicker} />
      </p>
      <p ref={text} className="about-text">
        {words.map((word, i) => (
          <span key={word.index} className={lit[i] ? 'is-lit' : undefined}>
            {word.raw}{' '}
          </span>
        ))}
      </p>
      <dl className="spec" data-reveal>
        {about.spec.map((row) => (
          <div key={row.key} className="spec-row">
            <dt>{row.key}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
