// vite.config.ts — FULL REPLACEMENT
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function withTrailingSlash(s: string) {
  return s.endsWith('/') ? s : `${s}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Use GH Pages base from workflow if provided; otherwise default to root.
  // We *force* a trailing slash to stop redirect/reload storms on iOS.
  const rawBase = env.VITE_BASE ?? '/'
  const base = withTrailingSlash(rawBase)

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        // Register on first load, then auto-update on new deploys
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        devOptions: { enabled: false },

        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'FeedPad App',
          short_name: 'FeedPad',
          description: 'FeedPad calculator and defaults tool',
          theme_color: '#0f62fe',
          background_color: '#ffffff',
          display: 'standalone',

          // CRITICAL: scope and start_url must exactly match your subpath + trailing slash
          scope: base,
          start_url: base,

          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ],
        },

        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,

          // Make SPA navigation work from any deep link *under* the repo base
          navigateFallback: `${base}index.html`,

          // Don’t precache the GH Pages 404 shim (prevents loop)
          globIgnores: ['**/404.html'],

          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

          runtimeCaching: [
            {
              // Network-first for HTML/JSON/API; avoids stale-app loops
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
    ],
    build: { outDir: 'dist' }
  }
})
