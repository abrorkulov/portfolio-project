import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// `updateViaCache: 'none'` stops the browser serving sw.js itself out of the
// HTTP cache, so a new strategy actually reaches returning visitors.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {
      /* offline support is a bonus; the site works without it */
    })
  })
}

// The people most likely to open this are the ones the site is for.
console.log(
  '%cGood instinct.%c\nThe crackme is emulated in src/lib/x86.ts. No peeking at the key.',
  'font: 900 22px Archivo, sans-serif; color: #ff4a1c',
  'font: 12px monospace; color: inherit',
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
