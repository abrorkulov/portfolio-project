/**
 * Placeholder for a widget whose chunk has not arrived yet.
 *
 * It reserves the same height the real panel will occupy, which is the whole
 * point — a skeleton that is shorter than its content is just a layout shift
 * with extra steps.
 *
 * The spinner is the one CSS animation the lite tier keeps running (see the
 * `.animate-spin` exemption in `styles/index.css`), because it is the only one
 * on the page that carries information rather than decoration: it means a
 * chunk is still downloading.
 */
export default function PanelSkeleton({
  height = 'h-64',
  label = 'Loading module',
}: {
  height?: string
  label?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`skeleton-shimmer glass-card flex w-full ${height} items-center justify-center rounded-3xl border border-white/5 p-8`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-signal border-t-transparent" />
        <span className="font-mono text-xs text-signal/80">{label}…</span>
      </div>
    </div>
  )
}
