import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { beasties } from 'vite-plugin-beasties'

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
    // Automatically compress images during build
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 75 },
      webp: { quality: 80 },
      avif: { quality: 70 },
    }),
    beasties({
      // 2. Inline the critical styles for speed
      inlineFonts: true,
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  build: {
    sourcemap: false, // Disable sourcemaps in production to reduce build size/memory
    rollupOptions: {
      output: {
        // Split large vendor libraries into their own chunks
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'gsap-vendor': ['gsap'],
          'ui-vendor': ['lucide-react'],
          'clerk-vendor': ['@clerk/clerk-react', '@clerk/shared'],
        },
      },
    },
  },
});