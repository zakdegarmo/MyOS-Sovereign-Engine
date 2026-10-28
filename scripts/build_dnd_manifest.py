import os
import json
from PIL import Image

def build_manifest():
    base_dir = os.path.join("apps", "web", "public", "textures", "avatars", "lpc")
    if not os.path.exists(base_dir):
        print(f"Directory not found: {base_dir}")
        return

    # GENOME_LAYERS from useAvatarCompositor.ts
    layers = [
        'body', 'legs', 'torso', 'hair', 'feet', 'hat', 'head', 'nose', 
        'ears', 'eyes', 'facial', 'shoulders', 'arms', 'weapon', 'offhand'
    ]
    
    manifest = {
        "sprites": {layer: {} for layer in layers}
    }
    
    count = 0
    
    # We only care about the standardized directories that map to our layers
    for layer in layers:
        layer_dir = os.path.join(base_dir, layer)
        if not os.path.exists(layer_dir):
            continue
            
        for root, _, files in os.walk(layer_dir):
            for file in files:
                if not file.endswith(".png"):
                    continue
                    
                file_path = os.path.join(root, file)
                
                # Check dimensions. LPC sheets must be 832px wide (13 frames * 64px)
                # or 768px wide (12 frames * 64px). We will allow anything >= 512 wide
                # just to be safe, but explicitly flag if it's super small.
                try:
                    with Image.open(file_path) as img:
                        w, h = img.size
                        if w < 512 or h < 512:
                            continue # Skip icons or weird fragments
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
                    continue
                    
                # Relative path from base_dir (e.g., 'body/bodies/body_male.png')
                rel_path = os.path.relpath(file_path, base_dir).replace("\\", "/")
                
                # Use the filename without extension as the key
                key = os.path.splitext(file)[0]
                
                manifest["sprites"][layer][key] = {
                    "path": rel_path
                }
                count += 1
                
    out_file = os.path.join(base_dir, "dnd_manifest.json")
    with open(out_file, "w") as f:
        json.dump(manifest, f, indent=4)
        
    print(f"Successfully wrote {count} valid assets to {out_file}")

if __name__ == "__main__":
    build_manifest()
