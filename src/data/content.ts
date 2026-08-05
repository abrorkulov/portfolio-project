// All portfolio copy and structured data lives here so components
// stay presentational and reusable.

export const profile = {
  name: 'Jahongir Abrorkulov',
  role: 'Frontend & AI/Systems Developer',
  age: 15,
  location: 'Tashkent, Uzbekistan',
  bio: [
    "I'm a 15-year-old Frontend & AI/Systems developer based in Tashkent, Uzbekistan, passionate about building high-performance web interfaces and understanding the systems underneath them.",
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
  items: { name: string; level: number }[]
}

export const skillCategories: SkillCategory[] = [
  {
    label: 'Frontend',
    eyebrow: 'interface_layer',
    items: [
      { name: 'React', level: 88 },
      { name: 'TypeScript', level: 82 },
      { name: 'JavaScript', level: 90 },
      { name: 'Tailwind CSS', level: 85 },
    ],
  },
  {
    label: 'Systems & Tools',
    eyebrow: 'kernel_layer',
    items: [
      { name: 'Linux (Ubuntu)', level: 78 },
      { name: 'Git', level: 80 },
      { name: 'Architecture & Low-level Analysis', level: 65 },
      { name: 'Networking Fundamentals', level: 60 },
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

export const interests = [
  {
    name: 'Counter-Strike 2',
    detail: 'Counter-Strike 2 is a tactical first-person shooter developed by Valve.',
    stats: { Faceit: '6 Lvl', hours: '1891', kdr: '1.13' },
  },
  {
    name: 'GTA V',
    detail: 'Open-world systems and the sheer scale of the simulation.',
    stats: { completion: '58%', hours: '800', mode: 'Story + Online' },
  },
  {
    name: 'Forza Horizon 5',
    detail: 'Racing, car culture, and physics-driven gameplay.',
    stats: { level: 'i don\'t know', cars: '25', hours: '98' },
  },
]

export type Certification = {
  id: string
  title: string
  issuer: string
  date: string
  category: 'frontend' | 'ai_systems' | 'languages' | 'security'
  skills: string[]
  credentialId?: string
  credentialUrl?: string
  imageUrl: string
  description: string
  verified: boolean
}

export const certifications: Certification[] = [
  {
    id: 'cert-mars-frontend',
    title: 'Frontend Development & Software Engineering',
    issuer: 'MARS IT Space (Sergeli Branch)',
    date: '2024',
    category: 'frontend',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'JavaScript ES6+', 'UI Architecture'],
    credentialId: 'MARS-FE-2024-88',
    credentialUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    description: 'Comprehensive software engineering certificate covering modern frontend frameworks, responsive UI design systems, and web application architecture.',
    verified: true,
  },
  {
    id: 'cert-najot-ai',
    title: 'AI Engineering & Prompt Engineering Specialization',
    issuer: "Najot Ta'lim (Chilonzor Branch)",
    date: '2026',
    category: 'ai_systems',
    skills: ['AI Systems Integration', 'Advanced Prompting', 'LLM Agents', 'Python', 'Systems API'],
    credentialId: 'NT-AI-2026-902',
    credentialUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    description: 'Specialized coursework in AI systems architecture, agentic workflows, prompt engineering, and intelligent model integration.',
    verified: true,
  },
  {
    id: 'cert-cambridge-ielts',
    title: 'IELTS English Proficiency Certificate (Score 5.5)',
    issuer: 'Cambridge Learning Center (Sergeli Branch)',
    date: '2025',
    category: 'languages',
    skills: ['Academic English', 'Technical Communication', 'Reading & Comprehension', 'Writing'],
    credentialId: 'CLC-IELTS-55',
    credentialUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    description: 'Official English language proficiency certification validating technical reading, writing, listening, and oral communication skills.',
    verified: true,
  },
  {
    id: 'cert-cs2-security',
    title: 'CS2 Low-Level System Security & Reverse Engineering',
    issuer: 'Independent Security Research Lab',
    date: '2025',
    category: 'security',
    skills: ['C++', 'Reverse Engineering', 'Memory Allocation', 'Windows API', 'Process Hooks'],
    credentialId: 'SEC-CS2-2025-01',
    credentialUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    description: 'Practical security research into process memory layouts, kernel hook techniques, and game client state protection mechanisms.',
    verified: true,
  },
]
