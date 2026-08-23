// Privacy-friendly client-side analytics helper script
// Logs events locally or safely hooks into external analytics services if configured.

export type AnalyticsEvent = {
  category: string
  action: string
  label?: string
  value?: number
}

/**
 * Starts section-view tracking and returns a teardown function.
 *
 * This used to be called from `main.tsx` *before* `createRoot().render()`, so
 * `querySelectorAll('section[id]')` ran against an empty `#root` and matched
 * nothing. The observer was constructed, observed zero elements, and never
 * fired once — the whole module was dead code that looked alive.
 *
 * It is now an effect in the app shell, which runs after the first commit, so
 * the sections it is looking for actually exist. It also watches `footer[id]`,
 * which the old selector missed even in principle: the contact section is a
 * `<footer>`.
 */
export function initAnalytics(): () => void {
  if (typeof window === 'undefined') return () => {}

  if (import.meta.env.DEV) {
    console.log('[Analytics] Session initialized')
  }

  if (!('IntersectionObserver' in window)) return () => {}

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.target.id) {
          trackEvent({
            category: 'Section View',
            action: 'view_section',
            label: entry.target.id,
          })
        }
      }
    },
    { threshold: 0.4 },
  )

  document
    .querySelectorAll('section[id], footer[id]')
    .forEach((section) => observer.observe(section))

  return () => observer.disconnect()
}

export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === 'undefined') return
  
  // Dev log
  if (import.meta.env.DEV) {
    console.log(`[Analytics Event] ${event.category} -> ${event.action} (${event.label || ''})`)
  }

  // Window custom event trigger if third party analytics listening
  window.dispatchEvent(
    new CustomEvent('portfolio_analytics', {
      detail: event,
    })
  )
}
