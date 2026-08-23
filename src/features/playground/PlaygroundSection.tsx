import { lazy, Suspense } from 'react'
import SectionHeader from '@/shared/ui/SectionHeader'
import ErrorBoundary from '@/shared/ui/ErrorBoundary'
import PanelSkeleton from '@/shared/ui/PanelSkeleton'
import { useNearViewport } from '@/shared/hooks/useNearViewport'

/**
 * The two live widgets, and the two rules that keep them off the critical path.
 *
 * `lazy()` defers the *chunk* until the component renders — but these render on
 * the very first pass, five screens above where anyone will see them, so their
 * JavaScript, their canvases and their requestAnimationFrame loops were all
 * competing with the hero for the main thread while the page was still
 * painting. `useNearViewport` holds them until the reader is within 600px,
 * which is what turns `lazy` from a bundling detail into an actual deferral.
 *
 * This lived inline in `App.tsx` along with its own skeleton component. It is a
 * section like every other section, so it owns its own file now and the app
 * shell just lists it.
 */
const PacketRunner = lazy(() => import('@/features/playground/PacketRunner'))
const CodePlayground = lazy(() => import('@/features/playground/CodePlayground'))

export default function PlaygroundSection() {
  const [ref, isNear] = useNearViewport<HTMLDivElement>()

  return (
    <section
      id="playground"
      className="section-rule relative py-16 sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          section="playground"
          eyebrow="playground"
          title="Things you can actually play with"
          description="Two small builds running live on this page — a canvas game and a JavaScript scratchpad. No screenshots, no video."
        />

        <div ref={ref} className="space-y-4 sm:space-y-6">
          {isNear ? (
            <>
              <ErrorBoundary fallbackTitle="Packet Runner fault">
                <Suspense fallback={<PanelSkeleton height="h-[500px]" />}>
                  <PacketRunner />
                </Suspense>
              </ErrorBoundary>

              <ErrorBoundary fallbackTitle="Code Playground fault">
                <Suspense fallback={<PanelSkeleton height="h-[450px]" />}>
                  <CodePlayground />
                </Suspense>
              </ErrorBoundary>
            </>
          ) : (
            <>
              <PanelSkeleton height="h-[500px]" />
              <PanelSkeleton height="h-[450px]" />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
