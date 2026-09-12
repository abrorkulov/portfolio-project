import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // three.js is deliberately NOT named here: a manual chunk is pulled
        // into the entry's preload graph, which would download the whole
        // renderer before the first character of "hello" is on screen. Left
        // alone, Rollup keeps it inside the lazy chunk that imports it.
        manualChunks: undefined,
      },
    },
  },
})
