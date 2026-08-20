import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initAnalytics } from './lib/analytics'

// Register Service Worker for PWA support.
// `updateViaCache: 'none'` stops the browser from serving sw.js itself out of
// the HTTP cache, so a new strategy actually reaches returning visitors.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err)
      })
  })
}

// Initialize Analytics tracking
initAnalytics()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
