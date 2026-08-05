import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, Menu, X } from 'lucide-react'

const links = [
  { href: '#about', id: 'about', label: 'about' },
  { href: '#trajectory', id: 'trajectory', label: 'journey' },
  { href: '#skills', id: 'skills', label: 'skills' },
  { href: '#playground', id: 'playground', label: 'playground' },
  { href: '#projects', id: 'projects', label: 'projects' },
  { href: '#telemetry', id: 'telemetry', label: 'telemetry' },
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
      const sections = links.map((link) => document.getElementById(link.id)).filter(Boolean) as HTMLElement[]
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
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
        (scrolled 
          ? 'glass-card border-b border-white/10 backdrop-blur-xl' 
          : 'bg-transparent')
      }
    >
      <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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
                    (isActive ? 'text-signal font-semibold' : 'hover:text-signal')
                  }
                >
                  {link.label}

                  {/* Active Link Highlight bar */}
                  {isActive ? (
                    <motion.span
                      layoutId="activeNavTab"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-signal to-pulse rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
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
            className="glow-border rounded-full bg-signal/10 border border-signal/30 px-5 py-2 font-mono text-xs uppercase tracking-wider text-signal transition-all hover:bg-signal/20 focus:outline-none focus:ring-2 focus:ring-signal/50"
          >
            connect
          </motion.a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-ink-muted hover:bg-white/10 hover:text-ink md:hidden focus:outline-none focus:ring-2 focus:ring-signal/50"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card border-b border-white/10 bg-void/95 px-6 py-6 md:hidden backdrop-blur-xl"
          >
            <ul className="flex flex-col space-y-4 font-mono text-xs uppercase tracking-wider">
              {links.map((link) => {
                const isActive = activeSection === link.id
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className={
                        'block py-2 transition-colors ' +
                        (isActive ? 'text-signal font-semibold text-sm' : 'text-ink-muted hover:text-signal')
                      }
                    >
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
