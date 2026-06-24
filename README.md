# Musa CAD — Marketing Website

The marketing site for **[Musa CAD](https://github.com/MusaCAD/MusaCAD)** — a
high-performance, multi-threaded 2D CAD engine in modern C++23. Built to feel
like the engine it advertises: light, precise, and fast, with scroll-driven CAD
geometry that draws, snaps, and renders in real time.

Live target domain: **musacad.org**

---

## Tech stack

| Concern        | Choice                                                              |
| -------------- | ------------------------------------------------------------------- |
| Framework      | [Astro](https://astro.build) (static output, zero-JS by default)    |
| Styling        | [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`, with a custom design-token layer (`src/styles/global.css`) |
| Scroll engine  | [Lenis](https://github.com/darkroomengineering/lenis) smooth scroll  |
| Animation      | [GSAP](https://gsap.com) + ScrollTrigger (scroll-driven sequences)  |
| Hero canvas    | [Three.js](https://threejs.org) (code-split, lazy-loaded)           |
| Fonts          | Self-hosted variable fonts (Space Grotesk / Inter / JetBrains Mono) via Fontsource |

Everything is **static** — no backend, no runtime services. The donate button is
an intentional dummy (shows a "Donations coming soon ✦" toast).

---

## Prerequisites

- **Node.js `>=18.20.8`** (Node 20 LTS recommended). This is enforced via the
  `engines` field. Astro 5 will refuse to build on older Node.
- npm (ships with Node).

> ⚠️ If you see `Node.js vX is not supported by Astro`, upgrade Node. If you see
> `Cannot find module '@tailwindcss/oxide-linux-x64-gnu'`, do a clean reinstall
> (`rm -rf node_modules package-lock.json && npm install`) so Tailwind v4's
> native binary is fetched for your platform.

---

## Getting started

```sh
npm install
npm run dev        # http://localhost:4321 — hot-reloading dev server
```

## Build & preview

```sh
npm run build      # static site -> ./dist
npm run preview    # serve ./dist locally to sanity-check the production build
npm run check      # astro check (type-checks .astro + TS)
```

---

## Project structure

```
public/
  musacad_logo.svg        # official logo (verbatim from the MusaCAD repo)
  musacad_mark.png        # optimized raster mark (navbar / OG)
  favicon*.png            # favicons derived from the logo
src/
  layouts/Base.astro      # document shell: fonts, meta, blueprint bg, smooth scroll
  components/
    Navbar.astro          # sticky glass nav + build-time GitHub star fetch
    Hero.astro            # headline, CTAs, interactive CAD viewport, command line
  scripts/
    smooth-scroll.ts      # Lenis <-> GSAP ScrollTrigger integration
    hero-canvas.ts        # Three.js CAD drawing (draws on load, snap markers, parallax)
  data/site.ts            # canonical links + build-time star fetch helper
  styles/global.css       # design tokens (@theme) + base + component layer
  pages/index.astro       # the page
astro.config.mjs          # site URL + Tailwind v4 Vite plugin
```

### Design tokens

All color/type/motion tokens live in the `@theme` block of
[`src/styles/global.css`](src/styles/global.css). The accent (`--color-accent:
#f73f28`) is **sampled from the official MusaCAD logo artwork**; navy and mint are
the logo's secondary hues. The Three.js hero canvas reads these via CSS custom
properties, so re-theming the site re-themes the live drawing too.

---

## Accessibility

- Full `prefers-reduced-motion` support: Lenis is disabled, the hero canvas
  renders its **final static state** (no animation loop, no pointer tracking),
  and reveal animations are neutralized.
- Anchored navigation works with or without smooth scroll.
- The interactive canvas is decorative; all content is real DOM/text.

---

## Deployment

The output in `dist/` is plain static files — host it anywhere.

### GitHub Pages (configured)

This repo ships a workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
that builds with Node 20 and deploys `dist/` to GitHub Pages on every push to `main`.

**One-time setup:** repo **Settings → Pages → Build and deployment → Source: GitHub
Actions**. After that, each push to `main` publishes automatically. Until a custom domain
is mapped, the site is served at `https://musacad.github.io/MusaCAD-Website/`.

`astro.config.mjs` **auto-detects the base path**: with no custom domain it builds for the
`/MusaCAD-Website/` subpath; the moment a `public/CNAME` file exists it switches to root
(`/`) with `site` set to that domain. So all asset/canonical/OG URLs stay correct in both
states with no manual edit.

### Custom domain (musacad.org)

1. Create `public/CNAME` containing one line: `musacad.org`. Commit + push — the next
   build auto-switches `base` → `/` and `site` → `https://musacad.org`.
2. In **Settings → Pages → Custom domain**, enter `musacad.org` and save.
3. DNS at your registrar:
   - Apex `musacad.org` → four `A` records: `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153` (optionally the matching `AAAA` records).
   - `www.musacad.org` → `CNAME` to `musacad.github.io`.
4. Tick **Enforce HTTPS** once GitHub issues the certificate.

### Netlify / Vercel (alternative)

- **Netlify** — build `npm run build`, publish `dist`.
- **Vercel** — framework preset **Astro** (auto-detected), static output.
- Note: both serve from root, so for these you'd want `base: '/'` (set a `public/CNAME`
  or adjust `astro.config.mjs`).

---

## Status

All ten sections are built and verified (desktop + mobile, normal + reduced motion):
navbar, hero, the pinned **draw-on-scroll** signature sequence, features grid,
performance counters + FPS-vs-edit-activity viz, interactive command-line showcase,
animated three-thread architecture diagram, get-started/build, community/support,
and footer.

## License

Site code: MIT (this website). **Musa CAD itself** is
[LGPL-3.0-or-later](https://github.com/MusaCAD/MusaCAD).
Logo © the MusaCAD project, used for identification.
