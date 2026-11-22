import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base './' gjør at siden fungerer både på GitHub Pages
// (https://<bruker>.github.io/Istrefi-Games/) og på et eget domene senere.
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // Støtt eldre iPader (iOS 13 og nyere), ikke bare de nyeste nettleserne.
  build: { target: ['es2019', 'safari13'], cssTarget: ['safari13'] },
  plugins: [
    react(),
    VitePWA({
      // 'prompt': appen laster ikke seg selv på nytt midt i bruk (ga dobbel åpningsskjerm).
      // Ny versjon tas i bruk neste gang appen åpnes.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Istrefi Games',
        short_name: 'Istrefi',
        description: 'Trygge og morsomme spill for barn fra 2 til 15 år.',
        lang: 'no',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#4cc9f0',
        theme_color: '#4cc9f0',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,svg,png,webp,woff2,mp3,ogg,json}'],
        // Opplesing (14 MB, to språk) lastes ikke ned på forhånd – hvert klipp lagres første gang det spilles
        globIgnores: ['voice/**'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: null,
        runtimeCaching: [
          {
            // Opplesing: lagres når de spilles første gang, så de virker offline etterpå
            urlPattern: ({ url }) => url.pathname.includes('/voice/'),
            handler: 'CacheFirst',
            options: { cacheName: 'voice', expiration: { maxEntries: 3000 } }
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages', networkTimeoutSeconds: 4 }
          }
        ]
      }
    })
  ]
});
