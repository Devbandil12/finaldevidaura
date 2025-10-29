import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // ✅ Add this line

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(), // ✅ Enable Tailwind plugin
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
    sourcemap: true,
  },
});
