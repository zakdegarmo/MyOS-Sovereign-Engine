import os
import time
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from PIL import Image
from io import BytesIO

# Configuration
BASE_URL = "https://opengameart.org"
SEARCH_URL = "https://opengameart.org/art-search-advanced?keys=LPC&field_art_type_tid%5B%5D=9" # 9 = 2D Art
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apps", "web", "public", "assets", "lpc")
TMP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts", "tmp_lpc")

# Create directories
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TMP_DIR, exist_ok=True)

def setup_driver():
    """Setup headless Chrome driver for scraping dynamic content or dealing with complex DOMs if needed."""
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    # Use standard Chrome driver (will require chromedriver to be installed/in path)
    return webdriver.Chrome(options=options)

def get_asset_links(driver, max_pages=1):
    """Crawl the search results to find individual asset page URLs."""
    print(f"Crawling {SEARCH_URL}...")
    asset_links = []
    
    # We could paginate, but let's start with page 1 for testing
    for page in range(max_pages):
        page_url = f"{SEARCH_URL}&page={page}" if page > 0 else SEARCH_URL
        driver.get(page_url)
        time.sleep(2) # Be polite
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Find all asset containers on the page
        # OpenGameArt search results use <span class="art-preview-title">
        nodes = soup.find_all('span', class_='art-preview-title')
        for node in nodes:
            a_tag = node.find('a')
            if a_tag and 'href' in a_tag.attrs:
                link = BASE_URL + a_tag['href']
                asset_links.append(link)
                
    return asset_links

def download_images_from_page(driver, page_url):
    """Given an asset page, find the actual PNG files and download them to TMP_DIR."""
    print(f"Inspecting {page_url}...")
    driver.get(page_url)
    time.sleep(1) # Be polite
    
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    downloads = []
    
    # OpenGameArt stores files in a div block with class 'field-name-field-art-files'
    # Or just look for any direct link ending in png or zip inside the main content area
    content_area = soup.find('div', class_='content')
    if content_area:
        links = content_area.find_all('a')
        for link in links:
            href = link.get('href', '')
            # OGA files are usually served from /sites/default/files/
            if '/files/' in href and (href.lower().endswith('.png') or href.lower().endswith('.zip')):
                downloads.append(href)
                
    downloaded_files = []
    for d_url in downloads:
        filename = d_url.split('/')[-1]
        filepath = os.path.join(TMP_DIR, filename)
        
        # Only download if we don't have it
        if not os.path.exists(filepath):
            print(f"  Downloading {filename}...")
            try:
                # OpenGameArt sometimes has relative or absolute links, handle both
                full_url = d_url if d_url.startswith('http') else BASE_URL + d_url
                
                response = requests.get(full_url, stream=True)
                if response.status_code == 200:
                    with open(filepath, 'wb') as f:
                        for chunk in response.iter_content(1024):
                            f.write(chunk)
                    downloaded_files.append(filepath)
            except Exception as e:
                print(f"  Error downloading {filename}: {e}")
        else:
            downloaded_files.append(filepath)
            
    return downloaded_files

def process_sprite_sheet(filepath):
    """
    Open a downloaded sprite sheet and try to chop it down or categorize it.
    Since LPC assets are highly varied, writing a universal chopper is hard.
    For this MVP, we'll just move the whole sheet into the public directory
    and organize by name. 
    A true '64x64 component chopper' requires exact dimension math per sheet.
    """
    filename = os.path.basename(filepath)
    name_lower = filename.lower()
    
    # Very basic semantic categorization based on filename
    category = "misc"
    if "body" in name_lower or "base" in name_lower:
        category = "body"
    elif "hair" in name_lower or "beard" in name_lower:
        category = "hair"
    elif "shirt" in name_lower or "armor" in name_lower or "robe" in name_lower or "clothes" in name_lower:
        category = "torso"
    elif "pants" in name_lower or "legs" in name_lower:
        category = "legs"
    elif "hat" in name_lower or "helm" in name_lower:
        category = "headgear"
    elif "weapon" in name_lower or "sword" in name_lower or "bow" in name_lower or "staff" in name_lower:
        category = "weapon"
        
    cat_dir = os.path.join(OUTPUT_DIR, category)
    os.makedirs(cat_dir, exist_ok=True)
    
    dest_path = os.path.join(cat_dir, filename)
    
    if not os.path.exists(dest_path):
        import shutil
        shutil.copy(filepath, dest_path)
        print(f"  Categorized {filename} -> {category}/")

def main():
    print("Initializing LPC Scraper...")
    try:
        driver = setup_driver()
    except Exception as e:
        print(f"Could not start Selenium. Note: You need Chrome and ChromeDriver installed. Error: {e}")
        return

    try:
        # Step 1: Get pages
        asset_links = get_asset_links(driver, max_pages=1) # Just 1 page for test
        print(f"Found {len(asset_links)} asset pages.")
        
        # Step 2: Extract & Download
        all_downloaded = []
        for link in asset_links:
            files = download_images_from_page(driver, link)
            all_downloaded.extend(files)
            
        print(f"Total sprite sheets downloaded: {len(all_downloaded)}")
        
        # Step 3: Process & Categorize
        for filepath in all_downloaded:
            process_sprite_sheet(filepath)
            
        print("Scraping and processing complete.")
        
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
