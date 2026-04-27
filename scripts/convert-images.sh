#!/usr/bin/env bash
# Convert all PNG/JPG card images to WebP. Run once after asset import.
set -euo pipefail
cd "$(dirname "$0")/.."

for f in assets/img/celtic/*.png; do
  out="${f%.png}.webp"
  cwebp -q 82 "$f" -o "$out" -quiet
done

for f in assets/img/classic/*.jpg; do
  out="${f%.jpg}.webp"
  cwebp -q 82 "$f" -o "$out" -quiet
done

celtic=$(ls assets/img/celtic/*.webp | wc -l | tr -d ' ')
classic=$(ls assets/img/classic/*.webp | wc -l | tr -d ' ')
echo "Converted celtic=${celtic} classic=${classic}"
