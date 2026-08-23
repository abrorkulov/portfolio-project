/** Who the site is about. Everything here is rendered somewhere on the page. */

export type Language = {
  name: string
  level: string
}

export type ExpertiseGroup = {
  category: string
  /**
   * Free-form labels rather than `TechName`: these are descriptive groupings
   * ("Linux", "Reverse Engineering") shown as plain chips, not icon tiles, so
   * they are not constrained to the brand registry.
   */
  items: readonly string[]
}

export type SocialKey =
  | 'github'
  | 'telegram'
  | 'instagram'
  | 'linkedin'
  | 'discord'

export const profile = {
  name: 'Jahongir Abrorkulov',
  role: 'Full-Stack & AI Engineer',
  age: 16,
  location: 'Tashkent, Uzbekistan',
  tagline:
    'I build products end to end — interface, API, database — and I build them with AI in the loop.',
  bio: [
    "I'm a 16-year-old full-stack and AI engineer in Tashkent. I build complete products: the interface people touch, the API behind it, the schema underneath, and the deploy that puts it in front of someone.",
    'Day to day that means TypeScript and React on the front, Next.js or Express on the server, Prisma over PostgreSQL and MySQL, and .NET or C++ when a problem is better solved closer to the metal.',
    'AI is not a sidebar in that process — it is part of the toolchain. I work in Claude Code for architecture and refactoring, use Gemini to pressure-test a plan before I commit to it, and verify everything the toolchain will let me verify.',
  ],
  languages: [
    { name: 'Uzbek', level: 'Native' },
    { name: 'Russian', level: 'Native' },
    { name: 'English', level: 'IELTS 5.5' },
  ],
  expertise: [
    {
      category: 'Frontend & Product',
      items: [
        'TypeScript',
        'React',
        'Next.js',
        'React Native',
        'Tailwind CSS',
        'Framer Motion',
      ],
    },
    {
      category: 'Backend & Data',
      items: [
        'Node.js',
        'Express.js',
        'Python',
        '.NET',
        'Prisma',
        'PostgreSQL',
        'MySQL',
      ],
    },
    {
      category: 'Systems & AI',
      items: [
        'C++',
        'C#',
        'Reverse Engineering',
        'Claude Code',
        'Gemini',
        'Linux',
      ],
    },
  ],
  email: 'jahongir.abrorkulov@gmail.com',
  /**
   * Entries still pointing at a bare domain root are treated as unconfigured
   * and filtered out of the footer — see `ContactSection`. Fill in a handle and
   * the row appears on its own.
   */
  socials: {
    github: 'https://github.com/abrorkulov',
    telegram: 'https://t.me/',
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/in/jahongir-abrorkulov',
    discord: 'https://discord.com',
  },
} satisfies {
  name: string
  role: string
  age: number
  location: string
  tagline: string
  bio: readonly string[]
  languages: readonly Language[]
  expertise: readonly ExpertiseGroup[]
  email: string
  socials: Record<SocialKey, string>
}

export const education = [
  {
    school: 'MARS IT Space',
    branch: 'Sergeli branch',
    detail: 'Frontend engineering & software fundamentals track',
  },
  {
    school: "Najot Ta'lim",
    branch: 'Chilonzor branch',
    detail: 'AI Engineering & systems coursework',
  },
] as const
