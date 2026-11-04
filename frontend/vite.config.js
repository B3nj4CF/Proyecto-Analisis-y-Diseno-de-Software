import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/procesos': {
        target: 'http://api_validaciones:8081',
        changeOrigin: true,
      },
    },
  }
})