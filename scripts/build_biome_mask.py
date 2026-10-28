#!/usr/bin/env python3
"""
build_biome_mask.py

Reads the HandsomeRobs Toril TIF lore map and generates:
  1. toril_biome_mask.png  — 2048×2048 RGBA biome mask
       R = Mountain density
       G = Forest density  
       B = Water/Ocean density
       A = Desert density
  2. faerun_pois.json      — (validates/supplements existing POI data)

Usage:
    python scripts/build_biome_mask.py

Requires:
    pip install Pillow numpy
"""

import json
import os
import sys
from pathlib import Path

try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("[build_biome_mask] Installing dependencies...")
    os.system(f"{sys.executable} -m pip install Pillow numpy")
    from PIL import Image
    import numpy as np

# Disable PIL decompression bomb check — the Toril TIF is legitimately huge (~410MP)
Image.MAX_IMAGE_PIXELS = None

# ─── Paths ─────────────────────────────────────────────────────────────────────

ROOT = Path(__file__).parent.parent
TIF_PATH = ROOT / "apps/web/src/assets/HandsomeRobs_map_of_Toril-TorilMap.tif"
OUT_MASK = ROOT / "apps/web/public/assets/textures/toril_biome_mask.png"
OUT_DIR  = ROOT / "apps/web/public/assets/data"
OUT_POIS = OUT_DIR / "faerun_pois_generated.json"

OUT_MASK.parent.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

MASK_SIZE = 2048

# ─── Biome HSV Classification Thresholds ──────────────────────────────────────
# These are tuned to HandsomeRobs_map_of_Toril color palette.
# H (0-360), S (0-1), V (0-1)

def rgb_to_hsv(r, g, b):
    """Convert 0-255 RGB to (H 0-360, S 0-1, V 0-1)."""
    r, g, b = r / 255.0, g / 255.0, b / 255.0
    mx = max(r, g, b)
    mn = min(r, g, b)
    df = mx - mn
    if mx == mn:
        h = 0.0
    elif mx == r:
        h = (60 * ((g - b) / df) + 360) % 360
    elif mx == g:
        h = (60 * ((b - r) / df) + 120) % 360
    else:
        h = (60 * ((r - g) / df) + 240) % 360
    s = 0.0 if mx == 0 else df / mx
    v = mx
    return h, s, v


def classify_pixel(r, g, b):
    """
    Returns (mountain, forest, water, desert) density floats in [0, 1].
    """
    h, s, v = rgb_to_hsv(r, g, b)

    mountain = 0.0
    forest   = 0.0
    water    = 0.0
    desert   = 0.0

    # Water/Ocean — deep blues and teals
    if (190 <= h <= 250) and s > 0.3:
        water = min(1.0, s * v * 2.0)

    # Coastline — light blue / cyan
    elif (170 <= h <= 190) and s > 0.2 and v > 0.5:
        water = 0.4

    # Forest — greens
    elif (80 <= h <= 160) and s > 0.25 and v > 0.2:
        forest = min(1.0, s * 1.5)

    # Mountain — grey-browns / dark rocky tones
    elif s < 0.2 and 0.25 < v < 0.65:
        mountain = 1.0 - v  # darker = more mountain

    # Snow peaks — very light, desaturated
    elif s < 0.1 and v > 0.85:
        mountain = 0.6

    # Desert — warm yellows and tans
    elif (25 <= h <= 55) and s > 0.2 and v > 0.5:
        desert = min(1.0, s * v * 1.8)

    # Plains fallthrough — light green-yellows
    elif (55 <= h <= 80) and s > 0.15:
        forest = 0.2  # mild green tint → sparse forest / plains edge

    return mountain, forest, water, desert


def build_biome_mask():
    print(f"[build_biome_mask] Loading TIF: {TIF_PATH}")
    if not TIF_PATH.exists():
        print(f"[build_biome_mask] ERROR: TIF not found at {TIF_PATH}")
        sys.exit(1)

    src = Image.open(TIF_PATH).convert("RGB")
    print(f"[build_biome_mask] Source size: {src.size}")

    # Resize to target mask resolution
    resized = src.resize((MASK_SIZE, MASK_SIZE), Image.LANCZOS)
    pixels = np.array(resized, dtype=np.uint8)

    # Classify each pixel
    mask = np.zeros((MASK_SIZE, MASK_SIZE, 4), dtype=np.uint8)
    print(f"[build_biome_mask] Classifying {MASK_SIZE}×{MASK_SIZE} pixels...")

    for y in range(MASK_SIZE):
        if y % 256 == 0:
            print(f"  Row {y}/{MASK_SIZE}...")
        for x in range(MASK_SIZE):
            r, g, b = pixels[y, x]
            mountain, forest, water, desert = classify_pixel(r, g, b)
            mask[y, x] = [
                int(mountain * 255),
                int(forest   * 255),
                int(water    * 255),
                int(desert   * 255),
            ]

    # Slight Gaussian blur for smooth biome transitions
    try:
        from PIL.ImageFilter import GaussianBlur
        mask_img = Image.fromarray(mask, 'RGBA')
        # Blur each channel separately to avoid halo artifacts
        channels = mask_img.split()
        blurred = [ch.filter(GaussianBlur(radius=8)) for ch in channels]
        mask_img = Image.merge('RGBA', blurred)
    except Exception as e:
        print(f"[build_biome_mask] Blur skipped: {e}")
        mask_img = Image.fromarray(mask, 'RGBA')

    mask_img.save(OUT_MASK)
    print(f"[build_biome_mask] OK Saved biome mask: {OUT_MASK}")

    # Quick validation — show dominant biome per quadrant
    arr = np.array(mask_img)
    h2, w2 = MASK_SIZE // 2, MASK_SIZE // 2
    quadrants = {
        "NW": arr[:h2, :w2],
        "NE": arr[:h2, w2:],
        "SW": arr[h2:, :w2],
        "SE": arr[h2:, w2:],
    }
    channel_names = ["Mountain", "Forest", "Water", "Desert"]
    print("\n[build_biome_mask] Biome Quadrant Analysis:")
    for name, q in quadrants.items():
        means = q.mean(axis=(0, 1))
        dominant = channel_names[int(means.argmax())]
        print(f"  {name}: {dominant} ({[f'{m:.0f}' for m in means]})")

    print(f"\n[build_biome_mask] Done! Biome mask ready at:")
    print(f"  {OUT_MASK.relative_to(ROOT)}")


if __name__ == "__main__":
    build_biome_mask()
