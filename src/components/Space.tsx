import { useEffect, useRef, useState } from 'react'
import type { Space as Engine, Telemetry } from '../space/engine'
import { prefersReducedMotion } from '../lib/env'
import { emitTelemetry, setPulse } from '../lib/telemetry'
import { measureAnchors, routePosition } from '../lib/route'
import { useNow } from '../lib/useNow'
import { hero, route } from '../data/site'

export default function Space() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'loading' | 'live' | 'still'>('loading')
  const { time, sky } = useNow()

  useEffect(() => {
    // Save-Data asks for less than several megabytes of planet maps, so it gets the stills.
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (prefersReducedMotion() || connection?.saveData || !canvas.current) {
      setMode('still')
      return
    }

    let anchors = measureAnchors()
    const remeasure = () => {
      anchors = measureAnchors()
    }
    const observer = new ResizeObserver(remeasure)
    observer.observe(document.body)
    window.addEventListener('load', remeasure)

    let engine: Engine | null = null
    let cancelled = false
    void import('../space/engine')
      .then(({ createSpace }) => {
        if (cancelled || !canvas.current) return
        try {
          engine = createSpace({
            canvas: canvas.current,
            progress: () => routePosition(anchors, window.scrollY),
            onTelemetry: (t: Telemetry) => emitTelemetry(t),
            onPin: (p) => {
              const el = pin.current
              if (!el) return
              if (p) {
                el.style.transform = `translate(${p.x}px, ${p.y}px)`
                el.dataset.on = ''
              } else {
                delete el.dataset.on
              }
            },
            onReady: () => setMode('live'),
            onLost: () => setMode('still'),
          })
        } catch {
          // A driver that rejects a shader gets the stills, not a blank page.
          engine = null
        }
        if (!engine) setMode('still')
        else setPulse(() => engine?.pulse())
      })
      .catch(() => setMode('still'))

    return () => {
      cancelled = true
      observer.disconnect()
      window.removeEventListener('load', remeasure)
      setPulse(null)
      engine?.dispose()
    }
  }, [])

  // With no flight, each stop still has its world behind it, as a photograph.
  useEffect(() => {
    if (mode !== 'still') return
    const layer = document.querySelector<HTMLElement>('.still')
    if (!layer) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = route.findIndex((r) => r.id === entry.target.id)
            layer.style.backgroundImage = `url(/space/stills/${index}.webp)`
            emitTelemetry({ at: index, km: NaN, lightYears: NaN })
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    route.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [mode])

  return (
    <div className="space" data-mode={mode} aria-hidden="true">
      {mode === 'still' ? (
        <div className="still" />
      ) : (
        <canvas ref={canvas} className="space-canvas" />
      )}
      <div ref={pin} className="pin">
        <i className="pin-dot" />
        <span className="pin-label">
          <b>{hero.pin}</b>
          <span>
            {time}
            {sky ? `, ${sky}` : ''}
          </span>
        </span>
      </div>
      {mode === 'loading' ? <p className="space-loading">{hero.loading}</p> : null}
    </div>
  )
}
