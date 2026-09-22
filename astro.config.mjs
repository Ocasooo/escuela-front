// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  vite: {
    envPrefix: ['PUBLIC_', 'VITE_', 'NEXT_PUBLIC_', 'API_', 'BACKEND_']
  },
  integrations: [tailwind()],
  devToolbar: {
    enabled: false
  },
  redirects: {
    '/login': '/',
    '/index': '/'
  }
});