import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, proxy API + health to the backend origin so the frontend can use
// same-origin paths (VITE_API_BASE stays empty). Override target via env.
const target = process.env.VITE_API_TARGET || 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target, changeOrigin: true },
      '/health': { target, changeOrigin: true },
    },
  },
})
