import { useEffect, useRef, useState } from 'react'

/**
 * Reports when an element has come within `rootMargin` of the viewport, once.
 *
 * `React.lazy` fetches its chunk the moment the component renders, not when
 * the component becomes visible — so the playground widgets, five screens
 * down, were downloading and mounting during the initial render alongside
 * everything above the fold. Gating them on this hook keeps their chunks and
 * their canvases off the critical path until the reader is actually heading
 * toward them.
 *
 * The margin is generous on purpose: the chunk should be fetched and mounted
 * before it scrolls into view, not as it arrives.
 */
export function useNearViewport<T extends HTMLElement>(rootMargin = '600px') {
  const ref = useRef<T>(null)
  const [isNear, setIsNear] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || isNear) return

    // No observer means no way to defer — show it rather than never show it.
    if (typeof IntersectionObserver === 'undefined') {
      setIsNear(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNear(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin, isNear])

  return [ref, isNear] as const
}
