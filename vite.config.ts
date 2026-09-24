import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/vstack/',
  // @omega-os/ui is a symlinked file: dep — allow dev-serving its self-hosted fonts.
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
