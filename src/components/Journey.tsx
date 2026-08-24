import SectionHeader from './SectionHeader'
import JourneyDeck from './JourneyDeck'

/**
 * The learning journey, section 02.
 *
 * One implementation, at every screen size. It used to branch on the motion
 * tier — a 3D deck on desktop, a flat spine on `lite` — and that was a
 * mistake: a visitor on a phone was shown a different section from the one
 * everyone else saw, and noticed. The tier is the right tool for deciding how
 * *much* a thing moves, not for deciding whether a section exists.
 *
 * `JourneyDeck` handles the width difference itself, by scaling how far the
 * deck spreads rather than by swapping layouts, and it honours
 * `prefers-reduced-motion` on its own — see the note above `TRAVEL` there for
 * why that is a separate question from the tier.
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
          description="Four milestones between 2023 and now. Flip through the deck — drag it, tap a card, or use the arrow keys."
        />

        <JourneyDeck />
      </div>
    </section>
  )
}
