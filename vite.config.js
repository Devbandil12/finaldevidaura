import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  devtool: false,
  server: {
    host: '0.0.0.0',
    port: 5173,

    // ← Add this block to proxy /api requests
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // your Express server
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
