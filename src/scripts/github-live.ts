/**
 * Keeps GitHub-derived numbers current in the browser.
 *
 * The site is statically built, so anything baked in at build time (star count,
 * latest release tag, download URLs) freezes until the next deploy. This module
 * refreshes those values on every visit instead:
 *
 *   • `[data-gh-stars]` — star count, site-wide.
 *   • `[data-gh-tag]`   — latest release tag, site-wide.
 *   • `[data-download]` — the download CTA, re-pointed at the artifact that
 *     matches the visitor's OS.
 *
 * The OS pass runs immediately against the server-rendered release JSON (no
 * network, no flash — the CTA is still behind its GSAP reveal). The API pass
 * follows and re-renders only if GitHub actually answered.
 *
 * Failure is always silent and non-destructive: if the API is unreachable,
 * rate-limited, or returns something unexpected, the server-rendered values
 * simply stay on screen.
 */
import {
  BUILD_URL,
  LATEST_RELEASE_API,
  RELEASES_URL,
  REPO_API,
  assetLabel,
  assetMeta,
  assetTitle,
  detectOS,
  formatStars,
  osName,
  pickAsset,
  toRelease,
  type OS,
  type Release,
} from '../data/site';

/**
 * Like `Snapshot`, but both halves are independently optional: GitHub may
 * answer for the repo and not for the release (or neither), and a half we
 * didn't get must never overwrite what the server rendered.
 */
interface LiveSnapshot {
  stars: number | null;
  release: Release | null;
}

/** Bump the suffix whenever the cached shape changes. */
const CACHE_KEY = 'musacad:gh:v1';
/** How long one visitor may reuse a cached answer. Keeps us far under the
 *  unauthenticated 60-requests/hour/IP limit while still feeling live. */
const CACHE_TTL_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 6000;

/* ========================================================================== */
/* Session cache                                                              */
/* ========================================================================== */

interface CacheEntry {
  at: number;
  snapshot: LiveSnapshot;
}

function readCache(): LiveSnapshot | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry?.snapshot || Date.now() - entry.at > CACHE_TTL_MS) return null;
    return entry.snapshot;
  } catch {
    // Private mode, blocked storage, corrupt JSON — just treat it as a miss.
    return null;
  }
}

function writeCache(snapshot: LiveSnapshot): void {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ at: Date.now(), snapshot } satisfies CacheEntry),
    );
  } catch {
    /* storage unavailable — caching is an optimization, not a requirement */
  }
}

/* ========================================================================== */
/* Rendering                                                                  */
/* ========================================================================== */

function link(text: string, href: string, title?: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.textContent = text;
  a.href = href;
  if (title) a.title = title;
  a.className =
    'underline decoration-line-strong underline-offset-[3px] transition-colors hover:text-ink-soft hover:decoration-ink-faint';
  return a;
}

function separator(): HTMLSpanElement {
  const s = document.createElement('span');
  s.textContent = '·';
  s.setAttribute('aria-hidden', 'true');
  return s;
}

function note(text: string): HTMLSpanElement {
  const s = document.createElement('span');
  s.textContent = text;
  return s;
}

/**
 * Read the release snapshot the server embedded next to a download CTA. It is
 * already in our own `Release` shape (not GitHub's), so this only needs to
 * parse and sanity-check it.
 */
function embeddedRelease(root: HTMLElement): Release | null {
  const el = root.querySelector<HTMLScriptElement>('script[data-dl-release]');
  if (!el?.textContent) return null;
  try {
    const release = JSON.parse(el.textContent) as Release;
    if (typeof release?.tag !== 'string' || !Array.isArray(release.assets)) {
      return null;
    }
    return release;
  } catch {
    return null;
  }
}

/**
 * Point one download CTA at the artifact for `os`, and list what's left in the
 * small line underneath. Called both for the embedded release and for the
 * freshly fetched one.
 */
function renderDownload(root: HTMLElement, release: Release, os: OS): void {
  const primary = root.querySelector<HTMLAnchorElement>('[data-dl-primary]');
  const label = root.querySelector<HTMLElement>('[data-dl-label]');
  const alt = root.querySelector<HTMLElement>('[data-dl-alt]');
  if (!primary || !label || !alt) return;

  const chosen = pickAsset(release, os);

  // --- primary button ---
  if (chosen) {
    primary.href = chosen.url;
    // A direct asset URL is a file download, not a page: no new tab.
    primary.removeAttribute('target');
    primary.setAttribute('download', '');
    primary.title = assetTitle(chosen);
    label.textContent = `Download for ${osName(os)}`;
  } else {
    primary.href = release.url || RELEASES_URL;
    primary.target = '_blank';
    primary.removeAttribute('download');
    primary.removeAttribute('title');
    label.textContent = 'Download';
  }

  // Swap in the platform glyph.
  const iconFor = chosen ? os : 'other';
  root.querySelectorAll<SVGElement>('[data-dl-icon]').forEach((icon) => {
    icon.classList.toggle('hidden', icon.dataset.dlIcon !== iconFor);
  });

  // --- "other downloads" line ---
  alt.replaceChildren();
  const parts: Node[] = [];

  if (chosen) {
    // Lead with what the big button will actually hand you.
    parts.push(note(assetMeta(chosen)));
  } else if (os === 'macos') {
    // Honest about the gap rather than silently offering a Linux build.
    parts.push(note('No macOS build yet —'));
    parts.push(link('build from source ↗', BUILD_URL));
  }

  for (const asset of release.assets) {
    if (asset === chosen) continue;
    parts.push(link(assetLabel(asset), asset.url, assetTitle(asset)));
  }

  parts.push(link('All releases ↗', release.url || RELEASES_URL));

  parts.forEach((node, i) => {
    if (i > 0) alt.append(separator());
    alt.append(node);
  });

  // Anything pointing at github.com (rather than a file) opens in a new tab.
  alt.querySelectorAll('a').forEach((a) => {
    if (!/\/releases\/download\//.test(a.href)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

/** Push whatever half (or halves) of a snapshot we actually have into the page. */
function apply(snapshot: LiveSnapshot, os: OS): void {
  const { stars, release } = snapshot;

  if (typeof stars === 'number') {
    const label = formatStars(stars);
    document.querySelectorAll<HTMLElement>('[data-gh-stars]').forEach((el) => {
      el.textContent = label;
      el.title = `${stars} ${stars === 1 ? 'star' : 'stars'} on GitHub`;
    });
  }

  if (!release) return;

  document.querySelectorAll<HTMLElement>('[data-gh-tag]').forEach((el) => {
    el.textContent = release.tag;
  });

  document.querySelectorAll<HTMLElement>('[data-download]').forEach((root) => {
    renderDownload(root, release, os);
  });
}

/* ========================================================================== */
/* Fetch                                                                      */
/* ========================================================================== */

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return res.json();
}

async function fetchSnapshot(): Promise<LiveSnapshot | null> {
  const [repo, release] = await Promise.all([
    getJson(REPO_API).catch(() => null),
    getJson(LATEST_RELEASE_API).catch(() => null),
  ]);

  const stars = (repo as { stargazers_count?: unknown } | null)?.stargazers_count;
  const parsed = toRelease(release);

  // Nothing usable came back — leave the server-rendered values alone.
  if (typeof stars !== 'number' && !parsed) return null;

  return { stars: typeof stars === 'number' ? stars : null, release: parsed };
}

/* ========================================================================== */
/* Boot                                                                       */
/* ========================================================================== */

export async function initGitHubLive(): Promise<void> {
  const os = detectOS(navigator);

  // Pass 1 — instant, offline: personalize what the server already gave us.
  document.querySelectorAll<HTMLElement>('[data-download]').forEach((root) => {
    const release = embeddedRelease(root);
    if (release) renderDownload(root, release, os);
  });

  // Pass 2 — live: cached answer if we have a fresh one, otherwise the API.
  const cached = readCache();
  if (cached) {
    apply(cached, os);
    return;
  }

  const snapshot = await fetchSnapshot();
  if (!snapshot) return;
  writeCache(snapshot);
  apply(snapshot, os);
}
