# gatewarden_scribe.py - v2.0
# Reads an index of concept page URLs, downloads the associated JSON,
# and files it in the correct Dewey Decimal Dungeon chamber.

import os
import time
import requests
import json
from urllib.parse import urljoin, urlparse

# --- Configuration ---
URL_INDEX_FILE = "oclc_concept_pages.txt"
# The root directory of your manually created dungeon
DEWEY_DUNGEON_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'MyOSPlanning', 'MyOS_NLDs', 'NLD 0000-0000-0000 DeweyDeciMatrix'))
POLITE_DELAY_SECONDS = 1.0 # We can be a little faster now

def get_target_filepath(notation, root_dir):
    """
    Translates a Dewey Decimal notation (e.g., "513.0285") into a valid,
    deeply nested file path based on the dungeon structure.
    """
    # Sanitize the notation to handle ranges like "521-525"
    safe_notation = notation.replace('-', '_').replace(' ', '')
    
    # Split into main class and subdivisions
    parts = safe_notation.split('.')
    
    # Build the path from the notation, assuming 4-digit folders
    path_parts = [root_dir]
    
    # Main class (e.g., 500)
    if len(parts[0]) > 0:
        path_parts.append(parts[0][:1] + "00")
    if len(parts[0]) > 1:
        path_parts.append(parts[0][:2] + "0")
    if len(parts[0]) > 2:
        path_parts.append(parts[0][:3])

    # Handle further subdivisions if they exist
    # This is a placeholder for the more complex sub-folder logic
    # For now, we'll place it in the deepest found directory
    
    final_dir = os.path.join(*path_parts)
    
    # Create a safe filename from the full notation
    safe_filename = safe_notation + ".json"
    
    return os.path.join(final_dir, safe_filename)


def main():
    if not os.path.exists(URL_INDEX_FILE):
        print(f"Error: URL index file '{URL_INDEX_FILE}' not found. Please run the Bulette first.")
        return
        
    if not os.path.isdir(DEWEY_DUNGEON_ROOT):
        print(f"Error: Dewey Decimal Dungeon not found at '{DEWEY_DUNGEON_ROOT}'")
        return

    with open(URL_INDEX_FILE, 'r', encoding='utf-8') as f:
        concept_pages = [line.strip() for line in f if line.strip()]

    print(f"[Gatewarden]: Awakening. Found {len(concept_pages)} scrolls to retrieve and archive.")

    success_count = 0
    fail_count = 0
    for url in concept_pages:
        try:
            print(f"[Gatewarden]: Retrieving scroll from: {url}")
            json_url = url.strip() + ".jsonld?download=true"
            
            json_response = requests.get(json_url, timeout=15)
            json_response.raise_for_status()
            json_data = json_response.json()

            notation = json_data.get('notation', 'UNKNOWN')
            
            target_filepath = get_target_filepath(notation, DEWEY_DUNGEON_ROOT)
            
            target_dir = os.path.dirname(target_filepath)
            if not os.path.exists(target_dir):
                print(f"  - Creating new chamber: {target_dir}")
                os.makedirs(target_dir)

            with open(target_filepath, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)

            print(f"  [+] Inscribed scroll '{notation}' to '{os.path.basename(target_filepath)}'")
            success_count += 1
            time.sleep(POLITE_DELAY_SECONDS)

        except Exception as e:
            print(f"  [!] Gatewarden ERROR while processing {url}: {e}")
            fail_count += 1
            continue

    print("\n-------------------------------------------")
    print("[Gatewarden]: Inscription complete.")
    print(f"  > Successfully archived: {success_count} scrolls.")
    print(f"  > Failed to archive: {fail_count} scrolls.")
    print(f"  > All data has been filed in the Dewey Decimal Dungeon.")
    print("-------------------------------------------")

if __name__ == '__main__':
    main()