import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5180,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Для Electron нужны относительные пути
    assetsDir: 'assets',
  },
})
