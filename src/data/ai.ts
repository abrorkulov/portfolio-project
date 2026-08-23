/** The "three years with Claude" section. */

/** Closed union: `ClaudeTerminal` styles each kind, with no default branch. */
export type SessionLineKind = 'shell' | 'brand' | 'user' | 'tool' | 'ok'

export type SessionLine = {
  kind: SessionLineKind
  text: string
}

export type PrincipleIcon = 'context' | 'verify' | 'depth' | 'terminal'

export type Principle = {
  icon: PrincipleIcon
  title: string
  detail: string
}

/** One of the two models, as shown in the tool split. */
export type AiTool = {
  name: string
  /** `TechIcon` slug lookup key — must exist in the brand registry. */
  tech: 'Claude Code' | 'Gemini'
  role: string
  detail: string
  /** Tailwind colour token family driving the card's accent. */
  accent: 'claude' | 'pulse'
  points: readonly string[]
}

export const aiPractice = {
  eyebrow: 'ai_toolkit',
  title: 'Three years of building with Claude',
  description:
    'AI is part of how I actually work, not a tab I keep open. Claude Code does the building; Gemini gets the plan before I commit to it.',

  /**
   * The opening shot of the section: the CLI itself.
   *
   * It is a drawn depiction rather than a capture, so it stays sharp at any
   * size and costs ~4 kB. Dropping a real screenshot in at the same path swaps
   * it with no code change — which is the point of keeping it in data.
   *
   * It sits *above* the live terminal replay, not beside it, and the two are
   * doing different jobs: this is what the tool looks like, the replay is what
   * using it looks like.
   */
  image: {
    src: '/claude-code.svg',
    alt: 'The Claude Code CLI in a terminal, reading and editing files in this portfolio repository.',
    caption:
      'Claude Code, running in the same terminal as git and the dev server.',
    badge: 'the only ai tool i build with',
  },

  paragraphs: [
    'I have been working with AI for three years, and all three of them have been with Claude. Not asking it for snippets — learning how to brief it, how much context it needs before it is useful, and how to read what it gives back. Getting good at that took far longer than learning any tool.',
    'Claude is an AI assistant built by Anthropic, and in my experience it is one of the best models there is. It reads a whole codebase rather than a pasted fragment, follows the conventions a project already has, and explains its reasoning — so I can argue with it instead of copying from it.',
    'I have a lot of respect for the engineers at Anthropic who built Claude Code. It is a genuinely well-made piece of software, and a good deal of what I know about writing and reviewing code I learned working alongside it.',
  ],

  /** The one-line claim the section is built around. */
  callout:
    'Claude Code for building, in the terminal. Gemini for strategy, before anything gets built. Nothing pasted between windows.',

  /** The two-model split, rendered as a pair of cards. */
  tools: [
    {
      name: 'Claude Code',
      tech: 'Claude Code',
      role: 'Building',
      detail:
        'Architecture and refactoring, in the terminal next to git and the dev server. It reads the whole repository, follows the conventions already there, and explains itself well enough to argue with.',
      accent: 'claude',
      points: [
        'Full-stack architecture',
        'Refactors across many files',
        'Reviews its own diff',
      ],
    },
    {
      name: 'Gemini',
      tech: 'Gemini',
      role: 'Planning',
      detail:
        'One step earlier in the process: scoping, trade-offs, and what the thing should even be. Two models that disagree about an approach catch what one agreeable model never will.',
      accent: 'pulse',
      points: [
        'Strategy and scoping',
        'Trade-offs before code',
        'A second opinion that pushes back',
      ],
    },
  ],

  stats: [
    { label: 'working with ai', value: '3 years' },
    { label: 'building with', value: 'Claude Code' },
    { label: 'planning with', value: 'Gemini' },
    { label: 'where it runs', value: 'Terminal' },
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
      title: 'Plan in one, build in another',
      detail:
        'Gemini pressure-tests the approach, Claude Code executes it. Two models that disagree catch what one agreeable model never will.',
    },
    {
      icon: 'terminal',
      title: 'Where the work already is',
      detail:
        'It runs next to git, the dev server and the build, so there is no copying between a browser tab and an editor.',
    },
  ],

  /**
   * Replayed by `ClaudeTerminal`. Keep the lines short — the widget types every
   * character, and a long line stalls the whole sequence.
   */
  session: [
    { kind: 'shell', text: '~/portfolio $ claude' },
    { kind: 'brand', text: 'Claude Code — connected to ~/portfolio' },
    { kind: 'user', text: 'restructure src/ into feature modules' },
    { kind: 'tool', text: 'Read  src/app/App.tsx' },
    { kind: 'tool', text: 'Write src/app/sections.ts' },
    { kind: 'ok', text: 'tsc + eslint + vite build — all clean' },
    { kind: 'user', text: 'ship it' },
  ],
} satisfies {
  eyebrow: string
  title: string
  description: string
  paragraphs: readonly string[]
  callout: string
  image: { src: string; alt: string; caption: string; badge: string }
  tools: readonly AiTool[]
  stats: readonly { label: string; value: string }[]
  principles: readonly Principle[]
  session: readonly SessionLine[]
}
