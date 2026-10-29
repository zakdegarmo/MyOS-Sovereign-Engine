import json
import os

MANIFEST_FILE = "Librarian_Staging/snes_manifest.json"
if os.path.exists(MANIFEST_FILE):
    with open(MANIFEST_FILE, 'r') as f:
        data = json.load(f)
    
    indexed_count = sum(1 for href in data if data[href].get("indexed"))
    print(f"[*] Total Games: {len(data)}")
    print(f"[*] Indexed Games: {indexed_count}")
    
    if indexed_count > 0:
        for href in data:
            if data[href].get("indexed"):
                print(f"    [+] Example Indexed: {href} ({len(data[href].get('sheets', []))} sheets)")
                break
else:
    print("[!] Manifest not found.")
