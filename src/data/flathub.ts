/**
 * Build-time Flathub data (server only — never imported by browser code).
 *
 * The install commands themselves are static facts, so the Flatpak panel never
 * depends on this. All it decides is whether the panel may say "Verified": that
 * status belongs to Flathub, so the site reads it rather than asserting it.
 */
import { FLATHUB_APPSTREAM_API } from './site';

const TIMEOUT_MS = 8000;

let pending: Promise<boolean> | null = null;

/** Whether Flathub currently shows the app as verified. False on any failure. */
export function isFlathubVerified(): Promise<boolean> {
  pending ??= load();
  return pending;
}

async function load(): Promise<boolean> {
  try {
    const res = await fetch(FLATHUB_APPSTREAM_API, {
      headers: { 'User-Agent': 'musacad-web' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Flathub ${res.status}`);
    const json = (await res.json()) as { metadata?: Record<string, unknown> };
    const verified = json.metadata?.['flathub::verification::verified'];
    return verified === true || verified === 'true';
  } catch (err) {
    console.warn(
      '[site] Flathub status unavailable at build time; omitting "Verified". ' +
        `(${err instanceof Error ? err.message : String(err)})`,
    );
    return false;
  }
}
