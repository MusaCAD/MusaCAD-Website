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

Everything is **static** — no backend, no runtime services. The only runtime
network call is a direct, unauthenticated read of the public GitHub API to keep
the star count, release tag and download links current (see
[Live GitHub data](#live-github-data--os-aware-downloads)).

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
  musacad_logo.svg        # official logo, verbatim from the engine repo (source of truth)
  og-image.png            # 1200×630 share card (generated, see scripts/)
  icon-512.png            # transparent 512px mark (manifest, structured data)
  icon-maskable-512.png   # 512px mark on the paper ground, inside the maskable safe zone
  apple-touch-icon.png    # 180px iOS home screen, opaque (iOS composites alpha to black)
  icon-192.png            # transparent mark used inline in the navbar + footer
  favicon*.png            # 32/48px favicons, transparent
  musacad_mark.png        # the old share card, kept for links already shared
  screenshots/*.webp      # product screenshots, 500 and 1000px (generated)
  .well-known/            # Flathub domain verification — keep it
scripts/
  make-images.sh          # regenerate screenshots, icons and the share card
  og-image.html           # the share card's template
src/
  layouts/
    Base.astro            # document shell: meta, canonical, Open Graph, JSON-LD, skip link
    Page.astro            # Base + navbar + <main> + footer, for every page but home
  components/
    Navbar.astro          # sticky glass nav + live GitHub star count
    Hero.astro            # the <h1>, CTAs, interactive CAD viewport
    Screenshots.astro     # the product screenshots
    Drafting.astro        # what a drafter can do (owns #features)
    Features.astro        # engine internals ("What's inside", #engine)
    DownloadCTA.astro     # OS-aware download button + "other downloads" line
    FlatpakPanel.astro    # the Flathub commands with copy buttons
    PageHeader.astro      # breadcrumb, eyebrow, <h1> and lede for content pages
  pages/
    index.astro           # home
    download.astro        # every platform, requirements, checksums, build from source
    autocad-alternative.astro  # for AutoCAD users: what carries over, an honest comparison
    faq.astro             # FAQ (FAQPage structured data from data/faq.ts)
    about.astro           # who makes it, contact, security reports
    privacy.astro         # privacy policy
    terms.astro           # terms of use
    donate.astro          # donations
    404.astro             # not-found page (noindex)
    robots.txt.ts         # robots.txt
    sitemap.xml.ts        # sitemap, discovered from src/pages
    llms.txt.ts           # plain summary for AI assistants (llmstxt.org)
    site.webmanifest.ts   # web app manifest
    .well-known/security.txt.ts  # RFC 9116 security contact
  scripts/
    smooth-scroll.ts      # Lenis <-> GSAP ScrollTrigger integration
    hero-canvas.ts        # Three.js CAD drawing (draws on load, snap markers, parallax)
    three-lite.ts         # the slice of three.js the canvas uses
    github-live.ts        # runtime refresh of stars / release tag / download links
    clipboard.ts          # copy-to-clipboard with a fallback for older browsers
  data/
    site.ts               # links, contact, platform support, release model (pure)
    seo.ts                # structured data and the share card
    faq.ts                # the FAQ, for the page and its structured data
    screenshots.ts        # screenshot files, alt text and captions
    github.ts             # build-time GitHub fetch (server only)
    flathub.ts            # build-time Flathub verification status (server only)
  styles/global.css       # design tokens (@theme) + base + component layer
astro.config.mjs          # site URL, base path, inlined stylesheet, Tailwind v4
```

### Design tokens

All color/type/motion tokens live in the `@theme` block of
[`src/styles/global.css`](src/styles/global.css). The brand hues are **sampled
from the official logo**, `assets/branding/musacad_logo.svg` in the engine repo,
and come in two strengths:

| Token | Value | Use |
| ----- | ----- | --- |
| `--color-brand` | `#f73c1c` | the logo's exact orange — large headings, canvases, diagrams |
| `--color-accent` | `#d82608` | the same hue deepened for WCAG AA — buttons and small text |
| `--color-accent-2-bright` | `#0fa968` | dimension green for strokes and markers |
| `--color-accent-2` | `#0b7a4b` | the same green at AA strength for small text |
| `--color-brand-navy` | `#0e2c4c` | the logo's navy body — deep panels |

The logo's orange measures 3.5:1 on the paper ground: fine for large type, short
of the 4.5:1 that small text and white-on-orange buttons need. So display type and
decoration keep the logo's exact hue, and everything a visitor has to read or
press uses the deeper shade. The Three.js canvases read `--accent` and
`--accent-2`, which point at the bright values.

If the mark ever changes again, re-sample `--color-brand` and the navy from the
SVG, recompute the AA shades for 4.5:1 on white, paper and panel, and run
`scripts/make-images.sh` — every icon and the share card derive from it.

---

## Search engines, AI assistants and the share card

Every page is built to be understood without running JavaScript:

- **One `<h1>` per page** that says what the page is about. On the home page it's
  "Free, open-source AutoCAD alternative"; the 144 Hz slogan is display text.
- **Self-referencing canonical URLs**, full Open Graph and Twitter tags, and a
  1200×630 share card (`public/og-image.png`).
- **Structured data** (schema.org JSON-LD, [`src/data/seo.ts`](src/data/seo.ts)):
  every page carries the Organization, WebSite, SoftwareApplication (free,
  LGPL, platforms, version, features) and SoftwareSourceCode nodes, plus its own
  WebPage and BreadcrumbList; the FAQ is an `FAQPage`. There are no ratings or
  reviews in it, and there shouldn't be until they're real.
- **`/sitemap.xml`** lists every page in `src/pages` automatically (the 404 and
  `_`-prefixed files excepted), with the screenshots for image search.
  **`/robots.txt`** welcomes every crawler and points at it.
- **`/llms.txt`** is a plain summary for AI assistants: what Musa CAD is, what
  it isn't (3D, AutoLISP), platforms, license, privacy and links.
- **`/.well-known/security.txt`** names the security contact; its `Expires` is
  computed at build time, and the nightly rebuild keeps it six months ahead.

What the site says about platforms comes from `PLATFORM_SUPPORT` in
[`src/data/site.ts`](src/data/site.ts): Windows and Linux are supported, macOS is
a preview until the Metal renderer lands. Change it there and the download page,
FAQ, structured data and `llms.txt` follow.

### Regenerating images

```sh
scripts/make-images.sh ../musa_cad   # path to the engine checkout
```

Rebuilds the WebP screenshots from the engine's `assets/screenshots/`, the 512px
icons from the logo, and the share card from `scripts/og-image.html`. Needs
Chrome or Chromium and `npm ci`.

---

## Legal pages

[`/privacy/`](src/pages/privacy.astro) and [`/terms/`](src/pages/terms.astro) are
written against what the code actually does — the site's only network call is
`scripts/github-live.ts` and its only storage is that file's 15-minute
`sessionStorage` cache; the app's only automatic request is the update check in
the engine's `src/ui/update_checker.cpp`. If either changes, update the policy
and its date in the same commit.

## Live GitHub data & OS-aware downloads

A static site normally freezes whatever it knew at build time. Three values must
not do that — the **star count**, the **latest release tag**, and the **download
URLs** — so they are resolved twice:

| When | What happens | Source |
| ---- | ------------ | ------ |
| Build time | `data/github.ts` fetches the repo + the release list once per build and renders real values into the HTML. Unreachable API ⇒ falls back to `FALLBACK_RELEASE` and a plain "Star" label; the build never fails. | server |
| Page view | `scripts/github-live.ts` re-reads both endpoints and updates every `[data-gh-stars]`, `[data-gh-tag]` and `[data-download]` in place. | browser |

So a visitor always sees the current release even if the site hasn't been
rebuilt since it shipped. Runtime results are cached in `sessionStorage` for 15
minutes, which keeps a visitor far below GitHub's unauthenticated limit (60
requests/hour/IP). If the API is unreachable, rate-limited or blocked, the
server-rendered values simply stay on screen — failure is silent and never
destructive.

### The download button

`DownloadCTA.astro` renders a platform-neutral **Download** button pointing at
the releases page, with every artifact listed in the small line beneath it.
That's what no-JS visitors and crawlers get, and it is always correct.

In the browser, `detectOS()` then retargets it at the matching artifact —
`.exe` for Windows, `.AppImage` for Linux, `.dmg` for macOS. Everything else
drops into the small "other downloads" line, so no artifact is ever hidden, just
de-emphasized. A phone or an unrecognized platform keeps the neutral button.

### Flatpak on Linux

Linux visitors get a second route under the AppImage button: the two Flathub
commands, each with its own copy button.

```sh
flatpak install flathub org.musacad.MusaCAD
flatpak run org.musacad.MusaCAD
```

Each step's number ticks once its command is copied and stays ticked, so the
install reads as progress. The panel links the
[Flathub listing](https://flathub.org/apps/org.musacad.MusaCAD) and Flathub's
setup guide, since Ubuntu and others ship without the Flathub remote and the
install command fails without it. On narrow screens the commands wrap at spaces
under a hanging `$` rather than scrolling sideways.

Where the panel shows, the GitHub `.flatpak` bundle drops out of the small line
— two Flatpak routes side by side would only raise "which one?". Windows and
macOS visitors don't see the panel at all; no-JS visitors always do.

The "Verified on Flathub" label is read from Flathub's API at build time rather
than asserted, and quietly disappears if that status ever lapses. The
verification itself rests on
[`public/.well-known/org.flathub.VerifiedApps.txt`](public/.well-known/org.flathub.VerifiedApps.txt)
— keep that file.

### Releases that skip a platform

A release doesn't have to ship every platform — a Windows build can be held back
while it's still being tested. So the site works from a **catalog** rather than a
single release: `toCatalog()` walks the release list newest-first and, for each
platform, keeps the builds from the first release that has any. A visitor on the
skipped platform is offered the newest build that actually exists for them
instead of being dumped on the releases page.

When that happens the version chip names the release the button really hands
over, not the newest one, and the small line says why:

> **Download for Windows** `v0.4.0`
> installer · 40 MB · v0.5.0 has no Windows build yet · Linux AppImage · …

Note the two different meanings of "version" on the page, and the two hooks that
keep them apart: `[data-gh-tag]` is the newest release (navbar, community band)
and `[data-dl-tag]` is the release this particular button serves. Assets are
taken per release rather than per file, so a platform's set stays internally
consistent — nobody gets an AppImage from one version beside a Flatpak from
another. `RELEASE_LOOKBACK` bounds how far back to search; past that the button
falls back to the releases page.

**Adding a new package format** (a `.deb`, an `.rpm`, an `.msix`) needs exactly
one line in `ASSET_RULES` in [`src/data/site.ts`](src/data/site.ts); the button,
the OS picker and the small line all follow. `rank` breaks ties within an OS
(lowest wins), and checksums/signatures are filtered out automatically. Because
`data/site.ts` is pure and imported by both the build and the browser, the two
renderings cannot drift.

---

## Accessibility

- WCAG AA contrast throughout (see the token table above), 24px minimum touch
  targets, underlined links in running text, and a "Skip to content" link that
  moves keyboard focus into the page.
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
that builds with Node 20 and deploys `dist/` to GitHub Pages. It runs on every push to
`main`, on a **nightly schedule** (so the server-rendered star count and release tag stay
fresh for crawlers and no-JS visitors), and on a `release-published` **repository
dispatch** — let `MusaCAD/MusaCAD` rebuild this site the moment it publishes a release:

```sh
gh api repos/MusaCAD/MusaCAD-Website/dispatches -f event_type=release-published
```

> Note: GitHub disables scheduled workflows after 60 days without repository activity.
> Visitors still get live values from the browser either way — re-enable the schedule
> from the Actions tab if the site goes quiet for that long.

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

The home page has twelve sections: navbar, hero, the pinned draw-on-scroll
sequence, screenshots, drafting features, engine internals, performance, the
interactive command line, the architecture diagram, get-started/build,
community, and footer. Around it: download, AutoCAD alternative, FAQ, about,
privacy, terms, donate and a 404 page.

Every page scores 100 for accessibility, best practices and SEO in Lighthouse,
on mobile and desktop, and validates clean with `html-validate`.

## Support

Musa CAD is free and actively maintained. If it's useful to you, you can help keep
it moving — there's an interactive support page at **[musacad.org/donate](https://musacad.org/donate)**:

- **UPI** — `kiranpranay12@okicici`
- **PayPal** — [paypal.me/pranaykiran](https://paypal.me/pranaykiran)
- **Ko-fi** — [ko-fi.com/pranaykiran](https://ko-fi.com/pranaykiran)

(These also power the repo's **Sponsor** button via [`.github/FUNDING.yml`](.github/FUNDING.yml).)

## License

Site code: MIT (this website). **Musa CAD itself** is
[LGPL-3.0-or-later](https://github.com/MusaCAD/MusaCAD).
Logo © the MusaCAD project, used for identification.
