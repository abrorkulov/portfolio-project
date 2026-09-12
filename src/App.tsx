import { useCallback, useEffect, useRef, useState } from 'react'
import Snow from './components/Snow'
import SceneStage from './components/SceneStage'
import StepRail from './components/StepRail'
import HomeScene from './scenes/HomeScene'
import AboutScene from './scenes/AboutScene'
import StudyScene from './scenes/StudyScene'
import StackScene from './scenes/StackScene'
import ContactScene from './scenes/ContactScene'
import { pages } from './data/site'

const LAST = pages.length - 1

function pageFromHash(): number {
  if (typeof window === 'undefined') return 0
  const found = pages.findIndex((entry) => entry.id === window.location.hash.slice(1))
  return found === -1 ? 0 : found
}

export default function App() {
  const [page, setPage] = useState(pageFromHash)

  // Each page performs its typing once per visit. Coming back to the home
  // screen and watching the word write itself again is charm the second time
  // and a wait every time after that.
  const seen = useRef(new Set<number>())

  const go = useCallback((next: number) => {
    setPage((current) => {
      const target = Math.max(0, Math.min(LAST, next))
      seen.current.add(current)
      return target
    })
  }, [])

  // The hash is a label on the current page, written with `replaceState` so
  // the back button leaves the site instead of walking the visitor backwards
  // through five screens they already saw.
  useEffect(() => {
    window.history.replaceState(null, '', `#${pages[page].id}`)
  }, [page])

  // Someone editing the hash by hand, or following a link into the site while
  // it is already open, should land on that page.
  useEffect(() => {
    const onHash = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown') go(page + 1)
      if (event.key === 'ArrowUp' || event.key === 'PageUp') go(page - 1)
      // The deck owns the left and right keys while it is on screen; it is
      // the thing the reader is most obviously pointing at.
      if (page === 2) return
      if (event.key === 'ArrowRight') go(page + 1)
      if (event.key === 'ArrowLeft') go(page - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, page])

  return (
    <div className="app">
      <Snow />

      <main className="viewport">
        <SceneStage page={page}>
          {(shown) => {
            if (shown === 1) {
              return <AboutScene onNext={() => go(2)} instant={seen.current.has(1)} />
            }
            if (shown === 2) return <StudyScene onNext={() => go(3)} />
            if (shown === 3) return <StackScene onNext={() => go(4)} />
            if (shown === 4) return <ContactScene />
            return <HomeScene onNext={() => go(1)} instant={seen.current.has(0)} />
          }}
        </SceneStage>
      </main>

      <StepRail page={page} onGo={go} />
    </div>
  )
}
