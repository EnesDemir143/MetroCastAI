import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/s3-data': {
        target: 'https://metrocast-ai-storage.s3.eu-central-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/s3-data/, ''),
      },
      '/api/predict': {
        target: 'https://api.metrocast.enesdemir.me',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/predict/, '/predict'),
        secure: false, // Useful if the target has self-signed certs, though usually not needed for production
      },
    },
  },
})
