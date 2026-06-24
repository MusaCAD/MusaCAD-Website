// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// GitHub Pages ⇄ custom-domain switch (no manual config edit needed).
//
// • No custom domain  → served at https://<org>.github.io/<repo>/, so we need
//   base = '/<repo>/'.
// • Custom domain      → the moment a `public/CNAME` file exists, the site is
//   served from the domain root, so base = '/' and site = that domain.
//
// To go live on musacad.org: add `public/CNAME` containing `musacad.org`,
// commit, push. Everything below adjusts automatically.
// ---------------------------------------------------------------------------
const REPO = 'MusaCAD-Website';
const GH_PAGES_HOST = 'musacad.github.io'; // org/user github.io subdomain

const cnamePath = fileURLToPath(new URL('./public/CNAME', import.meta.url));
const customDomain = existsSync(cnamePath)
  ? readFileSync(cnamePath, 'utf8').trim().split('\n')[0].trim()
  : null;

const site = customDomain ? `https://${customDomain}` : `https://${GH_PAGES_HOST}`;
const base = customDomain ? '/' : `/${REPO}/`;

// https://astro.build/config
export default defineConfig({
  site,
  base,

  // Static output — no backend required. Ready for GitHub Pages.
  output: 'static',

  // Tailwind v4 is wired through its first-party Vite plugin.
  vite: {
    plugins: [tailwindcss()],
  },
});
