import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH ?? '/protein_alignment/'
  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'es2022',
      sourcemap: true,
    },
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      include: ['comlink'],
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/tests/setup.ts',
      exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    },
  }
})
