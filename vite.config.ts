import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GH Actions will pass the base via CLI; default to "/" for dev
export default defineConfig({
  base: '/',
  plugins: [react()],
})
