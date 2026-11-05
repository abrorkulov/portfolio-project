/**
 * Every string on the site lives here so the components stay presentational.
 *
 * Every claim below can be checked against a public repository. That is the
 * rule for this file: a portfolio read by engineers loses everything the
 * moment one number turns out to be invented, so nothing here is rounded up.
 */

export const meta = {
  name: 'Jahongir Abrorkulov',
  role: 'Full-stack engineer',
}

export const nav = [
  { id: 'work', label: 'Work' },
  { id: 'stack', label: 'Stack' },
  { id: 'lab', label: 'Lab' },
  { id: 'contact', label: 'Contact' },
] as const

export const hero = {
  /** Long enough to fill the screen at a width where the two fit side by side. */
  wide: ['JAHONGIR', 'ABRORKULOV'],
  /** On a phone the name breaks where it breaks anyway: Jahon-gir, Abror-kulov. */
  narrow: ['JAHON', 'GIR', 'ABROR', 'KULOV'],
  statement: ['Full-stack engineer.', 'From the pixel to the register.'],
  facts: ['16 y.o.', 'Tashkent, UZ', '41.31°N 69.28°E'],
  hint: 'Move across the name',
  scroll: 'Scroll to go down',
}

/**
 * Read by the shader as raw bytes. What shows through the letters under the
 * pointer is the hex encoding of this sentence, not random noise, so anyone
 * patient enough can actually read it.
 */
export const heroBytes =
  'JAHONGIR ABRORKULOV // FULL STACK // FROM THE PIXEL TO THE REGISTER // TASHKENT // '

export const about = {
  kicker: 'Who',
  /** `*word*` is lit in the accent as the reader scrolls onto it. */
  statement:
    'Most full-stack stops at the database. *I kept digging.* I ship products people can open and use, then I go underneath to see how a machine really runs them: down through memory, into the instructions, one *byte* at a time.',
  spec: [
    { key: 'Based in', value: 'Tashkent, Uzbekistan' },
    { key: 'Languages', value: 'Uzbek, Russian, English (IELTS 6.0)' },
    { key: 'Studying', value: "AI Engineering at Najot Ta'lim" },
    { key: 'Started at', value: 'MARS IT School, frontend' },
    { key: 'Building now', value: 'HamshiraGo' },
  ],
}

export type Project = {
  id: string
  title: string
  kind: string
  summary: string
  stack: string[]
  repo: string
  live?: string
  image?: string
  imageAlt?: string
  status: string
  /** A project with no public build gets a drawn panel of how it works instead. */
  roles?: { name: string; does: string }[]
}

const GH = 'https://github.com/abrorkulov'

export const work = {
  kicker: 'Work',
  title: 'What I shipped',
  sourceLabel: 'Source',
  liveLabel: 'Open live',
  alsoLabel: 'Also built',
  projects: [
    {
      id: 'hamshira',
      title: 'HAMSHIRAGO',
      kind: 'Home nursing service',
      status: 'In active development',
      summary:
        'Call a nurse to your home in Uzbekistan. One codebase runs the website and the mobile app, with panels for patients, nurses and admins, and an interface in Uzbek (Latin and Cyrillic) and Russian.',
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
      title: 'AGROVEST',
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
      title: 'MAKTAB AI',
      kind: 'Learning network, hackathon',
      status: 'Live',
      summary:
        'Classmates learning together: a homework scanner, one-minute cheat sheets, exam cards and class-versus-class battles. Built for a school hackathon, in Uzbek, Russian and English.',
      stack: ['React', 'TypeScript', 'Ant Design', 'GSAP', 'Express', 'Prisma'],
      repo: `${GH}/hackaton-Platform-For-School`,
      live: 'https://hackaton23082027.vercel.app',
      image: '/work/maktab.webp',
      imageAlt: 'The Maktab AI homework scanner screen',
    },
    {
      id: 'jobfinder',
      title: 'JOBFINDER',
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
  also: [
    {
      title: 'Biznes Baza',
      does: 'CRM for a business database and the team working it',
      stack: 'React 19 · Express · Prisma · PostgreSQL',
      href: `${GH}/dashboard`,
    },
    {
      title: 'Bozor',
      does: 'Classifieds marketplace in three languages, with compile-time checked translations',
      stack: 'React · TypeScript · React Router',
      href: `${GH}/Sell-Your-Things`,
    },
    {
      title: 'Quizvibe',
      does: 'Create, play and share interactive quizzes',
      stack: 'React · Framer Motion',
      href: `${GH}/hackaton`,
    },
    {
      title: 'pybot',
      does: 'Telegram bot that downloads videos on request',
      stack: 'Python · yt-dlp',
      href: `${GH}/pybot`,
    },
  ],
}

export type Layer = {
  id: string
  level: string
  title: string
  body: string
  tools: string[]
}

/** Top to bottom. The order is the argument of the whole page. */
export const stack = {
  kicker: 'Stack',
  layers: [
    {
      id: 'interface',
      level: 'L6',
      title: 'INTERFACE',
      body: 'What people actually touch. Typed, translated, and on the web and a phone from one codebase.',
      tools: ['React', 'TypeScript', 'React Native', 'Expo', 'Tailwind', 'WebGL'],
    },
    {
      id: 'services',
      level: 'L5',
      title: 'SERVICES',
      body: 'The rules behind the screen: auth, validation, roles, and models wired into real features.',
      tools: ['Node.js', 'Express', 'Zod', 'JWT', 'Python', 'LLM APIs'],
    },
    {
      id: 'data',
      level: 'L4',
      title: 'DATA',
      body: 'Schemas that hold up once there are orders, statuses and more than one kind of user.',
      tools: ['PostgreSQL', 'Prisma', 'SQL'],
    },
    {
      id: 'infra',
      level: 'L3',
      title: 'INFRA',
      body: 'Getting it off my machine. One command to bring everything up, one push to ship it.',
      tools: ['Docker', 'Vercel', 'Railway', 'Render', 'Git'],
    },
    {
      id: 'native',
      level: 'L2',
      title: 'NATIVE',
      body: 'No runtime to hide behind. Manual memory, the Windows API, and a compiler that owes you nothing.',
      tools: ['C++', 'C', 'C#', '.NET', 'Win32', 'ImGui'],
    },
    {
      id: 'memory',
      level: 'L1',
      title: 'MEMORY',
      body: "Another process's memory is just bytes at addresses. Find the offsets and the structs come back.",
      tools: ['Process memory', 'Offsets', 'Pointer chains', 'Struct layout'],
    },
    {
      id: 'machine',
      level: 'L0',
      title: 'MACHINE',
      body: 'The bottom. No names, no types, only instructions. There is one right below for you to break.',
      tools: ['x86', 'Opcodes', 'Reverse engineering', 'Patching'],
    },
  ] as Layer[],
}

export const lab = {
  kicker: 'Lab',
  title: ['BELOW', 'THE API'],
  intro:
    'This function refuses everyone. It is real x86 machine code running on a small emulator in your browser. Make it return 1. Find the key, or change one byte.',
  file: 'crackme.bin',
  keyLabel: 'Key',
  hints: [
    'Follow the branch at 0x40100D. It decides everything.',
    '75 is JNE: jump if not equal. 74 is JE: jump if equal. Click the 75 in the hex view and type 74.',
  ],
  hintButton: 'Hint',
  autoButton: 'Patch it for me',
  granted: 'ACCESS GRANTED',
  byKey: 'You found the key.',
  byPatch: 'You patched the binary.',
  grantedNote: 'That was eight instructions. Real binaries have millions. That is the fun part.',
  writeup: {
    kicker: 'Field notes',
    title: 'cs2-cheat',
    quote: 'Playing with cheats is bad.',
    quoteSource: 'The description of my own repository',
    body: 'An external C++ overlay for Counter-Strike 2, and the project that taught me how a program looks from the outside. It never touches the game’s code: it attaches, reads the process’s memory, and rebuilds the world from raw bytes.',
    repo: `${GH}/cs2-cheat`,
    repoLabel: 'Read the source',
    modules: [
      { file: 'MemoryMgr', does: 'Attaches to the process, batches and caches its memory reads' },
      { file: 'Offsets', does: 'Where the game keeps what, kept apart from the logic' },
      { file: 'Entity · Bone', does: 'Rebuilds players and skeletons from raw structures' },
      { file: 'View', does: 'Projects 3D world positions onto the 2D screen' },
      { file: 'ESP · Radar', does: 'Draws what was reconstructed' },
      { file: 'OS-ImGui', does: 'The overlay window on top of the game' },
    ],
  },
}

export type Social = {
  id: 'telegram' | 'github' | 'linkedin'
  label: string
  handle: string
  href: string
}

export const contact = {
  kicker: 'Contact',
  title: ["LET'S", 'BUILD'],
  /** Swapped in if the visitor beat the crackme further up the page. */
  crackedTitle: ['YOU', 'GOT IN'],
  crackedNote: 'You beat the crackme. Message me and tell me how you did it.',
  note: 'From the first pixel to the last byte. Telegram is the fastest way to reach me.',
  now: 'Now in Tashkent',
  colophon: 'React, raw WebGL2, and an x86 emulator small enough to read.',
  source: 'https://github.com/abrorkulov/portfolio-project',
  sourceLabel: 'Site source',
}

export const socials: Social[] = [
  { id: 'telegram', label: 'Telegram', handle: '@ejodocome', href: 'https://t.me/ejodocome' },
  { id: 'github', label: 'GitHub', handle: 'abrorkulov', href: GH },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'jahongir-abrorkulov',
    href: 'https://linkedin.com/in/jahongir-abrorkulov',
  },
]
