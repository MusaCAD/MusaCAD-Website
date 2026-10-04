#!/usr/bin/env bash
# Regenerate the derived images in public/ from their sources.
#
#   scripts/make-images.sh [path/to/musa_cad]
#
# • screenshots/*.webp   ← <engine>/assets/screenshots/*.png (500 and 1000px wide)
# • icon-512.png         ← musacad_logo.svg, transparent
# • icon-maskable-512.png← musacad_logo.svg on the paper ground, inside the
#                           maskable safe zone (Android crops to a circle)
# • og-image.png         ← scripts/og-image.html at 1200×630
#
# Needs Google Chrome (or Chromium) and `npm ci` (for sharp and the fonts).
set -euo pipefail
cd "$(dirname "$0")/.."
ENGINE="${1:-../musa_cad}"
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

shoot() { # html-file width height out.png
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars --force-device-scale-factor=1 \
    --default-background-color=00000000 --allow-file-access-from-files \
    --window-size="$2,$3" --screenshot="$4" "file://$(realpath "$1")" 2>/dev/null
}

# Screenshots: two widths, WebP.
node -e '
  const sharp = require("sharp"), fs = require("fs"), path = require("path");
  const [src, out] = process.argv.slice(1);
  (async () => {
    for (const f of fs.readdirSync(src).filter((f) => f.endsWith(".png"))) {
      const name = path.basename(f, ".png");
      for (const w of [500, 1000])
        await sharp(path.join(src, f)).resize({ width: w }).webp({ quality: 82, effort: 6 })
          .toFile(path.join(out, `${name}-${w}.webp`));
    }
  })();
' "$ENGINE/assets/screenshots" public/screenshots

# Icons from the vector logo.
SVG="$(sed -E 's/ width="512" height="512"//' public/musacad_logo.svg)"
printf '<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:512px;height:512px}</style>%s' "$SVG" > "$TMP/icon.html"
printf '<!doctype html><style>html,body{margin:0}body{width:512px;height:512px;background:#faf9f6;display:flex;align-items:center;justify-content:center}svg{width:330px;height:330px}</style>%s' "$SVG" > "$TMP/maskable.html"
shoot "$TMP/icon.html" 512 512 public/icon-512.png
shoot "$TMP/maskable.html" 512 512 public/icon-maskable-512.png

# Share card, then squeeze it.
shoot scripts/og-image.html 1200 630 "$TMP/og.png"
node -e 'require("sharp")(process.argv[1]).png({ compressionLevel: 9, palette: false }).toFile(process.argv[2])' "$TMP/og.png" public/og-image.png

ls -la public/og-image.png public/icon-512.png public/icon-maskable-512.png public/screenshots
