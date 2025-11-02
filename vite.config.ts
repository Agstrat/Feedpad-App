// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // GitHub Pages base comes from your workflow as VITE_BASE
  const base = env.VITE_BASE || '/'

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
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
            { src: `${base}assets/logo.png`, sizes: '192x192', type: 'image/png' },
            { src: `${base}assets/logo.png`, sizes: '512x512', type: 'image/png' },
            { src: `${base}assets/logo.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          navigateFallback: `${base}index.html`,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'html-nav',
                networkTimeoutSeconds: 3,
                expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 },
              },
            },
            {
              urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === 'image',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'images',
                expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
          ],
        },
      }),
    ],
  }
})
