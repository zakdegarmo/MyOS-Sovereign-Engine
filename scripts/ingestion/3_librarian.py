import json
import os
import uuid
import time
import hashlib

def generate_namespace_uuid(name):
    # Deterministic UUID based on filename to prevent duplicates
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, name))

def inject_metadata():
    print("--- ZAMN Librarian (Dewey Metadata Injector) ---")
    repo_path = input("Target folder for categorization (e.g., 'zamn_assets'): ")
    
    if not os.path.exists(repo_path):
        print(f"[!] Error: Folder '{repo_path}' does not exist.")
        return

    memories = []
    
    print(f"[*] Scanning {repo_path}...")
    files = [f for f in os.listdir(repo_path) if f.lower().endswith('.png')]
    
    for filename in files:
        # Create a MemCube (Asset Type)
        # Consistent ID generation
        asset_id = generate_namespace_uuid(filename)
        
        mem_cube = {
            "id": asset_id,
            "type": "asset",
            "content": {
                "assetUrl": f"/assets/{repo_path}/{filename}", # Path relative to public/
                "fileName": filename,
                "mimeType": "image/png"
            },
            "meta": {
                "timestamp": int(time.time() * 1000),
                "origin": "ZAMN Archive",
                "context": ["snes", "sprite", "uncategorized"], # Placeholder tags
                "resonance": 0.5,
                "embedding": [] # To be filled by Gemini later
            }
        }
        
        memories.append(mem_cube)
        
    output_file = os.path.join(repo_path, "fossil_layer.json")
    
    with open(output_file, "w") as f:
        json.dump(memories, f, indent=4)
        
    print(f"[!] Metadata context injected into {output_file}")
    print(f"[*] Total MemCubes Created: {len(memories)}")
    print("[*] Next Step: Move folder to 'apps/web/public/assets/' and load via App.tsx")

if __name__ == "__main__":
    inject_metadata()
