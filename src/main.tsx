import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'
import '@/styles/index.css'
import { syncMotionTier } from '@/shared/motion/useMotionProfile'

// Stamp the motion tier on <html> before the first render. The stylesheet gates
// backdrop blur and the animated background on it, so doing this after mount
// would flash the expensive style onto a phone for a frame or two.
syncMotionTier()

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
