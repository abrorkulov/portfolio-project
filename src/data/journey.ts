import type { TechName } from '@/shared/lib/techMeta'

/** Icon key for a station. A closed union, so the icon map cannot miss a case. */
export type JourneyIcon = 'rocket' | 'gamepad' | 'code' | 'brain' | 'flag'

/**
 * One station on the line.
 *
 * The section is a train journey: the reader scrolls, the train runs along the
 * track, and each station is a year. `picked` is what was loaded aboard there —
 * the technologies learned at that stop — so the train is visibly carrying more
 * by the end of the line than it was at the first platform.
 *
 * Typing `picked` as `TechName` guarantees every badge has a brand colour and a
 * monogram, since the same names drive the icons in the station cards.
 */
export type JourneyStep = {
  year: string
  /** Short label painted on the platform sign in the 3D scene. Keep it tiny. */
  station: string
  title: string
  description: string
  icon: JourneyIcon
  picked: readonly TechName[]
  /**
   * A station the train has not reached yet.
   *
   * The last stop is forward-looking rather than historical, and it is rendered
   * differently — dimmed, dashed, labelled "next stop". Keeping it flagged in
   * the data means nothing in the UI can accidentally present an intention as
   * something that already happened.
   */
  upcoming?: boolean
}

export const journeySteps: readonly JourneyStep[] = [
  {
    year: '2023',
    station: 'START',
    title: 'The first station: markup and nerve',
    description:
      'Enrolled at MARS IT School (Sergeli) for frontend development, and started English at Cambridge Learning Center alongside it. Nothing I built that year survived — which is rather the point of a first stop.',
    icon: 'rocket',
    picked: ['HTML5', 'CSS3', 'JavaScript'],
  },
  {
    year: '2025',
    station: 'DEPTH',
    title: 'Going down a layer',
    description:
      'Built a custom client for Counter-Strike 2 — memory layout, process architecture, and a lot of C++ read very slowly. It taught me what a program actually is, which changed how I write the ones with buttons.',
    icon: 'gamepad',
    picked: ['C++', 'Reverse Engineering', 'Windows Internals'],
  },
  {
    year: '2025',
    station: 'SHIP',
    title: 'React, then a real product',
    description:
      'Finished React and JavaScript mastery, then co-founded adblogger.uz with my study group — the first thing I built that had users who were not me, and the first time shipping mattered more than being clever.',
    icon: 'code',
    picked: ['React', 'TypeScript', 'Tailwind CSS'],
  },
  {
    year: '2026',
    station: 'SCALE',
    title: 'Full-stack, with AI in the loop',
    description:
      "AI Engineering at Najot Ta'lim (Chilonzor), IELTS 5.5, and the stack widened to the whole product — Next.js and Express over Prisma, with Claude Code as the tool I architect and refactor in.",
    icon: 'brain',
    picked: ['Next.js', 'Prisma', 'Claude Code', 'PostgreSQL'],
  },
  {
    year: 'Next',
    station: 'NEXT',
    title: 'Where the line goes',
    description:
      'Maktab AI into real classrooms, deeper into the systems layer, and building things that outlast the tutorial that taught me. The track is already laid — this is just the next platform on it.',
    icon: 'flag',
    picked: [],
    upcoming: true,
  },
]
