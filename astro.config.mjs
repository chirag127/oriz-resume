// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import AstroPwa from '@vite-pwa/astro'

export default defineConfig({
  site: 'https://resume.oriz.in',
  output: 'static',
  vite: { plugins: [tailwindcss()] },
  integrations: [
    react(),
    sitemap(),
    AstroPwa({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        id: '/',
        name: 'oriz Resume',
        short_name: 'Resume',
        description: 'ATS-clean resume builder — form to templates, live preview, print to PDF, autosave. 100% client-side.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        lang: 'en',
        dir: 'ltr',
        categories: ['productivity'],
        theme_color: '#14213d',
        background_color: '#f7f4ee',
        icons: [
          { src: '/icons/icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
          { src: '/icons/icon-256.png', type: 'image/png', sizes: '256x256', purpose: 'any' },
          { src: '/icons/icon-384.png', type: 'image/png', sizes: '384x384', purpose: 'any' },
          { src: '/icons/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'any' },
          { src: '/icons/maskable-512.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
          { src: '/icons/icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
        ],
        screenshots: [
          {
            src: '/screenshots/desktop.png',
            type: 'image/png',
            sizes: '1280x800',
            form_factor: 'wide',
            label: 'oriz Resume — desktop builder',
          },
          {
            src: '/screenshots/mobile.png',
            type: 'image/png',
            sizes: '390x844',
            label: 'oriz Resume — mobile builder',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff,woff2}'],
        navigateFallbackDenylist: [/^\/\.well-known\//],
        runtimeCaching: [
          {
            // g4f / pollinations / AI providers — needs network, cache last good response.
            urlPattern: ({ url }) => url.origin !== self.location.origin,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'oriz-resume-ai',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
