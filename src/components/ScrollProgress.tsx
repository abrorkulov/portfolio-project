import { motion, useScroll, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ArrowUp, MessageCircle } from 'lucide-react'

const sections = [
  { id: 'about', label: 'About' },
  { id: 'trajectory', label: 'Journey' },
  { id: 'skills', label: 'Skills' },
  { id: 'playground', label: 'Playground' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
]

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  const [isVisible, setIsVisible] = useState(false)
  const [activeSection, setActiveSection] = useState('about')

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100)

      // Section scroll spy
      const scrollPosition = window.scrollY + 200
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id)
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id)
          break
        }
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToContact = () => {
    const contact = document.getElementById('contact')
    if (contact) {
      contact.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* Progress bar at top */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-signal via-signal-bright to-pulse origin-left z-50"
        style={{ scaleX }}
      />

      {/* Section dots indicator */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3"
      >
        {sections.map((section) => (
          <motion.button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className="relative group flex items-center gap-3"
            whileHover={{ x: 5 }}
          >
            {/* Tooltip */}
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="absolute left-8 px-2 py-1 bg-void border border-white/10 rounded text-xs font-mono text-ink whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {section.label}
            </motion.span>
            
            {/* Dot */}
            <motion.div
              className={`w-2 h-2 rounded-full transition-colors ${
                activeSection === section.id ? 'bg-signal' : 'bg-white/20'
              }`}
              animate={{
                scale: activeSection === section.id ? [1, 1.3, 1] : 1,
              }}
              transition={{
                duration: 0.3,
                repeat: activeSection === section.id ? Infinity : 0,
                repeatDelay: 1,
              }}
            />
            
            {/* Active line */}
            {activeSection === section.id && (
              <motion.div
                layoutId="activeSectionLine"
                className="absolute left-0 w-8 h-0.5 bg-gradient-to-r from-signal to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Floating action buttons */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        {/* Contact button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={scrollToContact}
          className="p-4 bg-gradient-to-br from-pulse to-signal rounded-full shadow-lg shadow-pulse/20 hover:shadow-pulse/40 transition-all hover:scale-110 group"
          aria-label="Contact"
        >
          <MessageCircle className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
        </motion.button>

        {/* Scroll to top button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          onClick={scrollToTop}
          className="p-4 bg-gradient-to-br from-signal to-pulse rounded-full shadow-lg shadow-signal/20 hover:shadow-signal/40 transition-all hover:scale-110 group"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 text-white group-hover:-translate-y-0.5 transition-transform" />
        </motion.button>
      </div>
    </>
  )
}
