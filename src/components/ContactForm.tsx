import { motion } from 'framer-motion'
import { useState } from 'react'
import { Send, CheckCircle, User, Mail, MessageSquare } from 'lucide-react'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
      setFormData({ name: '', email: '', message: '' })
      
      setTimeout(() => setIsSubmitted(false), 3000)
    }, 1500)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const inputVariants = {
    focused: {
      borderColor: 'rgba(94, 234, 212, 0.5)',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 0 20px rgba(94, 234, 212, 0.1)',
    },
    default: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      boxShadow: 'none',
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4 }}
      className="glass-card glow-border rounded-2xl p-8 relative z-10 overflow-hidden"
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-signal/5 via-transparent to-pulse/5"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-display text-xl font-semibold text-gradient mb-2">
            Send me a message
          </h3>
          <p className="font-mono text-xs text-ink-muted">
            I'll get back to you within 24 hours
          </p>
        </motion.div>
        
        {isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-signal to-pulse flex items-center justify-center mb-4 shadow-lg shadow-signal/30"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <CheckCircle className="h-10 w-10 text-white" />
              </motion.div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-mono text-sm text-ink-muted"
            >
              Message sent successfully!
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="font-mono text-xs text-ink-faint mt-2"
            >
              I'll be in touch soon 🚀
            </motion.p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <motion.div
              variants={inputVariants}
              animate={focusedField === 'name' ? 'focused' : 'default'}
              transition={{ duration: 0.2 }}
              className="relative group"
            >
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted group-focus-within:text-signal transition-colors" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder="Your name"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 font-mono text-sm text-ink placeholder-ink-muted/50 focus:outline-none transition-all"
              />
            </motion.div>
            
            <motion.div
              variants={inputVariants}
              animate={focusedField === 'email' ? 'focused' : 'default'}
              transition={{ duration: 0.2 }}
              className="relative group"
            >
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted group-focus-within:text-signal transition-colors" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="Your email"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 font-mono text-sm text-ink placeholder-ink-muted/50 focus:outline-none transition-all"
              />
            </motion.div>
            
            <motion.div
              variants={inputVariants}
              animate={focusedField === 'message' ? 'focused' : 'default'}
              transition={{ duration: 0.2 }}
              className="relative group"
            >
              <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-ink-muted group-focus-within:text-signal transition-colors" />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                onFocus={() => setFocusedField('message')}
                onBlur={() => setFocusedField(null)}
                placeholder="Your message"
                required
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 font-mono text-sm text-ink placeholder-ink-muted/50 focus:outline-none transition-all resize-none"
              />
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(94, 234, 212, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-signal via-signal-bright to-pulse text-white font-mono text-sm font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-signal/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              />
              {isSubmitting ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <span>Send Message</span>
                </>
              )}
            </motion.button>
          </form>
        )}
      </div>
    </motion.div>
  )
}
