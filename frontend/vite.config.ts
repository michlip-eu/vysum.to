import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Set to root
  server: {
    proxy: {
      '/api': 'http://localhost:3000', // Proxy /api to http://localhost:3001
    },
  },
})
