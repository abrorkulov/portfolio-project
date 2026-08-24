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

/**
 * How far the deck spreads, in px before perspective.
 *
 * These have to scale with the viewport. Tuned only for a desktop, a phone
 * puts the neighbouring cards completely off screen — the deck stops reading
 * as a deck and becomes one card with nothing either side of it, which is
 * most of what made it worth building.
 */
type Metrics = {
  /** Horizontal gap between neighbouring cards. */
  spread: number
  /** How far back each step off-centre sits. */
  depth: number
  /** Degrees each card turns inward per step. */
  tilt: number
  /** Pixels of drag that equal one card. */
  dragStep: number
}

const PHONE: Metrics = { spread: 290, depth: 200, tilt: 26, dragStep: 180 }
const TABLET: Metrics = { spread: 360, depth: 250, tilt: 30, dragStep: 240 }
const DESKTOP: Metrics = { spread: 420, depth: 300, tilt: 32, dragStep: 300 }

function metricsFor(width: number): Metrics {
  if (width < 640) return PHONE
  if (width < 1024) return TABLET
  return DESKTOP
}

/**
 * The three sets are module constants, so an identity check is enough to tell
 * whether a resize actually crossed a breakpoint. Without it, every pixel of a
 * window drag would hand the deck a new object and re-render all five cards.
 */
function useDeckMetrics(): Metrics {
  const [metrics, setMetrics] = useState<Metrics>(() =>
    metricsFor(typeof window === 'undefined' ? 1280 : window.innerWidth),
  )

  useEffect(() => {
    const evaluate = () =>
      setMetrics((previous) => {
        const next = metricsFor(window.innerWidth)
        return next === previous ? previous : next
      })

    evaluate()
    window.addEventListener('resize', evaluate)
    return () => window.removeEventListener('resize', evaluate)
  }, [])

  return metrics
}

/**
 * Read once, and deliberately not from the motion tier.
 *
 * The tier treats every phone as `lite`, which is right for the rest of the
 * page and wrong here: the deck's movement is the section. What genuinely
 * should not move is a deck belonging to someone who asked their OS to stop
 * animations, and that is a different question from which device they are on.
 */
const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const TRAVEL = PREFERS_REDUCED_MOTION
  ? { duration: 0 }
  : { type: 'spring' as const, stiffness: 130, damping: 20, mass: 0.7 }

/** A pointer that moved further than this was a drag, not a click. */
const CLICK_SLOP = 8

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value))

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * The learning journey, as a deck you flip through.
 *
 * Two earlier versions are worth knowing about, because both are the obvious
 * thing to reach for again:
 *
 * - It was scroll-driven once: a ~500vh track with a pinned stage flying a
 *   camera down a corridor. The 3D was right, hanging it off the scrollbar was
 *   not — the reader could not pass the section without playing the whole
 *   animation, nor step back without scrolling up. **Do not reintroduce a
 *   scroll-linked stage here.**
 * - It was desktop-only once, with a flat rail rendered on `lite`. That meant
 *   the section a phone saw was a different section from the one anyone had
 *   been shown, which is exactly what a visitor on a phone noticed and asked
 *   about. There is one version now, at every width.
 *
 * Five milestones stand on an arc: the front one square on and readable, its
 * neighbours turned inward and set back. Four things move the same spring —
 * the arrows, the year buttons, the left/right arrow keys, and dragging the
 * deck sideways.
 */
export default function JourneyDeck() {
  const [active, setActive] = useState(0)
  const stageRef = useRef<HTMLDivElement>(null)
  /** How far the last pointer gesture travelled, so a drag is not read as a click. */
  const dragDistance = useRef(0)
  const metrics = useDeckMetrics()

  // The deck's position, in cards. Fractional while dragging. Everything on
  // screen is derived from this one value, so the whole deck stays in step and
  // nothing here goes through React state on a per-frame basis.
  const position = useMotionValue(0)

  const goTo = useCallback(
    (index: number) => {
      const next = clamp(Math.round(index), 0, TOTAL - 1)
      setActive(next)
      animate(position, next, TRAVEL)
    },
    [position],
  )

  // Drag to flip — a swipe on a phone, a click-drag on a desktop, one code
  // path for both. `touch-action: pan-y` on the stage is what keeps vertical
  // scrolling with the browser while the horizontal axis comes to us.
  //
  // Pointer capture keeps the gesture alive if the pointer leaves the stage
  // mid-drag, and the position is written straight to the motion value — a
  // drag that re-rendered React on every pointermove would be the same mistake
  // the particle field made before it was rewritten.
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
      position.set(
        clamp(startPosition - dx / metrics.dragStep, -0.5, TOTAL - 0.5),
      )
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
  }, [goTo, position, metrics.dragStep])

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
        className="relative mx-auto h-[clamp(430px,64vw,540px)] max-w-5xl select-none"
        role="group"
        aria-roledescription="carousel"
        aria-label="Learning journey milestones"
      >
        {/* Ambient light, tinted by the milestone at the front. A sibling of
            the stage, never a child: a plain child of a `preserve-3d` element
            sits at z:0 and would occlude every card behind it.

            The soft falloff is a gradient rather than `filter: blur()`. A 90px
            blur re-rasterises a 700x400 surface every time the accent changes,
            and a mid-range phone is the wrong place to ask for that. */}
        <div
          aria-hidden="true"
          className="deck-glow"
          style={{
            background: `radial-gradient(closest-side, ${current.accent}, ${current.accent}66 44%, transparent 78%)`,
          }}
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
                metrics={metrics}
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
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-1 sm:px-4">
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
          className="scrollbar-none flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-void/70 px-2 py-1.5"
        >
          {stops.map((stop, index) => {
            const isActive = index === active
            return (
              <button
                key={stop.key}
                type="button"
                onClick={() => goTo(index)}
                aria-current={isActive ? 'true' : undefined}
                className="relative grid min-h-[44px] shrink-0 place-items-center rounded-full px-3.5 font-mono text-[11px] transition-colors duration-300 sm:px-4"
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

        <p className="flex items-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-ink-faint">
          <span className="tabular-nums text-ink-muted">{pad(active + 1)}</span>
          <span>/</span>
          <span className="tabular-nums">{pad(TOTAL)}</span>
          <span aria-hidden="true" className="mx-1 h-3 w-px bg-white/15" />
          drag &middot; tap a year &middot; &larr;/&rarr;
        </p>
      </div>
    </div>
  )
}

/**
 * One card on the arc, plus the year standing behind it.
 *
 * Every transform reads the deck's position directly, so a drag moves all five
 * cards on the compositor with no React render in between. `isActive`,
 * `isReachable` and `metrics` are the only React inputs, and none of them
 * change during a gesture.
 */
function DeckCard({
  stop,
  index,
  isActive,
  isReachable,
  position,
  metrics,
  onSelect,
}: {
  stop: Stop
  index: number
  isActive: boolean
  isReachable: boolean
  position: MotionValue<number>
  metrics: Metrics
  onSelect: () => void
}) {
  /** Signed distance from the front of the deck, in cards. */
  const offset = (value: number) => clamp(index - value, -3, 3)

  const x = useTransform(position, (value) => offset(value) * metrics.spread)
  const rotateY = useTransform(position, (value) => offset(value) * metrics.tilt)
  const z = useTransform(
    position,
    (value) => -Math.abs(offset(value)) * metrics.depth,
  )
  const opacity = useTransform(position, (value) =>
    Math.max(0, 1 - Math.abs(index - value) / 2.6),
  )

  // The year sits well behind its card and drifts more slowly, which is what
  // separates the two planes as the deck turns.
  const yearX = useTransform(
    position,
    (value) => offset(value) * (metrics.spread * 0.4),
  )
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
          // A card that has faded out must not keep swallowing taps meant for
          // the one in front of it.
          pointerEvents: isReachable ? 'auto' : 'none',
        }}
      >
        <article
          onClick={isActive ? undefined : onSelect}
          aria-current={isActive ? 'true' : undefined}
          className={'deck-card ' + (isActive ? '' : 'deck-card-idle')}
          style={
            {
              '--ring': `${stop.accent}${isActive ? '4d' : '24'}`,
              '--glow': `${stop.accent}${isActive ? '33' : '00'}`,
            } as CSSProperties
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border sm:h-11 sm:w-11"
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
              <span className="truncate font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint sm:text-[10px] sm:tracking-[0.24em]">
                {stop.isCoda ? 'coda' : pad(index + 1)} · {stop.tag}
              </span>
            </div>

            <span
              className="display-numeral shrink-0 text-3xl sm:text-4xl"
              style={{ color: stop.accent }}
            >
              {stop.year}
            </span>
          </div>

          <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-ink sm:mt-5 sm:text-2xl">
            {stop.title}
          </h3>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-muted sm:mt-3 sm:text-[15px]">
            {stop.body}
          </p>
        </article>
      </motion.div>
    </>
  )
}
