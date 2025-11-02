// vite.config.ts — FULL REPLACEMENT
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Keep your GitHub Pages base path behaviour (set in your workflow)
  const base = env.VITE_BASE ?? '/'

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'FeedPad App',
          short_name: 'FeedPad',
          description: 'FeedPad calculator and defaults tool',
          theme_color: '#0f62fe',
          background_color: '#ffffff',
          display: 'standalone',
          scope: base,
          start_url: base,
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ],
        },
        workbox: {
          // Cache the built app and common static assets so it runs offline
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'feedpad-runtime',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }
              }
            }
          ]
        }
      })
    ]
  }
})
