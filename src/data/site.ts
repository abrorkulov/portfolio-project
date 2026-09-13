/**
 * Every string on the site lives here so the pages stay presentational.
 *
 * One page per screen, in this order. The ids are the URL hashes.
 */

export const pages = [
  { id: 'home', label: 'home' },
  { id: 'about', label: 'about' },
  { id: 'study', label: 'study' },
  { id: 'stack', label: 'stack' },
  { id: 'contact', label: 'contact' },
] as const

export const corners = {
  /** Top-left of every page. The only place the full name appears. */
  name: 'jahongir abrorkulov',
}

export const meta = {
  /** The tab title on the front page. Must match the <title> in index.html
      so nothing flickers between the HTML and the first render. */
  title: 'Jahongir Abrorkulov - Hello :)',
  /** The other pages put their label first, so five open tabs can be told
      apart by their first word. */
  pageTitle: (label: string) => `${label} — Jahongir Abrorkulov`,
}

export const home = {
  /** Typed one character at a time, in the script face, very large. */
  greeting: 'Hello',
  smile: ':)',
  /** What the smile turns into under the pointer. */
  wink: ';)',
  /** Three words under the button, so a stranger knows what this is. */
  tagline: 'frontend · backend · ai',
  cta: 'press me !',
}

export const about = {
  /** Typed line by line. Short on purpose. */
  lines: [
    'Hi — my name is Jahongir.',
    "I'm 15, and I live in Tashkent.",
    'I build for the web: frontend, backend and AI.',
    'I like knowing how things work underneath.',
  ],
  next: 'next',
}

export type StudyCard = {
  id: string
  kicker: string
  title: string
  place: string
  body: string
}

/**
 * No dates anywhere. The question these answer is *where*, and a year column
 * only invited the reader to audit a timeline that is not the point.
 */
export const study: StudyCard[] = [
  {
    id: 'cambridge',
    kicker: 'english',
    title: 'Cambridge Learning Center',
    place: 'Tashkent — Sergeli',
    body:
      'I study English at Cambridge Learning Center, Sergeli branch. The course is communicative: grammar, reading and writing, with a lot of actual speaking. English is not a checkbox for me — documentation, articles and other people’s source code are almost always written in it, and it makes talking to people in this industry far easier. I read technical material comfortably now and hold a conversation without thinking about it.',
  },
  {
    id: 'najot',
    kicker: 'ai engineering',
    title: "Najot Ta'lim",
    place: 'Tashkent — Chilonzor',
    body:
      'At Najot Ta’lim I am on the AI Engineering track. I am learning how large language models behave from the outside and the inside: prompting, working with APIs, wiring models into ordinary applications, and judging whether what comes back is any good. The part I like most is that none of it is magic — it is engineering, with the same inputs, outputs, failures and ways to fix them.',
  },
  {
    id: 'mars',
    kicker: 'frontend',
    title: 'MARS IT School',
    place: 'Tashkent — Sergeli',
    body:
      'MARS IT School, Sergeli branch, is where the frontend started. I picked up the base there — HTML, CSS and JavaScript — and went on to React and TypeScript on my own. First projects, first bugs at three in the morning, and the first real understanding that an interface is not a picture: it is a running system with state, edges and a cost for every frame.',
  },
]

export type StackGroup = {
  id: string
  title: string
  summary: string
  items: string[]
}

export const stack: StackGroup[] = [
  {
    id: 'frontend',
    title: 'Frontend',
    summary: 'Interfaces, state and motion — the layer I ship in every day.',
    items: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS'],
  },
  {
    id: 'backend',
    title: 'Backend',
    summary: 'The logic under the interface: services, APIs and memory.',
    items: ['C#', '.NET', 'C++', 'Node.js'],
  },
  {
    id: 'ai',
    title: 'AI Engineering',
    summary: 'Models as part of a product: prompting, integration, evaluation.',
    items: ['Prompting', 'LLM APIs', 'Python', 'Integration'],
  },
]

export type Social = {
  id: 'telegram' | 'github' | 'instagram' | 'linkedin' | 'email'
  label: string
  handle: string
  href: string
}

export const contact = {
  copy: 'copy',
  copied: 'copied',
  signoff: 'thanks for making it this far :)',
  /** Prefix of the live line: "right now in tashkent — 23:41 · −3°, snowing". */
  now: 'right now in tashkent',
}

export const socials: Social[] = [
  {
    id: 'telegram',
    label: 'Telegram',
    handle: '@abrorkulov',
    href: 'https://t.me/ejodocome',
  },
  {
    id: 'github',
    label: 'GitHub',
    handle: 'abrorkulov',
    href: 'https://github.com/abrorkulov',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'jahongir-abrorkulov',
    href: 'https://linkedin.com/in/jahongir-abrorkulov',
  },
]
  