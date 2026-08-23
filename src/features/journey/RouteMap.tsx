import type { JourneyStep } from '@/data/content'

/**
 * The line as a still diagram — what a phone and any WebGL-less browser get in
 * place of `TrainScene`.
 *
 * Drawn like a transit map rather than a shrunken screenshot of the 3D scene,
 * because a small static render of a 3D thing always looks like a 3D thing that
 * failed. A route diagram is a legitimate way to show a line, so this reads as
 * a deliberate second design rather than a degraded first one.
 *
 * Vertical, because that is the axis a phone has room on.
 */
export default function RouteMap({
  steps,
  active,
}: {
  steps: readonly JourneyStep[]
  active: number
}) {
  const gap = 96
  const height = (steps.length - 1) * gap + 48
  const x = 34

  return (
    <svg
      viewBox={`0 0 260 ${height}`}
      // Decorative: the same information is in the station list beside it, in
      // text, which is what a screen reader should read instead.
      aria-hidden="true"
      className="mx-auto block h-auto w-full max-w-[260px]"
    >
      <defs>
        <linearGradient id="route-line" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#A78BFA" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FDBA74" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* The line itself. The final leg is dashed — it runs to a station the
          train has not reached, and a solid line would promise otherwise. */}
      <line
        x1={x}
        y1={24}
        x2={x}
        y2={24 + (steps.length - 2) * gap}
        stroke="url(#route-line)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1={x}
        y1={24 + (steps.length - 2) * gap}
        x2={x}
        y2={24 + (steps.length - 1) * gap}
        stroke="#FDBA74"
        strokeOpacity="0.4"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 9"
      />

      {steps.map((step, i) => {
        const y = 24 + i * gap
        const reached = i <= active
        const accent = step.upcoming ? '#FDBA74' : '#5EEAD4'

        return (
          <g key={`${step.year}-${step.station}`}>
            {reached && (
              <circle cx={x} cy={y} r="15" fill={accent} fillOpacity="0.12" />
            )}
            <circle
              cx={x}
              cy={y}
              r="9"
              fill="#0b0d12"
              stroke={accent}
              strokeOpacity={reached ? 0.95 : 0.35}
              strokeWidth="2.5"
            />
            {reached && <circle cx={x} cy={y} r="3.5" fill={accent} />}

            <text
              x={x + 28}
              y={y - 3}
              fontFamily='"Space Grotesk", system-ui, sans-serif'
              fontSize="19"
              fontWeight="600"
              fill={reached ? accent : '#48556A'}
            >
              {step.year}
            </text>
            <text
              x={x + 28}
              y={y + 15}
              fontFamily='"JetBrains Mono", monospace'
              fontSize="11"
              letterSpacing="1.6"
              fill="#48556A"
            >
              {step.station}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
