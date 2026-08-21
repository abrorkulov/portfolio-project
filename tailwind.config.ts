import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Small phones (iPhone SE, older Androids) are 360-375px wide; `xs` is
      // the hook for the handful of places a 2-up grid has to drop to 1-up.
      screens: {
        xs: '420px',
      },
      colors: {
        void: {
          DEFAULT: '#09090b',
          soft: '#0a0a0c',
          surface: '#0f0f12',
          line: '#1a1a1f',
        },
        signal: {
          DEFAULT: '#5EEAD4',
          dim: '#2DD4BF',
          bright: '#99F6E4',
        },
        pulse: {
          DEFAULT: '#A78BFA',
          dim: '#8B5CF6',
        },
        ember: {
          DEFAULT: '#FDBA74',
        },
        // Anthropic's warm accent. The AI section is the one part of the page
        // that steps off the teal/violet palette, so the tooling it is about
        // is recognisable at a glance.
        claude: {
          DEFAULT: '#D97757',
          dim: '#C2603F',
          bright: '#E9A184',
        },
        ink: {
          DEFAULT: '#E6EDF3',
          muted: '#7C8B9C',
          faint: '#48556A',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, #1C2635 1px, transparent 1px), linear-gradient(to bottom, #1C2635 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '48px 48px',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(94,234,212,0.35)',
        'glow-violet': '0 0 40px -8px rgba(167,139,250,0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        scan: 'scan 6s linear infinite',
        blink: 'blink 1.1s step-end infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
