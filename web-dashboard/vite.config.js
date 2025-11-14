import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom', 'react-hot-toast']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase-core': ['firebase/app', 'firebase/auth', 'firebase/database'],
          'vendor': ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'recharts', 'react-hot-toast'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/database', 'recharts', 'react-hot-toast'],
  },
  server: {
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true
    }
  }
})
