#!/usr/bin/env bash
set -euo pipefail

# Check for required tools
command -v pdfinfo >/dev/null 2>&1 || { echo >&2 "Error: 'pdfinfo' is required (usually part of poppler-utils)."; exit 1; }
command -v pdftoppm >/dev/null 2>&1 || { echo >&2 "Error: 'pdftoppm' is required."; exit 1; }
command -v mogrify >/dev/null 2>&1 || { echo >&2 "Error: 'mogrify' is required (part of ImageMagick)."; exit 1; }

if [ $# -ne 1 ]; then
  echo "Usage: $0 file.pdf"
  exit 1
fi

PDF="$1"

if [ ! -f "$PDF" ]; then
  echo "File not found: $PDF"
  exit 1
fi

BASENAME="$(basename "$PDF" .pdf)"
OUTDIR="$BASENAME"
MAX_SIZE=$((15 * 1024 * 1024)) # 15 MB

mkdir -p "$OUTDIR"

# 1. Get total number of pages
echo "Analyzing PDF..."
PAGE_COUNT=$(pdfinfo "$PDF" | grep "Pages:" | awk '{print $2}')

# 2. Calculate digit padding (e.g., if 100 pages, we want 001, 002...)
DIGITS=${#PAGE_COUNT}

echo "Processing $PAGE_COUNT pages..."

# 3. Loop through pages individually
for ((i=1; i<=PAGE_COUNT; i++)); do
  # Generate filename with zero padding (e.g., page-01.png)
  FMT_NUM=$(printf "%0${DIGITS}d" "$i")
  IMG_NAME="$OUTDIR/page-${FMT_NUM}.png"

  # SKIP IF EXISTS
  if [ -f "$IMG_NAME" ]; then
    echo "[Skip] Page $i ($IMG_NAME exists)"
    continue
  fi

  echo "[Conv] Page $i -> $IMG_NAME"

  # Convert specific page (-f first, -l last).
  # -singlefile prevents pdftoppm from adding its own numbering suffix.
  pdftoppm -r 300 -f "$i" -l "$i" "$PDF" "$OUTDIR/page-${FMT_NUM}" -png -singlefile

  # CHECK SIZE & COMPRESS
  size=$(stat -c%s "$IMG_NAME")

  if [ "$size" -gt "$MAX_SIZE" ]; then
    echo "  [Compress] Initial: $(($size / 1024 / 1024)) MB"

    # Start gentle, then squeeze harder if needed
    for quality in 90 80 70 60 50; do
      mogrify -strip -quality "$quality" "$IMG_NAME"
      size=$(stat -c%s "$IMG_NAME")

      if [ "$size" -le "$MAX_SIZE" ]; then
        echo "    -> Reduced to $(($size / 1024 / 1024)) MB (Quality: $quality)"
        break
      fi
    done

    # Last resort: downscale slightly
    size=$(stat -c%s "$IMG_NAME")
    if [ "$size" -gt "$MAX_SIZE" ]; then
      echo "    -> Still large, resizing to 85%"
      mogrify -resize 85% "$IMG_NAME"
    fi
  fi
done

echo "Done. Output in: $OUTDIR/"
