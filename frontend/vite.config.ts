export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true
    },
    allowedHosts: ['4skale.com']
  },
  preview: {
    host: '0.0.0.0',              // 👈 thêm
    port: 5173,                   // 👈 thêm
    allowedHosts: ['4skale.com']  // 👈 vẫn giữ
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'react-hot-toast'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          charts: ['recharts'],
          utils: ['axios', '@tanstack/react-query', 'clsx', 'tailwind-merge', 'date-fns']
        }
      }
    },
    esbuild: {
      drop: ['console', 'debugger']
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
