import type { Transition, Variants } from 'framer-motion'

/**
 * Shared motion vocabulary.
 *
 * Every section used to invent its own duration and easing, so the page felt
 * like several different sites stitched together — some things snapped, some
 * drifted. Everything now pulls from these tokens, which is what makes the
 * scroll read as one continuous piece.
 */

/** Custom cubic-beziers. `out` is the workhorse for entrances. */
export const ease = {
  /** Fast start, long gentle settle. Use for anything entering the viewport. */
  out: [0.22, 1, 0.36, 1],
  /** Symmetrical, for things that move and come back (hovers, toggles). */
  inOut: [0.65, 0, 0.35, 1],
  /** Slow, cinematic. Reserved for the hero. */
  slow: [0.16, 1, 0.3, 1],
} as const

export const spring = {
  /** Default for interactive feedback — settles without wobble. */
  snappy: { type: 'spring', stiffness: 400, damping: 32, mass: 0.7 },
  /** Looser, for larger elements where a little overshoot reads as weight. */
  soft: { type: 'spring', stiffness: 180, damping: 24, mass: 0.9 },
  /** For layout/shared-element transitions. */
  layout: { type: 'spring', stiffness: 320, damping: 34 },
} satisfies Record<string, Transition>

/**
 * Shared viewport config. `amount` beats the old `margin` strings: it triggers
 * on a fraction of the element being visible, so tall blocks reveal as soon as
 * their top edge lands rather than waiting for an arbitrary pixel offset.
 */
export const inView = { once: true, amount: 0.15 } as const

/** Looser trigger for tall sections that would otherwise reveal too late. */
export const inViewEarly = { once: true, amount: 0.05 } as const

export const duration = {
  fast: 0.25,
  base: 0.5,
  slow: 0.8,
} as const

/** The standard entrance: rise and fade. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
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
  hidden: (direction: number = 1) => ({ opacity: 0, x: 28 * direction }),
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.slow, ease: ease.out },
  },
}

/**
 * Parent container that releases its children in sequence. Children only need
 * `variants={fadeUp}` — no per-item delay arithmetic, which is what made the
 * old staggers drift out of sync when list lengths changed.
 */
export function staggerParent(stagger = 0.07, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  }
}

/** Standard hover lift for cards. */
export const hoverLift = {
  y: -6,
  transition: spring.snappy,
} satisfies Transition & { y: number }
