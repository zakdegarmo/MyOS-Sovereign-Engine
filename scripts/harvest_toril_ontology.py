import json
import urllib.request
import urllib.parse
import time
import os
import sys

API_URL = "https://forgottenrealms.fandom.com/api.php"

CATEGORIES = [
    "Locations_in_the_Sword_Coast",
    "Locations_in_Faerûn",
    "Settlements_in_Faerûn",
    "Dungeons_in_Faerûn",
    "Inns_and_taverns_in_Faerûn",
    "Underdark_locations",
    "Regions_of_Faerûn"
]

def fetch_category_members(category_name, max_results=150):
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": f"Category:{category_name}",
        "cmlimit": min(max_results, 500),
        "format": "json"
    }
    url = f"{API_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "MyOS-TorilHarvester/1.0"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            members = data.get("query", {}).get("categorymembers", [])
            return [m for m in members if m.get("ns") == 0] # page namespace only
    except Exception as e:
        print(f"Error fetching category {category_name}: {e}")
        return []

def fetch_page_extract(page_id):
    params = {
        "action": "query",
        "prop": "extracts",
        "exintro": 1,
        "explaintext": 1,
        "pageids": page_id,
        "format": "json"
    }
    url = f"{API_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "MyOS-TorilHarvester/1.0"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            pages = data.get("query", {}).get("pages", {})
            page = pages.get(str(page_id), {})
            return page.get("extract", "")
    except Exception as e:
        print(f"Error fetching extract for page {page_id}: {e}")
        return ""

def determine_lod_tier(title, category):
    t_lower = title.lower()
    cat_lower = category.lower()
    
    if "region" in cat_lower or any(k in t_lower for k in ["sword coast", "heartlands", "dalelands", "moonsea", "chult", "underdark", "anauroch", "kara-tur"]):
        return "Tier1_MajorRegion"
    if "settlement" in cat_lower or "city" in t_lower or "kingdom" in t_lower:
        return "Tier2_Landmark"
    if "inn" in cat_lower or "tavern" in cat_lower or "dungeon" in cat_lower or "room" in t_lower:
        return "Tier3_MicroPOI"
    return "Tier2_Landmark"

def main():
    print("Starting Forgotten Realms Canonical Ontology Harvester...")
    output_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\data"
    os.makedirs(output_dir, exist_ok=True)
    
    ontology = {
        "metadata": {
            "source": "Forgotten Realms Wiki (MediaWiki API)",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "totalNodes": 0
        },
        "regions": {},
        "nodes": {}
    }
    
    seen_page_ids = set()
    total_harvested = 0
    
    for cat in CATEGORIES:
        print(f"Harvesting category: Category:{cat}...")
        members = fetch_category_members(cat, max_results=100)
        print(f"Found {len(members)} pages in {cat}.")
        
        for m in members:
            page_id = m["pageid"]
            title = m["title"]
            
            if page_id in seen_page_ids:
                continue
            seen_page_ids.add(page_id)
            
            # Fetch abstract/extract
            extract = fetch_page_extract(page_id)
            tier = determine_lod_tier(title, cat)
            
            node_id = title.lower().replace(" ", "_").replace("'", "").replace("-", "_")
            ontology["nodes"][node_id] = {
                "id": node_id,
                "name": title,
                "pageId": page_id,
                "category": cat,
                "lodTier": tier,
                "extract": extract[:300] if extract else "",
                "wikiUrl": f"https://forgottenrealms.fandom.com/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
            }
            
            total_harvested += 1
            time.sleep(0.1) # Be gentle with API rate limits
            
    ontology["metadata"]["totalNodes"] = total_harvested
    output_file = os.path.join(output_dir, "toril_canonical_ontology.json")
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(ontology, f, indent=2)
        
    print(f"Successfully harvested {total_harvested} canonical Forgotten Realms nodes into {output_file}!")

if __name__ == "__main__":
    main()
