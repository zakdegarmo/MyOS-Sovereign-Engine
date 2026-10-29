import json
import re

with open("apps/web/public/data/level1_objects_raw.json", "r", encoding="utf-8") as f:
    raw_items = json.load(f)

magic_keywords = ['magic', 'wand', 'ring', 'scroll', 'potion', 'relic', 'eye of golorr', 'amulet', 'staff', 'blade', 'dagger of', 'sword of']
furniture_keywords = ['table', 'chair', 'throne', 'chest', 'box', 'barrel', 'altar', 'sarcophagus', 'bench', 'desk', 'bookshelf', 'shelf', 'dais', 'bed', 'cabinet', 'stool']
trap_keywords = ['trap', 'glyph', 'rune', 'plate', 'switch', 'lever', 'grate', 'pit', 'blade', 'needle', 'wire', 'symbol']
dressing_keywords = ['torch', 'sconce', 'cobweb', 'rubble', 'skeleton', 'skull', 'bone', 'mushroom', 'fungi', 'slime', 'pool', 'archway', 'pillar', 'column', 'tapestry', 'banner', 'curtain', 'statue', 'sculpture', 'urn', 'basin', 'fountain', 'moss']

magic_items = []
furniture = []
traps = []
set_dressing = []

for item in raw_items:
    lower = item.lower()
    if any(k in lower for k in magic_keywords):
        magic_items.append(item)
    elif any(k in lower for k in furniture_keywords):
        furniture.append(item)
    elif any(k in lower for k in trap_keywords):
        traps.append(item)
    elif any(k in lower for k in dressing_keywords):
        set_dressing.append(item)

master_catalog = {
    "magic_items_and_relics": sorted(magic_items)[:30],
    "furniture_and_containers": sorted(furniture)[:35],
    "traps_and_mechanisms": sorted(traps)[:30],
    "set_dressing_and_environment": sorted(set_dressing)[:35]
}

with open("apps/web/public/data/level1_master_asset_manifest.json", "w", encoding="utf-8") as f:
    json.dump(master_catalog, f, indent=2)

print(f"Master Catalog Created: {len(magic_items)} Magic Items, {len(furniture)} Furniture, {len(traps)} Traps, {len(set_dressing)} Set Dressings")
