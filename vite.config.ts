import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Add support for SSR and pre-rendering
  build: {
    sourcemap: true,
    ssrManifest: true, // Generate SSR manifest for react-snap
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'react-hot-toast', 'lucide-react'],
          'video-vendor': ['video.js', 'hls.js', 'react-player', 'react-hls-player'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api/terabox': {
        target: 'https://temp-gmail.site',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/terabox/, '/Tera'),
        configure: (proxy: any) => {
          // Handle request headers
          proxy.on('proxyReq', (proxyReq: any) => {
            proxyReq.setHeader('Origin', 'https://terabox.com');
            proxyReq.setHeader('Referer', 'https://terabox.com/');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          });
          
          // Handle response headers for CORS
          proxy.on('proxyRes', (proxyRes: any) => {
            if (proxyRes.headers) {
              proxyRes.headers['Access-Control-Allow-Origin'] = '*';
              proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
              proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Origin, X-Requested-With';
              proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            }
          });
        }
      },
      // Add a general proxy for m3u8 streams
      '^/proxy/(.*)': {
        target: '',
        changeOrigin: true,
        rewrite: (path: string) => {
          // Extract the target URL from the path
          const targetUrl = decodeURIComponent(path.replace(/^\/proxy\//, ''));
          return targetUrl;
        },
        configure: (proxy: any) => {
          // Set request headers to mimic mdisplay.com
          proxy.on('proxyReq', (proxyReq: any) => {
            proxyReq.setHeader('referer', 'https://mdisplay.com/');
            proxyReq.setHeader('origin', 'https://mdisplay.com');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          });
          
          // Add CORS headers to the response
          proxy.on('proxyRes', (proxyRes: any) => {
            if (proxyRes.headers) {
              proxyRes.headers['Access-Control-Allow-Origin'] = '*';
              proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
              proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
              proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
            }
          });
        }
      }
    },
    // Configure CORS for the development server
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin'],
      credentials: true
    }
  }
});
