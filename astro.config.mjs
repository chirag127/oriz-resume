import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://resume.oriz.in',
  output: 'static',
  vite: { plugins: [tailwindcss()] },
  integrations: [react(), sitemap()],
})
