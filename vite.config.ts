import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // three.js and recharts are deliberately NOT pinned to manual chunks:
        // naming them here pulls them into the entry's preload graph, which
        // re-downloads ~270 kB gzipped on every first paint. Left alone,
        // Rollup keeps them inside the lazy chunks that actually import them.
        manualChunks: {
          'motion-vendor': ['framer-motion'],
        },
      },
    },
  },
})
