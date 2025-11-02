// vite.config.ts — SAFE (no PWA)
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function withSlash(s: string) { return s.endsWith('/') ? s : s + '/' }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
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
