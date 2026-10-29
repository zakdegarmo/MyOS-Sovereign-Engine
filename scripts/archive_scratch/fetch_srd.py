import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

def fetch_spell_details(spell_info):
    url = f"https://www.dnd5eapi.co{spell_info['url']}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return {
                "name": data.get("name"),
                "level": f"Level {data.get('level')}" if data.get("level") > 0 else "Cantrip",
                "school": data.get("school", {}).get("name")
            }
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def main():
    print("Loading initial spell list...")
    with open("apps/web/public/5e_spells_list.json", "r") as f:
        spells = json.load(f)["results"]
    
    detailed_spells = []
    print(f"Fetching details for {len(spells)} spells...")
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_spell = {executor.submit(fetch_spell_details, spell): spell for spell in spells}
        for i, future in enumerate(as_completed(future_to_spell)):
            result = future.result()
            if result:
                detailed_spells.append(result)
            if i % 10 == 0:
                print(f"Progress: {i}/{len(spells)}")
                
    with open("apps/web/public/5e_srd_database.json", "w") as f:
        json.dump(detailed_spells, f, indent=4)
    print("Saved 5e_srd_database.json")

if __name__ == "__main__":
    main()
