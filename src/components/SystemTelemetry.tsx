import { motion } from 'framer-motion'
import { Cpu, HardDrive, MemoryStick, Network, Activity, Zap, Shield } from 'lucide-react'

interface Metric {
  label: string
  value: number
  max: number
  unit: string
  color: string
  icon: React.ElementType
}

const metrics: Metric[] = [
  { label: 'CPU Usage', value: 45, max: 100, unit: '%', color: 'signal', icon: Cpu },
  { label: 'Memory', value: 62, max: 100, unit: '%', color: 'pulse', icon: MemoryStick },
  { label: 'Disk I/O', value: 28, max: 100, unit: '%', color: 'signal', icon: HardDrive },
  { label: 'Network', value: 34, max: 100, unit: '%', color: 'pulse', icon: Network },
]

const systemInfo = [
  { label: 'OS', value: 'Ubuntu' },
  { label: 'Kernel', value: '6.5.0-generic' },
  { label: 'Architecture', value: 'x86_64' },
  { label: 'Shell', value: 'zsh 5.9' },
]

export default function SystemTelemetry() {
  return (
    <div className="glass-card glow-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-signal/20 to-pulse/20 p-2 border border-signal/30">
            <Activity className="h-5 w-5 text-signal" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-ink">System Telemetry</h3>
            <p className="font-mono text-xs text-ink-muted">Real-time system metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono text-xs text-green-400">Live</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          const percentage = (metric.value / metric.max) * 100
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-xl p-4 border border-white/5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`h-4 w-4 text-${metric.color}`} />
                <span className="font-mono text-xs text-ink-muted">{metric.label}</span>
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span className="font-mono text-2xl font-semibold text-ink">
                  {metric.value}
                </span>
                <span className="font-mono text-sm text-ink-muted mb-1">{metric.unit}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-void-surface">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.2 }}
                  className={`h-full rounded-full bg-${metric.color} shadow-glow`}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-xl p-4 border border-white/5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-pulse" />
            <h4 className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              Memory Architecture
            </h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-void-surface border border-white/5">
              <span className="font-mono text-xs text-ink">Stack</span>
              <span className="font-mono text-xs text-signal">High Addresses</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-void-surface border border-white/5">
              <span className="font-mono text-xs text-ink">Heap</span>
              <span className="font-mono text-xs text-pulse">Dynamic</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-void-surface border border-white/5">
              <span className="font-mono text-xs text-ink">BSS</span>
              <span className="font-mono text-xs text-ink-muted">Uninitialized</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-void-surface border border-white/5">
              <span className="font-mono text-xs text-ink">Data</span>
              <span className="font-mono text-xs text-ink-muted">Initialized</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-void-surface border border-white/5">
              <span className="font-mono text-xs text-ink">Text</span>
              <span className="font-mono text-xs text-signal">Code</span>
            </div>
          </div>
        </motion.div>

        {/* System Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-xl p-4 border border-white/5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-signal" />
            <h4 className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              System Details
            </h4>
          </div>
          <div className="space-y-3">
            {systemInfo.map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <span className="font-mono text-xs text-ink-muted">{info.label}</span>
                <span className="font-mono text-xs text-ink">{info.value}</span>
              </motion.div>
            ))}
          </div>

          {/* Process Status */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-ink-muted">Active Processes</span>
              <span className="font-mono text-xs text-signal">247</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-ink-muted">Threads</span>
              <span className="font-mono text-xs text-pulse">1,892</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-ink-muted">Uptime</span>
              <span className="font-mono text-xs text-ink">14d 7h 32m</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
