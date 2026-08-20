// All portfolio copy and structured data lives here so components
// stay presentational and reusable.

// Trigger redeploy after removing certifications
export const profile = {
  name: 'Jahongir Abrorkulov',
  role: 'Frontend & AI/Systems Developer',
  age: 16,
  location: 'Tashkent, Uzbekistan',
  bio: [
    "I'm a 16-year-old Frontend & AI/Systems developer based in Tashkent, Uzbekistan, passionate about building high-performance web interfaces and understanding the systems underneath them.",
    'My expertise spans frontend engineering with React, TypeScript, and modern design systems, backend development with C#, C++, .NET, and PHP, and systems-level work with Ubuntu.',
    'Currently focused on AI Engineering at Najot Ta\'lim, with advanced skills in AI prompting and system integration. I believe in understanding technology at every layer—from pixels to kernel.',
  ],
  languages: [
    { name: 'English', level: 'IELTS 5.5' },
    { name: 'Russian', level: 'Fluent' },
    { name: 'Uzbek', level: 'Native' },
  ],
  expertise: [
    {
      category: 'Frontend & Design',
      items: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'UI/UX Design', 'Modern Frontend Libraries'],
    },
    {
      category: 'Backend & Core',
      items: ['C#', 'C++', '.NET', 'PHP'],
    },
    {
      category: 'Systems & AI',
      items: ['Ubuntu', 'AI Engineering', 'Advanced AI Prompting', 'System Integration'],
    },
  ],
  email: 'jahongir.abrorkulov@gmail.com',
  socials: {
    github: 'https://github.com/abrorkulov',
    telegram: 'https://t.me/',
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/in/jahongir-abrorkulov',
    discord: 'https://discord.com',
  },
}

export type SkillCategory = {
  label: string
  eyebrow: string
  /** One-line framing of what this layer covers, shown under the heading. */
  summary: string
  items: { name: string; level: number; note: string }[]
}

// Ordered high-to-low inside each group so the strongest work leads.
export const skillCategories: SkillCategory[] = [
  {
    label: 'Frontend',
    eyebrow: 'interface_layer',
    summary: 'The layer I ship in daily — component architecture, type safety and motion.',
    items: [
      { name: 'HTML5', level: 92, note: 'Semantic markup and accessibility basics' },
      { name: 'JavaScript', level: 90, note: 'ES2023, async patterns, DOM internals' },
      { name: 'React', level: 88, note: 'Hooks, composition, render performance' },
      { name: 'CSS3', level: 86, note: 'Flexbox, grid, custom properties, animation' },
      { name: 'Tailwind CSS', level: 85, note: 'Design tokens and responsive systems' },
      { name: 'TypeScript', level: 82, note: 'Generics, discriminated unions, strict mode' },
      { name: 'Next.js', level: 75, note: 'App router, routing and rendering modes' },
      { name: 'Framer Motion', level: 72, note: 'Layout animation and scroll choreography' },
      { name: 'Sass', level: 68, note: 'Nesting, mixins and legacy stylesheet upkeep' },
    ],
  },
  {
    label: 'Backend',
    eyebrow: 'server_layer',
    summary: 'Where the data lives — typed services, memory-aware code and APIs.',
    items: [
      { name: 'C#', level: 75, note: 'OOP, LINQ, async/await' },
      { name: 'REST APIs', level: 74, note: 'Resource design, status codes, auth headers' },
      { name: '.NET', level: 72, note: 'Web APIs and dependency injection' },
      { name: 'C++', level: 70, note: 'Pointers, memory layout, STL' },
      { name: 'Node.js', level: 68, note: 'Express services and tooling scripts' },
      { name: 'Python', level: 66, note: 'Scripting, automation and AI tooling' },
      { name: 'PHP', level: 65, note: 'Server-rendered apps and REST endpoints' },
      { name: 'Express', level: 62, note: 'Routing, middleware and error handling' },
    ],
  },
  {
    label: 'Databases',
    eyebrow: 'data_layer',
    summary: 'Storing and querying the things an app has to remember.',
    items: [
      { name: 'SQL', level: 70, note: 'Joins, indexes and query shaping' },
      { name: 'MySQL', level: 68, note: 'Schema design for PHP and .NET apps' },
      { name: 'PostgreSQL', level: 62, note: 'Relational modelling and constraints' },
      { name: 'SQLite', level: 60, note: 'Embedded storage for local tools' },
      { name: 'MongoDB', level: 52, note: 'Document modelling for Node services' },
    ],
  },
  {
    label: 'AI & Systems',
    eyebrow: 'intelligence_layer',
    summary: 'The layer I study underneath — models, integration and how software really runs.',
    items: [
      { name: 'AI Prompting', level: 85, note: 'Structured prompting and evaluation loops' },
      { name: 'AI Engineering', level: 78, note: 'LLM integration and tool orchestration' },
      { name: 'System Integration', level: 72, note: 'Wiring services and data across boundaries' },
      { name: 'Data Structures', level: 70, note: 'Complexity trade-offs in real code' },
      { name: 'Networking', level: 64, note: 'TCP/IP, HTTP and packet-level debugging' },
      { name: 'Reverse Engineering', level: 60, note: 'Static analysis and process architecture' },
      { name: 'Windows Internals', level: 58, note: 'Processes, memory and the Win32 surface' },
      { name: 'Machine Learning', level: 50, note: 'Model fundamentals and training intuition' },
    ],
  },
  {
    label: 'Tools & DevOps',
    eyebrow: 'workflow_layer',
    summary: 'The workflow around the code — version control, containers and Linux.',
    items: [
      { name: 'VS Code', level: 90, note: 'Debugging, extensions, task automation' },
      { name: 'Git', level: 80, note: 'Branching strategy, rebasing, code review' },
      { name: 'GitHub', level: 80, note: 'Pull requests, issues and Actions' },
      { name: 'Linux (Ubuntu)', level: 78, note: 'Shell, permissions, daily driver' },
      { name: 'Vite', level: 76, note: 'Dev server, build config and code splitting' },
      { name: 'npm', level: 74, note: 'Dependency and script management' },
      { name: 'Postman', level: 70, note: 'API testing and collection workflows' },
      { name: 'Bash', level: 66, note: 'Shell scripting and pipeline glue' },
      { name: 'Vercel', level: 64, note: 'Deploys, previews and edge config' },
      { name: 'Figma', level: 60, note: 'Reading specs and exporting assets' },
      { name: 'Docker', level: 55, note: 'Containerising apps for local dev' },
    ],
  },
]

// Learning trajectory: relative skill maturity over time across tracks.
// Values are self-assessed proficiency (0-100) sampled at each checkpoint.
export type TrajectoryPoint = {
  month: string
  frontend: number
  aiMl: number
  systems: number
  linux: number
}

export const trajectory: TrajectoryPoint[] = [
  { month: 'Jan', frontend: 20, aiMl: 5, systems: 8, linux: 10 },
  { month: 'Mar', frontend: 35, aiMl: 10, systems: 15, linux: 20 },
  { month: 'May', frontend: 48, aiMl: 18, systems: 25, linux: 32 },
  { month: 'Jul', frontend: 60, aiMl: 28, systems: 38, linux: 45 },
  { month: 'Sep', frontend: 72, aiMl: 40, systems: 50, linux: 58 },
  { month: 'Nov', frontend: 80, aiMl: 50, systems: 58, linux: 68 },
  { month: 'Jan', frontend: 88, aiMl: 58, systems: 65, linux: 78 },
]

export const trajectoryLegend = [
  { key: 'frontend', label: 'Frontend', color: '#5EEAD4' },
  { key: 'aiMl', label: 'AI / ML Basics', color: '#A78BFA' },
  { key: 'systems', label: 'System Architecture', color: '#FDBA74' },
  { key: 'linux', label: 'Linux', color: '#60A5FA' },
] as const

export const education = [
  {
    school: "MARS IT Space",
    branch: 'Sergeli branch',
    detail: 'Frontend engineering & software fundamentals track',
  },
  {
    school: "Najot Ta'lim",
    branch: 'Chilonzor branch',
    detail: 'Programming fundamentals & systems coursework',
  },
]

export type TimelineEvent = {
  year: string
  title: string
  description: string
  icon: string
}

export const timelineEvents: TimelineEvent[] = [
  {
    year: '2023',
    title: 'Enrolled in Frontend Development',
    description: 'Started my journey at MARS IT School (Sergeli branch) for Frontend Development. Also began English courses at Cambridge Learning Center (Sergeli branch) to improve my language skills.',
    icon: 'rocket',
  },
  {
    year: '2025',
    title: 'Created Cs 2 hack client',
    description: 'Developed a custom hack client for Counter-Strike 2, showcasing my skills in reverse engineering, system analysis, and low-level programming.',
    icon: 'gamepad',
  },
  {
    year: '2025',
    title: 'React Mastery & First Startup',
    description: 'Completed React and JavaScript mastery. Co-founded and developed Adblogger.uz with classmates - my first real-world project bringing ideas to life.',
    icon: 'code',
  },
  {
    year: '2026',
    title: 'AI Engineering Focus',
    description: 'Joined Najot Ta\'lim (Chilonzor branch) for AI Engineering. Scored IELTS 5.5. Currently focusing on advanced AI prompting and system integration.',
    icon: 'brain',
  },
  
]

export type Project = {
  title: string
  description: string
  stack: string[]
  tag: string
  status: 'shipped' | 'in_progress'
}

export const projects: Project[] = [
  {
    title: 'Typing Speed Test Platform',
    description:
      'A custom web app for measuring typing speed and accuracy in real time, with live WPM tracking, accuracy scoring, and session history.',
    stack: ['React', 'TypeScript', 'Tailwind CSS'],
    tag: 'web_app',
    status: 'shipped',
  },
  {
    title: 'System & Game Security Research',
    description:
      'A low-level research project exploring memory layout, process architecture, and system analysis techniques in the context of Counter-Strike 2, focused on understanding how game clients manage state and resist tampering.',
    stack: ['C++', 'Windows Internals', 'Reverse Engineering'],
    tag: 'systems',
    status: 'in_progress',
  },
  {
    title: 'Utility Toolbelt',
    description:
      'A growing collection of small utility tools and web apps — from productivity scripts to dev-focused browser extensions — built to solve everyday friction points.',
    stack: ['TypeScript', 'Node.js', 'Vite'],
    tag: 'tools',
    status: 'in_progress',
  },
]

/** One line of the replayed Claude Code session in the AI section. */
export type SessionLine = {
  /** Drives the colour and the leading glyph. See `ClaudeTerminal`. */
  kind: 'shell' | 'brand' | 'user' | 'tool' | 'ok'
  text: string
}

export const aiPractice = {
  eyebrow: 'ai_toolkit',
  title: 'A year of building with Claude',
  description:
    'AI is part of how I actually work, not a tab I keep open. This is the whole setup — one tool, in the terminal, checked every time.',

  paragraphs: [
    "I have spent the past year learning Claude properly. Not asking it for snippets — learning how to brief it, how much context it needs before it is useful, and how to read what it gives back. Getting good at that took far longer than learning the tool itself.",
    'Claude is an AI assistant built by Anthropic. What makes it worth the year is that it reads a whole codebase rather than a pasted fragment, follows the conventions a project already has, and explains its reasoning — so I can argue with it instead of copying from it.',
  ],

  /** The one-line claim the section is built around. */
  callout:
    'I use only Claude Code, and only in the terminal. No chat tab, no editor plugin, nothing pasted between windows.',

  stats: [
    { label: 'working with claude', value: '1 year' },
    { label: 'the only ai tool', value: 'Claude Code' },
    { label: 'where it runs', value: 'Terminal' },
    { label: 'pasted from a chat tab', value: 'None' },
  ],

  principles: [
    {
      icon: 'context',
      title: 'Context before questions',
      detail:
        'Point it at the repo, the conventions and the constraint first. A vague prompt gets a generic answer no matter which model is behind it.',
    },
    {
      icon: 'verify',
      title: 'Verify, then trust',
      detail:
        'Typecheck, lint, build, read the diff. Everything it writes is a draft until the toolchain agrees with it.',
    },
    {
      icon: 'depth',
      title: 'One tool, learned deeply',
      detail:
        'A year inside a single tool beat spreading thin across five. I know what it is good at and, more usefully, where it is not.',
    },
    {
      icon: 'terminal',
      title: 'Where the work already is',
      detail:
        'It runs next to git, the dev server and the build, so there is no copying between a browser tab and an editor.',
    },
  ],

  /**
   * Replayed by `ClaudeTerminal`. These are the real steps from the session
   * that rebuilt the skills grid — keep them short; the widget types every
   * character and a long line stalls the whole sequence.
   */
  session: [
    { kind: 'shell', text: '~/portfolio $ claude' },
    { kind: 'brand', text: 'Claude Code — connected to ~/portfolio' },
    { kind: 'user', text: 'preview 4 skills per category, collapse the rest' },
    { kind: 'tool', text: 'Read  src/components/Skills.tsx' },
    { kind: 'tool', text: 'Edit  src/components/Skills.tsx  +42 -16' },
    { kind: 'ok', text: 'tsc + eslint + vite build — all clean' },
    { kind: 'user', text: 'ship it' },
  ] satisfies SessionLine[],
}

export type Interest = {
  name: string
  detail: string
  stats: Record<string, string | number>
}

export const interests: Interest[] = [
  {
    name: 'Counter-Strike 2',
    detail: 'Competitive FPS gaming focused on tactical teamwork and precise mechanics.',
    stats: {
      rank: 'Global Elite',
      hours: '2500+',
      kdr: '1.8',
    },
  },
  {
    name: 'Forza Horizon 5',
    detail: 'Open-world racing exploration and car collection.',
    stats: {
      completion: '85%',
      cars: '450+',
      level: '1200',
    },
  },
  {
    name: 'Rocket League',
    detail: 'Physics-based competitive soccer with rocket-powered cars.',
    stats: {
      rank: 'Grand Champion',
      hours: '1800+',
      mode: '3v3 Standard',
    },
  },
]
