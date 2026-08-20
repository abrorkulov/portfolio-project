import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import SectionHeader from './SectionHeader'
import { trajectory, trajectoryLegend, education } from '../data/content'

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { dataKey: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-void-line bg-void-soft/95 px-4 py-3 font-mono text-xs shadow-glow backdrop-blur">
      <p className="mb-2 text-ink-muted">checkpoint · {label}</p>
      {payload.map((entry) => {
        const legendEntry = trajectoryLegend.find(
          (l) => l.key === entry.dataKey,
        )
        return (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-6"
          >
            <span style={{ color: entry.color }}>
              {legendEntry?.label ?? entry.dataKey}
            </span>
            <span className="text-ink">{entry.value}%</span>
          </div>
        )
      })}
    </div>
  )
}

export default function LearningTrajectory() {
  return (
    <section
      id="trajectory"
      className="relative border-t border-void-line py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeader
          eyebrow="learning_trajectory"
          title="Skill development over time"
          description="Self-tracked proficiency across four tracks, sampled every two months. Not a leaderboard — a record of where the time actually went."
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="rounded-2xl border border-void-line bg-void-surface/40 p-4 sm:p-6"
        >
          <div className="h-[320px] w-full sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trajectory}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  {trajectoryLegend.map((entry) => (
                    <linearGradient
                      key={entry.key}
                      id={`gradient-${entry.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={entry.color}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor={entry.color}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  stroke="#1C2635"
                  strokeDasharray="4 8"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#48556A"
                  tick={{
                    fill: '#7C8B9C',
                    fontSize: 12,
                    fontFamily: 'JetBrains Mono',
                  }}
                  tickLine={false}
                  axisLine={{ stroke: '#1C2635' }}
                />
                <YAxis
                  stroke="#48556A"
                  tick={{
                    fill: '#7C8B9C',
                    fontSize: 12,
                    fontFamily: 'JetBrains Mono',
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="font-mono text-xs text-ink-muted">
                      {value}
                    </span>
                  )}
                  iconType="circle"
                  iconSize={8}
                />
                {trajectoryLegend.map((entry) => (
                  <Area
                    key={entry.key}
                    type="monotone"
                    dataKey={entry.key}
                    name={entry.label}
                    stroke={entry.color}
                    strokeWidth={2}
                    fill={`url(#gradient-${entry.key})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Education highlights */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {education.map((edu, i) => (
            <motion.div
              key={edu.school}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-xl border border-void-line bg-void-surface/40 p-5 transition-colors hover:border-signal/40"
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-signal">
                education
              </p>
              <h3 className="mt-2 font-display text-lg font-medium">
                {edu.school}
              </h3>
              <p className="text-sm text-ink-muted">{edu.branch}</p>
              <p className="mt-2 text-sm text-ink-faint">{edu.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
