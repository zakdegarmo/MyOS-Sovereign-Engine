import os
import json
import re

def generate_manifest(base_dir, out_file):
    print(f"Scanning {base_dir} for sliced assets...")
    manifest = {}
    
    # Dewey Decimal High-Level Mapping for Games
    # 500: Natural Sciences (Animals, Monsters, Nature)
    # 600: Technology (Weapons, Equipment, Tools, Architecture)
    # 700: Arts & Recreation (Magic, Spells, VFX)
    # 900: History & Geography (Terrain, Maps, Biomes)
    
    def assign_dewey(tags):
        tags_str = " ".join(tags).lower()
        if any(w in tags_str for w in ["monster", "bat", "bee", "worm", "ghost", "slime", "wood", "tree", "animal"]):
            return {"category": "500 Natural Sciences & Nature", "code": 500}
        if any(w in tags_str for w in ["sword", "bow", "helm", "greaves", "armor", "adobe", "building", "apron", "crown"]):
            return {"category": "600 Technology & Equipment", "code": 600}
        if any(w in tags_str for w in ["spell", "fire", "water", "lightning", "heal", "magic", "animation"]):
            return {"category": "700 Arts & Magic", "code": 700}
        if any(w in tags_str for w in ["atlas", "terrain", "map", "floor", "base"]):
            return {"category": "900 Geography & Terrain", "code": 900}
        
        return {"category": "000 General Concepts", "code": 0}

    total_assets = 0
    
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if not file.endswith(".png"):
                continue
                
            # Ignore the debug overviews
            if "_DEBUG_OVERVIEW_" in file:
                continue
                
            file_path = os.path.join(root, file)
            # Relative path for web serving
            rel_path = os.path.relpath(file_path, start=base_dir).replace('\\', '/')
            
            # Clean up the name for tagging
            # Strip "_part_XX", ".png", URL encoding "%20"
            clean_name = re.sub(r'_part_\d+', '', file)
            clean_name = clean_name.replace('.png', '').replace('%20', ' ').replace('%5BLPC%5D', '')
            
            # Parent folder name as a tag context
            parent_folder = os.path.basename(root).replace('%20', ' ')
            
            # Tokenize into tags
            raw_tags = re.findall(r'[A-Za-z]+', clean_name + " " + parent_folder)
            tags = list(set([t.lower() for t in raw_tags if len(t) > 2]))
            
            dewey = assign_dewey(tags)
            
            manifest[rel_path] = {
                "name": clean_name.strip(),
                "tags": tags,
                "dewey_decimal": dewey,
                "file_path": rel_path
            }
            total_assets += 1

    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=4)
        
    print(f"Generated manifest for {total_assets} assets at {out_file}")

if __name__ == "__main__":
    base_dir = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\billboards"
    out_file = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\billboard_manifest.json"
    generate_manifest(base_dir, out_file)
