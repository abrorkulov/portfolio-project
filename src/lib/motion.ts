import type { Transition, Variants } from 'framer-motion'
import { getMotionTier } from './useMotionProfile'

/**
 * Shared motion vocabulary.
 *
 * Every section used to invent its own duration and easing, so the page felt
 * like several different sites stitched together — some things snapped, some
 * drifted. Everything now pulls from these tokens, which is what makes the
 * scroll read as one continuous piece.
 *
 * The vocabulary comes in two weights. `full` is the desktop performance:
 * longer travel, blur and clip-path reveals, generous staggers. `lite` is the
 * same choreography with the expensive parts removed — shorter distances, no
 * filter or clip-path animation (both force a repaint per frame, which is what
 * made phones stutter), tighter staggers so a list finishes before the reader
 * has scrolled past it.
 *
 * The weight is chosen once at import. Variant objects must keep a stable
 * identity for the life of the page — swapping them mid-session restarts every
 * animation that references them — so components that need a live value read
 * `useMotionProfile()` instead.
 */
const LITE = getMotionTier() === 'lite'

/** Custom cubic-beziers. `out` is the workhorse for entrances. */
export const ease = {
  /** Fast start, long gentle settle. Use for anything entering the viewport. */
  out: [0.22, 1, 0.36, 1],
  /** Symmetrical, for things that move and come back (hovers, toggles). */
  inOut: [0.65, 0, 0.35, 1],
  /** Slow, cinematic. Reserved for the hero. */
  slow: [0.16, 1, 0.3, 1],
  /** Overshoots a hair before settling. For things that should feel alive. */
  expressive: [0.34, 1.4, 0.64, 1],
} as const

export const spring = {
  /** Default for interactive feedback — settles without wobble. */
  snappy: { type: 'spring', stiffness: 400, damping: 32, mass: 0.7 },
  /** Looser, for larger elements where a little overshoot reads as weight. */
  soft: { type: 'spring', stiffness: 180, damping: 24, mass: 0.9 },
  /** For layout/shared-element transitions. */
  layout: { type: 'spring', stiffness: 320, damping: 34 },
  /** Long, low-frequency drift — pointer parallax and magnetic pulls. */
  drift: { type: 'spring', stiffness: 150, damping: 20, mass: 0.6 },
} satisfies Record<string, Transition>

/**
 * Shared viewport config. `amount` beats the old `margin` strings: it triggers
 * on a fraction of the element being visible, so tall blocks reveal as soon as
 * their top edge lands rather than waiting for an arbitrary pixel offset.
 *
 * Phones get a lower threshold across the board. A phone viewport is short
 * enough that waiting for 15% of a tall card leaves the reader looking at a
 * blank slot they have already scrolled to.
 */
export const inView = { once: true, amount: LITE ? 0.05 : 0.15 } as const

/** Looser trigger for tall sections that would otherwise reveal too late. */
export const inViewEarly = { once: true, amount: LITE ? 0.01 : 0.05 } as const

export const duration = {
  fast: LITE ? 0.2 : 0.25,
  base: LITE ? 0.36 : 0.5,
  slow: LITE ? 0.45 : 0.8,
  /** Hero-scale entrances only. */
  cinematic: LITE ? 0.6 : 1.1,
} as const

/** Travel distances. Phones move things a short way; desktop can be generous. */
export const travel = {
  sm: LITE ? 8 : 14,
  md: LITE ? 12 : 24,
  lg: LITE ? 16 : 40,
} as const

/** The standard entrance: rise and fade. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: travel.md },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.slow, ease: ease.out },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base, ease: ease.out } },
}

/** Slide in from the side — pair with `custom` of -1 (left) or 1 (right). */
export const slideIn: Variants = {
  hidden: (direction: number = 1) => ({
    opacity: 0,
    x: (LITE ? 14 : 28) * direction,
  }),
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.slow, ease: ease.out },
  },
}

/**
 * Rise out of a soft focus. The blur is the whole point of it and it is also
 * the expensive part — animating `filter` repaints the element every frame —
 * so on `lite` it degrades to a plain rise. Reserve it for a handful of
 * elements per page (headlines, section titles), never a grid.
 */
export const blurUp: Variants = {
  hidden: LITE
    ? { opacity: 0, y: travel.md }
    : { opacity: 0, y: travel.lg, filter: 'blur(14px)' },
  show: {
    opacity: 1,
    y: 0,
    ...(LITE ? {} : { filter: 'blur(0px)' }),
    transition: { duration: duration.cinematic, ease: ease.slow },
  },
}

/**
 * A line of type wiped upward from behind its own baseline. Needs a parent
 * with `overflow: hidden` (`.reveal-line` in index.css does this).
 */
export const lineReveal: Variants = {
  hidden: { y: LITE ? '60%' : '110%', opacity: LITE ? 0 : 1 },
  show: {
    y: '0%',
    opacity: 1,
    transition: { duration: duration.cinematic, ease: ease.slow },
  },
}

/** Grows into place. Good for tiles, badges and icon chips. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: LITE ? 0.97 : 0.9, y: travel.sm },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: duration.base,
      ease: LITE ? ease.out : ease.expressive,
    },
  },
}

/**
 * Cards arriving with a touch of rotation, as though settling onto the page.
 * The tilt is dropped on `lite` — a rotated layer cannot share the compositor
 * fast path with its neighbours and phones show it as a shimmer on the text.
 */
export const driftIn: Variants = {
  hidden: LITE
    ? { opacity: 0, y: travel.md }
    : { opacity: 0, y: travel.lg, rotate: -1.5, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: { duration: duration.slow, ease: ease.out },
  },
}

/**
 * Parent container that releases its children in sequence. Children only need
 * `variants={fadeUp}` — no per-item delay arithmetic, which is what made the
 * old staggers drift out of sync when list lengths changed.
 *
 * Staggers are compressed on `lite`. The same 0.09s gap that reads as a
 * cascade across a three-column desktop grid becomes a slow queue down a
 * one-column phone layout, where the last card lands long after the reader
 * has scrolled to it.
 */
export function staggerParent(stagger = 0.07, delayChildren = 0): Variants {
  const scale = LITE ? 0.55 : 1
  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren: stagger * scale,
        delayChildren: delayChildren * scale,
      },
    },
  }
}

/** Standard hover lift for cards. Flat on touch, where there is no hover. */
export const hoverLift = LITE
  ? {}
  : ({ y: -6, transition: spring.snappy } satisfies Transition & { y: number })

/**
 * Hover props for a card. Spreading this instead of hand-writing `whileHover`
 * keeps touch devices from mounting hover/tap gesture listeners they will
 * never use — Framer attaches pointer handlers per motion component, and a
 * grid of 41 of them is a measurable cost on a phone.
 */
export const liftOnHover = LITE
  ? {}
  : { whileHover: { y: -6 }, transition: spring.snappy }

/**
 * Drops hover gesture props on touch devices.
 *
 * A `whileHover` prop is not free: Framer attaches pointer listeners to the
 * component for it. A phone can never fire them, but it still pays for them —
 * and a grid of 41 skill cards was paying 41 times over. `whileTap` is left
 * alone, since a tap is real feedback on a touchscreen.
 */
export function hoverOnly<T extends object>(props: T): T | Record<string, never> {
  return LITE ? {} : props
}

/** True when the page is running the reduced vocabulary. */
export const isLiteMotion = LITE
