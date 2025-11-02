// vite.config.ts — SAFE, NO PWA, Pages-friendly
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function withSlash(s: string) { return s.endsWith('/') ? s : s + '/' }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // GH Pages workflow sets VITE_BASE: /<repo>/
  const base = withSlash(env.VITE_BASE ?? '/')

  return {
    base,
    plugins: [react()],
    build: { outDir: 'dist' },
    server: {
      host: true,
      watch: { usePolling: true },
      hmr: { overlay: false },
    },
  }
})
