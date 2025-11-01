// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Injected by your GH Actions workflow (e.g. "/<repo>/"); fallback to "/"
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base, // ensures all built asset URLs are prefixed for GitHub Pages
  plugins: [
    react(),
    VitePWA({
      base,                    // make the SW/manifest respect the Pages base
      registerType: 'autoUpdate',
      workbox: { clientsClaim: true, skipWaiting: true },
      includeAssets: ['assets/logo.png'],
      manifest: {
        name: 'FeedPad',
        short_name: 'FeedPad',
        description: 'Feed pad calculator with saved defaults',
        theme_color: '#0f62fe',
        background_color: '#ffffff',
        display: 'standalone',
        // Explicitly scope PWA to the repo path on Pages
        start_url: base,
        scope: base,
        icons: [
          { src: 'assets/logo.png', sizes: '192x192', type: 'image/png' },
          { src: 'assets/logo.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
});
