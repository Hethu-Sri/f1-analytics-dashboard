import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/ergast': {
        target: 'https://ergast.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ergast/, '/api/f1'),
      },
    },
  },
})
