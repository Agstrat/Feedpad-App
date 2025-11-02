// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE || '/'

  return {
    base,
    plugins: [
      react(),

      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false, // set true if you want SW during `npm run dev`
        },
        includeAssets: ['assets/logo.png'],
        manifest: {
          name: 'FeedPad',
          short_name: 'FeedPad',
          description: 'FeedPad calculator & defaults — works offline.',
          theme_color: '#0f62fe',
          background_color: '#f5f7fb',
          display: 'standalone',
          start_url: `${base}`,
          scope: `${base}`,
          icons: [
            // Ideally provide proper 192 & 512 versions; these point to your current logo.
            { src: `${base}assets/logo.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: `${base}assets/logo.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: `${base}assets/logo.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ],
        },
        workbox: {
          // Precache all built assets
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],

          // Make SPA routes work offline (GitHub Pages subpath safe)
          navigateFallback: `${base}index.html`,

          // Runtime caching for same-origin navigations & images
          runtimeCaching: [
            {
              // HTML navigations
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'html-nav',
                networkTimeoutSeconds: 3,
                expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 },
              },
            },
            {
              // Images (icons, logo)
              urlPattern: ({ request, sameOrigin }) =>
                sameOrigin && request.destination === 'image',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'images',
                expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
            {
              // Static JSON/PDF exports if any
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin && /\.(json|pdf)$/.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-data',
                expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
          ],
        },
      }),
    ],
  }
})
