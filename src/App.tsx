import { lazy, Suspense } from 'react'
import { MotionConfig } from 'framer-motion'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import TrainTimeline from './components/TrainTimeline'
import Skills from './components/Skills'
import Projects from './components/Projects'
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

export default function App() {
  return (
    // reducedMotion="user" is the piece the CSS media query could never cover:
    // Framer animates via JS, so without this the whole page kept moving for
    // people who asked their OS to stop it.
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-hidden bg-void font-body text-ink">
        <ParticleBackground />
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

          <ErrorBoundary fallbackTitle="Timeline Section Fault">
            <TrainTimeline />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Skills Section Fault">
            <Skills />
          </ErrorBoundary>

          {/* Interactive Widgets Section */}
          <section
            id="playground"
            className="section-rule relative py-16 sm:py-24 lg:py-32"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeader
                index="04"
                eyebrow="playground"
                title="Things you can actually play with"
                description="Two small builds running live on this page — a canvas game and a JavaScript scratchpad. No screenshots, no video."
              />

              <div className="space-y-4 sm:space-y-6">
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
              </div>
            </div>
          </section>

          <ErrorBoundary fallbackTitle="Projects Showcase Fault">
            <Projects />
          </ErrorBoundary>
        </main>

        <Footer />
      </div>
    </MotionConfig>
  )
}
