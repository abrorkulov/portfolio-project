/**
 * The page's section registry — the single source of truth for what sections
 * exist, what order they are in, what they are called, and what number they
 * wear.
 *
 * Before this file, that information lived in four places at once: the link
 * array in `Navbar`, the label array in `ScrollProgress`, a hardcoded
 * `index="03"` string on every `SectionHeader`, and a hand-rolled "07" in the
 * contact footer. Adding a section in the middle of the page meant editing all
 * four and renumbering by hand, and nothing anywhere would tell you if you got
 * it wrong — the page would just quietly show two `04`s, or a rail entry
 * pointing at an id that no longer existed.
 *
 * Now the order of the array below *is* the order of the page, the numbers are
 * derived from it, and `SectionId` is a closed union — so a typo in a nav link
 * or a scroll-spy id is a type error rather than a dead anchor.
 */

export type SectionId =
  | 'top'
  | 'about'
  | 'journey'
  | 'skills'
  | 'ai'
  | 'playground'
  | 'projects'
  | 'contact'

type SectionDef = {
  id: SectionId
  /** Lowercase label for the navbar; title-cased automatically for the rail. */
  label: string
  /** Numbered sections carry an `01`-style index in their header. */
  numbered: boolean
  /** Appears in the navbar's primary link list. */
  nav: boolean
  /** Appears in the left-hand scroll rail. */
  rail: boolean
}

/** Page order. Everything else in this file is derived from it. */
const SECTIONS = [
  { id: 'top', label: 'home', numbered: false, nav: false, rail: false },
  { id: 'about', label: 'about', numbered: true, nav: true, rail: true },
  { id: 'journey', label: 'journey', numbered: true, nav: true, rail: true },
  { id: 'skills', label: 'skills', numbered: true, nav: true, rail: true },
  { id: 'ai', label: 'ai', numbered: true, nav: true, rail: true },
  { id: 'playground', label: 'playground', numbered: true, nav: true, rail: true },
  { id: 'projects', label: 'projects', numbered: true, nav: true, rail: true },
  // Reached by the navbar's "connect" button and the floating action button
  // rather than a nav link, but it is still a stop on the rail.
  { id: 'contact', label: 'contact', numbered: true, nav: false, rail: true },
] as const satisfies readonly SectionDef[]

export type Section = (typeof SECTIONS)[number]

/**
 * Two-digit index for a section's header, derived from its position among the
 * numbered sections. `SectionHeader` reads this itself, so a section can never
 * disagree with the page about what number it is.
 */
const INDEX_BY_ID = new Map<SectionId, string>(
  SECTIONS.filter((section) => section.numbered).map((section, i) => [
    section.id,
    String(i + 1).padStart(2, '0'),
  ]),
)

export function sectionIndex(id: SectionId): string | undefined {
  return INDEX_BY_ID.get(id)
}

/** Title Case for the rail, which reads as a table of contents. */
const titleCase = (label: string) =>
  label === 'ai' ? 'AI' : label[0].toUpperCase() + label.slice(1)

export const navSections = SECTIONS.filter((section) => section.nav).map(
  (section) => ({ id: section.id, label: section.label, href: `#${section.id}` }),
)

export const railSections = SECTIONS.filter((section) => section.rail).map(
  (section) => ({ id: section.id, label: titleCase(section.label) }),
)

/**
 * Ids the scroll spy watches. The hero is excluded deliberately: it has no nav
 * link and no rail entry, so highlighting it would light nothing up while
 * un-highlighting whatever was active.
 */
export const spyIds: SectionId[] = SECTIONS.filter(
  (section) => section.nav || section.rail,
).map((section) => section.id)
