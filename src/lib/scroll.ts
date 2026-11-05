import { useEffect } from 'react'
import type { RefObject } from 'react'
import { prefersReducedMotion } from './env'

type Mode =
  /** 0 when the element's top reaches the viewport top, 1 when its bottom
      reaches the viewport bottom. For a tall section with a sticky child. */
  | 'pin'
  /** 0 when the top enters from below, 1 when the top reaches the viewport top. */
  | 'enter'
  /** 0 when the top enters from below, 1 when the bottom leaves past the top. */
  | 'through'

type Subscriber = {
  el: HTMLElement
  mode: Mode
  smooth: number
  current: number
  fresh: boolean
  fn: (progress: number) => void
}

const subscribers = new Set<Subscriber>()
let raf = 0

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function measure(sub: Subscriber, vh: number) {
  const rect = sub.el.getBoundingClientRect()
  if (sub.mode === 'pin') {
    const travel = rect.height - vh
    return travel > 0 ? clamp01(-rect.top / travel) : 0
  }
  if (sub.mode === 'enter') return clamp01(1 - rect.top / vh)
  return clamp01((vh - rect.top) / (rect.height + vh))
}

/**
 * One loop for everything the scrollbar drives.
 *
 * All the rects are read before any callback writes, so a dozen subscribers
 * cannot force a dozen layouts. The easing lives here rather than in a tween:
 * the value chases the scroll position every frame and the loop stops itself
 * the moment everything has settled, so an idle page costs nothing.
 */
function tick() {
  raf = 0
  const vh = window.innerHeight
  const targets = [...subscribers].map((sub) => measure(sub, vh))
  let moving = false
  ;[...subscribers].forEach((sub, i) => {
    const target = targets[i]
    const next = sub.fresh ? target : sub.current + (target - sub.current) * sub.smooth
    const settled = Math.abs(target - next) < 0.0004
    const value = settled ? target : next
    if (!settled) moving = true
    if (value !== sub.current || sub.fresh) {
      sub.current = value
      sub.fresh = false
      sub.fn(value)
    }
  })
  if (moving) schedule()
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(tick)
}

let bound = false
function bind() {
  if (bound) return
  bound = true
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
}

/**
 * Calls `fn` with the element's scroll progress, outside React. Nothing here
 * sets state, so a scrub can never re-render the page.
 */
export function useScrollProgress(
  ref: RefObject<HTMLElement>,
  fn: (progress: number) => void,
  { mode = 'pin', smooth = 0.14 }: { mode?: Mode; smooth?: number } = {},
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    bind()
    const sub: Subscriber = {
      el,
      mode,
      smooth: prefersReducedMotion() ? 1 : smooth,
      current: 0,
      fresh: true,
      fn,
    }
    subscribers.add(sub)
    schedule()
    return () => {
      subscribers.delete(sub)
    }
    // `fn` is expected to be stable; every caller writes straight to the DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, mode, smooth])
}
