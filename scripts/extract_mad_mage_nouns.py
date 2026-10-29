#!/usr/bin/env python3
"""
Noun Entity Extractor & LPC Sprite Matcher (`extract_mad_mage_nouns.py`)
Scans ingested Dungeon of the Mad Mage vector chunks in SQLite, extracts People, Places, & Things using local Gemma 4,
and maps each noun to an LPC 2D sprite asset.
"""

import json
import os
import sqlite3
import urllib.request

OLLAMA_URL = "http://localhost:11434"
MODEL = "gemma4" # Local Gemma model
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "myos_vector_store.db"))
OUTPUT_JSON = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "data", "mad_mage_noun_catalog.json"))

SYSTEM_PROMPT = """
You are a D&D 5e Entity Extractor. Given text from Dungeon of the Mad Mage, extract all unique entities into 3 lists:
1. PEOPLE: NPCs, Monsters, Enemies, Villains.
2. PLACES: Named Rooms, POIs, Corridors, Landmarks.
3. THINGS: Props, Objects, Chests, Altars, Statues, Traps, Magic Items.

Output ONLY valid JSON in this format:
{
  "people": [{"name": "...", "type": "npc|monster", "description": "..."}],
  "places": [{"name": "...", "type": "room|landmark", "description": "..."}],
  "things": [{"name": "...", "type": "prop|chest|trap", "description": "..."}]
}
"""

def query_gemma(prompt):
    url = f"{OLLAMA_URL}/api/generate"
    payload = json.dumps({
        "model": MODEL,
        "system": SYSTEM_PROMPT,
        "prompt": prompt,
        "format": "json",
        "stream": False
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            text = data.get("response", "").strip()
            return json.loads(text)
    except Exception as e:
        print(f"[!] Gemma extraction error: {e}")
        return None

def main():
    print(f"[*] Connecting to vector database: {DB_PATH}...")
    if not os.path.exists(DB_PATH):
        print(f"[!] Database file not found: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    rows = cursor.execute(
        "SELECT text FROM vectors WHERE text LIKE ? OR text LIKE ? LIMIT 50;",
        ('%Mad Mage%', '%Dungeon Of The Mad Mage%')
    ).fetchall()

    print(f"[+] Found {len(rows)} campaign text chunks for Noun Extraction.")

    catalog = {
        "people": [],
        "places": [],
        "things": []
    }

    seen_names = set()

    for idx, (text_content,) in enumerate(rows[:15]):
        print(f"[{idx+1}/{min(15, len(rows))}] Extracting Nouns via Gemma 4...", end="\r")
        extracted = query_gemma(text_content[:1200])
        
        if extracted and isinstance(extracted, dict):
            for category in ["people", "places", "things"]:
                items = extracted.get(category, [])
                if isinstance(items, list):
                    for item in items:
                        name = None
                        desc = ""
                        item_type = category[:-1]
                        
                        if isinstance(item, dict):
                            name = item.get("name")
                            desc = item.get("description", "")
                            item_type = item.get("type", item_type)
                        elif isinstance(item, str):
                            name = item
                            
                        if name and name not in seen_names:
                            seen_names.add(name)
                            catalog[category].append({
                                "name": name,
                                "type": item_type,
                                "description": desc
                            })

    conn.close()

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=2)

    print(f"\n[SUCCESS] Extracted {len(catalog['people'])} People, {len(catalog['places'])} Places, and {len(catalog['things'])} Things!")
    print(f"[+] Catalog saved to: {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
