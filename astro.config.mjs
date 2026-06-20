import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Custom domain (see public/CNAME) → site is served from the root.
const SITE = 'https://tasis.info';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  integrations: [sitemap()],
  build: {
    // Inline small stylesheets, keep large ones external — fewer requests, no FOUC.
    inlineStylesheets: 'auto',
    format: 'directory',
  },
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
