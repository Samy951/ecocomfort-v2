import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA disabled for development
    // VitePWA({
    //   registerType: "autoUpdate",
    //   workbox: {
    //     globPatterns: ["**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}"],
    //     runtimeCaching: [
    //       {
    //         // Real-time endpoints - no cache, network only
    //         urlPattern:
    //           /^http:\/\/localhost:3000\/api\/dashboard\/(sensor-data|overview)/i,
    //         handler: "NetworkOnly",
    //         options: {
    //           cacheName: "realtime-api",
    //         },
    //       },
    //       {
    //         // Other API endpoints - cached with fast timeout
    //         urlPattern: /^http:\/\/localhost:3000\/api\/.*/i,
    //         handler: "NetworkFirst",
    //         options: {
    //           cacheName: "api-cache",
    //           networkTimeoutSeconds: 3, // Fast timeout for real-time feel
    //           expiration: {
    //             maxEntries: 100,
    //             maxAgeSeconds: 60 * 60 * 24, // 24 hours
    //           },
    //         },
    //       },
    //     ],
    //   },
    //   includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
    //   manifest: {
    //     name: "EcoComfort",
    //     short_name: "EcoComfort",
    //     description: "Application de gestion énergétique intelligente",
    //     theme_color: "#10B981",
    //     background_color: "#1F2937",
    //     display: "standalone",
    //     orientation: "portrait",
    //     scope: "/",
    //     start_url: "/",
    //     icons: [
    //       {
    //         src: "pwa-192x192.png",
    //         sizes: "192x192",
    //         type: "image/png",
    //       },
    //       {
    //         src: "pwa-512x512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //       },
    //       {
    //         src: "pwa-512x512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //         purpose: "any maskable",
    //       },
    //     ],
    //   },
    // }),
  ],
  server: {
    host: true,
    port: 3001, // Frontend dev server port
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Backend port
        changeOrigin: true,
        secure: false,
      },
      '/broadcasting/auth': {
        target: 'http://localhost:3000', // Backend port
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});