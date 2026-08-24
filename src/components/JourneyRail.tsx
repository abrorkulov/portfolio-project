import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Brain, Code, Gamepad2, Rocket, type LucideIcon } from 'lucide-react'
import { timelineEvents } from '../data/content'

type TimelineEvent = (typeof timelineEvents)[number]

const iconMap: Record<string, LucideIcon> = {
  rocket: Rocket,
  code: Code,
  brain: Brain,
  gamepad: Gamepad2,
}

/**
 * One accent per milestone, walked in order rather than stored in the data.
 * The point of the colour is that the rail changes hue as you descend it, so
 * it belongs to the layout — adding a fifth milestone should not also mean
 * picking a fifth colour by hand.
 */
const ACCENTS = ['#5EEAD4', '#7DD3FC', '#A78BFA', '#FDBA74'] as const
const accentFor = (index: number) => ACCENTS[index % ACCENTS.length]

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * The flat learning journey: a spine with a station per milestone.
 *
 * This is what `lite` gets — phones, narrow windows, low-memory machines and
 * anyone who has asked their OS for reduced motion. `JourneyDeck` is the
 * desktop performance; the two are separate components rather than one
 * component with branches because they are genuinely different layouts, and
 * because everything below has to be able to render with no motion system at
 * all. There is deliberately not a single Framer component in this file: on
 * this tier every variant collapses to an empty pair anyway, so the only
 * thing importing them would buy is a variant tree for Framer to walk.
 *
 * The year panel only appears from `lg`, where there is a second column to
 * pin it to. Below that, each card carries its own year.
 */
export default function JourneyRail() {
  const cardRefs = useRef<(HTMLLIElement | null)[]>([])
  const [active, setActive] = useState(0)

  // Which milestone the reader is level with. IntersectionObserver rather than
  // a scroll handler, for the same reason `useScrollSpy` is: reading offsets
  // mid-scroll forces a synchronous layout flush on every event.
  useEffect(() => {
    const cards = cardRefs.current.filter(
      (card): card is HTMLLIElement => card !== null,
    )
    if (cards.length === 0) return

    const inBand = new Set<number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = cards.indexOf(entry.target as HTMLLIElement)
          if (index === -1) continue
          if (entry.isIntersecting) inBand.add(index)
          else inBand.delete(index)
        }

        // Furthest down the page wins. When the band falls in the gap between
        // two cards the previous answer stands, rather than the panel blanking.
        let next = -1
        for (const index of inBand) if (index > next) next = index
        if (next !== -1) setActive(next)
      },
      { rootMargin: '-38% 0px -42% 0px', threshold: 0 },
    )

    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [])

  const goTo = (index: number) =>
    cardRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="hidden lg:col-span-4 lg:block">
        <YearPanel active={active} onSelect={goTo} />
      </div>

      <div className="relative lg:col-span-8">
        <span
          aria-hidden="true"
          className="journey-spine absolute left-4 top-0 h-full w-px sm:left-6"
        />

        <ol className="space-y-5 sm:space-y-8">
          {timelineEvents.map((event, index) => (
            <MilestoneCard
              key={`${event.year}-${event.title}`}
              event={event}
              index={index}
              isActive={index === active}
              innerRef={(node) => {
                cardRefs.current[index] = node
              }}
            />
          ))}
        </ol>

        {/* The rail does not end at the last card — it ends at now. */}
        <div className="relative mt-5 pl-11 sm:mt-8 sm:pl-16">
          <span
            aria-hidden="true"
            className="absolute left-4 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-signal sm:left-6"
          />
          <p className="font-mono text-[11px] text-ink-faint sm:text-xs">
            <span className="text-signal">now</span> — the next one is still
            being written
          </p>
        </div>
      </div>
    </div>
  )
}

function YearPanel({
  active,
  onSelect,
}: {
  active: number
  onSelect: (index: number) => void
}) {
  const event = timelineEvents[active]
  const accent = accentFor(active)

  return (
    <div className="sticky top-32">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
        milestone{' '}
        <span className="tabular-nums text-ink">{pad(active + 1)}</span>
        <span className="px-1">/</span>
        <span className="tabular-nums">{pad(timelineEvents.length)}</span>
      </p>

      <div className="relative mt-5">
        <p
          className="display-numeral text-[clamp(4rem,7vw,6.5rem)]"
          style={{
            backgroundImage: `linear-gradient(150deg, ${accent}, #E6EDF3 135%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {event.year}
        </p>

        <div className="mt-4">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.22em]"
            style={{ color: accent }}
          >
            {event.tag}
          </p>
          <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-ink">
            {event.title}
          </h3>
        </div>
      </div>

      {/* An index of the whole rail, and the way to jump around it. */}
      <ol className="mt-7 border-t border-white/[0.07] pt-2">
        {timelineEvents.map((milestone, index) => {
          const isActive = index === active
          return (
            <li key={`${milestone.year}-${milestone.title}`}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={isActive ? 'step' : undefined}
                className="group flex min-h-[44px] w-full items-center gap-3 text-left"
              >
                <span
                  aria-hidden="true"
                  className="h-px shrink-0"
                  style={{
                    width: isActive ? 32 : 16,
                    backgroundColor: isActive
                      ? accentFor(index)
                      : 'rgba(255,255,255,0.22)',
                  }}
                />
                <span
                  className={
                    'font-mono text-[11px] ' +
                    (isActive ? 'text-ink' : 'text-ink-faint')
                  }
                >
                  <span className="tabular-nums">{milestone.year}</span>
                  <span className="px-2 text-ink-faint/60">·</span>
                  {milestone.tag}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function MilestoneCard({
  event,
  index,
  isActive,
  innerRef,
}: {
  event: TimelineEvent
  index: number
  isActive: boolean
  innerRef: (node: HTMLLIElement | null) => void
}) {
  const Icon = iconMap[event.icon] ?? Rocket
  const accent = accentFor(index)

  return (
    <li ref={innerRef} className="relative pl-11 sm:pl-16">
      {/* The station on the rail, lit when its card is the one in view. */}
      <span
        aria-hidden="true"
        className="absolute left-4 top-8 grid h-4 w-4 -translate-x-1/2 place-items-center sm:left-6"
      >
        <span
          className="absolute h-4 w-4 rounded-full"
          style={{ backgroundColor: accent, opacity: isActive ? 0.24 : 0.1 }}
        />
        <span
          className="relative rounded-full"
          style={
            {
              backgroundColor: accent,
              width: isActive ? 9 : 6,
              height: isActive ? 9 : 6,
            } as CSSProperties
          }
        />
      </span>

      <div className="glass-card rounded-3xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border"
              style={{
                borderColor: `${accent}40`,
                backgroundColor: `${accent}14`,
              }}
            >
              <Icon
                className="h-5 w-5"
                style={{ color: accent }}
                aria-hidden="true"
              />
            </span>
            <span className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
              {pad(index + 1)} · {event.tag}
            </span>
          </div>

          <span
            className="display-numeral shrink-0 text-3xl opacity-80 sm:text-4xl"
            style={{ color: accent }}
          >
            {event.year}
          </span>
        </div>

        <h3 className="mt-4 font-display text-lg font-semibold text-ink sm:text-xl">
          {event.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-[15px]">
          {event.description}
        </p>
      </div>
    </li>
  )
}
