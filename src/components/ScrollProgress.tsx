import { motion, useScroll, useSpring } from 'framer-motion'
import { ArrowUp, MessageCircle } from 'lucide-react'
import { useScrollSpy, useScrolledPast } from '../lib/useScrollSpy'
import { isLiteMotion } from '../lib/motion'

const sections = [
  { id: 'about', label: 'About' },
  { id: 'trajectory', label: 'Journey' },
  { id: 'skills', label: 'Skills' },
  { id: 'ai', label: 'AI' },
  { id: 'playground', label: 'Playground' },
  { id: 'contact', label: 'Contact' },
]

const sectionIds = sections.map((section) => section.id)

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  // Shared with the navbar. This component used to run its own `scroll`
  // handler doing the same `offsetTop` reads, so the page was forcing layout
  // twice per scroll event for one piece of information.
  const isVisible = useScrolledPast(100)
  const activeSection = useScrollSpy(sectionIds)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToContact = () => scrollToSection('contact')

  return (
    <>
      {/* Progress bar at top */}
      <motion.div
        className="fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-signal via-signal-bright to-pulse"
        style={{ scaleX }}
      />

      {/* Section rail. Each entry is a label that collapses to a tick until
          it is the active one, so the rail reads as a table of contents
          rather than six anonymous dots. */}
      <motion.nav
        aria-label="Section navigation"
        initial={isLiteMotion ? false : { opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        // Shown only from 2xl. The rail sits at a fixed `left-6`, but the page
        // content is centred in a 1280px container — so anywhere between 1024
        // and ~1500px the expanded labels ran straight into the headline. At
        // 1536px the container's own margin is wider than the rail.
        className="fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1 2xl:flex"
      >
        {sections.map((section) => {
          const isActive = activeSection === section.id
          return (
            <button
              key={section.id}
              type="button"
              aria-label={`Go to ${section.label}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => scrollToSection(section.id)}
              className="group flex items-center gap-3 py-1.5"
            >
              <span
                className={
                  'h-px transition-all duration-500 ' +
                  (isActive
                    ? 'w-8 bg-signal'
                    : 'w-4 bg-white/25 group-hover:w-6 group-hover:bg-white/50')
                }
              />
              <span
                className={
                  'font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ' +
                  (isActive
                    ? 'text-signal opacity-100'
                    : 'text-ink-faint opacity-0 group-hover:opacity-100')
                }
              >
                {section.label}
              </span>
            </button>
          )
        })}
      </motion.nav>

      {/* Floating action buttons */}
      <div className="safe-bottom fixed bottom-5 right-4 z-40 flex flex-col gap-3 sm:bottom-8 sm:right-8">
        {/* Contact button */}
        <motion.button
          initial={isLiteMotion ? false : { opacity: 0, scale: 0 }}
          animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0 }}
          transition={{ duration: isLiteMotion ? 0 : 0.3, delay: 0.1 }}
          style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
          aria-hidden={!isVisible}
          tabIndex={isVisible ? 0 : -1}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={scrollToContact}
          className="group grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-pulse to-signal shadow-lg shadow-pulse/20 transition-shadow hover:shadow-pulse/40 sm:h-14 sm:w-14"
          aria-label="Contact"
        >
          <MessageCircle className="h-5 w-5 text-white transition-transform group-hover:rotate-12" />
        </motion.button>

        {/* Scroll to top button */}
        <motion.button
          initial={isLiteMotion ? false : { opacity: 0, scale: 0 }}
          animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0 }}
          transition={{ duration: isLiteMotion ? 0 : 0.3 }}
          style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
          aria-hidden={!isVisible}
          tabIndex={isVisible ? 0 : -1}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={scrollToTop}
          className="group grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-signal to-pulse shadow-lg shadow-signal/20 transition-shadow hover:shadow-signal/40 sm:h-14 sm:w-14"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5 text-white transition-transform group-hover:-translate-y-0.5" />
        </motion.button>
      </div>
    </>
  )
}
