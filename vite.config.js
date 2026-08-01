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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' blob: https://scripts.clarity.ms https://www.clarity.ms https://checkout.razorpay.com https://cdn.razorpay.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https://res.cloudinary.com https://flagcdn.com; connect-src 'self' http://localhost:5000 http://localhost:5055 http://localhost:5173 ws://localhost:5173 ws://localhost:5055 wss://localhost:5000 wss://localhost:5055 wss://*.clarity.ms https://*.clarity.ms https://api.allorigins.win https://www.google-analytics.com https://analytics.google.com https://*.razorpay.com; worker-src 'self' blob:; frame-src 'self' https://www.youtube.com https://api.razorpay.com;",
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
