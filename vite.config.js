import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
// https://vite.dev/config/
export default defineConfig({
  resolve: {
    // Ensure React is only bundled once. Duplicate React copies can break hooks in
    // third-party libs (MUI) and trigger errors like "Cannot read properties of undefined (reading 'useLayoutEffect')".
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        maximumFileSizeToCacheInBytes: 3000000, // Increase limit to 3MB to avoid warnings for large assets
      },
      manifest: {
        name: 'Lume',
        short_name: 'Lume',
        description: 'Premium streaming experience',
        theme_color: '#9146FF',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // manualChunks(id) {
        //   if (id.includes('node_modules')) {
        //     if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
        //       return 'vendor';
        //     }
        //     if (id.includes('@mui') || id.includes('@emotion')) {
        //       return 'mui';
        //     }
        //   }
        // },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kb
  },
})
