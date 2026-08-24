import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Code,
  Gamepad2,
  Rocket,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { timelineEvents } from '../data/content'

const iconMap: Record<string, LucideIcon> = {
  rocket: Rocket,
  code: Code,
  brain: Brain,
  gamepad: Gamepad2,
}

const ACCENTS = ['#5EEAD4', '#7DD3FC', '#A78BFA', '#FDBA74'] as const

type Stop = {
  key: string
  year: string
  tag: string
  title: string
  body: string
  Icon: LucideIcon
  accent: string
  isCoda: boolean
}

/**
 * The milestones, plus one closing plate. The coda is not a milestone — it is
 * the end of the deck, and it is what stops the sequence finishing on a card
 * that looks exactly like the three before it.
 */
const stops: Stop[] = [
  ...timelineEvents.map((event, index) => ({
    key: `${event.year}-${event.title}`,
    year: event.year,
    tag: event.tag,
    title: event.title,
    body: event.description,
    Icon: iconMap[event.icon] ?? Rocket,
    accent: ACCENTS[index % ACCENTS.length],
    isCoda: false,
  })),
  {
    key: 'now',
    year: 'now',
    tag: 'in progress',
    title: 'The next one is still being written',
    body: 'Three years in, and the interesting part is that the list is not finished. Whatever lands here next is currently a half-built branch and a lot of reading.',
    Icon: Sparkles,
    accent: '#5EEAD4',
    isCoda: true,
  },
]

const TOTAL = stops.length

/** Horizontal gap between neighbouring cards, in px before perspective. */
const SPREAD = 420
/** Degrees each card turns inward per step away from the front. */
const TILT = 32
/** How far back each step off-centre sits. */
const DEPTH = 300
/** Pixels of drag that equal one card. */
const DRAG_STEP = 300
/** A pointer that moved further than this was a drag, not a click. */
const CLICK_SLOP = 8

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value))

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * The learning journey, as a deck you flip through.
 *
 * The version before this one was scroll-driven: a ~500vh track with a pinned
 * stage, flying a camera down a corridor as the reader scrolled. The 3D was
 * right; hanging it off the scrollbar was not. It meant the reader could not
 * pass the section without playing the whole animation, could not step back
 * without scrolling up, and lost control of their own scrolling for five
 * screens. A section should not take the page hostage to introduce itself.
 *
 * So the scroll is gone and the depth stayed. Five milestones stand on an arc:
 * the front one square on and readable, its neighbours turned inward and set
 * back. Four things move the same spring — the arrows, the year buttons, the
 * left/right arrow keys, and dragging the deck sideways — and the section is
 * one screen tall, scrolling past like any other.
 *
 * `lite` never renders this; see `Journey.tsx`.
 */
export default function JourneyDeck() {
  const [active, setActive] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  /** How far the last pointer gesture travelled, so a drag is not read as a click. */
  const dragDistance = useRef(0)

  // The deck's position, in cards. Fractional while dragging. Everything on
  // screen is derived from this one value, so the whole deck stays in step and
  // nothing here goes through React state on a per-frame basis.
  const position = useMotionValue(0)

  const goTo = useCallback(
    (index: number) => {
      const next = clamp(Math.round(index), 0, TOTAL - 1)
      setActive(next)
      animate(position, next, {
        type: 'spring',
        stiffness: 130,
        damping: 20,
        mass: 0.7,
      })
    },
    [position],
  )

  // Drag to flip. Pointer capture keeps the gesture alive if the cursor leaves
  // the stage mid-drag, and the position is written straight to the motion
  // value — a drag that re-rendered React on every pointermove would be the
  // same mistake the particle field made before it was rewritten.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    let dragging = false
    let startX = 0
    let startPosition = 0

    const handleDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      dragging = true
      startX = event.clientX
      startPosition = position.get()
      dragDistance.current = 0
      // Throws if the pointer is no longer active by the time this runs.
      try {
        stage.setPointerCapture(event.pointerId)
      } catch {
        /* capture is a nicety; the gesture works without it */
      }
    }

    const handleMove = (event: PointerEvent) => {
      if (!dragging) return
      const dx = event.clientX - startX
      dragDistance.current = Math.abs(dx)
      // Half a card of overscroll at each end, so the deck has ends you can
      // feel rather than a value that silently stops moving.
      position.set(clamp(startPosition - dx / DRAG_STEP, -0.5, TOTAL - 0.5))
    }

    const handleUp = (event: PointerEvent) => {
      if (!dragging) return
      dragging = false
      if (stage.hasPointerCapture(event.pointerId)) {
        try {
          stage.releasePointerCapture(event.pointerId)
        } catch {
          /* already released */
        }
      }
      goTo(position.get())
    }

    stage.addEventListener('pointerdown', handleDown)
    stage.addEventListener('pointermove', handleMove)
    stage.addEventListener('pointerup', handleUp)
    stage.addEventListener('pointercancel', handleUp)

    return () => {
      stage.removeEventListener('pointerdown', handleDown)
      stage.removeEventListener('pointermove', handleMove)
      stage.removeEventListener('pointerup', handleUp)
      stage.removeEventListener('pointercancel', handleUp)
    }
  }, [goTo, position])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goTo(active - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      goTo(active + 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      goTo(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      goTo(TOTAL - 1)
    }
  }

  const current = stops[active]

  return (
    <div>
      <div
        className="relative mx-auto h-[clamp(400px,46vw,540px)] max-w-5xl select-none"
        role="group"
        aria-roledescription="carousel"
        aria-label="Learning journey milestones"
      >
        {/* Ambient light, tinted by the milestone at the front. Sibling of the
            stage, never a child: a plain child of a `preserve-3d` element sits
            at z:0 and would occlude every card behind it. */}
        <div
          aria-hidden="true"
          className="deck-glow"
          style={{ backgroundColor: current.accent }}
        />

        <div className="deck-viewport">
          <div
            ref={stageRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="deck-stage cursor-grab rounded-3xl active:cursor-grabbing"
          >
            {stops.map((stop, index) => (
              <DeckCard
                key={stop.key}
                stop={stop}
                index={index}
                isActive={index === active}
                isReachable={Math.abs(index - active) <= 2}
                position={position}
                onSelect={() => {
                  if (dragDistance.current > CLICK_SLOP) return
                  goTo(index)
                }}
              />
            ))}
          </div>
        </div>

        <div aria-hidden="true" className="deck-floor" />

        {/* Controls sit above the scene, outside the 3D context. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-2 sm:px-4">
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Previous milestone"
            className="deck-arrow pointer-events-auto"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            disabled={active === TOTAL - 1}
            aria-label="Next milestone"
            className="deck-arrow pointer-events-auto"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* The index: where you are, and every way to get somewhere else. */}
      <div className="mt-6 flex flex-col items-center gap-4">
        <nav
          aria-label="Journey milestones"
          className="flex items-center gap-1 rounded-full border border-white/10 bg-void/70 px-2 py-1.5"
        >
          {stops.map((stop, index) => {
            const isActive = index === active
            return (
              <button
                key={stop.key}
                type="button"
                onClick={() => goTo(index)}
                aria-current={isActive ? 'true' : undefined}
                className="relative grid min-h-[44px] place-items-center rounded-full px-4 font-mono text-[11px] transition-colors duration-300"
                style={{ color: isActive ? stop.accent : undefined }}
              >
                {isActive && (
                  <motion.span
                    layoutId="deckStation"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: `${stop.accent}1a`,
                      boxShadow: `inset 0 0 0 1px ${stop.accent}55`,
                    }}
                    transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                  />
                )}
                <span
                  className={
                    'relative z-10 tabular-nums ' +
                    (isActive ? '' : 'text-ink-faint hover:text-ink-muted')
                  }
                >
                  {stop.year}
                </span>
              </button>
            )
          })}
        </nav>

        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-faint">
          <span className="tabular-nums text-ink-muted">{pad(active + 1)}</span>
          <span>/</span>
          <span className="tabular-nums">{pad(TOTAL)}</span>
          <span aria-hidden="true" className="mx-1 h-3 w-px bg-white/15" />
          drag, click or use the arrow keys
        </p>
      </div>
    </div>
  )
}

/**
 * One card on the arc, plus the year standing behind it.
 *
 * Every transform reads the deck's position directly, so a drag moves all five
 * cards on the compositor with no React render in between. `isActive` and
 * `isReachable` are the only React inputs, and both only change when the deck
 * settles on a new card.
 */
function DeckCard({
  stop,
  index,
  isActive,
  isReachable,
  position,
  onSelect,
}: {
  stop: Stop
  index: number
  isActive: boolean
  isReachable: boolean
  position: MotionValue<number>
  onSelect: () => void
}) {
  /** Signed distance from the front of the deck, in cards. */
  const offset = (value: number) => clamp(index - value, -3, 3)

  const x = useTransform(position, (value) => offset(value) * SPREAD)
  const rotateY = useTransform(position, (value) => offset(value) * TILT)
  const z = useTransform(position, (value) => -Math.abs(offset(value)) * DEPTH)
  const opacity = useTransform(position, (value) =>
    Math.max(0, 1 - Math.abs(index - value) / 2.6),
  )

  // The year sits well behind its card and drifts more slowly, which is what
  // separates the two planes as the deck turns.
  const yearX = useTransform(position, (value) => offset(value) * 170)
  const yearOpacity = useTransform(position, (value) =>
    Math.max(0, 0.55 - Math.abs(index - value) * 0.55),
  )

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="deck-layer pointer-events-none"
        style={{ x: yearX, y: -180, z: -620, opacity: yearOpacity }}
      >
        <span
          className="deck-year"
          style={{
            color: 'transparent',
            backgroundImage: `linear-gradient(165deg, ${stop.accent}, rgba(230,237,243,0.22))`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          {stop.year}
        </span>
      </motion.div>

      <motion.div
        className="deck-layer"
        style={{
          x,
          z,
          rotateY,
          opacity,
          // A card that has faded out must not keep swallowing clicks meant
          // for the one in front of it.
          pointerEvents: isReachable ? 'auto' : 'none',
        }}
      >
        <article
          onClick={isActive ? undefined : onSelect}
          aria-current={isActive ? 'true' : undefined}
          className={
            'deck-card ' + (isActive ? '' : 'deck-card-idle')
          }
          style={
            {
              '--ring': `${stop.accent}${isActive ? '4d' : '24'}`,
              '--glow': `${stop.accent}${isActive ? '33' : '00'}`,
            } as CSSProperties
          }
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border"
                style={{
                  borderColor: `${stop.accent}44`,
                  backgroundColor: `${stop.accent}16`,
                }}
              >
                <stop.Icon
                  className="h-5 w-5"
                  style={{ color: stop.accent }}
                  aria-hidden="true"
                />
              </span>
              <span className="truncate font-mono text-[10px] uppercase tracking-[0.24em] text-ink-faint">
                {stop.isCoda ? 'coda' : pad(index + 1)} · {stop.tag}
              </span>
            </div>

            <span
              className="display-numeral shrink-0 text-4xl"
              style={{ color: stop.accent }}
            >
              {stop.year}
            </span>
          </div>

          <h3 className="mt-5 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
            {stop.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
            {stop.body}
          </p>
        </article>
      </motion.div>
    </>
  )
}
