import { lazy, Suspense } from 'react'
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

// Code splitting heavy interactive components for performance optimization
const PacketRunner = lazy(() => import('./components/PacketRunner'))
const CodePlayground = lazy(() => import('./components/CodePlayground'))

// Cyberpunk Skeleton Fallback loader
function ComponentSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`skeleton-shimmer glass-card w-full ${height} rounded-2xl border border-white/5 p-8 flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-signal border-t-transparent" />
        <span className="font-mono text-xs text-signal/80">Initializing Module...</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div id="top" className="relative min-h-screen overflow-x-hidden bg-void text-ink font-body">
      <ParticleBackground />
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
        <section id="playground" className="relative border-t border-white/5 py-32">
          <div className="mx-auto max-w-7xl px-6 space-y-8">
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
        </section>

        <ErrorBoundary fallbackTitle="Projects Showcase Fault">
          <Projects />
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  )
}