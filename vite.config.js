import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Debug — confirms key loaded at server start
  console.log('KEY:', env.VITE_CLAUDE_API_KEY?.slice(0, 8))

  return {
    plugins: [react()],
    server: {
      host: true,          // exposes on LAN so team devices can connect
      proxy: {
        '/api/claude': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/claude/, ''),
          headers: {
            'x-api-key': env.VITE_CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'origin': '',        // strip browser Origin so Anthropic doesn't block as direct browser request
          },
        },
        '/api/alert': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  }
})
