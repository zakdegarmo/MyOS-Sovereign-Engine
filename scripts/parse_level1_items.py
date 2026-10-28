import sqlite3
import json
import re

conn = sqlite3.connect("data/myos_vector_store.db")
cursor = conn.cursor()

# Query chunks matching Level 1 / Mad Mage
rows = cursor.execute("SELECT text FROM vectors WHERE text LIKE '%Mad Mage%' OR text LIKE '%Undermountain%';").fetchall()

print(f"Total Chunks Inspected: {len(rows)}")

items = set()
magic = set()
furniture = set()
traps = set()
dressing = set()

# Regex rules for items and objects
for (text,) in rows:
    # Check for specific items mentioned
    for match in re.findall(r'\b(?:stone|iron|wooden|bronze|copper|gold|silver|magic|arcane|glowing|carved|rust|dusty|broken|cracked)\s+[a-z]+(?:\s+[a-z]+)?\b', text, re.IGNORECASE):
        lower = match.lower().strip()
        if len(lower) > 5 and not any(w in lower for w in ['level', 'page', 'chapter', 'dungeon', 'waterdeep', 'mad mage']):
            items.add(lower)

print(f"Extracted {len(items)} descriptive objects from vector store!")

# Save to level1_objects_raw.json
with open("apps/web/public/data/level1_objects_raw.json", "w", encoding="utf-8") as f:
    json.dump(sorted(list(items)), f, indent=2)

print("Saved to level1_objects_raw.json")
