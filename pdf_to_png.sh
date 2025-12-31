#!/usr/bin/env bash
set -euo pipefail

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

echo "Converting PDF to PNGs..."
pdftoppm -r 300 "$PDF" "$OUTDIR/page" -png

for img in "$OUTDIR"/page-*.png; do
  size=$(stat -c%s "$img")

  if [ "$size" -le "$MAX_SIZE" ]; then
    continue
  fi

  echo "Compressing $(basename "$img") ($(($size / 1024 / 1024)) MB)"

  # Start gentle, then squeeze harder if needed
  for quality in 90 80 70 60 50; do
    mogrify -strip -quality "$quality" "$img"
    size=$(stat -c%s "$img")

    if [ "$size" -le "$MAX_SIZE" ]; then
      echo "  -> reduced to $(($size / 1024 / 1024)) MB (quality $quality)"
      break
    fi
  done

  # Last resort: downscale slightly
  size=$(stat -c%s "$img")
  if [ "$size" -gt "$MAX_SIZE" ]; then
    echo "  -> still large, resizing to 85%"
    mogrify -resize 85% "$img"
  fi
done

echo "Done. Output in: $OUTDIR/"
