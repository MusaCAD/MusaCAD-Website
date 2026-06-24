/** Canonical external links + project facts, reused across the site. */
export const REPO_URL = 'https://github.com/MusaCAD/MusaCAD';
export const RELEASES_URL = 'https://github.com/MusaCAD/MusaCAD/releases';
export const REPO_API = 'https://api.github.com/repos/MusaCAD/MusaCAD';
export const ARCHITECTURE_URL =
  'https://github.com/MusaCAD/MusaCAD/blob/main/docs/ARCHITECTURE.md';
export const BUILD_URL =
  'https://github.com/MusaCAD/MusaCAD/blob/main/docs/BUILD.md';

export const LATEST_RELEASE = 'v0.1.0';
export const LICENSE = 'LGPL-3.0-or-later';
export const PLATFORMS = ['Linux', 'Windows'];

/** Best-effort build-time star count. Returns null if the API is unreachable. */
export async function fetchStars(): Promise<number | null> {
  try {
    const res = await fetch(REPO_API, {
      headers: { 'User-Agent': 'musacad-web', Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return typeof json.stargazers_count === 'number'
      ? json.stargazers_count
      : null;
  } catch {
    return null;
  }
}

/** Compact star formatting (1234 -> "1.2k"). */
export function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : `${n}`;
}
