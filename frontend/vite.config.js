import { defineConfig, loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000'

  return {
    plugins: [svelte()],
    server: {
      port: 5173,
      proxy: {
        '/api': apiUrl,
        '/chat': apiUrl,
        '/health': apiUrl
      }
    },
    build: {
      outDir: '../public',
      emptyOutDir: true
    }
  }
})
