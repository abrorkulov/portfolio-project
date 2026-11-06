import { useEffect, useLayoutEffect, useState } from 'react'
import { prefersReducedMotion } from './lib/env'
import { flyTo, measureAnchors, routePosition } from './lib/route'
import Hud from './components/Hud'
import Lab from './components/Lab'
import Space from './components/Space'
import { About, Also, Clauding, Contact, Hero, Leg, ProjectStop, Stack } from './components/Stops'
import { route, work } from './data/site'

/**
 * One flight, read top to bottom. The page is a transparent sheet over a fixed
 * canvas: stops are where the camera holds, legs are the scroll between them.
 *
 * Whether a panel is showing is a `data-here` attribute written directly, never
 * React's className. React owns className and rewrites it on any render that changes
 * it, which once wiped this exact state at the worst moment.
 */
export default function App() {
  const [cracked, setCracked] = useState(false)

  // The browser looks for the anchor while #root is still empty, finds nothing
  // and stays at the top, so a shared link to #contact has to be honoured here.
  useLayoutEffect(() => {
    const target = window.location.hash.slice(1)
    if (!target) return
    // 'instant', not 'auto': auto inherits the stylesheet's smooth scrolling, and a
    // thirty-screen flight would still be in the air when the fonts arrive and move
    // everything. Then once more, because the fonts do move everything.
    const jump = () =>
      document.getElementById(target)?.scrollIntoView({ behavior: 'instant' as ScrollBehavior })
    jump()
    void document.fonts.ready.then(jump)
  }, [])

  // Every link inside the page is a flight. With reduced motion it stays a plain jump.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (prefersReducedMotion() || event.metaKey || event.ctrlKey || event.shiftKey) return
      const link = (event.target as Element).closest?.('a[href^="#"]')
      const id = link?.getAttribute('href')?.slice(1)
      if (!id || !document.getElementById(id)) return
      event.preventDefault()
      window.history.replaceState(null, '', `#${id}`)
      flyTo(id)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // Words show only while the camera is holding at their world. Going by the route
  // rather than by what is on screen is what clears a panel the moment the camera
  // leaves, before the text can scroll up under the header.
  useEffect(() => {
    const stops = route.map(({ id }) => document.getElementById(id))
    const legs = [...document.querySelectorAll<HTMLElement>('.leg')]
    let anchors = measureAnchors()
    let raf = 0
    const set = (el: HTMLElement | null, on: boolean) => {
      if (!el) return
      if (on) el.dataset.here = ''
      else delete el.dataset.here
    }
    const paint = () => {
      raf = 0
      const at = routePosition(anchors, window.scrollY)
      stops.forEach((el, i) => set(el, Math.abs(at - i) < 0.05))
      legs.forEach((el, i) => set(el, at > i + 0.2 && at < i + 0.8))
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    const remeasure = () => {
      anchors = measureAnchors()
      schedule()
    }
    paint()
    const observer = new ResizeObserver(remeasure)
    observer.observe(document.body)
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
    }
  }, [])

  return (
    <>
      <Space />
      <Hud />
      <main>
        <Hero />
        <Leg index={0} />
        <About />
        <Leg index={1} />
        {work.projects.map((project, i) => (
          <div key={project.id} className="contents">
            <ProjectStop project={project} index={i} />
            <Leg index={i + 2} />
          </div>
        ))}
        <Also />
        <Leg index={6} />
        <Clauding />
        <Leg index={7} />
        <Lab onCracked={() => setCracked(true)} />
        <Leg index={8} />
        <Stack />
        <Leg index={9} />
        <Contact cracked={cracked} />
      </main>
    </>
  )
}
