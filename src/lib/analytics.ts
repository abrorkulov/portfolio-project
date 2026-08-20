// Privacy-friendly client-side analytics helper script
// Logs events locally or safely hooks into external analytics services if configured.

export type AnalyticsEvent = {
  category: string
  action: string
  label?: string
  value?: number
}

export function initAnalytics() {
  if (typeof window === 'undefined') return
  
  // Track page view
  if (import.meta.env.DEV) {
    console.log('[Analytics] Session initialized')
  }
  
  // Observe section visibility for section view metrics
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            trackEvent({
              category: 'Section View',
              action: 'view_section',
              label: entry.target.id,
            })
          }
        })
      },
      { threshold: 0.4 }
    )

    document.querySelectorAll('section[id]').forEach((sec) => observer.observe(sec))
  }
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
