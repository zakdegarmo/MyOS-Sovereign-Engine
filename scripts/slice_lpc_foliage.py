import os
import glob
import json
from PIL import Image

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web"))
SRC_LPC = os.path.join(BASE_DIR, "src", "assets", "lpc")
PUBLIC_LPC = os.path.join(BASE_DIR, "public", "assets", "lpc")
OUT_DIR = os.path.join(BASE_DIR, "public", "assets", "lpc_sliced")

stones_dir = os.path.join(OUT_DIR, "stones")
trees_dir = os.path.join(OUT_DIR, "trees")
foliage_dir = os.path.join(OUT_DIR, "foliage")

for d in [stones_dir, trees_dir, foliage_dir]:
    os.makedirs(d, exist_ok=True)

catalog = {
    "stones": [],
    "trees": [],
    "foliage": []
}

# 1. Process Stone Assets
stone_files = glob.glob(os.path.join(SRC_LPC, "stones*.png")) + glob.glob(os.path.join(PUBLIC_LPC, "stones*.png"))
stone_files = sorted(list(set(stone_files)))

for idx, sf in enumerate(stone_files, start=1):
    try:
        img = Image.open(sf).convert("RGBA")
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        out_name = f"stone_{idx}.png"
        out_path = os.path.join(stones_dir, out_name)
        img.save(out_path, "PNG")
        web_url = f"/assets/lpc_sliced/stones/{out_name}"
        catalog["stones"].append(web_url)
        print(f"[Stone Processed] {out_name} ({img.width}x{img.height})")
    except Exception as e:
        print(f"Error processing stone {sf}: {e}")

# Save JSON Catalog
catalog_path = os.path.join(OUT_DIR, "catalog.json")
with open(catalog_path, "w", encoding="utf-8") as f:
    json.dump(catalog, f, indent=2)

print(f"✅ Sliced Catalog written to {catalog_path} with {len(catalog['stones'])} stones!")
