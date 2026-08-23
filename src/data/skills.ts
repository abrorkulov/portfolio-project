import type { TechName } from '@/shared/lib/techMeta'

/**
 * Proficiency, 0–100.
 *
 * Kept as a plain number rather than a branded type — the value is authored by
 * hand and read by a progress bar, and the only invariant that matters (it is
 * a percentage) is enforced by the bar clamping, not by the type system.
 */
export type SkillLevel = number

export type Skill = {
  /** Constrained to the brand registry, so every card has an icon. */
  name: TechName
  level: SkillLevel
  note: string
}

export type SkillCategory = {
  label: string
  eyebrow: string
  /** One-line framing of what this layer covers, shown under the heading. */
  summary: string
  items: readonly Skill[]
}

// Ordered high-to-low inside each group so the strongest work leads.
export const skillCategories: readonly SkillCategory[] = [
  {
    label: 'Frontend',
    eyebrow: 'interface_layer',
    summary:
      'The layer I ship in daily — component architecture, type safety and motion.',
    items: [
      { name: 'HTML5', level: 92, note: 'Semantic markup and accessibility basics' },
      { name: 'JavaScript', level: 90, note: 'ES2023, async patterns, DOM internals' },
      { name: 'React', level: 88, note: 'Hooks, composition, render performance' },
      { name: 'CSS3', level: 86, note: 'Flexbox, grid, custom properties, animation' },
      { name: 'Tailwind CSS', level: 85, note: 'Design tokens and responsive systems' },
      { name: 'TypeScript', level: 82, note: 'Generics, discriminated unions, strict mode' },
      { name: 'Next.js', level: 78, note: 'App router, server components, rendering modes' },
      { name: 'Framer Motion', level: 74, note: 'Layout animation and scroll choreography' },
      { name: 'GSAP', level: 68, note: 'ScrollTrigger timelines and pinned sequences' },
      { name: 'React Native', level: 62, note: 'Cross-platform screens and native navigation' },
    ],
  },
  {
    label: 'Backend',
    eyebrow: 'server_layer',
    summary: 'Where the data lives — typed services, memory-aware code and APIs.',
    items: [
      { name: 'C#', level: 75, note: 'OOP, LINQ, async/await' },
      { name: 'REST APIs', level: 74, note: 'Resource design, status codes, auth flows' },
      { name: 'Node.js', level: 72, note: 'Service runtimes, streams and tooling scripts' },
      { name: '.NET', level: 72, note: 'Web APIs and dependency injection' },
      { name: 'C++', level: 70, note: 'Pointers, memory layout, STL' },
      { name: 'Express.js', level: 70, note: 'Routing, middleware and error handling' },
      { name: 'Python', level: 66, note: 'Scripting, automation and AI tooling' },
    ],
  },
  {
    label: 'Databases',
    eyebrow: 'data_layer',
    summary: 'Storing and querying the things an app has to remember.',
    items: [
      { name: 'Prisma', level: 70, note: 'Schema-first modelling, migrations, typed queries' },
      { name: 'SQL', level: 70, note: 'Joins, indexes and query shaping' },
      { name: 'MySQL', level: 68, note: 'Schema design for production web apps' },
      { name: 'PostgreSQL', level: 62, note: 'Relational modelling and constraints' },
      { name: 'SQLite', level: 60, note: 'Embedded storage for local tools' },
      { name: 'MongoDB', level: 52, note: 'Document modelling for Node services' },
    ],
  },
  {
    label: 'AI & Systems',
    eyebrow: 'intelligence_layer',
    summary:
      'The tools I think with, and the layer underneath that explains why software behaves as it does.',
    items: [
      { name: 'Claude Code', level: 88, note: 'Full-stack architecture, refactoring, review' },
      { name: 'AI Prompting', level: 85, note: 'Structured briefs and evaluation loops' },
      { name: 'AI Engineering', level: 78, note: 'LLM integration and tool orchestration' },
      { name: 'System Integration', level: 72, note: 'Wiring services and data across boundaries' },
      { name: 'Data Structures', level: 70, note: 'Complexity trade-offs in real code' },
      { name: 'Gemini', level: 68, note: 'Strategy, planning and second opinions' },
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
