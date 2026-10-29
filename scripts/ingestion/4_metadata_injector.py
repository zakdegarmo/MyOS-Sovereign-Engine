import json
import re
import os

# Data extracted from Spriters Resource markdown
MARKDOWN_DATA = """
[Julie](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4005/)
[Zeke](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4004/)
[Baby](https://www.spriters-resource.com/snes/zombiesneighbours/asset/179732/)
[Barbecue Cook](https://www.spriters-resource.com/snes/zombiesneighbours/asset/179731/)
[Credit Level NPCs & Map Placement](https://www.spriters-resource.com/snes/zombiesneighbours/asset/63281/)
[Various Victims](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4006/)
[Victims (Extra)](https://www.spriters-resource.com/snes/zombiesneighbours/asset/32045/)
[Frankenstein](https://www.spriters-resource.com/snes/zombiesneighbours/asset/31836/)
[Giant Ant](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4057/)
[Gillman of the Blue Lagoon (a.k.a Brook Shards)](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4063/)
[Jelly Blob](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4056/)
[Kelly Flock](https://www.spriters-resource.com/snes/zombiesneighbours/asset/63288/)
[Martians](https://www.spriters-resource.com/snes/zombiesneighbours/asset/31838/)
[Mummy](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4060/)
[Mushroom Men](https://www.spriters-resource.com/snes/zombiesneighbours/asset/32189/)
[Mutant Plant](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4061/)
[Pod Plant](https://www.spriters-resource.com/snes/zombiesneighbours/asset/31834/)
[Stanley Decker (Axe)](https://www.spriters-resource.com/snes/zombiesneighbours/asset/32192/)
[Stanley Decker (Chainsaw)](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4064/)
[Tentacle](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4065/)
[Tommy the Evil Doll](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4007/)
[Vlad Belmont the Vampire](https://www.spriters-resource.com/snes/zombiesneighbours/asset/31835/)
[Werewolf](https://www.spriters-resource.com/snes/zombiesneighbours/asset/31620/)
[Zombie](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4066/)
[Dr. Tongue (Form 1, Giant Spider)](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4059/)
[Dr. Tongue (Form 2, Floating Head)](https://www.spriters-resource.com/snes/zombiesneighbours/asset/62217/)
[Flying Saucer](https://www.spriters-resource.com/snes/zombiesneighbours/asset/31837/)
[Giant Baby](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4058/)
[Snakeoid](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4062/)
[Level 01 Bonus: Day of the Tentacle](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4009/)
[Level 01: Rescue the Neighbours in: Zombie Panic](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4008/)
[Level 02: Evening of the Undead](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4010/)
[Level 03: Terror in Aisle Five](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4011/)
[Level 04: Chainsaw / Lumberjack Hedgemaze Mayhem](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4012/)
[Level 05: Weird Kids on the Block](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4013/)
[Level 06: More Shocking than Level 5: Pyramid of Fear](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4014/)
[Level 07: Dr. Tongue's Castle of Terror](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4015/)
[Level 08: Forty Feet of Terror in: Titanic Toddler](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4016/)
[Level 09 Bonus: Mushroom Men](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4018/)
[Level 09: Toxic Terrors](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4017/)
[Level 10: No Assembly Required](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4019/)
[Level 11: Weeds Gone Bad](https://www.spriters-resource.com/snes/zombiesneighbours/asset/63287/)
[Level 12 Bonus: Cheerleaders Versus the Monsters](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4021/)
[Level 12: They Came to Earth for One Thing: Mars needs Cheerleaders](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4020/)
[Level 13: Terrifying to the Bone! Chopping Mall](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4022/)
[Level 14: Seven Meals for Seven Zombies](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4023/)
[Level 15: Dinner on Monster Island](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4024/)
[Level 16: From the Depths of the Earth: Ants](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4025/)
[Level 17 Bonus: Someplace Very Warm](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4027/)
[Level 17: Office of the Doomed](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4026/)
[Level 18: The Terror is Back in: Squidmen of the Deep](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4028/)
[Level 19: Nightmare on Terror Street](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4029/)
[Level 20: Invasion of the Snakeoids](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4030/)
[Level 21: The Day the Earth Ran Away](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4031/)
[Level 22 Bonus: The Son of Dr. Tongue](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4033/)
[Level 22: The Scary Sequel to Level 7: Revenge of Dr. Tongue](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4032/)
[Level 23: The Caves of Mystery](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4034/)
[Level 24: Warehouse of the Evil Dolls](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4035/)
[Level 25: Huge Discounts on: Look Who's Shopping](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4036/)
[Level 26: Where the Red Fern Growls](https://www.spriters-resource.com/snes/zombiesneighbours/asset/63286/)
[Level 27: Dances With Werewolves](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4037/)
[Level 28: Scream in Horror on: Mark of the Vampire](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4038/)
[Level 29: More Shocking than Level 28: Zombie House Party](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4039/)
[Level 30: The Horror of Floor Thirteen](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4040/)
[Level 31: Look Who's Coming to Dinner](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4041/)
[Level 32: Get Ready for Big Terror: Giant Ant Farm](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4042/)
[Level 33 Bonus: Curse of the Pharaohs](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4044/)
[Level 33: Fish and Crypts](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4043/)
[Level 34: I Was a Chainsaw Maniac / Maniac Lumberjack](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4045/)
[Level 35: Boardwalk of Terrors](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4046/)
[Level 36: Prepare for the Terror: Monster Phobia](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4047/)
[Level 37: Labyrinth of Horrors](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4048/)
[Level 38: Monsters of the Blue Lagoon](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4049/)
[Level 39: Destroy All Vampires](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4050/)
[Level 40: More Terror than Before: Pyramid of Fear 2](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4051/)
[Level 41: They Are Back! In: Martians Go Home!](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4052/)
[Level 42: Terror has a New Name! Spikes](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4053/)
[Level 43: Super Fund Cleanup Site](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4054/)
[Level 44: The Curse of Dr. Tongue](https://www.spriters-resource.com/snes/zombiesneighbours/asset/63285/)
[Level 45: Danger in Picnic Park](https://www.spriters-resource.com/snes/zombiesneighbours/asset/4055/)
[Level 46: A Shocking Sequel to Level 34: Day of the Chainsaw / Lumberjack](https://www.spriters-resource.com/snes/zombiesneighbours/asset/63284/)
[Level 47: More Shocking than Level 46: Gridiron Terror](https://www.spriters-resource.com/snes/zombiesneighbours/asset/63283/)
[Level 48 Bonus / Credit Level: Monsters Among Us](https://www.spriters-resource.com/snes/zombiesneighbours/asset/180056/)
[Level 48: Curse of the Tongue](https://www.spriters-resource.com/snes/zombiesneighbours/asset/63282/)
[Boogeyman (Trap)](https://www.spriters-resource.com/snes/zombiesneighbours/asset/32188/)
[Exit Door](https://www.spriters-resource.com/snes/zombiesneighbours/asset/32191/)
[Football Player (Hazard)](https://www.spriters-resource.com/snes/zombiesneighbours/asset/32190/)
[Items & Weapons](https://www.spriters-resource.com/snes/zombiesneighbours/asset/153551/)
[Level Prelude Fonts](https://www.spriters-resource.com/snes/zombiesneighbours/asset/179980/)
"""

# Categorization Logic
MAIN_CHARS = ["Julie", "Zeke", "Baby", "Barbecue Cook"]
BOSSES = ["Dr. Tongue", "Giant Baby", "Snakeoid", "Flying Saucer"]
THREATS = ["Hazards", "Trap"]

def get_category(name):
    if any(x in name for x in MAIN_CHARS): return "Main Characters"
    if "Level" in name and not "Fonts" in name: return "Levels"
    if any(x in name for x in BOSSES): return "Bosses"
    if any(x in name for x in THREATS): return "Hazards"
    if "Victim" in name: return "Victims"
    if name in ["Items & Weapons", "Exit Door", "Level Prelude Fonts"]: return "System"
    return "Enemies"

def run_injection():
    # 1. Parse Markdown into Dict
    id_map = {}
    pattern = r"\[(.*?)\]\(.*?/asset/(\d+)/?\)"
    matches = re.findall(pattern, MARKDOWN_DATA)
    
    for name, asset_id in matches:
        id_map[asset_id] = {
            "name": name,
            "category": get_category(name)
        }
    
    print(f"[*] Parsed {len(id_map)} mappings from Spriters Resource.")

    # 2. Load fossil_layer.json
    json_path = "apps/web/public/assets/ZAMN_Assets/fossil_layer.json"
    if not os.path.exists(json_path):
        print(f"[!] Error: {json_path} not found.")
        return

    with open(json_path, 'r') as f:
        data = json.load(f)

    # 3. Update Metadata
    updated_count = 0
    for asset in data:
        filename = asset.get('content', {}).get('fileName', '')
        # Extract ID from filename (e.g., 153551.png -> 153551)
        id_match = re.match(r"(\d+)\.png", filename)
        if id_match:
            sid = id_match.group(1)
            if sid in id_map:
                info = id_map[sid]
                # Update Filename with readable name
                asset['content']['fileName'] = f"{info['name']}.png"
                # Update Context (Tags)
                # Categories mapping to Dewey-ish codes or just readable tags
                tags = asset['meta'].get('context', [])
                if "uncategorized" in tags: tags.remove("uncategorized")
                
                # Add Category Tag
                cat_tag = info['category'].replace(" ", "_").lower()
                if cat_tag not in tags: tags.append(cat_tag)
                
                # Add human readable name as tag
                name_tag = info['name'].replace(" ", "_").lower()
                if name_tag not in tags: tags.append(name_tag)
                
                # Map to Dewey Codes for the Sidebar
                dewey_map = {
                    "Main Characters": "710", # Arts - Performing
                    "Enemies": "720",
                    "Bosses": "730",
                    "Levels": "740",
                    "Victims": "750",
                    "Hazards": "760",
                    "System": "700"
                }
                code = dewey_map.get(info['category'], "700")
                if code not in tags: tags.append(code)
                
                asset['meta']['context'] = tags
                updated_count += 1

    # 4. Save Back
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=4)

    print(f"[!] Injection Complete. {updated_count} assets updated with metadata.")

if __name__ == "__main__":
    run_injection()
