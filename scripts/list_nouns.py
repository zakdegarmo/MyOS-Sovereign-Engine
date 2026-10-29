import json

with open("apps/web/public/data/mad_mage_noun_catalog.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("=== PEOPLE (30 Extracted) ===")
for p in data["people"]:
    desc = f" - {p['description']}" if p.get('description') else ""
    print(f"* {p['name']}{desc}")

print("\n=== PLACES (19 Extracted) ===")
for p in data["places"]:
    desc = f" - {p['description']}" if p.get('description') else ""
    print(f"* {p['name']}{desc}")

print("\n=== THINGS (35 Extracted) ===")
for t in data["things"]:
    desc = f" - {t['description']}" if t.get('description') else ""
    print(f"* {t['name']}{desc}")
