import sqlite3
import json
import os
import urllib.request

OLLAMA_URL = "http://localhost:11434"
MODEL = "gemma4"
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "myos_vector_store.db"))
OUTPUT_JSON = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "web", "public", "data", "level1_object_manifest.json"))

SYSTEM_PROMPT = """
You are a D&D 5e Asset Auditor. Read the text from Level 1 of Dungeon of the Mad Mage and list EVERY SINGLE SPECIFIC OBJECT, THING, ITEM, FURNITURE, TRAP, OR SET DRESSING mentioned.

Categorize items into:
1. MAGIC_ITEMS_AND_RELICS
2. MUNDANE_FURNITURE_AND_CONTAINERS
3. TRAPS_AND_MECHANISMS
4. SET_DRESSING_AND_ENVIRONMENTAL_DETAILS

Output ONLY valid JSON in this format:
{
  "magic_items": [{"name": "...", "description": "...", "suggested_asset": "..."}],
  "furniture_containers": [{"name": "...", "description": "...", "suggested_asset": "..."}],
  "traps_mechanisms": [{"name": "...", "description": "...", "suggested_asset": "..."}],
  "set_dressing": [{"name": "...", "description": "...", "suggested_asset": "..."}]
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
            return json.loads(data.get("response", "{}"))
    except Exception as e:
        print(f"[!] Extraction error: {e}")
        return None

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    rows = cursor.execute(
        "SELECT text FROM vectors WHERE text LIKE '%Level 1%' OR text LIKE '%Entry Level%' OR text LIKE '%Mad Mage%' LIMIT 40;"
    ).fetchall()

    print(f"[*] Auditing {len(rows)} Level 1 chunks for complete Object Manifest...")

    manifest = {
        "magic_items": [],
        "furniture_containers": [],
        "traps_mechanisms": [],
        "set_dressing": []
    }
    seen = set()

    for idx, (text,) in enumerate(rows[:20]):
        print(f"[{idx+1}/20] Extracting Level 1 Objects via Gemma 4...", end="\r")
        extracted = query_gemma(text[:1400])
        if extracted and isinstance(extracted, dict):
            for cat, key in [
                ("magic_items", "magic_items"),
                ("furniture_containers", "furniture_containers"),
                ("traps_mechanisms", "traps_mechanisms"),
                ("set_dressing", "set_dressing")
            ]:
                items = extracted.get(key, [])
                if isinstance(items, list):
                    for item in items:
                        name = item.get("name") if isinstance(item, dict) else str(item)
                        if name and name.lower() not in seen:
                            seen.add(name.lower())
                            manifest[cat].append(item if isinstance(item, dict) else {"name": name})

    conn.close()

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n[SUCCESS] Extracted Level 1 Object Manifest to: {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
