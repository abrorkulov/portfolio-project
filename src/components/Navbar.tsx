import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ease, spring } from '../lib/motion'
import { Code2, Menu, X } from 'lucide-react'

const links = [
  { href: '#about', id: 'about', label: 'about' },
  { href: '#trajectory', id: 'trajectory', label: 'journey' },
  { href: '#skills', id: 'skills', label: 'skills' },
  { href: '#playground', id: 'playground', label: 'playground' },
  { href: '#projects', id: 'projects', label: 'projects' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('about')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ScrollSpy & background glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24)

      // Section scroll spy calculation
      const sections = links
        .map((link) => document.getElementById(link.id))
        .filter(Boolean) as HTMLElement[]
      const scrollPosition = window.scrollY + 120

      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = sections[i]
        if (sec && sec.offsetTop <= scrollPosition) {
          setActiveSection(sec.id)
          break
        }
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={
        'fixed inset-x-0 top-0 z-50 transition-all duration-300 ' +
        (scrolled || mobileMenuOpen
          ? 'glass-card border-b border-white/10 backdrop-blur-xl'
          : 'bg-transparent')
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
          className="flex items-center gap-2 font-display font-semibold text-gradient focus:outline-none focus:ring-2 focus:ring-signal/50 rounded-lg p-1"
        >
          <Code2 className="h-5 w-5 text-signal" />
          <span className="font-mono text-sm text-ink">
            <span className="text-ink-muted">~/</span>jahongir.dev
          </span>
        </motion.a>

        {/* Desktop Links with ScrollSpy highlighting */}
        <ul className="hidden items-center gap-6 font-mono text-xs uppercase tracking-wider text-ink-muted md:flex">
          {links.map((link) => {
            const isActive = activeSection === link.id
            return (
              <li key={link.href}>
                <motion.a
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  whileHover={{ y: -2 }}
                  className={
                    'relative transition-colors py-1 group focus:outline-none focus:ring-1 focus:ring-signal ' +
                    (isActive
                      ? 'text-signal font-semibold'
                      : 'hover:text-signal')
                  }
                >
                  {link.label}

                  {/* Active Link Highlight bar */}
                  {isActive ? (
                    <motion.span
                      layoutId="activeNavTab"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-signal to-pulse rounded-full"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  ) : (
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-signal to-pulse transition-all group-hover:w-full rounded-full" />
                  )}
                </motion.a>
              </li>
            )
          })}
        </ul>

        {/* Desktop Action & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <motion.a
            whileHover={{ scale: 1.05 }}
            href="#contact"
            onClick={(e) => handleNavClick(e, '#contact')}
            transition={spring.snappy}
            className="glow-border hidden min-h-[40px] items-center rounded-full border border-signal/30 bg-signal/10 px-5 py-2 font-mono text-xs uppercase tracking-wider text-signal transition-colors hover:bg-signal/20 sm:inline-flex"
          >
            connect
          </motion.a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-11 w-11 place-items-center rounded-xl text-ink-muted transition-colors hover:bg-white/10 hover:text-ink md:hidden"
            aria-label={
              mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: ease.out }}
            className="overflow-hidden border-b border-white/10 bg-void/95 backdrop-blur-xl md:hidden"
          >
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05 } },
              }}
              className="flex flex-col gap-1 px-4 py-4 font-mono text-sm uppercase tracking-wider"
            >
              {links.map((link) => {
                const isActive = activeSection === link.id
                return (
                  <motion.li
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, x: -12 },
                      show: { opacity: 1, x: 0 },
                    }}
                  >
                    <a
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      aria-current={isActive ? 'page' : undefined}
                      className={
                        'flex min-h-[48px] items-center rounded-xl px-3 transition-colors ' +
                        (isActive
                          ? 'bg-signal/10 font-semibold text-signal'
                          : 'text-ink-muted hover:bg-white/5 hover:text-ink')
                      }
                    >
                      {link.label}
                    </a>
                  </motion.li>
                )
              })}
              <motion.li
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  show: { opacity: 1, x: 0 },
                }}
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
