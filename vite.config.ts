import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('@clerk')) {
              return 'vendor-clerk';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('axios') || id.includes('lucide-react')) {
              return 'vendor-utils';
            }
            // Group other node_modules into a general vendor chunk
            return 'vendor-misc';
          }
          
          // Page chunks for better code splitting
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1].split('.')[0];
            return `page-${pageName.toLowerCase()}`;
          }
          
          // Component chunks
          if (id.includes('/components/')) {
            return 'components';
          }
          
          // Service chunks
          if (id.includes('/services/')) {
            return 'services';
          }
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 3000, // Increase limit to 3MB for Clerk library
    target: 'esnext',
    minify: 'esbuild',
  },
});
