import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createHeroGL } from '../lib/heroGL'
import type { HeroGL } from '../lib/heroGL'
import { prefersReducedMotion } from '../lib/env'
import { useScrollProgress } from '../lib/scroll'
import { hero, heroBytes, meta } from '../data/site'

const NARROW = 720

/**
 * Fits each line to the full measure, then scales the whole name back if it
 * would eat the screen on a short, wide window. Written as a font-size so the
 * DOM type is correct by itself: it is what a screen reader, a reduced-motion
 * visitor or a machine without WebGL2 gets, and what the shader rasterises from.
 */
function fitLines(block: HTMLElement) {
  const lines = [...block.querySelectorAll<HTMLElement>('.hero-line')]
  if (!lines.length) return
  const available = block.clientWidth
  const narrow = window.innerWidth < NARROW

  const widthAt100 = lines.map((line) => {
    line.style.fontSize = '100px'
    return line.getBoundingClientRect().width
  })

  let sizes: number[]
  if (narrow) {
    // Four short lines at one size. GIR stays small and stays left; fitting it
    // to the measure on its own would make it twice the height of the others.
    const widest = Math.max(...widthAt100)
    sizes = lines.map(() => (available / widest) * 100)
  } else {
    sizes = widthAt100.map((width) => (available / width) * 100)
  }

  const total = sizes.reduce((sum, size) => sum + size * 0.8, 0)
  const budget = narrow ? window.innerHeight * 0.66 : window.innerHeight - 225
  const shrink = total > budget ? budget / total : 1
  lines.forEach((line, i) => {
    line.style.fontSize = `${sizes[i] * shrink}px`
  })
}

export default function Hero() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < NARROW,
  )
  const [painted, setPainted] = useState(false)
  const [shaded, setShaded] = useState(false)
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const name = useRef<HTMLHeadingElement>(null)
  const chrome = useRef<HTMLDivElement>(null)
  const engine = useRef<HeroGL | null>(null)
  const progress = useRef(0)

  const lines = narrow ? hero.narrow : hero.wide

  useLayoutEffect(() => {
    if (name.current) fitLines(name.current)
    engine.current?.layout()
  }, [lines])

  // Nothing on this page may wait for the shader. If the fonts or the context
  // are slow or absent, the plain type is revealed and the page simply carries on.
  useEffect(() => {
    let cancelled = false
    const fallback = window.setTimeout(() => setPainted(true), 1800)

    const start = async () => {
      if (name.current) {
        await Promise.race([
          Promise.all([
            document.fonts.load('900 100px Archivo'),
            document.fonts.load('400 40px "Martian Mono"'),
          ]),
          new Promise((resolve) => window.setTimeout(resolve, 1500)),
        ])
        if (cancelled || !name.current) return
        fitLines(name.current)
      }
      if (prefersReducedMotion() || !canvas.current) {
        setPainted(true)
        return
      }
      try {
        const gl = createHeroGL(
          canvas.current,
          () =>
            [...(name.current?.querySelectorAll<HTMLElement>('.hero-line') ?? [])].map((el) => ({
              el,
              text: el.textContent ?? '',
            })),
          heroBytes,
          () => {
            engine.current = null
            setShaded(false)
          },
        )
        if (gl) {
          engine.current = gl
          gl.setScroll(progress.current)
          setShaded(true)
        }
      } catch {
        // A driver that rejects the shader gets the type, which was never gone.
      }
      setPainted(true)
    }
    void start()

    let timer = 0
    const onResize = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const isNarrow = window.innerWidth < NARROW
        setNarrow(isNarrow)
        if (name.current) fitLines(name.current)
        engine.current?.layout()
      }, 120)
    }
    window.addEventListener('resize', onResize, { passive: true })

    const observer = new IntersectionObserver(([entry]) => {
      engine.current?.setVisible(entry.isIntersecting)
    })
    if (root.current) observer.observe(root.current)

    return () => {
      cancelled = true
      window.clearTimeout(fallback)
      window.clearTimeout(timer)
      window.removeEventListener('resize', onResize)
      observer.disconnect()
      engine.current?.dispose()
      engine.current = null
    }
  }, [])

  const onProgress = useCallback((p: number) => {
    progress.current = p
    engine.current?.setScroll(p)
    const el = chrome.current
    if (el) {
      el.style.opacity = String(1 - Math.min(1, p * 3.2))
      el.style.transform = `translateY(${p * -60}px)`
    }
  }, [])
  useScrollProgress(root, onProgress, { smooth: 0.18 })

  return (
    <section
      id="top"
      ref={root}
      className={['hero', painted && 'is-painted', shaded && 'is-gl'].filter(Boolean).join(' ')}
      data-theme="dark"
    >
      <div className="hero-sticky">
        <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />

        <div ref={chrome} className="hero-chrome">
          <p className="hero-statement">
            <span className="ln">
              <span>{hero.statement[0]}</span>
            </span>
            <span className="ln">
              <span>{hero.statement[1]}</span>
            </span>
          </p>
          <ul className="hero-facts">
            {hero.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
          <p className="hero-hint">
            <span className="hero-hint-mouse">{hero.hint}</span>
            <span>{hero.scroll}</span>
          </p>
        </div>

        <h1 ref={name} className="hero-name" aria-label={`${meta.name}, ${meta.role}`}>
          {lines.map((line) => (
            <span key={line} className="hero-line" aria-hidden="true">
              {line}
            </span>
          ))}
        </h1>
      </div>
    </section>
  )
}
