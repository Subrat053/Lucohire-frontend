import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react-dom') ||
              id.includes('react-router-dom') ||
              id.includes('react-helmet-async') ||
              id.includes('react/')
            ) {
              return 'vendor-core';
            }
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('firebase') || id.includes('@react-oauth')) {
              return 'vendor-firebase';
            }
            if (id.includes('react-select') || id.includes('react-window')) {
              return 'vendor-widgets';
            }
            if (id.includes('axios') || id.includes('socket.io-client')) {
              return 'vendor-utils';
            }
          }
        },
      },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5055',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5055',
        changeOrigin: true,
        ws: true,
      },
      '/sitemap.xml': {
        target: 'http://localhost:5055',
        changeOrigin: true,
      },
      '/jobs/': {
        target: 'http://localhost:5055',
        changeOrigin: true,
      },
      '/robots.txt': {
        target: 'http://localhost:5055',
        changeOrigin: true,
      },
    },
  },
});
