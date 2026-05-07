import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  publicDir: path.resolve(__dirname, '../shared-assets/public'),
  resolve: {
    alias: {
      '@shared-assets': path.resolve(__dirname, '../shared-assets/src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})