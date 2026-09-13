/**
 * Build-time GitHub data (server only — never imported by browser code).
 *
 * This gives the static HTML a correct first paint: real star count, real
 * release tag, real asset list. `scripts/github-live.ts` then refreshes the
 * same values in the browser on every visit, so the page stays current between
 * deploys instead of freezing at whatever was true when it was built.
 */
import {
  FALLBACK_RELEASE_INFO,
  LATEST_RELEASE_API,
  REPO_API,
  toRelease,
  type Snapshot,
} from './site';

const TIMEOUT_MS = 8000;

/**
 * A token isn't required (the endpoints are public), but unauthenticated calls
 * are limited to 60/hour *per IP* — and CI runners share IPs. The deploy
 * workflow passes the automatic `GITHUB_TOKEN`, which lifts that to 1000/hour.
 */
function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'musacad-web',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: headers(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${url}`);
  return res.json();
}

/** Log once and degrade — a marketing build must never fail on a flaky API. */
function soften(what: string) {
  return (err: unknown) => {
    console.warn(
      `[site] GitHub ${what} unavailable at build time; falling back. ` +
        `(${err instanceof Error ? err.message : String(err)})`,
    );
    return null;
  };
}

let pending: Promise<Snapshot> | null = null;

/**
 * Stars + the latest release, fetched once per `astro build` and shared by
 * every component that asks (navbar, hero, download section, community band).
 */
export function getSnapshot(): Promise<Snapshot> {
  pending ??= load();
  return pending;
}

async function load(): Promise<Snapshot> {
  const [repo, release] = await Promise.all([
    getJson(REPO_API).catch(soften('repository')),
    getJson(LATEST_RELEASE_API).catch(soften('latest release')),
  ]);

  const stars = (repo as { stargazers_count?: unknown } | null)?.stargazers_count;

  return {
    stars: typeof stars === 'number' ? stars : null,
    release: toRelease(release) ?? FALLBACK_RELEASE_INFO,
  };
}
