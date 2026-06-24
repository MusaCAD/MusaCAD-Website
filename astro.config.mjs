// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Canonical site URL — used for sitemap, canonical tags, and absolute asset URLs.
  site: 'https://musacad.org',

  // Tailwind v4 is wired through its first-party Vite plugin (no PostCSS config needed).
  vite: {
    plugins: [tailwindcss()],
  },

  // Static output — no backend required. Ready for GitHub Pages / Netlify / Vercel.
  output: 'static',
});
