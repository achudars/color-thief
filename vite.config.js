import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      input: './index.html'
    }
  },
  server: {
    port: 3000,
    open: '/index.html',
    cors: true
  },
  preview: {
    port: 4173,
    open: '/index.html'
  },
  css: {
    devSourcemap: true
  },
  esbuild: {
    target: 'es2020'
  }
});
