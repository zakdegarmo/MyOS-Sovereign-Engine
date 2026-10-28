import json
import urllib.request
import urllib.parse
import time
import os

API_URL = "https://forgottenrealms.fandom.com/api.php"

MAJOR_REGIONS_MAP = {
    "Sword Coast & North": [
        "Waterdeep", "Neverwinter", "Baldur's Gate", "Candlekeep", "Icewind Dale",
        "High Forest", "Silverymoon", "Luskan", "Longsaddle", "Daggerford"
    ],
    "Western Heartlands & South": [
        "Elturgard", "Amn", "Tethyr", "Calimshan", "Cormyr",
        "Scornubel", "Berdusk", "Serpent Hills", "Cloud Peaks", "Dragonmere"
    ],
    "Dalelands & Moonsea": [
        "Shadowdale", "Mistledale", "Archendale", "Zhentil Keep", "Hillsfar",
        "Phlan", "Mulmaster", "Melvaunt", "Standing Stone", "Daggerdale"
    ],
    "Sea of Fallen Stars": [
        "Sembia", "Aglarond", "Impiltur", "Turmish", "Chessenta",
        "Unther", "Mulhorand", "Pirate Isles", "Vilhon Reach", "Altumbel"
    ],
    "Far North & Frozen Lands": [
        "Ten-Towns", "Mithral Hall", "Citadel Adbar", "Citadel Felbarr", "Mirabar",
        "Kelvin's Cairn", "Vaasa", "Damara", "Tortured Lands", "Coldwood"
    ],
    "Anauroch Desert": [
        "The Sword Sand Dunes", "Plain of Standing Stones", "High Ice", "Ruins of Netheril",
        "Orentar", "Black Road", "Bedine Lands", "Doomspire", "Goblin Marches", "Karse"
    ],
    "Chult & Southern Jungles": [
        "Port Nyanzaru", "Mezro", "Firefinger", "Heart of Ubtao", "Wyrmheart Mine",
        "Omu", "Samarach", "Tashalar", "Snakewood", "Wild Coast"
    ],
    "Far East & Kara-Tur": [
        "Thay", "Rashemen", "Tuigan Steppes", "Shou Lung", "Kozakura",
        "Wa", "Tabot", "Great Wall of Shou Lung", "Narfell", "Dragonwall"
    ],
    "Zakhara (Land of Fate)": [
        "Huzuz", "Qudra", "An-Ansam Desert", "Pearl Cities", "Pantheon Mountains",
        "Corsair Domains", "Al-Kalim", "Ruined Kingdoms", "Sea of Chaos", "High Desert"
    ],
    "The Underdark": [
        "Skullport", "Undermountain", "Menzoberranzan", "Blingdenstone", "Gracklstugh",
        "Mantol-Derith", "Sloobludop", "Darklake", "Chaulssin", "Abyssal Rift"
    ]
}

TARGET_CATEGORIES = [
    "Locations_in_Faerûn",
    "Settlements",
    "Cities",
    "Towns",
    "Dungeons",
    "Taverns",
    "Castles",
    "Forests",
    "Mountains",
    "Lakes",
    "Rivers",
    "Ruins"
]

def fetch_category_members(cat, limit=500):
    params = {
        "action": "query",
        "list": "categorymembers",
        "cmtitle": f"Category:{cat}",
        "cmlimit": limit,
        "format": "json"
    }
    url = f"{API_URL}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "MyOS-MasterTorilPOI/1.0"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("query", {}).get("categorymembers", [])
    except Exception as e:
        print(f"Error fetching {cat}: {e}")
        return []

def main():
    print("Building Master Toril POI Catalog...")
    output_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\data"
    os.makedirs(output_dir, exist_ok=True)
    
    catalog = {
        "metadata": {
            "title": "Canonical Toril 1,000+ POI Spatial Lattice",
            "majorRegionCount": len(MAJOR_REGIONS_MAP),
            "subregionCount": sum(len(sub) for sub in MAJOR_REGIONS_MAP.values()),
            "totalPoiCount": 0
        },
        "structure": MAJOR_REGIONS_MAP,
        "pois": {}
    }
    
    seen = set()
    total_pois = 0
    
    for cat in TARGET_CATEGORIES:
        print(f"Harvesting Category:{cat}...")
        members = fetch_category_members(cat)
        for m in members:
            title = m["title"]
            page_id = m["pageid"]
            if page_id in seen or title.startswith("Category:"):
                continue
            seen.add(page_id)
            
            node_id = title.lower().replace(" ", "_").replace("'", "").replace("-", "_")
            catalog["pois"][node_id] = {
                "id": node_id,
                "name": title,
                "pageId": page_id,
                "category": cat,
                "wikiUrl": f"https://forgottenrealms.fandom.com/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
            }
            total_pois += 1
            
        time.sleep(0.1)
        
    catalog["metadata"]["totalPoiCount"] = total_pois
    output_file = os.path.join(output_dir, "toril_1000_poi_catalog.json")
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)
        
    print(f"Done! Saved {total_pois} canonical POIs to {output_file}!")

if __name__ == "__main__":
    main()
