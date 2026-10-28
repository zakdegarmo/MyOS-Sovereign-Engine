# grub_oclc.py - v1.0
# A respectful, two-stage web crawler to download the OCLC's
# modernized Dewey Decimal Classification "Concept" objects.

import os
import time
import requests
import json
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

# --- Configuration ---
START_URL = "https://entities.oclc.org/worldcat/ddc/"
URL_INDEX_FILE = "oclc_page_index.txt"  # A file to store the URLs of pages to download from
OUTPUT_DIR = "Dewey_Concepts_JSON"      # The folder where the final JSON files will be saved
POLITE_DELAY_SECONDS = 2               # A respectful delay between requests

def crawl_for_concept_pages(start_url):
    """
    Stage 1: Crawls the DDC website to find all unique concept pages.
    Saves the list of URLs to a text file.
    """
    urls_to_visit = [start_url]
    visited_urls = set()
    concept_page_urls = set()

    print(f"[Crawler]: Beginning recursive crawl at {start_url}...")

    while urls_to_visit:
        current_url = urls_to_visit.pop(0)
        if current_url in visited_urls:
            continue

        print(f"[Crawler]: Visiting: {current_url}")
        visited_urls.add(current_url)

        try:
            response = requests.get(current_url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            for link in soup.find_all('a', href=True):
                absolute_url = urljoin(current_url, link['href'])
                
                if urlparse(absolute_url).netloc != urlparse(start_url).netloc:
                    continue

                # The pattern for a concept page URL is a URI containing "/worldcat/ddc/E"
                if "/worldcat/ddc/E" in absolute_url and ".json" not in absolute_url:
                    if absolute_url not in concept_page_urls:
                        print(f"  [+] Found Concept Page: {absolute_url}")
                        concept_page_urls.add(absolute_url)
                
                # If it's another directory page, add it to the queue
                elif "/worldcat/ddc/" in absolute_url and absolute_url not in visited_urls:
                    urls_to_visit.append(absolute_url)
            
            time.sleep(POLITE_DELAY_SECONDS)
        except requests.RequestException as e:
            print(f"  [!] Crawler ERROR: Could not fetch {current_url}: {e}")
            continue
            
    # Save the found URLs to a file for the next stage
    sorted_urls = sorted(list(concept_page_urls))
    with open(URL_INDEX_FILE, 'w', encoding='utf-8') as f:
        for url in sorted_urls:
            f.write(url + '\n')
            
    print(f"\n[Crawler]: Stage 1 Complete. Found {len(sorted_urls)} concept pages.")
    print(f"URL list saved to '{URL_INDEX_FILE}'.")
    return sorted_urls

def download_concepts_from_index(url_list, output_dir):
    """
    Stage 2: Reads the URL list, visits each page, finds the specific
    JSON download link, and saves the content.
    """
    print(f"\n[Downloader]: Beginning Stage 2: Downloading {len(url_list)} concepts...")
    if not os.path.exists(output_dir):
        print(f"[Downloader]: Creating output directory: {output_dir}")
        os.makedirs(output_dir)

    for url in url_list:
        try:
            print(f"[Downloader]: Processing page: {url}")
            # Construct the direct download URL based on the pattern you found
            # Example: .../E3F9hRv97HYyxWxcKvb6FFGm3y  ->  .../E3F9hRv97HYyxWxcKvb6FFGm3y.jsonld?download=true
            json_url = url.strip() + ".jsonld?download=true"
            
            print(f"  [+] Constructed Download URL: {json_url}")
            json_response = requests.get(json_url, timeout=10)
            json_response.raise_for_status()
            json_data = json_response.json()
            
            # Use the Dewey 'notation' for a clean, logical filename
            filename = f"{json_data.get('notation', 'UNKNOWN').replace(' ', '_')}.json"
            filepath = os.path.join(output_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)
            print(f"  [+] Saved concept to '{filepath}'")

            time.sleep(POLITE_DELAY_SECONDS)
        except Exception as e:
            print(f"  [!] Downloader ERROR: Could not process {url}: {e}")
            continue

def main():
    """Orchestrates the two-stage grubbing process."""
    if os.path.exists(URL_INDEX_FILE):
        user_choice = input(f"Found existing URL index ('{URL_INDEX_FILE}').\nDo you want to (S)kip crawling and use this index, or (R)e-crawl to create a new one? (S/R): ")
        if user_choice.lower() == 's':
            with open(URL_INDEX_FILE, 'r', encoding='utf-8') as f:
                concept_pages = [line.strip() for line in f]
            print(f"Loaded {len(concept_pages)} URLs from existing index.")
        else:
            concept_pages = crawl_for_concept_pages(START_URL)
    else:
        concept_pages = crawl_for_concept_pages(START_URL)
    
    if not concept_pages:
        print("No concept pages found. Aborting download stage.")
        return

    download_concepts_from_index(concept_pages, OUTPUT_DIR)
    
    print("\nGrubbing operation complete.")

if __name__ == '__main__':
    main()