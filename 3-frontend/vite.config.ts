import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 1. Tell esbuild (dev server) to target modern browsers that support import.meta
  esbuild: {
    target: 'es2020',
  },
  // 2. Tell Rollup (production build) to target modern browsers
  build: {
    target: 'es2020',
  },
  // 3. Tell dependency optimizer to target modern browsers
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
    exclude: ['lucide-react'],
  },
});