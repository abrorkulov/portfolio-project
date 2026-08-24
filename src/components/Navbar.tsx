import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ease, isLiteMotion, spring } from '../lib/motion'
import { useScrollSpy, useScrolledPast } from '../lib/useScrollSpy'
import { useMagnetic } from '../lib/pointerFx'
import { Code2, Menu, X } from 'lucide-react'

const links = [
  { href: '#about', id: 'about', label: 'about' },
  { href: '#trajectory', id: 'trajectory', label: 'journey' },
  { href: '#skills', id: 'skills', label: 'skills' },
  { href: '#ai', id: 'ai', label: 'ai' },
  { href: '#playground', id: 'playground', label: 'playground' },
]

const sectionIds = links.map((link) => link.id)

export default function Navbar() {
  // Both of these used to be a hand-rolled `scroll` listener that read
  // `element.offsetTop` on every event — a forced layout flush, on the main
  // thread, mid-scroll, and the scroll rail ran a second copy of it.
  const scrolled = useScrolledPast(24)
  const activeSection = useScrollSpy(sectionIds)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const connectRef = useMagnetic<HTMLAnchorElement>(0.28)

  // A drawer that leaves the page scrolling underneath it feels broken on
  // phones, and Escape should always be a way out.
  useEffect(() => {
    if (!mobileMenuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileMenuOpen])

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const targetId = href.replace('#', '')
    if (targetId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const elem = document.getElementById(targetId)
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <motion.header
      initial={isLiteMotion ? false : { y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: ease.out }}
      className={
        'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-500 ' +
        (scrolled || mobileMenuOpen
          ? 'glass-card border-b border-white/10 shadow-[0_10px_40px_-24px_rgba(94,234,212,0.6)]'
          : 'border-b border-transparent bg-transparent')
      }
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8"
      >
        {/* Brand Logo */}
        <motion.a
          href="#top"
          onClick={(e) => handleNavClick(e, '#top')}
          whileHover={{ scale: 1.03 }}
          transition={spring.snappy}
          className="group flex items-center gap-2 rounded-lg p-1 font-display font-semibold focus:outline-none focus:ring-2 focus:ring-signal/50"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-signal/25 bg-signal/10 transition-colors duration-300 group-hover:border-signal/50 group-hover:bg-signal/20">
            <Code2 className="h-4 w-4 text-signal" />
          </span>
          <span className="font-mono text-sm text-ink">
            <span className="text-ink-muted">~/</span>jahongir.dev
          </span>
        </motion.a>

        {/* Desktop links. The active state is a pill that slides between items
            rather than five independent highlights flicking on and off. */}
        <ul className="hidden items-center gap-1 font-mono text-xs uppercase tracking-wider text-ink-muted lg:flex">
          {links.map((link) => {
            const isActive = activeSection === link.id
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  aria-current={isActive ? 'page' : undefined}
                  className={
                    'relative block rounded-full px-3 py-2 transition-colors duration-300 focus:outline-none focus:ring-1 focus:ring-signal ' +
                    (isActive ? 'text-signal' : 'hover:text-ink')
                  }
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeNavTab"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border border-signal/25 bg-signal/10"
                      transition={spring.layout}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </a>
              </li>
            )
          })}
        </ul>

        {/* Desktop Action & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <a
            ref={connectRef}
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            className="glow-border hidden min-h-[40px] items-center rounded-full border border-signal/30 bg-signal/10 px-5 py-2 font-mono text-xs uppercase tracking-wider text-signal transition-colors duration-300 hover:bg-signal/20 sm:inline-flex"
          >
            connect
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-11 w-11 place-items-center rounded-xl text-ink-muted transition-colors hover:bg-white/10 hover:text-ink lg:hidden"
            aria-label={
              mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileMenuOpen ? 'close' : 'open'}
                initial={isLiteMotion ? false : { opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={isLiteMotion ? undefined : { opacity: 0, rotate: 90 }}
                transition={{ duration: isLiteMotion ? 0 : 0.18, ease: ease.out }}
                className="grid place-items-center"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            // Animating `height: auto` relayouts the drawer on every frame.
            // The full tier can afford it for 300ms on a deliberate tap;
            // touch devices get the panel immediately.
            initial={isLiteMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={isLiteMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: isLiteMotion ? 0 : 0.3, ease: ease.out }}
            className="overflow-hidden border-b border-white/10 bg-void/95 lg:hidden"
          >
            <motion.ul
              initial="hidden"
              animate="show"
              variants={
                isLiteMotion
                  ? { hidden: {}, show: {} }
                  : { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
              }
              className="flex flex-col gap-1 px-4 py-4 font-mono text-sm uppercase tracking-wider"
            >
              {links.map((link, i) => {
                const isActive = activeSection === link.id
                return (
                  <motion.li
                    key={link.href}
                    variants={
                      isLiteMotion
                        ? { hidden: {}, show: {} }
                        : { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }
                    }
                  >
                    <a
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      aria-current={isActive ? 'page' : undefined}
                      className={
                        'flex min-h-[48px] items-center gap-3 rounded-xl px-3 transition-colors ' +
                        (isActive
                          ? 'bg-signal/10 font-semibold text-signal'
                          : 'text-ink-muted hover:bg-white/5 hover:text-ink')
                      }
                    >
                      <span className="section-index text-[10px] text-ink-faint">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {link.label}
                    </a>
                  </motion.li>
                )
              })}
              <motion.li
                variants={
                  isLiteMotion
                    ? { hidden: {}, show: {} }
                    : { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }
                }
                className="mt-2"
              >
                <a
                  href="#contact"
                  onClick={(e) => handleNavClick(e, '#contact')}
                  className="flex min-h-[48px] items-center justify-center rounded-xl border border-signal/30 bg-signal/10 px-3 font-mono text-sm uppercase tracking-wider text-signal"
                >
                  connect
                </a>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
