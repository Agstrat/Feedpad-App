// vite.config.ts (FULL REPLACEMENT)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Injected by GH Actions (e.g. "/<repo>/")
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      // --- One-time SW kill to fix blank screen from stale cache ---
      selfDestroying: true,                // unregister old SW on clients
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,       // remove old caches
      },
      base,                                // ensure SW paths respect GH Pages base
      includeAssets: ['assets/logo.png'],
      manifest: {
        name: 'FeedPad',
        short_name: 'FeedPad',
        description: 'Feed pad calculator with saved defaults',
        theme_color: '#0f62fe',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: base,                   // PWA scoped to repo path
        scope: base,
        icons: [
          { src: 'assets/logo.png', sizes: '192x192', type: 'image/png' },
          { src: 'assets/logo.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
});
