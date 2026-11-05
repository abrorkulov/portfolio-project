/**
 * Every string on the site lives here so the components stay presentational.
 *
 * Two kinds of claim, and neither is invented: what Jahongir built, which can be
 * checked against a public repository, and facts about the Solar System, which
 * can be checked against any textbook.
 */

const GH = 'https://github.com/abrorkulov'

export const meta = {
  name: 'Jahongir Abrorkulov',
  role: 'Full-stack engineer',
}

/** The route, in flight order. Each index is also an integer position on it. */
export const route = [
  { id: 'top', name: 'Earth' },
  { id: 'about', name: 'Moon' },
  { id: 'hamshira', name: 'Mars' },
  { id: 'agrovest', name: 'Jupiter' },
  { id: 'maktab', name: 'Saturn' },
  { id: 'jobfinder', name: 'Uranus' },
  { id: 'also', name: 'Neptune' },
  { id: 'lab', name: 'Pluto' },
  { id: 'stack', name: 'Milky Way' },
  { id: 'contact', name: 'Deep field' },
] as const

export const nav = [
  { href: '#hamshira', label: 'Work' },
  { href: '#lab', label: 'Lab' },
  { href: '#stack', label: 'Stack' },
  { href: '#contact', label: 'Contact' },
]

export const hud = {
  fromHome: 'From Tashkent',
  light: 'Light',
}

export const hero = {
  name: 'Jahongir Abrorkulov',
  title: 'I build software from right here.',
  body: 'Full-stack engineer, 16. Web and mobile products on the surface, C++ and reverse engineering underneath.',
  note: 'Day and night on this Earth are real, right now. The dark side is where it is night.',
  scroll: 'Scroll to leave orbit',
  loading: 'Acquiring signal',
  pin: 'Tashkent',
}

export const about = {
  label: 'The Moon',
  title: 'Most full-stack stops at the database. I kept digging.',
  body: 'I ship products people can open and use, then I go underneath to see how a machine actually runs them: through memory, into the instructions, one byte at a time.',
  spec: [
    { key: 'Based in', value: 'Tashkent, Uzbekistan' },
    { key: 'Languages', value: 'Uzbek, Russian, English (IELTS 6.0)' },
    { key: 'Studying', value: "AI Engineering, Najot Ta'lim" },
    { key: 'Started', value: 'Frontend, MARS IT School' },
    { key: 'Building now', value: 'HamshiraGo' },
  ],
}

/** Shown mid-flight, in the empty part of each leg. All figures are averages. */
export const legs = [
  { line: 'The Moon. 384,400 km.', sub: 'Light crosses that in 1.3 seconds.' },
  {
    line: 'What I have shipped, in the order you reach it.',
    sub: 'That is the Sun. Mars comes first, 228 million km from it.',
  },
  {
    line: 'Through the asteroid belt.',
    sub: 'Jupiter next: 778 million km from the Sun. Sunlight takes 43 minutes.',
  },
  { line: 'Saturn.', sub: '1.4 billion km. Sunlight takes 79 minutes.' },
  { line: 'Uranus.', sub: '2.9 billion km. It rolls around the Sun on its side.' },
  { line: 'Neptune.', sub: '4.5 billion km. The Sun is just a very bright star now.' },
  {
    line: 'That bright star is the Sun.',
    sub: '5.9 billion km behind us. Past the last planet, I take things apart.',
  },
  { line: 'Leaving.', sub: 'From here on, everything you can see is a star.' },
  { line: 'The Milky Way is a dot now.', sub: 'One of about two trillion.' },
]

export type Project = {
  id: string
  world: string
  title: string
  kind: string
  status: string
  summary: string
  stack: string[]
  repo: string
  live?: string
  image?: string
  imageAlt?: string
  /** A project with no public build gets how it works instead of a screenshot. */
  roles?: { name: string; does: string }[]
}

export const work = {
  sourceLabel: 'Source',
  liveLabel: 'Open live',
  projects: [
    {
      id: 'hamshira',
      world: 'Mars',
      title: 'HamshiraGo',
      kind: 'Home nursing service',
      status: 'In active development',
      summary:
        'Call a nurse to your home in Uzbekistan. One codebase runs the website and the mobile app, with panels for patients, nurses and admins, in Uzbek (Latin and Cyrillic) and Russian.',
      stack: ['Expo', 'React Native', 'Express', 'PostgreSQL', 'Docker', 'Zod', 'JWT'],
      repo: `${GH}/Hamshira`,
      roles: [
        { name: 'Patient', does: 'Picks a service, books a slot, follows the order' },
        { name: 'Nurse', does: 'Applies, gets verified, claims orders from the queue' },
        { name: 'Admin', does: 'Checks documents, approves nurses, runs the catalog' },
      ],
    },
    {
      id: 'agrovest',
      world: 'Jupiter',
      title: 'AgroVest',
      kind: 'B2B contract farming',
      status: 'Live, frontend',
      summary:
        'Buy the harvest before it is grown. A marketplace connecting Uzbek farms with restaurants, retail and wholesale buyers: ready batches today, fixed-price contracts for tomorrow.',
      stack: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
      repo: `${GH}/FarmPlatform`,
      live: 'https://farm-platform-plc6.vercel.app',
      image: '/work/agrovest.webp',
      imageAlt: 'The AgroVest marketplace, listing tomato, potato and watermelon batches',
    },
    {
      id: 'maktab',
      world: 'Saturn',
      title: 'Maktab AI',
      kind: 'Learning network, hackathon',
      status: 'Live',
      summary:
        'Classmates learning together: a homework scanner, one-minute cheat sheets, exam cards and class-versus-class battles. Built for a school hackathon, in three languages.',
      stack: ['React', 'TypeScript', 'Ant Design', 'GSAP', 'Express', 'Prisma'],
      repo: `${GH}/hackaton-Platform-For-School`,
      live: 'https://hackaton23082027.vercel.app',
      image: '/work/maktab.webp',
      imageAlt: 'The Maktab AI homework scanner screen',
    },
    {
      id: 'jobfinder',
      world: 'Uranus',
      title: 'JobFinder',
      kind: 'Job board',
      status: 'Full stack',
      summary:
        'A job board that shows the salary, the team and the actual work before you spend an evening applying. A React client on a typed API, translated with i18next.',
      stack: ['React', 'Zustand', 'i18next', 'Express', 'Prisma', 'Zod'],
      repo: `${GH}/Job-Finder`,
      image: '/work/jobfinder.webp',
      imageAlt: 'The JobFinder landing page with its search bar',
    },
  ] as Project[],
  also: {
    label: 'Neptune',
    title: 'Also built',
    items: [
      {
        title: 'Biznes Baza',
        does: 'CRM for a business database and the team working it',
        stack: 'React 19, Express, Prisma, PostgreSQL',
        href: `${GH}/dashboard`,
      },
      {
        title: 'Bozor',
        does: 'Classifieds marketplace in three languages, with compile-time checked translations',
        stack: 'React, TypeScript, React Router',
        href: `${GH}/Sell-Your-Things`,
      },
      {
        title: 'Quizvibe',
        does: 'Create, play and share interactive quizzes',
        stack: 'React, Framer Motion',
        href: `${GH}/hackaton`,
      },
      {
        title: 'pybot',
        does: 'Telegram bot that downloads videos on request',
        stack: 'Python, yt-dlp',
        href: `${GH}/pybot`,
      },
    ],
  },
}

export const lab = {
  label: 'Pluto',
  title: 'Not officially a planet. Not officially allowed.',
  intro:
    'This function refuses everyone. It is real x86 machine code, running on a small emulator in your browser. Make it return 1: find the key, or change one byte.',
  file: 'crackme.bin',
  keyLabel: 'Key',
  hints: [
    'Follow the branch at 0x40100D. It decides everything.',
    '75 is JNE: jump if not equal. 74 is JE: jump if equal. Click the 75 in the hex view and type 74.',
  ],
  hintButton: 'Hint',
  autoButton: 'Patch it for me',
  granted: 'Access granted',
  byKey: 'You found the key.',
  byPatch: 'You patched the binary.',
  grantedNote: 'That was eight instructions. Real binaries have millions. That is the fun part.',
  writeup: {
    title: 'cs2-cheat',
    quote: 'Playing with cheats is bad.',
    quoteSource: 'The description of my own repository',
    body: 'An external C++ overlay for Counter-Strike 2, and the project that taught me how a program looks from the outside. It attaches, reads the process’s memory, and rebuilds the world from raw bytes.',
    repo: `${GH}/cs2-cheat`,
    repoLabel: 'Read the source',
    modules: [
      { file: 'MemoryMgr', does: 'Attaches to the process, batches and caches its memory reads' },
      { file: 'Offsets', does: 'Where the game keeps what, kept apart from the logic' },
      { file: 'Entity, Bone', does: 'Rebuilds players and skeletons from raw structures' },
      { file: 'View', does: 'Projects 3D world positions onto the 2D screen' },
      { file: 'ESP, Radar', does: 'Draws what was reconstructed' },
      { file: 'OS-ImGui', does: 'The overlay window on top of the game' },
    ],
  },
}

export const stack = {
  label: 'The Milky Way',
  title: 'Everything I work with, from the screen down to the instruction.',
  layers: [
    { title: 'Interface', tools: 'React, TypeScript, React Native, Expo, Tailwind, WebGL' },
    { title: 'Services', tools: 'Node.js, Express, Zod, JWT, Python, LLM APIs' },
    { title: 'Data', tools: 'PostgreSQL, Prisma, SQL' },
    { title: 'Infrastructure', tools: 'Docker, Vercel, Railway, Render, Git' },
    { title: 'Native', tools: 'C++, C, C#, .NET, Win32, ImGui' },
    { title: 'Memory', tools: 'Process memory, offsets, pointer chains, struct layout' },
    { title: 'Machine', tools: 'x86, opcodes, reverse engineering, patching' },
  ],
}

export type Social = {
  id: 'telegram' | 'github' | 'linkedin'
  label: string
  handle: string
  href: string
}

export const contact = {
  title: 'About two trillion galaxies. Only one has me in it.',
  note: 'Telegram is the fastest way to reach me.',
  /** Swapped in if the visitor beat the crackme back at Pluto. */
  crackedTitle: 'You got in.',
  crackedNote: 'You beat the crackme. Message me and tell me how you did it.',
  now: 'Now in Tashkent',
  back: 'Return to Tashkent',
  credits:
    'Rendered live in your browser with raw WebGL2. The 9,096 brightest stars are real and in their real places (Yale Bright Star Catalog). Planet and sky maps from NASA data, Solar System Scope, CC BY 4.0. Pluto: NASA, New Horizons.',
  source: 'https://github.com/abrorkulov/portfolio-project',
  sourceLabel: 'Site source',
}

export const socials: Social[] = [
  { id: 'telegram', label: 'Telegram', handle: '@ejodocome', href: 'https://t.me/abrorkulov' },
  { id: 'github', label: 'GitHub', handle: 'abrorkulov', href: 'https://github.com/abrorkulov' },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'jahongir-abrorkulov',
    href: 'https://linkedin.com/in/jahongir-abrorkulov',
  },
]
