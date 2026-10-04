import type { APIRoute } from 'astro';
import { SCREENSHOTS } from '../data/screenshots';

/**
 * Every page in src/pages, discovered rather than listed by hand, so a new page
 * can't be left out. Skipped: the 404 page, `_`-prefixed files, and endpoints
 * like this one. The home page also lists its screenshots for image search.
 */
const pages = Object.keys(import.meta.glob('./**/*.astro'))
  .map((f) => f.replace(/^\.\//, '').replace(/\.astro$/, ''))
  .filter((f) => f !== '404' && !f.split('/').some((part) => part.startsWith('_')))
  .map((f) => (f === 'index' ? '' : `${f.replace(/\/index$/, '')}/`))
  .sort();

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = ({ site }) => {
  const abs = (path: string) => new URL(`${import.meta.env.BASE_URL}${path}`, site).href;
  const urls = pages.map((path) => {
    const images =
      path === ''
        ? SCREENSHOTS.map(
            (s) =>
              `\n    <image:image><image:loc>${esc(abs(s.src.replace(/^\//, '')))}</image:loc></image:image>`,
          ).join('')
        : '';
    return `  <url>\n    <loc>${esc(abs(path))}</loc>${images}\n  </url>`;
  });
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    urls.join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
