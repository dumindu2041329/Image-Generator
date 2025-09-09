import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  
  define: {
    global: 'globalThis',
  },
  
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep React and React-DOM in the same chunk to avoid timing issues
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-clerk': ['@clerk/clerk-react', '@clerk/clerk-js', '@clerk/themes'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-utils': ['axios', 'lucide-react'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 3000,
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false, // Disable sourcemaps to avoid potential issues
  },
});
