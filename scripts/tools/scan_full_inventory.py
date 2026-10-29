import os
import json
import glob

ROOT = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS"

inventory = {
    "apps": [],
    "packages": [],
    "cartridges": [],
    "three_components": [],
    "blend_files": [],
    "glb_models": [],
    "audio_tracks": [],
    "screenings_videos": [],
    "tools_scripts": [],
    "standalone_htmls": []
}

# 1. Apps
for d in os.listdir(os.path.join(ROOT, "apps")):
    full = os.path.join(ROOT, "apps", d)
    if os.path.isdir(full):
        pkg_json = os.path.join(full, "package.json")
        desc = ""
        if os.path.exists(pkg_json):
            try:
                with open(pkg_json, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    desc = data.get("description", data.get("name", ""))
            except:
                pass
        inventory["apps"].append({"name": d, "desc": desc})

# 2. Packages
pkg_dir = os.path.join(ROOT, "packages")
if os.path.exists(pkg_dir):
    for d in os.listdir(pkg_dir):
        full = os.path.join(pkg_dir, d)
        if os.path.isdir(full):
            inventory["packages"].append(d)

# 3. Cartridges in apps/web/src/cartridges
cart_dir = os.path.join(ROOT, "apps", "web", "src", "cartridges")
if os.path.exists(cart_dir):
    for d in os.listdir(cart_dir):
        if os.path.isdir(os.path.join(cart_dir, d)):
            inventory["cartridges"].append(d)

# 4. Major 3D World Components in apps/web/src/components
comp_dir = os.path.join(ROOT, "apps", "web", "src", "components")
if os.path.exists(comp_dir):
    for d in os.listdir(comp_dir):
        if os.path.isdir(os.path.join(comp_dir, d)):
            inventory["three_components"].append(d)

# 5. Blend files
for root, dirs, files in os.walk(ROOT):
    if "node_modules" in root or ".git" in root or "dist" in root:
        continue
    for f in files:
        if f.endswith(".blend") and not f.endswith(".blend1"):
            rel = os.path.relpath(os.path.join(root, f), ROOT)
            inventory["blend_files"].append(rel)
        elif f.endswith(".glb") or f.endswith(".gltf"):
            rel = os.path.relpath(os.path.join(root, f), ROOT)
            inventory["glb_models"].append(rel)
        elif f.endswith(".html") and ("standalone" in f or "temp" in f or "test" in f):
            rel = os.path.relpath(os.path.join(root, f), ROOT)
            inventory["standalone_htmls"].append(rel)

# 6. Scripts in scripts/tools
tools_dir = os.path.join(ROOT, "scripts", "tools")
if os.path.exists(tools_dir):
    for f in os.listdir(tools_dir):
        if f.endswith(".py") or f.endswith(".mjs") or f.endswith(".js"):
            inventory["tools_scripts"].append(f)

# 7. Screenings
screen_dir = os.path.join(ROOT, "apps", "web", "public", "screenings")
if os.path.exists(screen_dir):
    for f in os.listdir(screen_dir):
        inventory["screenings_videos"].append(f)

# Save inventory
out_path = os.path.join(ROOT, "docs", "symbiorithm", "FULL_SYSTEM_INVENTORY.json")
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(inventory, f, indent=2)

print("INVENTORY WRITTEN:", out_path)
print(f"Apps: {len(inventory['apps'])} | Packages: {len(inventory['packages'])} | Cartridges: {len(inventory['cartridges'])}")
print(f"Components: {len(inventory['three_components'])} | Blend files: {len(inventory['blend_files'])} | GLB models: {len(inventory['glb_models'])}")
print(f"Tools scripts: {len(inventory['tools_scripts'])} | Videos: {len(inventory['screenings_videos'])} | Standalone HTMLs: {len(inventory['standalone_htmls'])}")
