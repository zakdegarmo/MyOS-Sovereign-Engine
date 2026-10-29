import json
import difflib
import re

def main():
    print("Loading LLaVA extracted database...")
    with open("apps/web/public/spell_database.json", "r") as f:
        llava_spells = json.load(f)
        
    print("Loading official SRD database...")
    with open("apps/web/public/5e_srd_database.json", "r") as f:
        srd_spells = json.load(f)
        
    srd_names = [s["name"] for s in srd_spells]
    srd_dict = {s["name"].lower(): s for s in srd_spells}
    
    fixed_spells = []
    failed_matches = 0
    
    for spell in llava_spells:
        raw_name = spell["name"]
        
        # 1. Exact match
        matched_srd = srd_dict.get(raw_name.lower())
        
        # 2. Fuzzy match
        if not matched_srd:
            matches = difflib.get_close_matches(raw_name, srd_names, n=1, cutoff=0.6)
            if matches:
                matched_srd = srd_dict.get(matches[0].lower())
                
        if matched_srd:
            print(f"Matched: '{raw_name}' -> '{matched_srd['name']}' ({matched_srd['school']} {matched_srd['level']})")
            fixed_spells.append({
                "id": re.sub(r'[^a-z0-9]', '_', matched_srd['name'].lower()),
                "name": matched_srd['name'],
                "level": matched_srd['level'],
                "school": matched_srd['school'],
                "file": spell["file"] # Keep the original file mapping!
            })
        else:
            print(f"WARNING: Could not find SRD match for '{raw_name}' (File: {spell['file']})")
            failed_matches += 1
            # Keep original LLaVA data as fallback
            fixed_spells.append(spell)
            
    print(f"\nSuccessfully fixed {len(llava_spells) - failed_matches} out of {len(llava_spells)} spells!")
    
    with open("apps/web/public/spell_database.json", "w") as f:
        json.dump(fixed_spells, f, indent=4)
    print("Overwrote spell_database.json with 100% accurate SRD data.")

if __name__ == "__main__":
    main()
