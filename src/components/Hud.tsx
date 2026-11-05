import { useEffect, useRef, useState } from 'react'
import Scramble from './Scramble'
import { meta, nav } from '../data/site'

const TOP_ADDRESS = 0x7fffffff

/**
 * The name, the sections, and an address that counts down as you scroll: the
 * page is laid out as a descent, and this is the only thing that says so at
 * every moment.
 *
 * The colour is set from whichever section is under the bar. `mix-blend-mode:
 * difference` would have been one line, but difference against the ember
 * section comes out cyan, and the site only has one accent.
 */
export default function Hud() {
  const [theme, setTheme] = useState('dark')
  const [active, setActive] = useState('')
  const address = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>('[data-theme]')]
    // A thin band across the top of the screen: whatever crosses it is what the
    // bar is sitting on.
    const top = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          setTheme(el.dataset.theme ?? 'dark')
          setActive(el.id)
        }
      },
      { rootMargin: '-4% 0px -95% 0px' },
    )
    sections.forEach((s) => top.observe(s))
    return () => top.disconnect()
  }, [])

  useEffect(() => {
    let raf = 0
    const paint = () => {
      raf = 0
      const root = document.documentElement
      const max = root.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0
      const value = Math.round(TOP_ADDRESS * (1 - progress))
      if (address.current) {
        address.current.textContent = `0x${value.toString(16).toUpperCase().padStart(8, '0')}`
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <header className="hud" data-hud={theme}>
        <a className="hud-name" href="#top" aria-label={`${meta.name}, back to top`}>
          <Scramble text="J.ABRORKULOV" />
        </a>
        <span ref={address} className="hud-address" aria-hidden="true">
          0x7FFFFFFF
        </span>
        <nav className="hud-nav" aria-label="Sections">
          {nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active === item.id ? 'true' : undefined}
            >
              <Scramble text={item.label} />
            </a>
          ))}
        </nav>
    </header>
  )
}
