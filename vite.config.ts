// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Injected by GH Actions: "/<repo>/" on Pages, "/" in dev
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react()],
})
