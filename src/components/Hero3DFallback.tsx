/**
 * A CSS/SVG-only stand-in for the 3D core. Used when the device can't or
 * shouldn't run WebGL (small screens, no WebGL support, reduced-motion).
 */
export default function Hero3DFallback() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <div className="relative h-64 w-64 sm:h-80 sm:w-80">
        <div className="absolute inset-0 animate-[spin_20s_linear_infinite] rounded-full border border-signal/30" />
        <div className="absolute inset-6 animate-[spin_14s_linear_infinite_reverse] rounded-full border border-pulse/30" />
        <div className="absolute inset-14 animate-[spin_9s_linear_infinite] rounded-full border border-signal/40" />
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 h-full w-full opacity-70"
        >
          <polygon
            points="100,20 170,60 170,140 100,180 30,140 30,60"
            fill="none"
            stroke="#5EEAD4"
            strokeWidth="1"
          />
          <polygon
            points="100,55 145,80 145,120 100,145 55,120 55,80"
            fill="none"
            stroke="#A78BFA"
            strokeWidth="1"
          />
        </svg>
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal shadow-glow" />
      </div>
    </div>
  )
}
