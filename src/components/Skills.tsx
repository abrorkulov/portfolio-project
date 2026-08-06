import { motion } from 'framer-motion'
import SectionHeader from './SectionHeader'
import { skillCategories } from '../data/content'
import { Code2, Server, Brain, Wrench } from 'lucide-react'

const skillLogos: Record<string, string> = {
  'React': 'https://cdn.simpleicons.org/react/61DAFB',
  'TypeScript': 'https://cdn.simpleicons.org/typescript/3178C6',
  'JavaScript': 'https://cdn.simpleicons.org/javascript/F7DF1E',
  'Tailwind CSS': 'https://cdn.simpleicons.org/tailwindcss/06B6D4',
  'Next.js': 'https://cdn.simpleicons.org/nextdotjs/000000',
  'Framer Motion': 'https://cdn.simpleicons.org/framer/0055FF',
  'C#': 'https://cdn.simpleicons.org/csharp/239120',
  'C++': 'https://cdn.simpleicons.org/cpp/00599C',
  '.NET': 'https://cdn.simpleicons.org/dotnet/512BD4',
  'PHP': 'https://cdn.simpleicons.org/php/777BB4',
  'Node.js': 'https://cdn.simpleicons.org/nodedotjs/339933',
  'AI Engineering': 'https://cdn.simpleicons.org/openai/412991',
  'AI Prompting': 'https://cdn.simpleicons.org/openai/412991',
  'System Integration': 'https://cdn.simpleicons.org/integration/6366F1',
  'Reverse Engineering': 'https://cdn.simpleicons.org/reverseng/FF6B6B',
  'Git': 'https://cdn.simpleicons.org/git/F05032',
  'VS Code': 'https://cdn.simpleicons.org/visualstudiocode/007ACC',
  'Linux (Ubuntu)': 'https://cdn.simpleicons.org/ubuntu/E95420',
  'Docker': 'https://cdn.simpleicons.org/docker/2496ED',
  'Postman': 'https://cdn.simpleicons.org/postman/FF6C37',
  'Architecture Analysis': 'https://cdn.simpleicons.org/architecture/8B5CF6',
}

const categoryConfig = {
  'Frontend': { icon: Code2, gradient: 'from-cyan-500 via-blue-500 to-purple-500' },
  'Backend': { icon: Server, gradient: 'from-purple-500 via-pink-500 to-red-500' },
  'AI & Systems': { icon: Brain, gradient: 'from-emerald-500 via-teal-500 to-cyan-500' },
  'Tools & DevOps': { icon: Wrench, gradient: 'from-orange-500 via-red-500 to-pink-500' },
}

export default function Skills() {
  return (
    <section id="skills" className="relative border-t border-white/5 py-24 sm:py-32 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-signal/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pulse/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        <SectionHeader
          eyebrow="skills_and_technologies"
          title="Tools I reach for"
          description="Split across the interface layer I ship with, and the systems layer I study underneath it."
        />

        <div className="space-y-20">
          {skillCategories.map((category, ci) => {
            const config = categoryConfig[category.label as keyof typeof categoryConfig]
            const Icon = config.icon
            
            return (
              <motion.div
                key={category.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8, delay: ci * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {/* Modern category header */}
                <div className="flex items-center gap-4 mb-8">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`relative`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${config.gradient} rounded-2xl blur-lg opacity-50`} />
                    <div className={`relative bg-gradient-to-r ${config.gradient} rounded-2xl p-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </motion.div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-gradient-cool tracking-tight">
                      {category.label}
                    </h3>
                    <span className="font-mono text-xs text-ink-muted/70 uppercase tracking-[0.2em]">
                      {category.eyebrow}
                    </span>
                  </div>
                </div>

                {/* Modern skill cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {category.items.map((item, i) => {
                    const logoUrl = skillLogos[item.name]
                    
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.5, delay: ci * 0.15 + i * 0.05 }}
                        whileHover={{ y: -8 }}
                        className="group"
                      >
                        <div className="relative h-full">
                          {/* Card background with gradient border */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          
                          <div className="relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
                            {/* Logo container */}
                            <div className="flex items-start justify-between mb-4">
                              <motion.div 
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                className="relative"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-signal/20 to-pulse/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 border border-white/10">
                                  {logoUrl ? (
                                    <img 
                                      src={logoUrl} 
                                      alt={item.name}
                                      className="h-8 w-8"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <Code2 className="h-8 w-8 text-white/80" />
                                  )}
                                </div>
                              </motion.div>
                              
                              {/* Percentage badge */}
                              <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-signal/20 to-pulse/20 rounded-full blur-md" />
                                <div className="relative bg-white/5 backdrop-blur-sm rounded-full px-3 py-1 border border-white/10">
                                  <span className="font-mono text-xs font-semibold text-signal">
                                    {item.level}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Skill name */}
                            <motion.h4 
                              whileHover={{ scale: 1.05 }}
                              className="font-display text-base font-semibold text-ink mb-2 group-hover:text-signal transition-colors"
                            >
                              {item.name}
                            </motion.h4>
                            
                            {/* Progress bar */}
                            <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${item.level}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: ci * 0.15 + i * 0.05 + 0.2, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-signal via-signal-bright to-pulse relative"
                              >
                                <motion.div
                                  className="absolute inset-0 bg-white/30"
                                  animate={{ x: ['-100%', '100%'] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
                                />
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
