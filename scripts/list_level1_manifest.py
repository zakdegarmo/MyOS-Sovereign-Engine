import json
import os

PATH = "apps/web/public/data/level1_object_manifest.json"
if os.path.exists(PATH):
    with open(PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    print("=== 🔮 1. MAGIC ITEMS & RELICS ===")
    for item in data.get("magic_items", []):
        name = item.get("name", "Unknown")
        desc = item.get("description", "")
        print(f"* {name} — {desc}")

    print("\n=== 🪑 2. MUNDANE FURNITURE & CONTAINERS ===")
    for item in data.get("furniture_containers", []):
        name = item.get("name", "Unknown")
        desc = item.get("description", "")
        print(f"* {name} — {desc}")

    print("\n=== ⚔️ 3. TRAPS, GLYPHS & MECHANISMS ===")
    for item in data.get("traps_mechanisms", []):
        name = item.get("name", "Unknown")
        desc = item.get("description", "")
        print(f"* {name} — {desc}")

    print("\n=== 🕸️ 4. SET DRESSING & ENVIRONMENT ===")
    for item in data.get("set_dressing", []):
        name = item.get("name", "Unknown")
        desc = item.get("description", "")
        print(f"* {name} — {desc}")
else:
    print("[!] Manifest JSON not created yet.")
