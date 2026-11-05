import { useEffect, useLayoutEffect, useState } from 'react'
import About from './components/About'
import Contact from './components/Contact'
import Descent from './components/Descent'
import Hero from './components/Hero'
import Hud from './components/Hud'
import Lab from './components/Lab'
import Work from './components/Work'

/**
 * The page is one argument read top to bottom: what I ship, then what runs it,
 * then the machine itself.
 *
 * Reveals are a class and a CSS transition, never a tween. A tween interrupted
 * mid-flight strands the element at whatever opacity it reached; a class either
 * is on the element or is not, and CSS finishes the job regardless.
 */
export default function App() {
  const [cracked, setCracked] = useState(false)

  // The browser looks for the anchor while #root is still empty, finds nothing
  // and stays at the top, so a shared link to #contact has to be honoured here.
  useLayoutEffect(() => {
    const target = window.location.hash.slice(1)
    if (target) document.getElementById(target)?.scrollIntoView({ behavior: 'auto' })
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <Hud />
      <main>
        <Hero />
        <About />
        <Work />
        <Descent />
        <Lab onCracked={() => setCracked(true)} />
        <Contact cracked={cracked} />
      </main>
    </>
  )
}
