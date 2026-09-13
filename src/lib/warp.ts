import gsap from 'gsap'

/**
 * How hard the snow is being pulled past the camera right now: 0 at rest, 1
 * at the peak of a page change.
 *
 * A plain module-level object, read by the render loop and written by a tween.
 * It deliberately never touches React — this changes on every frame of a
 * transition, and a state update per frame would re-render the whole tree
 * underneath an animation whose entire job is to stay smooth.
 */
export const warp = { value: 0 }

/** Kicks the field into a short surge. Called once per page change, and
    once, longer, when the site first opens. */
export function pulseWarp(duration = 1.35) {
  gsap.killTweensOf(warp)
  gsap.fromTo(warp, { value: 1 }, { value: 0, duration, ease: 'power3.out' })
}
