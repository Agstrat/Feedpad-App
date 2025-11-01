import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // These two lines make new versions activate immediately:
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
      },
      includeAssets: ['assets/logo.png'],
      manifest: {
        name: 'FeedPad',
        short_name: 'FeedPad',
        description: 'Feed pad calculator with saved defaults',
        theme_color: '#0f62fe',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'assets/logo.png', sizes: '192x192', type: 'image/png' },
          { src: 'assets/logo.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
});
