import { useEffect } from 'react'
import { MotionConfig } from 'framer-motion'
import { isLiteMotion } from '@/shared/motion/motion'
import { initAnalytics } from '@/shared/lib/analytics'

import Navbar from '@/features/chrome/Navbar'
import ScrollProgress from '@/features/chrome/ScrollProgress'
import ParticleBackground from '@/features/chrome/ParticleBackground'
import CursorGlow from '@/features/chrome/CursorGlow'

import Hero from '@/features/hero/Hero'
import About from '@/features/about/About'
import JourneySection from '@/features/journey/JourneySection'
import SkillsSection from '@/features/skills/SkillsSection'
import AiSection from '@/features/ai/AiSection'
import PlaygroundSection from '@/features/playground/PlaygroundSection'
import ProjectsSection from '@/features/projects/ProjectsSection'
import ContactSection from '@/features/contact/ContactSection'

import ErrorBoundary from '@/shared/ui/ErrorBoundary'

/**
 * Every section, each behind its own error boundary.
 *
 * The boundaries are per-section rather than one around the tree on purpose: a
 * WebGL context that fails to initialise, or a canvas widget that throws on an
 * exotic browser, should cost the visitor that one panel — not the whole page.
 *
 * The order here is the page order, and it must match `app/sections.ts`, which
 * is what the navbar, the scroll rail and every section's number are derived
 * from.
 */
const SECTIONS = [
  { id: 'hero', label: 'Hero', Component: Hero },
  { id: 'about', label: 'About', Component: About },
  { id: 'journey', label: 'Journey', Component: JourneySection },
  { id: 'skills', label: 'Skills', Component: SkillsSection },
  { id: 'ai', label: 'AI practice', Component: AiSection },
  { id: 'playground', label: 'Playground', Component: PlaygroundSection },
  { id: 'projects', label: 'Projects', Component: ProjectsSection },
] as const

export default function App() {
  // Analytics observes `section[id]`, so it can only run once those exist.
  // It used to be called from `main.tsx` before `render()`, against an empty
  // `#root` — it matched nothing and never fired.
  useEffect(() => initAnalytics(), [])

  return (
    // `reducedMotion` is the piece the CSS media query could never cover:
    // Framer animates via JS, so without this the whole page kept moving for
    // people who asked their OS to stop it.
    //
    // On the lite tier it is forced to "always". The variants in
    // `shared/motion/motion.ts` are already inert there, so this is a backstop
    // for any motion component that hand-rolls its own values.
    <MotionConfig reducedMotion={isLiteMotion ? 'always' : 'user'}>
      {/* No background on this wrapper.

          `body::before` paints the page's whole ambient wash and is a fixed,
          z-index:0 child of <body>. This div is also a positioned child of
          <body> with `z-index: auto`, so the two land in the same paint group
          and DOM order decides — meaning an opaque `bg-void` here covered the
          wash completely. The gradients had been invisible for the life of the
          page; the background just looked like flat black.

          The base colour lives on <body> in the stylesheet, where it belongs. */}
      <div className="clip-x relative min-h-screen font-body text-ink">
        <ParticleBackground />
        <CursorGlow />
        <ScrollProgress />
        <Navbar />

        <main>
          {SECTIONS.map(({ id, label, Component }) => (
            <ErrorBoundary key={id} fallbackTitle={`${label} section fault`}>
              <Component />
            </ErrorBoundary>
          ))}
        </main>

        <ErrorBoundary fallbackTitle="Contact section fault">
          <ContactSection />
        </ErrorBoundary>
      </div>
    </MotionConfig>
  )
}
