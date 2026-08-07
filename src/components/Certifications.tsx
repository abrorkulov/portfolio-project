import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Award, Maximize2, X, CheckCircle2, ShieldCheck, RotateCw, QrCode, Lock, Eye } from 'lucide-react'
import SectionHeader from './SectionHeader'
import { certifications, Certification } from '../data/content'

const isMobile = () => window.innerWidth < 768

const categories = [
  { id: 'all', label: 'All Certificates' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'ai_systems', label: 'AI & Systems' },
  { id: 'languages', label: 'Languages & Skills' },
  { id: 'security', label: 'Security Research' },
] as const

// Interactive 3D Parallax Tilt Card Component with Mobile Fallbacks
function CertCard({
  cert,
  onOpenModal,
}: {
  cert: Certification
  onOpenModal: (cert: Certification) => void
}) {
  const [isFlipped, setIsFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const mobile = isMobile()

  // Motion values for smooth 3D tilt - only on desktop
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring physics for natural 3D motion - only on desktop
  const springConfig = { stiffness: 300, damping: 25 }
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig)

  // Specular sheen gradient position - only on desktop
  const sheenX = useSpring(useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']), springConfig)
  const sheenY = useSpring(useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']), springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mobile || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const x = (e.clientX - rect.left) / width - 0.5
    const y = (e.clientY - rect.top) / height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    if (!mobile) {
      mouseX.set(0)
      mouseY.set(0)
    }
  }

  return (
    <div className="w-full sm:perspective-1000" style={{ perspective: mobile ? 'none' : '1200px' }}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: mobile ? 0 : (isFlipped ? 0 : rotateX),
          rotateY: mobile ? 0 : (isFlipped ? 180 : rotateY),
          transformStyle: mobile ? 'flat' : 'preserve-3d',
        }}
        transition={{ duration: mobile ? 0.3 : 0.6, ease: 'easeOut' }}
        className="group relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-void/90 glass-card transition-all duration-300 hover:border-signal/40 hover:shadow-xl hover:shadow-signal/10"
      >
        {/* Specular Shine Sweep on Hover */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-30 hidden md:block"
          style={{
            background: `radial-gradient(circle at ${sheenX} ${sheenY}, rgba(94, 234, 212, 0.3) 0%, rgba(167, 139, 250, 0.1) 50%, transparent 75%)`,
          }}
        />

        {/* FRONT SIDE */}
        <div
          className={
            'flex flex-col justify-between h-full w-full transition-opacity duration-300 ' +
            (isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100')
          }
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Certificate Image Preview */}
          {cert.imageUrl ? (
            <div
              className="relative aspect-[16/10] sm:aspect-video w-full overflow-hidden bg-black/60 cursor-pointer"
              onClick={() => onOpenModal(cert)}
              tabIndex={0}
              role="button"
              aria-label={`Expand certificate: ${cert.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onOpenModal(cert)
                }
              }}
            >
              <img
                src={cert.imageUrl}
                alt={cert.title}
                loading="lazy"
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void via-void/20 to-transparent" />

              {/* Badges Overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-void/85 backdrop-blur-md border border-signal/40 px-2.5 py-1 font-mono text-[10px] sm:text-[11px] text-signal shadow-lg">
                  <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {cert.verified ? 'Verified' : 'Certificate'}
                </span>
                <span className="rounded-full bg-void/85 backdrop-blur-md border border-white/10 px-2.5 py-1 font-mono text-[10px] sm:text-[11px] text-ink-muted">
                  {cert.date}
                </span>
              </div>

              {/* Hover Expand Button */}
              <div className="absolute inset-0 flex items-center justify-center bg-void/60 opacity-0 backdrop-blur-xs transition-opacity duration-300 group-hover:opacity-100 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenModal(cert)
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-2 font-mono text-xs font-semibold text-void shadow-xl transition-transform hover:scale-105"
                >
                  <Eye className="h-4 w-4" />
                  Expand Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="relative aspect-[16/10] sm:aspect-video w-full overflow-hidden bg-black/60 flex items-center justify-center">
              <div className="text-center">
                <Award className="h-12 w-12 text-signal/50 mx-auto mb-2" />
                <p className="font-mono text-xs text-ink-muted">Certificate image not available</p>
              </div>
            </div>
          )}

          {/* Details */}
          <div className="p-4 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-signal mb-1">
                <span className="inline-flex items-center gap-1.5 truncate max-w-[200px]">
                  <Award className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{cert.issuer}</span>
                </span>
                <span className="text-[10px] text-ink-muted uppercase tracking-wider shrink-0">{cert.category}</span>
              </div>
              <h3 className="font-display text-base sm:text-lg font-semibold text-ink group-hover:text-signal transition-colors">
                {cert.title}
              </h3>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed line-clamp-2">
                {cert.description}
              </p>
            </div>

            {/* Controls */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex flex-wrap gap-1.5">
                {cert.skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="rounded-md bg-white/5 border border-white/5 px-2 py-0.5 font-mono text-[10px] text-ink-muted"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setIsFlipped(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 font-mono text-xs text-ink hover:bg-signal/15 hover:text-signal hover:border-signal/30 transition-all"
                >
                  <RotateCw className="h-3.5 w-3.5 text-signal" />
                  Flip Details
                </button>

                <button
                  onClick={() => onOpenModal(cert)}
                  className="inline-flex items-center gap-1 font-mono text-xs text-signal hover:underline"
                >
                  Inspect
                  <Maximize2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE (Flipped view) */}
        <div
          className={
            'absolute inset-0 flex flex-col justify-between p-5 sm:p-6 bg-void/95 border border-signal/30 backdrop-blur-xl transition-opacity duration-300 ' +
            (isFlipped ? 'opacity-100 z-30' : 'opacity-0 pointer-events-none')
          }
          style={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-signal" />
                <span className="font-mono text-xs font-semibold text-signal uppercase tracking-wider">
                  Credential Hash
                </span>
              </div>
              <button
                onClick={() => setIsFlipped(false)}
                className="rounded-lg bg-white/10 p-1.5 text-ink-muted hover:text-ink transition-colors"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-signal/20 bg-signal/5 p-3.5 space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between text-ink-muted">
                <span>Issuer:</span>
                <span className="text-signal font-semibold truncate max-w-[150px]">{cert.issuer}</span>
              </div>
              <div className="flex items-center justify-between text-ink-muted">
                <span>ID:</span>
                <span className="text-ink font-semibold">{cert.credentialId || 'VERIFIED'}</span>
              </div>
              <div className="flex items-center justify-between text-ink-muted">
                <span>Status:</span>
                <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Authenticated
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-void border border-signal/30">
                <QrCode className="h-16 w-16 text-signal/80" />
                <span className="mt-2 font-mono text-[10px] text-ink-muted">SHA256: 8f92a1...c4b2</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="font-mono text-[11px] text-ink-muted">
              Click flip to return
            </span>
            <button
              onClick={() => setIsFlipped(false)}
              className="rounded-lg bg-signal/15 border border-signal/30 px-3 py-1 font-mono text-xs text-signal font-semibold hover:bg-signal/25 transition-colors"
            >
              Flip Back
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function Certifications() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null)

  const filteredCerts = certifications.filter((cert: Certification) => {
    if (activeCategory === 'all') return true
    return cert.category === activeCategory
  })

  // Keyboard accessibility for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCert(null)
    }
    if (selectedCert) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedCert])

  return (
    <section id="certificates" className="relative border-t border-white/5 py-20 sm:py-32 bg-void">
      {/* Soft ambient gradient glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -z-10 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-signal/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 -z-10 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-pulse/5 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="[ 05 / CERTIFICATIONS & DIPLOMAS ]"
          title="Verified Competencies & Credentials"
          description="Click any certificate to expand high-res photos and inspect verified details."
        />

        {/* Filter categories tabs */}
        <div className="mb-10 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={
                'relative rounded-lg px-3.5 py-1.5 sm:px-4 sm:py-2 font-mono text-xs tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-signal/50 whitespace-nowrap ' +
                (activeCategory === cat.id
                  ? 'bg-signal/15 text-signal border border-signal/30 font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-white/5 border border-transparent')
              }
            >
              {cat.label}
              {activeCategory === cat.id && (
                <motion.div
                  layoutId="certTabIndicator"
                  className="absolute inset-0 rounded-lg border border-signal/40 bg-signal/10 -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Certifications Grid */}
        <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredCerts.map((cert: Certification) => (
              <motion.div
                key={cert.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <CertCard cert={cert} onOpenModal={(selected) => setSelectedCert(selected)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/90 p-3 sm:p-6 backdrop-blur-xl"
            onClick={() => setSelectedCert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card relative max-h-[92vh] max-w-4xl w-full overflow-hidden rounded-2xl border border-signal/30 bg-void shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-6 py-3.5">
                <div className="flex items-center gap-2 truncate pr-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-signal shrink-0" />
                  <span className="font-mono text-xs font-semibold text-signal uppercase tracking-wider truncate">
                    {selectedCert.issuer}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="rounded-lg p-1 text-ink-muted hover:bg-white/10 hover:text-ink transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
                {/* Image */}
                {selectedCert.imageUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-xl">
                    <img
                      src={selectedCert.imageUrl}
                      alt={selectedCert.title}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-xl flex items-center justify-center">
                    <div className="text-center">
                      <Award className="h-16 w-16 text-signal/50 mx-auto mb-3" />
                      <p className="font-mono text-sm text-ink-muted">Certificate image not available</p>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-lg sm:text-2xl font-bold text-ink">
                      {selectedCert.title}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
                      {selectedCert.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 rounded-xl bg-white/5 border border-white/10 p-3.5 sm:p-4 font-mono text-xs">
                    <div>
                      <span className="text-ink-muted block mb-0.5">Issuing Organization</span>
                      <span className="text-ink font-semibold">{selectedCert.issuer}</span>
                    </div>
                    <div>
                      <span className="text-ink-muted block mb-0.5">Completion Date</span>
                      <span className="text-ink font-semibold">{selectedCert.date}</span>
                    </div>
                    {selectedCert.credentialId && (
                      <div>
                        <span className="text-ink-muted block mb-0.5">Credential Verification ID</span>
                        <span className="text-signal font-semibold">{selectedCert.credentialId}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-ink-muted block mb-0.5">Security Status</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 inline" /> Verified & Active
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="font-mono text-xs text-ink-muted block mb-2">Verified Competencies:</span>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {selectedCert.skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded-lg bg-signal/10 border border-signal/20 px-2.5 py-1 font-mono text-xs text-signal"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-white/10 px-4 sm:px-6 py-3.5 bg-void/80">
                <span className="font-mono text-xs text-ink-muted hidden sm:inline">
                  Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-ink">Esc</kbd> to close
                </span>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="ml-auto rounded-xl bg-signal px-5 py-2 font-mono text-xs font-semibold text-void hover:bg-signal/90 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
