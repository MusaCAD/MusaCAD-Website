/**
 * Canonical external links + project facts, reused across the site.
 *
 * Everything in this module is *pure* and browser-safe: it is imported both by
 * `.astro` frontmatter (build time) and by `scripts/github-live.ts` (runtime),
 * so the same rules classify release assets in both places. Network access at
 * build time lives in `data/github.ts`.
 */

export const REPO_OWNER = 'MusaCAD';
export const REPO_NAME = 'MusaCAD';

export const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
export const RELEASES_URL = `${REPO_URL}/releases`;
export const REPO_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
export const LATEST_RELEASE_API = `${REPO_API}/releases/latest`;
export const ARCHITECTURE_URL = `${REPO_URL}/blob/main/docs/ARCHITECTURE.md`;
export const BUILD_URL = `${REPO_URL}/blob/main/docs/BUILD.md`;

export const LICENSE = 'LGPL-3.0-or-later';
export const PLATFORMS = ['Linux', 'Windows'];

/**
 * Last-resort release tag. Only ever shown when GitHub was unreachable at build
 * time *and* the visitor's browser can't reach the API either — otherwise the
 * real tag comes from the API. Keep it roughly current, but it is not the
 * source of truth.
 */
export const FALLBACK_RELEASE = 'v0.4.0';

/* ========================================================================== */
/* Release model                                                              */
/* ========================================================================== */

export type OS = 'windows' | 'linux' | 'macos' | 'other';

export interface ReleaseAsset {
  /** Raw file name, e.g. `MusaCAD-0.4.0-x86_64.AppImage`. */
  name: string;
  /** Direct `browser_download_url`. */
  url: string;
  /** Size in bytes. */
  size: number;
  os: OS;
  /** Human name for the package format, e.g. `AppImage`. */
  kind: string;
  /** Preference within an OS — lower wins when picking the default download. */
  rank: number;
}

export interface Release {
  tag: string;
  /** Release page on GitHub (falls back to the releases index). */
  url: string;
  assets: ReleaseAsset[];
}

export interface Snapshot {
  stars: number | null;
  release: Release;
}

/** Used whenever the API gave us nothing usable. */
export const FALLBACK_RELEASE_INFO: Release = {
  tag: FALLBACK_RELEASE,
  url: RELEASES_URL,
  assets: [],
};

/* -------------------------------------------------------------------------- */
/* Asset classification                                                       */
/* -------------------------------------------------------------------------- */

/** Checksums, signatures and manifests aren't "downloads" a visitor wants. */
const IGNORED_ASSET = /\.(sha\d*(sum)?|asc|sig|pem|txt|json|yml|yaml)$|checksums?/i;

/**
 * First matching rule wins. Adding a new packaging format to the release
 * pipeline (a `.deb`, an `.rpm`, an `.msix`) only needs a line here — the
 * download button, the "other downloads" line and the OS picker all follow.
 */
const ASSET_RULES: ReadonlyArray<{
  re: RegExp;
  os: OS;
  kind: string;
  rank: number;
}> = [
  { re: /\.(exe|msi)$/i, os: 'windows', kind: 'installer', rank: 0 },
  { re: /-win(dows)?[-.].*\.zip$/i, os: 'windows', kind: 'portable zip', rank: 1 },
  { re: /\.appimage$/i, os: 'linux', kind: 'AppImage', rank: 0 },
  { re: /\.deb$/i, os: 'linux', kind: '.deb package', rank: 1 },
  { re: /\.rpm$/i, os: 'linux', kind: '.rpm package', rank: 2 },
  { re: /\.flatpak$/i, os: 'linux', kind: 'Flatpak', rank: 3 },
  { re: /\.(dmg|pkg)$/i, os: 'macos', kind: 'disk image', rank: 0 },
  { re: /\.tar\.(gz|xz|zst|bz2)$/i, os: 'linux', kind: 'tarball', rank: 4 },
  { re: /\.zip$/i, os: 'other', kind: 'archive', rank: 5 },
];

/** Display order for the "other downloads" line. */
const OS_ORDER: readonly OS[] = ['windows', 'linux', 'macos', 'other'];

/** Human OS name. `other` has none — its assets are labelled by kind alone. */
export function osName(os: OS): string {
  return os === 'windows'
    ? 'Windows'
    : os === 'linux'
      ? 'Linux'
      : os === 'macos'
        ? 'macOS'
        : '';
}

/** `Linux AppImage`, `Windows installer`, `archive`. */
export function assetLabel(asset: ReleaseAsset): string {
  const name = osName(asset.os);
  return name ? `${name} ${asset.kind}` : asset.kind;
}

/** `AppImage · 32 MB` — drops the size if GitHub didn't report one. */
export function assetMeta(asset: ReleaseAsset): string {
  const size = formatBytes(asset.size);
  return size ? `${asset.kind} · ${size}` : asset.kind;
}

/** `MusaCAD-0.4.0-x86_64.AppImage · 32 MB` — for `title` tooltips. */
export function assetTitle(asset: ReleaseAsset): string {
  const size = formatBytes(asset.size);
  return size ? `${asset.name} · ${size}` : asset.name;
}

/** Binary MB, matching how GitHub itself reports asset sizes. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const mb = bytes / 1024 / 1024;
  if (mb >= 1000) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 10) return `${Math.round(mb)} MB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/** Compact star formatting (1234 -> "1.2k"). */
export function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : `${n}`;
}

/**
 * Normalize one GitHub release-asset payload. Returns `null` for things a
 * visitor should never be offered (checksums, signatures).
 */
function toAsset(raw: unknown): ReleaseAsset | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  const name = typeof a.name === 'string' ? a.name : '';
  const url = typeof a.browser_download_url === 'string' ? a.browser_download_url : '';
  if (!name || !url || IGNORED_ASSET.test(name)) return null;

  const rule = ASSET_RULES.find((r) => r.re.test(name));
  return {
    name,
    url,
    size: typeof a.size === 'number' ? a.size : 0,
    os: rule?.os ?? 'other',
    kind: rule?.kind ?? 'download',
    rank: rule?.rank ?? 9,
  };
}

/**
 * Normalize a GitHub `releases/latest` payload into our `Release` shape.
 * Returns `null` if the payload isn't a release (404 body, rate-limit body…).
 */
export function toRelease(raw: unknown): Release | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.tag_name !== 'string' || !r.tag_name) return null;

  const assets = (Array.isArray(r.assets) ? r.assets : [])
    .map(toAsset)
    .filter((a): a is ReleaseAsset => a !== null)
    .sort(
      (a, b) =>
        OS_ORDER.indexOf(a.os) - OS_ORDER.indexOf(b.os) ||
        a.rank - b.rank ||
        a.name.localeCompare(b.name),
    );

  return {
    tag: r.tag_name,
    url: typeof r.html_url === 'string' ? r.html_url : RELEASES_URL,
    assets,
  };
}

/** The asset a visitor on `os` should get, or `null` if we ship nothing for it. */
export function pickAsset(release: Release, os: OS): ReleaseAsset | null {
  if (os === 'other') return null;
  return release.assets.find((a) => a.os === os) ?? null;
}

/** Classify a single platform/UA string. `null` means "no opinion". */
function classifyPlatformString(value: string | undefined | null): OS | null {
  if (!value) return null;
  const s = value.toLowerCase();
  // Mobile first: we ship no Android/iOS build, and an Android UA string also
  // contains "Linux" — checking it first stops us offering an AppImage to a phone.
  if (/android|iphone|ipad|ipod/.test(s)) return 'other';
  // macOS before Windows: the substring "darwin" contains "win".
  if (/mac ?os|macintosh|darwin/.test(s)) return 'macos';
  if (/windows|win32|win64|wow64/.test(s)) return 'windows';
  if (/linux|x11|ubuntu|fedora|chrome ?os|cros|freebsd/.test(s)) return 'linux';
  return null;
}

/**
 * Best-effort OS detection.
 *
 * Sources are consulted in order of trust — User-Agent Client Hints give a
 * single clean token, the UA string is messy but universal, and `nav.platform`
 * is legacy and increasingly frozen — and the first one with an opinion wins.
 * Merging them into one haystack would let a stale `nav.platform` outvote a
 * precise hint, so we don't.
 *
 * Anything unrecognized (or that we can't ship a build for — phones, tablets)
 * resolves to `other`, which leaves the generic "Download" button pointing at
 * the releases page. That's the safe direction to be wrong in.
 */
export function detectOS(nav: Navigator): OS {
  const uaData = (nav as Navigator & { userAgentData?: { platform?: string } })
    .userAgentData;

  for (const source of [uaData?.platform, nav.userAgent, nav.platform]) {
    const os = classifyPlatformString(source);
    if (os) return os;
  }
  return 'other';
}
