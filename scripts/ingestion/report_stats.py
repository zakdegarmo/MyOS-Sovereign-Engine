import json
import os

MANIFEST_FILE = "apps/web/public/assets/Librarian_Staging/snes_manifest.json"
if os.path.exists(MANIFEST_FILE):
    with open(MANIFEST_FILE, 'r') as f:
        data = json.load(f)
    
    indexed_count = sum(1 for href in data if data[href].get("indexed"))
    secured_count = sum(1 for href in data if data[href].get("secured"))
    total_sheets = sum(len(data[href].get("sheets", [])) for href in data if data[href].get("indexed"))
    
    print(f"[*] Total Games Discovered: {len(data)}")
    print(f"[*] Games Indexed: {indexed_count}")
    print(f"[*] Games Secured: {secured_count}")
    print(f"[*] Total Sheets Mapped: {total_sheets}")
else:
    print("[!] Manifest not found.")
