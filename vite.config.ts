import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: "./public",
  build: {
    outDir: "dist"
  }
,
  base: "/",
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
   server: {
    host: true,
    // https: true,
    allowedHosts: [
      ".ngrok-free.dev",
      ".ngrok.io",
      ".axorainfotech.com"
    ]
  }
});
