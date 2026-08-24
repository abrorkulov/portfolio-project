import { lazy, Suspense } from 'react'
import { MotionConfig } from 'framer-motion'
import { isLiteMotion } from './lib/motion'
import { useNearViewport } from './lib/useNearViewport'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Journey from './components/Journey'
import Statement from './components/Statement'
import Skills from './components/Skills'
import AiPractice from './components/AiPractice'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import ScrollProgress from './components/ScrollProgress'
import ParticleBackground from './components/ParticleBackground'
import CursorGlow from './components/CursorGlow'
import SectionHeader from './components/SectionHeader'

// Code splitting heavy interactive components for performance optimization
const PacketRunner = lazy(() => import('./components/PacketRunner'))
const CodePlayground = lazy(() => import('./components/CodePlayground'))

// Cyberpunk Skeleton Fallback loader
function ComponentSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div
      className={`skeleton-shimmer glass-card w-full ${height} rounded-2xl border border-white/5 p-8 flex items-center justify-center`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-signal border-t-transparent" />
        <span className="font-mono text-xs text-signal/80">
          Initializing Module...
        </span>
      </div>
    </div>
  )
}

/**
 * The two interactive widgets, held back until the reader is near them.
 *
 * Both are `lazy()`, but that only defers the chunk until render — and they
 * render on the very first pass, so their JavaScript, their canvas and their
 * requestAnimationFrame loop were all competing with the hero for the main
 * thread. Now nothing is fetched until the section is within 600px.
 */
function PlaygroundWidgets() {
  const [ref, isNear] = useNearViewport<HTMLDivElement>()

  return (
    <div ref={ref} className="space-y-4 sm:space-y-6">
      {isNear ? (
        <>
          <ErrorBoundary fallbackTitle="PacketRunner Simulation Fault">
            <Suspense fallback={<ComponentSkeleton height="h-[500px]" />}>
              <PacketRunner />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Code Playground Fault">
            <Suspense fallback={<ComponentSkeleton height="h-[450px]" />}>
              <CodePlayground />
            </Suspense>
          </ErrorBoundary>
        </>
      ) : (
        <>
          <ComponentSkeleton height="h-[500px]" />
          <ComponentSkeleton height="h-[450px]" />
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    // `reducedMotion` is the piece the CSS media query could never cover:
    // Framer animates via JS, so without this the whole page kept moving for
    // people who asked their OS to stop it.
    //
    // On the lite tier it is forced to "always". The variants in
    // `lib/motion.ts` are already inert there, so this is a backstop for any
    // motion component that hand-rolls its own values.
    <MotionConfig reducedMotion={isLiteMotion ? 'always' : 'user'}>
      <div className="clip-x relative min-h-screen font-body text-ink">
        <ParticleBackground />
        {/* Light from above and a vignette. After the canvas so the
            constellation is dimmed toward the edges with everything else. */}
        <div aria-hidden="true" className="page-veil" />
        <CursorGlow />
        <ScrollProgress />
        <Navbar />
        <main>
          <ErrorBoundary fallbackTitle="Hero Module Fault">
            <Hero />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="About Section Fault">
            <About />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Journey Section Fault">
            <Journey />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Statement Fault">
            <Statement />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Skills Section Fault">
            <Skills />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="AI Section Fault">
            <AiPractice />
          </ErrorBoundary>

          {/* Interactive Widgets Section */}
          <section
            id="playground"
            className="section-rule relative py-16 sm:py-24 lg:py-32"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeader
                index="05"
                eyebrow="playground"
                title={
                  <>
                    Things you can{' '}
                    <span className="accent-em text-gradient">actually</span>{' '}
                    play with
                  </>
                }
                description="Two small builds running live on this page — a canvas game and a JavaScript scratchpad. No screenshots, no video."
              />

              <PlaygroundWidgets />
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </MotionConfig>
  )
}
