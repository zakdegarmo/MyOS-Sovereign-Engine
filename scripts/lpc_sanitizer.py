import os
import json
from PIL import Image
import concurrent.futures

# Configuration
LPC_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apps", "web", "public", "assets", "lpc")
OUTPUT_MANIFEST = os.path.join(LPC_ROOT, "lpc_registry.json")
OLD_MANIFEST = os.path.join(LPC_ROOT, "semantic_manifest.json")

# Build tag map for quick lookup
tag_map = {}
if os.path.exists(OLD_MANIFEST):
    try:
        from urllib.parse import unquote
        with open(OLD_MANIFEST, "r") as f:
            old_data = json.load(f)
            # Old manifest has { "category": [ ... ] } or { "category": [ { "id": "...", "tags": [...] } ] }
            for category, items in old_data.items():
                if category in ["stats", "meta"]: continue
                for item in items:
                    if isinstance(item, str):
                        path = unquote(item)
                        tag_map[path] = {"category": category, "tags": []}
                    elif isinstance(item, dict):
                        path = unquote(item.get("id", ""))
                        tag_map[path] = {"category": category, "tags": item.get("tags", [])}
    except Exception as e:
        print(f"Failed to load old manifest: {e}")

def analyze_asset(rel_path):
    full_path = os.path.join(LPC_ROOT, rel_path)
    try:
        with Image.open(full_path) as img:
            w, h = img.size
            
            # 1. Classification
            # Standard LPC sheets are 832x1344 (V1) or similar large multiples of 64
            is_sheet = w >= 512 and h >= 512
            
            # 2. Ghost Check (Is it 100% transparent?)
            if img.mode != 'RGBA':
                # If no alpha, it's definitely not a ghost (though rare in LPC)
                is_ghost = False
            else:
                bbox = img.getbbox()
                is_ghost = bbox is None

            if is_ghost:
                return None

            # 3. Vertical Bias (For semantic validation)
            # Sample the first 64x64 frame (or the whole thing if smaller)
            sample_w = min(w, 64)
            sample_h = min(h, 64)
            sample = img.crop((0, 0, sample_w, sample_h))
            
            # Calculate pixel density in 3 sectors
            # Sector 0: Top (0-33%), Sector 1: Mid (33-66%), Sector 2: Bottom (66-100%)
            y_chunks = [0, sample_h // 3, (2 * sample_h) // 3, sample_h]
            densities = []
            
            for i in range(3):
                sector = sample.crop((0, y_chunks[i], sample_w, y_chunks[i+1]))
                if sector.mode == 'RGBA':
                    alpha = sector.getchannel('A')
                    # count non-zero pixels
                    non_zero = sum(1 for p in alpha.getdata() if p > 0)
                    densities.append(non_zero)
                else:
                    densities.append(sample_w * (y_chunks[i+1] - y_chunks[i]))

            # Determine bias
            max_d = max(densities) if sum(densities) > 0 else 0
            bias = "mid"
            if max_d > 0:
                if densities[0] == max_d: bias = "top"
                elif densities[2] == max_d: bias = "bottom"

            # 4. Semantic Enrichment
            info = tag_map.get(rel_path.replace("\\", "/"), {"category": "uncategorized", "tags": []})

            return {
                "path": rel_path.replace("\\", "/"),
                "width": w,
                "height": h,
                "type": "sheet" if is_sheet else "singular",
                "bias": bias,
                "category": info["category"],
                "tags": info["tags"]
            }
    except Exception as e:
        # print(f"Error processing {rel_path}: {e}")
        return None

def main():
    print(f"Scanning assets in {LPC_ROOT}...")
    all_pngs = []
    for root, dirs, files in os.walk(LPC_ROOT):
        # Skip some known non-asset dirs
        if "archives_processed" in root or ".git" in root:
            continue
        for file in files:
            if file.lower().endswith(".png"):
                rel = os.path.relpath(os.path.join(root, file), LPC_ROOT)
                all_pngs.append(rel)

    print(f"Found {len(all_pngs)} candidates. Starting heuristic analysis...")
    
    registry = {
        "sheets": [],
        "singular": [],
        "stats": {
            "ghosts_pruned": 0,
            "total_count": 0
        }
    }

    # Parallel processing for speed
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(analyze_asset, all_pngs))

    for res in results:
        if res is None:
            registry["stats"]["ghosts_pruned"] += 1
            continue
        
        if res["type"] == "sheet":
            registry["sheets"].append(res)
        else:
            registry["singular"].append(res)
        
        registry["stats"]["total_count"] += 1

    with open(OUTPUT_MANIFEST, "w") as f:
        json.dump(registry, f, indent=2)

    print(f"Done! Registry saved to {OUTPUT_MANIFEST}")
    print(f"Stats: {registry['stats']}")

if __name__ == "__main__":
    main()
