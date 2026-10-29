import json
import requests
import difflib
import re
import time

def main():
    print("Loading initial spell list...")
    with open("apps/web/public/5e_spells_list.json", "r") as f:
        spells = json.load(f)["results"]
        
    srd_dict = {s["name"].lower(): s for s in spells}
    srd_names = [s["name"] for s in spells]
    
    with open("apps/web/public/spell_database.json", "r") as f:
        llava_spells = json.load(f)
        
    fixed_spells = []
    
    print(f"Fixing {len(llava_spells)} LLaVA spells...")
    
    for i, spell in enumerate(llava_spells):
        raw_name = spell.get("name", "")
        
        # Fuzzy match to get URL
        matches = difflib.get_close_matches(raw_name, srd_names, n=1, cutoff=0.5)
        if matches:
            matched_srd = srd_dict.get(matches[0].lower())
            
            try:
                # Fetch details
                url = f"https://www.dnd5eapi.co{matched_srd['url']}"
                resp = requests.get(url, timeout=5)
                data = resp.json()
                
                lvl = data.get("level", 0)
                lvl_str = "Cantrip" if lvl == 0 else f"Level {lvl}"
                
                fixed_spells.append({
                    "id": re.sub(r'[^a-z0-9]', '_', data['name'].lower()),
                    "name": data['name'],
                    "level": lvl_str,
                    "school": data.get("school", {}).get("name", "Evocation"),
                    "file": spell["file"],
                    "desc": data.get("desc", ["No description available."])
                })
                print(f"Fixed: {raw_name} -> {data['name']} ({lvl_str}, {data.get('school', {}).get('name')})")
            except Exception as e:
                print(f"Error fetching {url}: {e}")
                fixed_spells.append(spell)
        else:
            print(f"No match for {raw_name}")
            fixed_spells.append(spell)
            
        time.sleep(0.05)
        
    with open("apps/web/public/spell_database.json", "w") as f:
        json.dump(fixed_spells, f, indent=4)
    print("Saved fixed spell_database.json")

if __name__ == "__main__":
    main()
