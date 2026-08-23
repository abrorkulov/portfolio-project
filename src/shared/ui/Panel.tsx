import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type PanelProps = {
  icon: LucideIcon
  title: string
  subtitle?: string
  /** Controls rendered on the right of the header. Wraps below on phones. */
  actions?: ReactNode
  /** Status text/badges shown under the title on small screens. */
  meta?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * The shared chrome for the interactive widgets.
 *
 * Packet Runner and the Code Playground had each hand-rolled the same
 * icon-tile / title / actions header with slightly different spacing, and both
 * laid it out as a single flex row that collapsed badly under ~600px. One
 * component keeps them identical and makes the header wrap properly.
 */
export default function Panel({
  icon: Icon,
  title,
  subtitle,
  actions,
  meta,
  children,
  className = '',
}: PanelProps) {
  return (
    <div
      className={`glass-card glow-border overflow-hidden rounded-3xl p-4 sm:p-6 ${className}`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-signal/30 bg-gradient-to-br from-signal/20 to-pulse/20">
            <Icon className="h-5 w-5 text-signal" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-ink sm:text-lg">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-ink-muted">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {(actions || meta) && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
            {meta}
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  )
}
