import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // The key change to fix the refresh issue is correctly implemented here
  base: './',
  
  plugins: [
    react(),
    // Remove the tailwindcss plugin, as Vite uses PostCSS for this
  ],

  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
