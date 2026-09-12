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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
