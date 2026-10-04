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

/**
 * How many releases back to look when hunting for a platform's newest build.
 * Deep enough to survive a few platform-skipping releases, shallow enough to
 * stay one small API response.
 */
export const RELEASE_LOOKBACK = 10;
/**
 * The release *list*, newest first. We deliberately don't use
 * `/releases/latest`: a release can ship builds for only some platforms (a
 * Windows build held back while it's still being tested, say), and a visitor
 * on the missing platform should still be offered the newest build that does
 * exist for them rather than being dumped on the releases page.
 */
export const RELEASES_API = `${REPO_API}/releases?per_page=${RELEASE_LOOKBACK}`;
export const ARCHITECTURE_URL = `${REPO_URL}/blob/main/docs/ARCHITECTURE.md`;
export const BUILD_URL = `${REPO_URL}/blob/main/docs/BUILD.md`;
export const ISSUES_URL = `${REPO_URL}/issues`;
export const ROADMAP_URL = `${REPO_URL}/blob/main/docs/ROADMAP.md`;
export const COMMANDS_URL = `${REPO_URL}/blob/main/docs/COMMANDS.md`;
export const CLI_URL = `${REPO_URL}/blob/main/docs/CLI.md`;
export const CHANGELOG_URL = `${REPO_URL}/blob/main/CHANGELOG.md`;
export const AUTOCAD_CONFIG_URL = `${REPO_URL}/blob/main/docs/AUTOCAD_CONFIG.md`;
export const LICENSE_URL = 'https://www.gnu.org/licenses/lgpl-3.0.html';

/** Who answers mail about the project — the address on the MusaCAD GitHub organization. */
export const CONTACT_EMAIL = 'pranay@weberq.in';
export const MAINTAINER = 'Pranay Kiran';
export const MAINTAINER_URL = 'https://github.com/KiranPranay';

/**
 * The Flathub listing. Its "verified" badge is earned through
 * public/.well-known/org.flathub.VerifiedApps.txt on this site — keep that file.
 */
export const FLATHUB_APP_ID = 'org.musacad.MusaCAD';
// Locale-neutral: Flathub redirects each visitor to their own language.
export const FLATHUB_URL = `https://flathub.org/apps/${FLATHUB_APP_ID}`;
export const FLATHUB_APPSTREAM_API = `https://flathub.org/api/v2/appstream/${FLATHUB_APP_ID}`;
// Many distros (Ubuntu among them) don't ship the Flathub remote, and the
// install command fails without it.
export const FLATHUB_SETUP_URL = 'https://flathub.org/setup';

/** The two commands the Linux download panel offers, in the order they're run. */
export const FLATPAK_STEPS = [
  { label: 'Install', command: `flatpak install flathub ${FLATHUB_APP_ID}` },
  { label: 'Run', command: `flatpak run ${FLATHUB_APP_ID}` },
] as const;

export const LICENSE = 'LGPL-3.0-or-later';

/**
 * Where Musa CAD runs, and how well. macOS is a preview: the app needs OpenGL 4.5
 * Core and macOS stops at 4.1, so the drawing viewport can't start there until the
 * Metal renderer on the roadmap lands — the command-line tools already work.
 * Say exactly this anywhere the platforms come up; it's the honest version.
 */
export const PLATFORM_SUPPORT = [
  { os: 'windows', name: 'Windows', status: 'supported', detail: 'Windows 10 and 11, 64-bit' },
  { os: 'linux', name: 'Linux', status: 'supported', detail: '64-bit; AppImage or Flathub' },
  { os: 'macos', name: 'macOS', status: 'preview', detail: 'Apple silicon, macOS 12+; command line only for now' },
] as const;

/** What every machine needs, whichever platform. */
export const GPU_REQUIREMENT = 'Graphics drivers with OpenGL 4.5';

/**
 * Last-resort release tag. Only ever shown when GitHub was unreachable at build
 * time *and* the visitor's browser can't reach the API either — otherwise the
 * real tag comes from the API. Keep it roughly current, but it is not the
 * source of truth.
 */
export const FALLBACK_RELEASE = 'v0.5.0';

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
  /** Tag of the release this asset came from — not necessarily the latest one. */
  tag: string;
  /** That release's page on GitHub. */
  releaseUrl: string;
  /** URL of the `<name>.sha256` published beside it, when the release has one. */
  checksumUrl?: string;
}

/**
 * What the site actually needs to know about downloads: the newest release,
 * plus the best build available for each platform — which may come from an
 * older release when the newest one skipped that platform.
 */
export interface Catalog {
  /** Tag of the newest published release, whatever it happens to ship. */
  latest: string;
  /** That release's page on GitHub. */
  latestUrl: string;
  /** When it was published (ISO 8601), or null when unknown. */
  published: string | null;
  /**
   * One coherent set per platform: for each OS, every asset from the newest
   * release that has any build for it. Sorted by OS, then preference.
   */
  assets: ReleaseAsset[];
}

export interface Snapshot {
  stars: number | null;
  catalog: Catalog;
}

/** Used whenever the API gave us nothing usable. */
export const FALLBACK_CATALOG: Catalog = {
  latest: FALLBACK_RELEASE,
  latestUrl: RELEASES_URL,
  published: null,
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
function toAsset(raw: unknown, tag: string, releaseUrl: string): ReleaseAsset | null {
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
    tag,
    releaseUrl,
  };
}

/**
 * Build the download catalog from a GitHub `/releases` payload.
 *
 * Walks the releases newest-first and, for each platform, keeps the assets from
 * the first release that has any build for it. So a release that ships Linux
 * and macOS but holds back Windows still leaves Windows visitors pointed at the
 * newest Windows build that exists, rather than at the releases page.
 *
 * Assets are taken per-release rather than per-file so a platform's set stays
 * internally consistent — a visitor never gets an AppImage from one version
 * alongside a Flatpak from another.
 *
 * Returns `null` if the payload isn't a usable release array (a rate-limit
 * body, a 404, an empty repo).
 */
export function toCatalog(raw: unknown): Catalog | null {
  if (!Array.isArray(raw)) return null;

  const releases = raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    // Drafts aren't public and prereleases aren't what a download button should
    // hand someone — the same two exclusions GitHub's own `/latest` applies.
    .filter((r) => typeof r.tag_name === 'string' && r.tag_name && !r.draft && !r.prerelease)
    // The API returns newest-first, but sort defensively so a re-tagged or
    // back-dated release can't quietly become "latest".
    .sort(
      (a, b) =>
        Date.parse(String(b.published_at ?? b.created_at ?? 0)) -
        Date.parse(String(a.published_at ?? a.created_at ?? 0)),
    );

  if (!releases.length) return null;

  const newest = releases[0];
  const assets: ReleaseAsset[] = [];
  const covered = new Set<OS>();

  for (const r of releases) {
    if (covered.size === OS_ORDER.length) break;
    const tag = String(r.tag_name);
    const releaseUrl = typeof r.html_url === 'string' ? r.html_url : RELEASES_URL;
    const rawAssets = (Array.isArray(r.assets) ? r.assets : []) as Record<string, unknown>[];
    // Checksums are filtered out as downloads, but remembered so each file can
    // link the `<name>.sha256` published beside it.
    const checksums = new Map(
      rawAssets
        .filter((a) => typeof a?.name === 'string' && /\.sha256$/i.test(a.name as string))
        .map((a) => [String(a.name).replace(/\.sha256$/i, ''), String(a.browser_download_url)]),
    );
    const parsed = rawAssets
      .map((a) => toAsset(a, tag, releaseUrl))
      .filter((a): a is ReleaseAsset => a !== null)
      .map((a) => (checksums.has(a.name) ? { ...a, checksumUrl: checksums.get(a.name) } : a));

    for (const os of OS_ORDER) {
      if (covered.has(os)) continue;
      const forOs = parsed.filter((a) => a.os === os);
      if (!forOs.length) continue;
      covered.add(os);
      assets.push(...forOs);
    }
  }

  assets.sort(
    (a, b) =>
      OS_ORDER.indexOf(a.os) - OS_ORDER.indexOf(b.os) ||
      a.rank - b.rank ||
      a.name.localeCompare(b.name),
  );

  return {
    latest: String(newest.tag_name),
    latestUrl: typeof newest.html_url === 'string' ? newest.html_url : RELEASES_URL,
    published: typeof newest.published_at === 'string' ? newest.published_at : null,
    assets,
  };
}

/** The asset a visitor on `os` should get, or `null` if we ship nothing for it. */
export function pickAsset(catalog: Catalog, os: OS): ReleaseAsset | null {
  if (os === 'other') return null;
  return catalog.assets.find((a) => a.os === os) ?? null;
}

/**
 * True when this asset comes from an older release than the newest one —
 * i.e. the platform was skipped in the latest release and we've fallen back.
 */
export function isBehindLatest(asset: ReleaseAsset, catalog: Catalog): boolean {
  return asset.tag !== catalog.latest;
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
