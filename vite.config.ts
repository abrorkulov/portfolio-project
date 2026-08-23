import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors the `@/*` path in tsconfig.json. Every cross-module import in
    // src/ goes through this: relative chains like `../../shared/motion/motion`
    // are how a feature-sliced tree quietly turns back into spaghetti, because
    // moving a file silently rewrites what its neighbours mean.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // three.js and gsap are deliberately NOT pinned to manual chunks:
        // naming them here pulls them into the entry's preload graph, which
        // re-downloads ~270 kB gzipped on every first paint. Left alone,
        // Rollup keeps them inside the lazy chunks that actually import them —
        // `Hero3D` for three, `useGsap`'s dynamic import for GSAP.
        manualChunks: {
          'motion-vendor': ['framer-motion'],
        },
      },
    },
  },
})
