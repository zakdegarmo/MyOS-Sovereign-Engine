import requests
from bs4 import BeautifulSoup
import json
import os
import time
import random
import uuid
import re
from Categorizer import Categorizer

# Configuration
BASE_URL = "https://www.spriters-resource.com"
BROWSE_URL = "https://www.spriters-resource.com/browse/games/?consoles[0]=1&sortby=1&dir=1"
STAGING_DIR = "apps/web/public/assets/Librarian_Staging"
MANIFEST_FILE = os.path.join(STAGING_DIR, "snes_manifest.json")
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Referer': BASE_URL
}

class GrandLibrarian:
    def __init__(self):
        os.makedirs(STAGING_DIR, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.games = self._load_manifest()

    def _load_manifest(self):
        if os.path.exists(MANIFEST_FILE):
            with open(MANIFEST_FILE, 'r') as f:
                return json.load(f)
        return {}

    def _save_manifest(self):
        with open(MANIFEST_FILE, 'w') as f:
            json.dump(self.games, f, indent=4)

    def _wait(self, min_s=1, max_s=3):
        time.sleep(random.uniform(min_s, max_s))

    def discover_games(self, pages=24):
        """Phase 1: Crawl the browse pages to find all snes games"""
        print(f"[*] Starting Game Discovery ({pages} pages)...")
        for p in range(1, pages + 1):
            url = f"https://www.spriters-resource.com/browse/games/page-{p}/?consoles[0]=1&sortby=1&dir=1"
            print(f"    [+] Crawling Page {p}/{pages}...")
            
            try:
                res = self.session.get(url, timeout=15)
                res.raise_for_status()
                soup = BeautifulSoup(res.text, 'html.parser')
                
                # Selector for game links
                # Broader selector as 'div.updatesheet' is likely incorrect for browse pages
                links = soup.select('a[href*="/snes/"]')
                for a in links:
                    name = a.text.strip()
                    href = a['href']
                    
                    # Basic filtering to ensure it's a game link
                    # Game links are usually /snes/name/ and don't contain 'asset', 'page-', 'addasset', etc.
                    # Also length-based filtering to avoid the header/footer links
                    if all(x not in href for x in ['asset', 'page-', 'addasset', 'stats', 'browse']) and len(href.split('/')) == 4:
                        if href not in self.games:
                            self.games[href] = {
                                "name": name,
                                "url": BASE_URL + href,
                                "indexed": False
                            }
                
                self._save_manifest()
                self._wait()

            except Exception as e:
                print(f"    [!] Error on Page {p}: {e}")
                continue

        print(f"[!] Phase 1 Complete. {len(self.games)} games in manifest.")

    def index_game(self, game_href):
        """Phase 2: Scrape categories and sheets for a specific game"""
        game = self.games[game_href]
        if game.get("indexed"): return True
        
        print(f"[*] Indexing: {game['name']} ({game['url']})")
        try:
            res = self.session.get(game['url'], timeout=15)
            res.raise_for_status()
            print(f"    [+] Page Loaded ({len(res.text)} bytes)")
            soup = BeautifulSoup(res.text, 'html.parser')
            
            sheets = []
            
            # Find categories and sheets
            # Be broad with the section container search
            sections = soup.find_all(class_="updatesheet")
            print(f"    [+] Found {len(sections)} updatesheet sections")
            
            # Current game's relative prefix for filtering
            # Standardize for comparison
            game_prefix = game_href.strip('/')
            
            if not sections:
                # Emergency fallback: find any /sheet/ or /asset/ links that belong to this game
                print(f"    [!] No updatesheet sections found, using direct link discovery.")
                all_links = soup.find_all('a', href=re.compile(f"^/{game_prefix}/(?:sheet|asset)/"))
                print(f"    [+] Found {len(all_links)} relevant game-prefixed links")
                for a in all_links:
                    sheet_name = a.text.strip()
                    sheet_id_match = re.search(r"/(?:sheet|asset)/(\d+)/", a['href'])
                    if sheet_id_match:
                        sheet_id = sheet_id_match.group(1)
                        if not any(s['id'] == sheet_id for s in sheets):
                            sheets.append({
                                "id": sheet_id,
                                "name": sheet_name,
                                "category": "Uncategorized",
                                "dewey": Categorizer.get_dewey(sheet_name)
                            })
            else:
                for section in sections:
                    # Search for header in various common patterns
                    header = section.find_previous_sibling(class_=re.compile("updatesheettitle|game-category-header"))
                    if not header:
                        # Sometimes it's a parent's sibling
                        parent = section.parent
                        if parent:
                            header = parent.find_previous_sibling(class_=re.compile("updatesheettitle|game-category-header"))
                    
                    category_name = header.text.strip() if header else "Miscellaneous"
                    
                    # Get relevant sheets in this section
                    links = section.find_all('a', href=re.compile(f"/(?:sheet|asset)/"))
                    for a in links:
                        # Strict check: link belongs to this game
                        if f"/{game_prefix}/" not in a['href']: continue
                        
                        sheet_name = a.text.strip()
                        sheet_id_match = re.search(r"/(?:sheet|asset)/(\d+)/", a['href'])
                        if sheet_id_match:
                            sheet_id = sheet_id_match.group(1)
                            if not any(s['id'] == sheet_id for s in sheets):
                                sheets.append({
                                    "id": sheet_id,
                                    "name": sheet_name,
                                    "category": category_name,
                                    "dewey": Categorizer.get_dewey(sheet_name, category_name)
                                })

            print(f"    [+] Extracted {len(sheets)} sheets")
            game['sheets'] = sheets
            game['indexed'] = True
            self._save_manifest()
            self._wait(0.5, 1.5)
            return True

        except Exception as e:
            print(f"    [!] Error indexing {game['name']}: {e}")
            return False

    def secure_assets(self, limit_games=5):
        """Phase 3: Download images and generate fossil_layer.json"""
        count = 0
        for href, game in self.games.items():
            if not game.get("indexed"): continue
            if game.get("secured"): continue
            if count >= limit_games: break
            
            print(f"[*] Securing Assets for: {game['name']}")
            game_folder = os.path.join(STAGING_DIR, Categorizer.clean_tag(game['name']))
            os.makedirs(game_folder, exist_ok=True)
            
            memories = []
            
            for sheet in game['sheets']:
                # Consistent ID generation (Namespace UUID based on sheet ID)
                asset_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"spriters_{sheet['id']}"))
                filename = f"{sheet['id']}.png"
                dest_path = os.path.join(game_folder, filename)
                
                # 1. Download if missing
                if not os.path.exists(dest_path):
                    try:
                        # We need to visit the sheet page to get the actual download URL
                        sheet_url = f"{BASE_URL}/snes/zombiesneighbours/asset/{sheet['id']}/" # Placeholder logic
                        # Real logic: sheets often have a direct download button on the game page or need 1 more hop.
                        # For now, we simulate the hop to be safe and "extra polite"
                        sheet_res = self.session.get(f"{BASE_URL}/snes/{href.split('/')[-2]}/asset/{sheet['id']}/", timeout=10)
                        s_soup = BeautifulSoup(sheet_res.text, 'html.parser')
                        dl_btn = s_soup.find(id="download")
                        if dl_btn and 'href' in dl_btn.attrs:
                            img_url = BASE_URL + dl_btn['href']
                            img_res = self.session.get(img_url, timeout=15)
                            with open(dest_path, 'wb') as f:
                                f.write(img_res.content)
                            print(f"    [+] Saved: {sheet['name']}")
                        self._wait(0.3, 0.8)
                    except Exception as e:
                        print(f"    [!] Failed to download {sheet['name']}: {e}")
                        continue

                # 2. Add to MemCube array
                mem_cube = {
                    "id": asset_id,
                    "type": "asset",
                    "content": {
                        "assetUrl": f"/assets/Librarian_Staging/{os.path.basename(game_folder)}/{filename}",
                        "fileName": f"{sheet['name']}.png",
                        "mimeType": "image/png"
                    },
                    "meta": {
                        "timestamp": int(time.time() * 1000),
                        "origin": f"Librarian: {game['name']}",
                        "context": ["snes", "sprite", Categorizer.clean_tag(sheet['category']), sheet['dewey']],
                        "resonance": 0.5,
                        "embedding": []
                    }
                }
                memories.append(mem_cube)

            # Save fossil_layer.json for this game
            with open(os.path.join(game_folder, "fossil_layer.json"), 'w') as f:
                json.dump(memories, f, indent=4)
            
            game['secured'] = True
            self._save_manifest()
            count += 1

if __name__ == "__main__":
    librarian = GrandLibrarian()
    
    # Phase 1: Game Discovery (Already complete, but runs fast if manifest exists)
    # librarian.discover_games(pages=24)
    
    # Phase 3: Securing (Batch Mode)
    print(f"\n[*] Starting Phase 3: Securing (Batch: 20 games)...")
    librarian.secure_assets(limit_games=20)
    
    # Final Stat Report
    print("\n" + "="*40)
    print("      LIBRARIAN BATCH COMPLETE")
    print("="*40)
    
    indexed_count = sum(1 for href in librarian.games if librarian.games[href].get("indexed"))
    secured_count = sum(1 for href in librarian.games if librarian.games[href].get("secured"))
    print(f"[*] Total Indexed Games: {indexed_count}")
    print(f"[*] Total Secured Games: {secured_count}")
    print("="*40)
    
    print(f"\n[!] Grand Librarian Cycle Complete.")
    print(f"[*] Total Manifest: {len(librarian.games)} games.")
