import { useEffect, useRef, useState } from 'react'

/**
 * Which of the given sections the reader is currently looking at.
 *
 * This replaces the hand-rolled spy that the navbar and the scroll rail each
 * ran independently: both listened to `scroll` and read `element.offsetTop`
 * inside the handler. Reading a layout property forces the browser to flush
 * layout synchronously, so every scroll event — dozens per second, twice over —
 * blocked the main thread mid-scroll. IntersectionObserver does the same job
 * off the main thread and fires only when a boundary is actually crossed.
 *
 * The root margin collapses the viewport to a thin band around 40% down the
 * screen; whichever section overlaps that band is the active one.
 */
export function useScrollSpy(ids: string[], fallback = ids[0] ?? '') {
  const [active, setActive] = useState(fallback)
  // Joined so the effect re-runs when the list genuinely changes, not on every
  // render that rebuilds the array literal at the call site.
  const key = ids.join(',')

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)

    if (elements.length === 0) return

    const visible = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }

        // Furthest down the page wins, matching the old "last section whose top
        // has passed" behaviour. When nothing overlaps the band — the gap
        // between two short sections — the previous answer stands rather than
        // blanking the indicator.
        for (let i = ids.length - 1; i >= 0; i--) {
          if (visible.has(ids[i])) {
            setActive(ids[i])
            return
          }
        }
      },
      // Roughly a tenth of the viewport, centred a little above the middle.
      // Narrower than this and a short phone viewport leaves a band of only a
      // few dozen pixels for a boundary to land in.
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return active
}

/**
 * True once the page has scrolled past `threshold` pixels.
 *
 * Reads `window.scrollY` only — no layout property, so it never forces a
 * reflow — and coalesces to one update per animation frame.
 */
export function useScrolledPast(threshold: number) {
  const [past, setPast] = useState(false)
  const frame = useRef(0)

  useEffect(() => {
    const evaluate = () => {
      frame.current = 0
      setPast(window.scrollY > threshold)
    }

    const handleScroll = () => {
      if (!frame.current) frame.current = requestAnimationFrame(evaluate)
    }

    evaluate()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [threshold])

  return past
}
