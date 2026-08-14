/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const BASE = "/my-sudoku/";

const pwa = VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["favicon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"],
  manifest: {
    id: BASE,
    name: "My Sudoku",
    short_name: "My Sudoku",
    description: "A personal Sudoku game that works offline.",
    theme_color: "#f3efe6",
    background_color: "#f3efe6",
    display: "standalone",
    orientation: "portrait",
    start_url: BASE,
    scope: BASE,
    icons: [
      {
        src: "icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
    navigateFallback: `${BASE}index.html`,
  },
});

export default defineConfig({
  base: BASE,
  plugins: [react(), ...(process.env.VITEST ? [] : [pwa])],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
