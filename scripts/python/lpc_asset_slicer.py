import os
import sys
import json
import glob
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

LPC_ROOT = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\lpc"
LPC_EQUIP = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\lpc_equipment"
OUTPUT_DIR = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\assets\billboards\lpc_sliced"
CATALOG_PATH = os.path.join(OUTPUT_DIR, "catalog.json")

def slice_lpc_sheet(sheet_path, tile_size=64):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    base_name = os.path.splitext(os.path.basename(sheet_path))[0]
    sliced_items = []

    try:
        img = Image.open(sheet_path).convert("RGBA")
        width, height = img.size

        cols = width // tile_size
        rows = height // tile_size

        count = 0
        for r in range(rows):
            for c in range(cols):
                box = (c * tile_size, r * tile_size, (c + 1) * tile_size, (r + 1) * tile_size)
                tile = img.crop(box)

                extrema = tile.getextrema()
                if extrema and extrema[3][1] > 0:
                    count += 1
                    item_filename = f"{base_name}_r{r}_c{c}.png"
                    item_path = os.path.join(OUTPUT_DIR, item_filename)
                    tile.save(item_path, "PNG")

                    sliced_items.append({
                        "id": f"{base_name}_{r}_{c}",
                        "filename": item_filename,
                        "category": base_name.split('_')[0],
                        "source": os.path.basename(sheet_path),
                        "row": r,
                        "col": c,
                        "url": f"/assets/billboards/lpc_sliced/{item_filename}"
                    })

        return sliced_items
    except Exception as e:
        print(f"Error slicing {sheet_path}: {e}")
        return []

def index_all_lpc_assets():
    print(f"📦 Scanning LPC directories for asset extraction...")
    
    sheets = []
    for root in [LPC_ROOT, LPC_EQUIP]:
        if os.path.exists(root):
            sheets.extend(glob.glob(os.path.join(root, "*.png")))
            sheets.extend(glob.glob(os.path.join(root, "**/*.png"), recursive=True))

    print(f"Found {len(sheets)} LPC sprite sheets. Beginning automated slicing...")

    catalog = {}
    total_sliced = 0

    for idx, sheet in enumerate(sheets[:30], 1):
        items = slice_lpc_sheet(sheet)
        for item in items:
            catalog[item["id"]] = item
            total_sliced += 1

    with open(CATALOG_PATH, "w") as f:
        json.dump({"total": total_sliced, "items": catalog}, f, indent=2)

    print(f"✅ LPC Auto-Slicer Complete! Sliced {total_sliced} transparent sprites into '{OUTPUT_DIR}'.")
    print(f"Catalog indexed at: {CATALOG_PATH}")

def find_asset(keyword):
    if not os.path.exists(CATALOG_PATH):
        print("Catalog not built yet. Running indexer...")
        index_all_lpc_assets()

    with open(CATALOG_PATH, "r") as f:
        data = json.load(f)

    matches = [
        item for item in data["items"].values()
        if keyword.lower() in item["category"].lower() or keyword.lower() in item["source"].lower()
    ]

    print(f"🔍 Found {len(matches)} LPC sprites matching keyword '{keyword}':")
    for m in matches[:5]:
        print(f" - [{m['id']}] {m['url']}")
    return matches

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "index":
            index_all_lpc_assets()
        elif cmd == "find" and len(sys.argv) > 2:
            find_asset(sys.argv[2])
        else:
            find_asset(cmd)
    else:
        index_all_lpc_assets()
