import SectionHeader from './SectionHeader'
import JourneyRail from './JourneyRail'
import JourneyDeck from './JourneyDeck'
import { isLiteMotion } from '../lib/motion'

/**
 * The learning journey, section 02.
 *
 * Two implementations, and the motion tier picks one:
 *
 * - `full` — `JourneyDeck`. Five milestones standing on a 3D arc: the front
 *   one square on and readable, its neighbours turned inward and set back.
 *   Arrows, the year buttons, the arrow keys and a sideways drag all move the
 *   same spring.
 * - `lite` — `JourneyRail`. A flat spine with a station per milestone and no
 *   animation of any kind. Phones, narrow windows, low-memory machines and
 *   reduced-motion visitors get this.
 *
 * There was a scroll-driven version in between — a ~500vh track with a pinned
 * stage flying a camera down a corridor. It is worth knowing why it is gone,
 * because it is the obvious thing to reach for again: hanging a scene off the
 * scrollbar means the reader cannot get past the section without playing the
 * whole animation, cannot step back a milestone without scrolling up, and
 * loses control of their own scrolling for five screens. The depth was the
 * good part; the scroll binding was not. **Do not reintroduce a scroll-linked
 * stage in this section.**
 *
 * Both versions are one screen tall and scroll past like any other section.
 */
export default function Journey() {
  return (
    <section
      id="trajectory"
      className="section-rule relative py-16 sm:py-24 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="dot-grid absolute inset-0 opacity-40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          index="02"
          eyebrow="my_learning_journey"
          title={
            <>
              How I got here,{' '}
              <span className="accent-em text-gradient">year by year</span>
            </>
          }
          description={
            isLiteMotion
              ? 'Four milestones between 2023 and now — the courses, the builds, and the turns that changed what I work on.'
              : 'Four milestones between 2023 and now. Flip through the deck — drag it, click a card, or use the arrow keys.'
          }
        />

        {isLiteMotion ? <JourneyRail /> : <JourneyDeck />}
      </div>
    </section>
  )
}
