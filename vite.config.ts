import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'chart': ['chart.js']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
