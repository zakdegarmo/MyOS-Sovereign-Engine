import json
import os

MANIFEST_FILE = "Librarian_Staging/snes_manifest.json"

if os.path.exists(MANIFEST_FILE):
    with open(MANIFEST_FILE, 'r') as f:
        data = json.load(f)
    
    reset_count = 0
    for href in data:
        if data[href].get("indexed") and (not data[href].get("sheets") or len(data[href].get("sheets")) == 0):
            data[href]["indexed"] = False
            reset_count += 1
            
    with open(MANIFEST_FILE, 'w') as f:
        json.dump(data, f, indent=4)
    
    print(f"[*] Reset {reset_count} games with 0 sheets.")
else:
    print("[!] Manifest not found.")
