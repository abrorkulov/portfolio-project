import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { prefersReducedMotion } from '../lib/env'
import type { Photo } from '../data/site'

const THROW_MS = 280
const SWIPE_PX = 40

/**
 * A stack of prints on warm paper: the one thing on the route that was not rendered.
 *
 * Each sheet's place in the fan comes from its depth, set here as a data attribute and
 * read by the stylesheet, so all the layout lives in one place. The top sheet is thrown
 * clear before it drops to the back, or it would pass through the ones above it.
 */
export default function Album({ title, photos }: { title: string; photos: Photo[] }) {
  const [top, setTop] = useState(0)
  const [throwing, setThrowing] = useState(false)
  const swipe = useRef<number | null>(null)
  const count = photos.length

  const next = () => {
    if (throwing) return
    if (prefersReducedMotion()) {
      setTop((top + 1) % count)
      return
    }
    setThrowing(true)
    window.setTimeout(() => {
      setTop((value) => (value + 1) % count)
      setThrowing(false)
    }, THROW_MS)
  }
  const previous = () => {
    if (!throwing) setTop((top - 1 + count) % count)
  }

  const onPointerUp = (event: PointerEvent) => {
    const from = swipe.current
    swipe.current = null
    if (from === null) return
    const moved = event.clientX - from
    if (moved <= -SWIPE_PX) next()
    else if (moved >= SWIPE_PX) previous()
  }

  return (
    <figure className="album" aria-label={`${title}, ${count} screenshots`}>
      <div
        className="album-stack"
        onPointerDown={(event) => {
          swipe.current = event.clientX
        }}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipe.current = null
        }}
      >
        {photos.map((photo, i) => {
          const depth = (i - top + count) % count
          const isTop = depth === 0
          return (
            <button
              key={photo.src}
              type="button"
              className="sheet"
              data-depth={depth}
              data-thrown={isTop && throwing ? '' : undefined}
              onClick={isTop ? next : undefined}
              tabIndex={isTop ? 0 : -1}
              aria-hidden={!isTop}
              aria-label={isTop ? `${photo.alt}. Next photo` : undefined}
            >
              <img
                src={photo.src}
                alt=""
                width={1280}
                height={800}
                decoding="async"
                draggable={false}
              />
              <span className="sheet-caption">
                <span>{photo.caption}</span>
                <b>
                  {String(i + 1).padStart(2, '0')}/{String(count).padStart(2, '0')}
                </b>
              </span>
            </button>
          )
        })}
      </div>
      <figcaption className="album-controls">
        <button type="button" onClick={previous} aria-label="Previous photo">
          ←
        </button>
        <span aria-live="polite">{photos[top].caption}</span>
        <button type="button" onClick={next} aria-label="Next photo">
          →
        </button>
      </figcaption>
    </figure>
  )
}
