import os
import sys
import requests
import time
from ddgs import DDGS
from pixel_art_inator import convert_to_pixel_art

# Ensure UTF-8 output encoding for Windows PowerShell console
sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = "./apps/web/public/assets/billboards/jit_assets"

def scrape_and_pixelate(noun_input):
    start_time = time.time()
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"🔍 Searching web for an image of '{noun_input}'...")
    
    try:
        # 1. Search for the image using DuckDuckGo (with retry loop)
        results = []
        for attempt in range(3):
            try:
                with DDGS() as ddgs:
                    # Searching for clip art/icons yields much cleaner results than random stock photos
                    search_query = f"{noun_input} simple 2d game icon clip art isolated on white background"
                    results = list(ddgs.images(search_query, max_results=1))
                    break # Success!
            except Exception as e:
                print(f"⚠️ DuckDuckGo search attempt {attempt + 1} failed: {e}. Retrying in 2 seconds...")
                time.sleep(2)
                
        if not results:
            print(f"❌ No images found for '{noun_input}' after 3 attempts.")
            return None
            
        image_url = results[0].get("image")
        print(f"🔗 Found image URL: {image_url}")
        
        # 2. Download the image
        print("⬇️ Downloading image...")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(image_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Save the raw image temporarily
        temp_filename = os.path.join(OUTPUT_DIR, f"temp_raw_{noun_input.replace(' ', '_')}.jpg")
        with open(temp_filename, "wb") as f:
            f.write(response.content)
            
        print(f"💾 Saved temporary raw image to {temp_filename}")
        
        # 3. Process the image using the pixel_art_inator script
        safe_filename = f"{noun_input.lower().replace(' ', '_')}.png"
        final_path = os.path.join(OUTPUT_DIR, safe_filename)
        
        print(f"🎨 Running pixelation pipeline on the image...")
        result_path = convert_to_pixel_art(
            image_input_path=temp_filename, 
            output_path=final_path,
            target_size=(64, 64), 
            palette_colors=12
        )
        
        if result_path:
            elapsed = time.time() - start_time
            print(f"✅ Success! JIT Asset generated at: {result_path}")
            print(f"⏱️ Total Execution Time: {elapsed:.2f} seconds")
            # Clean up the raw file
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            return result_path
        else:
            print("❌ Failed to process the image into pixel art.")
            return None
            
    except Exception as e:
        print(f"❌ Error during JIT scraping pipeline: {e}")
        return None

def batch_scrape(comma_separated_nouns):
    nouns = [n.strip() for n in comma_separated_nouns.split(',') if n.strip()]
    print(f"🚀 Starting Batch Scraping for {len(nouns)} items: {nouns}")
    successful = []
    
    for noun in nouns:
        result = scrape_and_pixelate(noun)
        if result:
            successful.append(result)
        time.sleep(1) # Prevent aggressive rate limiting
        
    print(f"🎉 Batch complete! Successfully processed {len(successful)}/{len(nouns)} items.")
    return successful

if __name__ == "__main__":
    if len(sys.argv) > 1:
        search_query = " ".join(sys.argv[1:])
    else:
        search_query = input("Enter a noun (or comma-separated list of nouns) to scrape and pixelate: ")
    
    if ',' in search_query:
        batch_scrape(search_query)
    else:
        scrape_and_pixelate(search_query)
