import requests
from bs4 import BeautifulSoup
import time
import os
import random
import re

BASE_URL = "https://www.spriters-resource.com"
GAME_URL = "https://www.spriters-resource.com/snes/zombiesneighbours/"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Referer': 'https://www.spriters-resource.com/'
}

def gather_links():
    print("--- ZAMN Gatherer (Link Extractor) ---")
    print(f"[*] Accessing {GAME_URL}...")
    
    try:
        res = requests.get(GAME_URL, headers=HEADERS, timeout=10)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # 1. Find all Asset Links
        # Selector: a[href*="/snes/zombiesneighbours/asset/"]
        raw_links = soup.select('a[href*="/snes/zombiesneighbours/asset/"]')
        sheet_links = list(set([BASE_URL + a['href'] for a in raw_links if 'href' in a.attrs]))
        
        print(f"[*] Found {len(sheet_links)} potential sheets.")
        
        direct_pngs = []
        
        for i, link in enumerate(sheet_links):
            try:
                # print(f"[{i+1}/{len(sheet_links)}] Inspecting: {link}")
                time.sleep(random.uniform(0.3, 0.8)) # Be polite
                
                s_res = requests.get(link, headers=HEADERS, timeout=10)
                if s_res.status_code != 200: continue
                    
                s_soup = BeautifulSoup(s_res.text, 'html.parser')
                
                # 2. Find the DIRECT DOWNLOAD BUTTON
                # Priority 1: ID "download" (Most robust)
                download_btn = s_soup.find(id="download")
                
                # Priority 2: Data Attribute 'data-download'
                if not download_btn:
                    download_btn = s_soup.select_one('a[data-download]')
                
                # Priority 3: Class 'button thin-stroke' with "Download" text
                if not download_btn:
                    download_btn = s_soup.select_one('a.button.thin-stroke')
                
                if download_btn and 'href' in download_btn.attrs:
                    full_url = BASE_URL + download_btn['href']
                    direct_pngs.append(full_url)
                    print(f"    [+] Secured: {full_url.split('/')[-1]}")
                else:
                    # Last Resort: Main Image (if it's just an image page)
                    img_tag = s_soup.select_one('div.sheet-container img')
                    if img_tag and 'src' in img_tag.attrs:
                        full_url = BASE_URL + img_tag['src']
                        if not full_url.startswith('http'): full_url = BASE_URL + full_url
                        direct_pngs.append(full_url)
                        print(f"    [+] Secured (Fallback): {full_url.split('/')[-1]}")
                    else:
                        print(f"    [-] No download link found: {link}")

            except Exception as e:
                print(f"[!] Error processing {link}: {e}")
                continue

        # Save to manifest
        with open("manifest.txt", "w") as f:
            for url in direct_pngs:
                f.write(url + "\n")
        
        print(f"\n[!] Extraction Complete. {len(direct_pngs)} URLs saved to manifest.txt")
        print("[*] Ready for Script 2: The Downloader.")

    except Exception as e:
        print(f"[ABORT] Critical Error: {e}")

if __name__ == "__main__":
    try:
        gather_links()
    except KeyboardInterrupt:
        print("\n[!] Scraper interrupted by user.")
