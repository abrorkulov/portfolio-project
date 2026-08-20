import {
  Brain,
  Cpu,
  Network,
  ScanSearch,
  Code2,
  Terminal,
  Database,
  Binary,
  Boxes,
  MonitorCog,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'

/**
 * Brand metadata for every technology shown on the site.
 *
 * `slug` points at simple-icons' CDN. Several brands (C#, VS Code, OpenAI…)
 * have been pulled from that catalogue over trademark requests, so a slug is
 * optional: anything without one — and anything whose request fails at
 * runtime, e.g. offline — falls back to a locally rendered monogram tile so a
 * broken-image glyph can never reach the page.
 */
export type TechMeta = {
  /** Brand colour, drives the tile tint, glow and progress bar. */
  color: string
  /** simple-icons slug, verified to resolve. Omit for locally drawn marks. */
  slug?: string
  /** 1–2 character fallback monogram. */
  mono: string
  /** Fallback glyph for concepts that have no logo at all. */
  icon?: LucideIcon
}

export const techMeta: Record<string, TechMeta> = {
  // ── Frontend ──────────────────────────────────────────────
  HTML5: { color: '#E34F26', slug: 'html5', mono: 'H5' },
  CSS3: { color: '#1572B6', slug: 'css', mono: 'C3' },
  React: { color: '#61DAFB', slug: 'react', mono: 'Re' },
  TypeScript: { color: '#3178C6', slug: 'typescript', mono: 'TS' },
  JavaScript: { color: '#F7DF1E', slug: 'javascript', mono: 'JS' },
  'Tailwind CSS': { color: '#06B6D4', slug: 'tailwindcss', mono: 'TW' },
  Sass: { color: '#CC6699', slug: 'sass', mono: 'Sa' },
  'Next.js': { color: '#E6EDF3', slug: 'nextdotjs', mono: 'N' },
  'Framer Motion': { color: '#7B61FF', slug: 'framer', mono: 'FM' },

  // ── Backend ───────────────────────────────────────────────
  'C#': { color: '#9B4F96', mono: 'C#', icon: Terminal },
  'C++': { color: '#00599C', slug: 'cplusplus', mono: 'C++' },
  '.NET': { color: '#8B5CF6', slug: 'dotnet', mono: '.N' },
  PHP: { color: '#8892BF', slug: 'php', mono: 'PHP' },
  'Node.js': { color: '#3C9E48', slug: 'nodedotjs', mono: 'JS' },
  Python: { color: '#3776AB', slug: 'python', mono: 'Py' },
  Express: { color: '#C7D0DB', slug: 'express', mono: 'Ex' },
  'REST APIs': { color: '#5EEAD4', mono: 'API', icon: Waypoints },

  // ── Databases ─────────────────────────────────────────────
  SQL: { color: '#7DD3FC', mono: 'SQL', icon: Database },
  PostgreSQL: { color: '#4169E1', slug: 'postgresql', mono: 'PG' },
  MySQL: { color: '#4479A1', slug: 'mysql', mono: 'My' },
  SQLite: { color: '#003B57', slug: 'sqlite', mono: 'Lt' },
  MongoDB: { color: '#47A248', slug: 'mongodb', mono: 'Mg' },

  // ── AI & Systems ──────────────────────────────────────────
  'AI Engineering': { color: '#A78BFA', mono: 'AI', icon: Brain },
  'AI Prompting': { color: '#C084FC', mono: 'AI', icon: Cpu },
  'Machine Learning': { color: '#F472B6', mono: 'ML', icon: Boxes },
  'System Integration': { color: '#6366F1', mono: 'SI', icon: Network },
  'Reverse Engineering': { color: '#FB7185', mono: 'RE', icon: ScanSearch },
  'Windows Internals': { color: '#38BDF8', mono: 'WI', icon: MonitorCog },
  'Data Structures': { color: '#FDBA74', mono: 'DS', icon: Binary },
  Networking: { color: '#818CF8', mono: 'Net', icon: Waypoints },

  // ── Tools & DevOps ────────────────────────────────────────
  Git: { color: '#F05032', slug: 'git', mono: 'Git' },
  GitHub: { color: '#E6EDF3', slug: 'github', mono: 'GH' },
  'VS Code': { color: '#2F9BD8', mono: 'VS', icon: Code2 },
  'Linux (Ubuntu)': { color: '#E95420', slug: 'ubuntu', mono: 'Ub' },
  Docker: { color: '#2496ED', slug: 'docker', mono: 'Dk' },
  Postman: { color: '#FF6C37', slug: 'postman', mono: 'Pm' },
  Vite: { color: '#646CFF', slug: 'vite', mono: 'Vt' },
  npm: { color: '#CB3837', slug: 'npm', mono: 'np' },
  Bash: { color: '#4EAA25', slug: 'gnubash', mono: 'sh' },
  Vercel: { color: '#E6EDF3', slug: 'vercel', mono: 'Vc' },
  Figma: { color: '#F24E1E', slug: 'figma', mono: 'Fg' },
}

const FALLBACK: TechMeta = { color: '#7C8B9C', mono: '?', icon: Code2 }

export function getTechMeta(name: string): TechMeta {
  return techMeta[name] ?? FALLBACK
}

/**
 * Lightens a brand colour until it reads on the near-black surface.
 *
 * Brand palettes are picked for white backgrounds: C++ navy (#00599C) and
 * PHP's muted indigo all but vanish against #09090b. Logos keep their true
 * colour — this is for the text and bars drawn beside them.
 */
export function readableAccent(hex: string, minLuminance = 0.42): string {
  const value = hex.replace('#', '')
  if (value.length !== 6) return hex

  const rgb = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16))

  // Perceived luminance, 0–1.
  const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
  if (luminance >= minLuminance) return hex

  // Blend toward white by just enough to clear the threshold.
  const amount = Math.min((minLuminance - luminance) / (1 - luminance), 0.8)
  const lightened = rgb.map((channel) =>
    Math.round(channel + (255 - channel) * amount),
  )

  return `#${lightened.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}
