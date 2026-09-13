import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import GlowArrow from './GlowArrow'
import { prefersReducedMotion } from '../lib/env'
import { glass } from '../lib/pointer'
import type { StudyCard } from '../data/site'

type Props = {
  cards: StudyCard[]
}

/** Pixels of drag that count as one card. Tune this first if the feel is off. */
const DRAG_STEP = 320
/** Sideways wheel travel that counts as a trackpad swipe, in pixels. */
const WHEEL_STEP = 60
/** A wheel gesture is over once the events stop for this long. */
const WHEEL_GAP = 160

function metrics(width: number) {
  if (width < 640) return { spread: width * 0.78, depth: 150, tilt: 22, blur: 5 }
  if (width < 1100) return { spread: width * 0.5, depth: 190, tilt: 25, blur: 7 }
  return { spread: 600, depth: 230, tilt: 27, blur: 9 }
}

/**
 * The study deck: frosted cards standing on a shallow arc, the front one
 * square on and readable, its neighbours turned inward, set back and blurred
 * out of the way.
 *
 * The neighbour blur is the point — they have to read as *behind* the card
 * you are reading, and at this size a plain opacity drop left two walls of
 * legible text competing with the one in front.
 *
 * Nothing around the cards may mask or filter: `backdrop-filter` samples the
 * nearest backdrop root, and a mask or filter on any ancestor becomes one —
 * the frosted glass would then have nothing behind it but its own empty box,
 * and the snow it is supposed to be frosting would disappear. The cards run
 * off the side of the page instead, and `html { overflow-x: hidden }` catches
 * them.
 */
export default function Carousel({ cards }: Props) {
  const [index, setIndex] = useState(0)
  const [reachable, setReachable] = useState(0)
  // Glare only. The tilt is the deck's own, driven from `layout`.
  const lit = glass(0)

  const deck = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const items = useRef<(HTMLDivElement | null)[]>([])

  // The deck's position is a float, driven straight onto the elements. It is
  // never React state: a drag would otherwise re-render the whole page on
  // every pointermove. Only `index` and `reachable` cross into React, and both
  // change once per settle.
  const pos = useRef({ value: 0 })
  const size = useRef(metrics(typeof window === 'undefined' ? 1280 : window.innerWidth))

  const layout = useCallback(() => {
    const { spread, depth, tilt, blur } = size.current
    items.current.forEach((el, i) => {
      if (!el) return
      const d = i - pos.current.value
      const away = Math.abs(d)
      gsap.set(el, {
        xPercent: -50,
        yPercent: -50,
        x: d * spread,
        z: -away * depth,
        rotateY: -d * tilt,
        scale: 1 - Math.min(away, 2) * 0.07,
        opacity: away > 2.2 ? 0 : 1 - Math.min(away, 2) * 0.45,
        zIndex: 100 - Math.round(away * 10),
      })
      // The neighbour blur lives on an inner element, never on the transformed
      // one: a filter flattens the element it sits on, and a flattened card
      // stops taking part in the stage's 3D space.
      const face = el.firstElementChild
      if (face) {
        gsap.set(face, {
          filter: away < 0.02 ? 'none' : `blur(${Math.min(away, 2) * blur}px)`,
        })
      }
    })
  }, [])

  const settle = useCallback(
    (next: number) => {
      const target = gsap.utils.clamp(0, cards.length - 1, next)
      setIndex(target)
      if (prefersReducedMotion()) {
        pos.current.value = target
        layout()
        setReachable(target)
        return
      }
      gsap.to(pos.current, {
        value: target,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: true,
        onUpdate: layout,
        // Pointer events follow React state, not the tween: a card faded to
        // zero still swallows clicks meant for the one in front of it, and
        // reading that off a live motion value costs a render per frame.
        onComplete: () => setReachable(target),
      })
    },
    [cards.length, layout],
  )

  // The stage holds absolutely positioned cards, so it has no height of its
  // own — and a fixed one overlapped everything the moment a card wrapped to
  // one more line. Measure the tallest card instead, and re-measure when the
  // web fonts land or the box reflows.
  useEffect(() => {
    const stageEl = stage.current
    if (!stageEl) return

    const measure = () => {
      let tallest = 0
      items.current.forEach((el) => {
        if (el) tallest = Math.max(tallest, el.offsetHeight)
      })
      if (tallest <= 0) return
      stageEl.style.height = `${tallest}px`
      // The side arrows are absolutely positioned against the deck, not the
      // stage, so they need the same number to sit level with the card.
      deck.current?.style.setProperty('--deck-h', `${tallest}px`)
    }

    measure()
    const observer = new ResizeObserver(measure)
    items.current.forEach((el) => {
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    layout()
    const onResize = () => {
      size.current = metrics(window.innerWidth)
      layout()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [layout])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') settle(index - 1)
      if (event.key === 'ArrowRight') settle(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, settle])

  // A two-finger swipe on a trackpad arrives as horizontal wheel events, and
  // sideways is the direction the deck already moves in. One swipe is one
  // card; the same silence-then-threshold rule the page gestures use keeps
  // trackpad inertia from turning one swipe into three.
  //
  // The counters live in a ref so that re-binding on a new `index` does not
  // forget that the current gesture has already been spent.
  const wheel = useRef({ sum: 0, last: 0, spent: false })

  useEffect(() => {
    const el = deck.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      const state = wheel.current
      const now = performance.now()
      if (now - state.last > WHEEL_GAP) {
        state.sum = 0
        state.spent = false
      }
      state.last = now
      if (state.spent) return
      state.sum += event.deltaX
      if (Math.abs(state.sum) < WHEEL_STEP) return
      state.spent = true
      settle(index + Math.sign(state.sum))
    }
    el.addEventListener('wheel', onWheel, { passive: true })
    return () => el.removeEventListener('wheel', onWheel)
  }, [index, settle])

  const drag = useRef<{ id: number; startX: number; from: number } | null>(null)

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    gsap.killTweensOf(pos.current)
    drag.current = { id: event.pointerId, startX: event.clientX, from: pos.current.value }
    // Throws if the pointer is already gone by the time this runs, which is
    // exactly the case where there is nothing left to capture.
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* no capture; the gesture still ends on pointerup */
    }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state || state.id !== event.pointerId) return
    const moved = (state.startX - event.clientX) / DRAG_STEP
    pos.current.value = gsap.utils.clamp(-0.35, cards.length - 0.65, state.from + moved)
    layout()
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state || state.id !== event.pointerId) return
    drag.current = null
    settle(Math.round(pos.current.value))
  }

  return (
    <div ref={deck} className="deck">
      <div className="deck-row">
        <div className="deck-viewport">
          <div
            ref={stage}
            className="deck-stage"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {cards.map((card, i) => (
              <div
                key={card.id}
                ref={(el) => {
                  items.current[i] = el
                }}
                className="deck-card"
                style={{ pointerEvents: i === reachable ? 'auto' : 'none' }}
                aria-hidden={i === index ? undefined : true}
              >
                <div className="deck-face glass" {...lit}>
                  <span className="deck-kicker">{card.kicker}</span>
                  <h3 className="deck-title">{card.title}</h3>
                  <p className="deck-place">{card.place}</p>
                  <p className="deck-body">{card.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Arrows and chips are one row in the markup. On a wide screen the
          arrows lift out of it and flank the card; on a phone there is no
          room beside a card worth reading, so they stay in the row. */}
      <div className="deck-controls">
        <div className="deck-arrow deck-arrow-left">
          <GlowArrow
            direction="left"
            label="Previous card"
            onClick={() => settle(index - 1)}
            disabled={index === 0}
          />
        </div>

        <div className="deck-tabs" role="tablist" aria-label="Places I study">
          {cards.map((card, i) => (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={i === index ? 'deck-tab is-active' : 'deck-tab'}
              onClick={() => settle(i)}
            >
              {card.kicker}
            </button>
          ))}
        </div>

        <div className="deck-arrow deck-arrow-right">
          <GlowArrow
            direction="right"
            label="Next card"
            onClick={() => settle(index + 1)}
            disabled={index === cards.length - 1}
          />
        </div>
      </div>
    </div>
  )
}
