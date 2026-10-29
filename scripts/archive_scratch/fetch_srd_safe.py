import json
import urllib.request
import time

def main():
    print("Loading initial spell list...")
    with open("apps/web/public/5e_spells_list.json", "r") as f:
        spells = json.load(f)["results"]
    
    detailed_spells = []
    print(f"Fetching details for {len(spells)} spells...")
    
    for i, spell in enumerate(spells):
        url = f"https://www.dnd5eapi.co{spell['url']}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                
                lvl = data.get("level")
                if lvl == 0:
                    lvl_str = "Cantrip"
                else:
                    lvl_str = f"Level {lvl}"
                    
                detailed_spells.append({
                    "name": data.get("name"),
                    "level": lvl_str,
                    "school": data.get("school", {}).get("name")
                })
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            
        if (i + 1) % 10 == 0:
            print(f"Progress: {i + 1}/{len(spells)}")
            with open("apps/web/public/5e_srd_database.json", "w") as f:
                json.dump(detailed_spells, f, indent=4)
        
        time.sleep(0.1)
                
    with open("apps/web/public/5e_srd_database.json", "w") as f:
        json.dump(detailed_spells, f, indent=4)
    print("Saved 5e_srd_database.json")

if __name__ == "__main__":
    main()
