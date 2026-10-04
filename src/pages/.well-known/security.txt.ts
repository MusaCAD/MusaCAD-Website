import type { APIRoute } from 'astro';
import { CONTACT_EMAIL } from '../../data/site';

/**
 * RFC 9116. `Expires` must stay under a year out; computing it at build time and
 * rebuilding nightly keeps it six months ahead without anyone remembering to.
 */
export const GET: APIRoute = ({ site }) => {
  const abs = (path: string) => new URL(`${import.meta.env.BASE_URL}${path}`, site).href;
  const expires = new Date(Date.now() + 180 * 864e5);
  expires.setUTCHours(0, 0, 0, 0);
  const body = [
    `Contact: mailto:${CONTACT_EMAIL}`,
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: en',
    `Canonical: ${abs('.well-known/security.txt')}`,
    `Policy: ${abs('about/#security')}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
