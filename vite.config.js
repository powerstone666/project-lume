import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const CINEMAOS_ORIGIN = 'https://cinemaos.tech'
const CINEMAOS_INTERNAL_API_PREFIXES = [
  '/api/cinemaosv2',
  '/api/moviebox',
  '/api/multi-movies',
  '/api/tmdb',
]
const POPUP_BLOCKER_SCRIPT = `
(() => {
  const blockedOpen = () => null;
  try {
    Object.defineProperty(window, 'open', {
      configurable: false,
      enumerable: true,
      writable: false,
      value: blockedOpen,
    });
  } catch {
    window.open = blockedOpen;
  }
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a');
    if (link && link.target && link.target !== '_self') {
      event.preventDefault();
      event.stopImmediatePropagation();
      link.target = '_self';
    }
  }, true);
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.target && form.target !== '_self') {
      event.preventDefault();
      event.stopImmediatePropagation();
      form.target = '_self';
    }
  }, true);
})();
`

const rewriteCinemaOsUrls = (html) => html
  .replaceAll(`${CINEMAOS_ORIGIN}/`, '/api/cinemaos/')
  .replaceAll('//cinemaos.tech/', '/api/cinemaos/')
  .replace(/(["'(=\s])\/_next\//g, '$1/api/cinemaos/_next/')

const cinemaOsDevProxy = () => ({
  name: 'cinemaos-dev-proxy',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const requestUrl = new URL(request.url || '/', 'http://localhost')
      const isProxyRequest = requestUrl.pathname.startsWith('/api/cinemaos/')
      const isNextAssetRequest = requestUrl.pathname.startsWith('/_next/')
      const isCinemaOsApiRequest = CINEMAOS_INTERNAL_API_PREFIXES.some((prefix) =>
        requestUrl.pathname === prefix || requestUrl.pathname.startsWith(`${prefix}/`)
      )

      if (!isProxyRequest && !isNextAssetRequest && !isCinemaOsApiRequest) {
        return next()
      }

      try {
        const upstreamPath = isProxyRequest
          ? requestUrl.pathname.replace(/^\/api\/cinemaos/, '')
          : requestUrl.pathname
        const upstreamUrl = new URL(upstreamPath, CINEMAOS_ORIGIN)
        upstreamUrl.search = requestUrl.search
        const upstreamResponse = await fetch(upstreamUrl, {
          headers: {
            accept: request.headers.accept || '*/*',
            ...(request.headers.range ? { range: request.headers.range } : {}),
            ...(request.headers['user-agent'] ? { 'user-agent': request.headers['user-agent'] } : {}),
          },
        })
        const contentType = upstreamResponse.headers.get('content-type') || 'application/octet-stream'
        const isWebpackRuntime = upstreamPath.includes('/_next/static/chunks/webpack-')
        response.statusCode = upstreamResponse.status
        response.setHeader('content-type', contentType)

        if (contentType.includes('text/html')) {
          const html = rewriteCinemaOsUrls(await upstreamResponse.text())
          response.setHeader('cache-control', 'no-store')
          response.end(html)
          return
        }

        if (isWebpackRuntime && contentType.includes('javascript')) {
          const runtime = await upstreamResponse.text()
          response.setHeader('cache-control', 'no-store')
          response.end(`${POPUP_BLOCKER_SCRIPT}\n${runtime}`)
          return
        }

        for (const header of ['cache-control', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
          const value = upstreamResponse.headers.get(header)
          if (value) response.setHeader(header, value)
        }

        if (!upstreamResponse.body) {
          response.end()
          return
        }

        Readable.fromWeb(upstreamResponse.body).pipe(response)
      } catch (error) {
        console.error('CinemaOS dev proxy request failed:', error)
        response.statusCode = 502
        response.setHeader('content-type', 'application/json')
        response.end(JSON.stringify({ error: 'CinemaOS is unavailable' }))
      }
    })
  },
})

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
    cinemaOsDevProxy(),
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
