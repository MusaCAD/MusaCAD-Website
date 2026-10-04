import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL;
  const manifest = {
    name: 'Musa CAD',
    short_name: 'Musa CAD',
    description: "Free, open-source 2D CAD with AutoCAD's commands, ribbon and shortcuts.",
    start_url: base,
    scope: base,
    display: 'browser',
    background_color: '#faf9f6',
    theme_color: '#faf9f6',
    icons: [
      { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${base}icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
};
