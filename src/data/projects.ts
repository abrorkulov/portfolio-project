import type { TechName } from '@/shared/lib/techMeta'

/** Closed unions: the icon and badge maps are exhaustive by construction. */
export type ProjectTag =
  | 'ai_edtech'
  | 'startup'
  | 'platform'
  | 'web_app'
  | 'marketplace'
  | 'systems'

export type ProjectStatus = 'shipped' | 'in_progress'

export type Project = {
  title: string
  description: string
  stack: readonly TechName[]
  tag: ProjectTag
  status: ProjectStatus
  /** Live URL, when there is one to point at. */
  href?: string
  /** Shown under the title — what the work actually was. */
  role?: string
}

export const projects: readonly Project[] = [
  {
    title: 'Maktab AI',
    description:
      'An AI platform for private schools — lessons, assignments and student progress in one place, with a model in the loop that explains a wrong answer instead of just marking it. The largest thing I have architected end to end.',
    stack: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Tailwind CSS'],
    tag: 'ai_edtech',
    status: 'in_progress',
    role: 'Architecture, full stack',
  },
  {
    title: 'adblogger.uz',
    description:
      'A startup co-founded with my study group, and the first product I shipped to people who were not me. Advertising and blogger discovery for the Uzbek market — built, launched and maintained by a team of students.',
    stack: ['React', 'TypeScript', 'Node.js', 'Express.js', 'MySQL'],
    tag: 'startup',
    status: 'shipped',
    href: 'https://adblogger.uz',
    role: 'Co-founder, frontend lead',
  },
  {
    title: 'FarmPlatform',
    description:
      'A management platform for agricultural operations — inventory, cycles and reporting modelled properly in a relational schema instead of the spreadsheet it replaced. Most of the work was in the data model, not the screens.',
    stack: ['React', 'Node.js', 'Prisma', 'PostgreSQL'],
    tag: 'platform',
    status: 'shipped',
    role: 'Full stack',
  },
  {
    title: 'Job-Finder',
    description:
      'A job board with search, filtering and applications: typed API, indexed queries and a listing feed that stays fast as the table grows. Built to find out where a naive query starts to hurt, and how to fix it.',
    stack: ['Next.js', 'TypeScript', 'Prisma', 'MySQL'],
    tag: 'web_app',
    status: 'shipped',
    role: 'Full stack',
  },
  {
    title: 'Sotuv-Sayt',
    description:
      'Sell Your Thing — a classifieds marketplace where anyone can list an item, browse by category and message a seller. Image handling and the listing lifecycle turned out to be the hard parts, not the catalogue.',
    stack: ['React', 'Express.js', 'MongoDB', 'Tailwind CSS'],
    tag: 'marketplace',
    status: 'shipped',
    role: 'Full stack',
  },
  {
    title: 'Systems & Reverse Engineering',
    description:
      'Ongoing low-level research in C++: memory utilities for Counter-Strike 2, process and module walking, and reading how a running program lays itself out. Where I go when I want to understand something rather than ship it.',
    stack: ['C++', 'Windows Internals', 'Reverse Engineering'],
    tag: 'systems',
    status: 'in_progress',
    role: 'Personal research',
  },
]
