import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const isElectron = process.env.ELECTRON === 'true'

export default defineConfig({
  plugins: [react()],
  base: isElectron ? './' : '/',
  server: {
    port: 5180,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
})
