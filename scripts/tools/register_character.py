import json
import os
import argparse

MANIFEST_PATHS = [
    r"apps/web/public/textures/avatars/lpc/mephit_manifest.json",
    r"apps/web/public/assets/mephit_manifest.json",
    r"apps/web/dist/assets/mephit_manifest.json"
]

LPC_MANIFEST_PATHS = [
    r"apps/web/public/assets/lpc_manifest.json",
    r"apps/web/dist/assets/lpc_manifest.json"
]

def register_in_mephit_manifest(name, category="body/bodies"):
    rel_sprite_path = f"{category}/{name}.png" if not name.endswith(".png") else f"{category}/{name}"
    
    for mpath in MANIFEST_PATHS:
        if not os.path.exists(mpath):
            continue
            
        try:
            with open(mpath, 'r') as f:
                data = json.load(f)
                
            sprites = data.get("sprites", {})
            cat_list = sprites.get(category, [])
            
            if rel_sprite_path not in cat_list:
                cat_list.append(rel_sprite_path)
                sprites[category] = cat_list
                data["sprites"] = sprites
                
                with open(mpath, 'w') as f:
                    json.dump(data, f, indent=4)
                print(f"[Manifest] Registered {rel_sprite_path} in {mpath}")
            else:
                print(f"[Manifest] {rel_sprite_path} already present in {mpath}")
        except Exception as e:
            print(f"[Manifest WARN] Failed to update {mpath}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Register spritesheet into engine manifests.")
    parser.add_argument("--name", required=True, help="Character sprite name")
    parser.add_argument("--category", default="body/bodies", help="Manifest sprite category")
    args = parser.parse_args()
    
    register_in_mephit_manifest(args.name, args.category)

if __name__ == "__main__":
    main()
