# bulette_grubber.py - v4.0
# The Hardcoded Bulette. A direct and focused web crawler.
# It starts from a comprehensive seed list and finds all unique concept pages.

import os
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

# --- Configuration ---
# A comprehensive, hardcoded list of the main DDC category pages.
SEED_URLS = [
    "https://entities.oclc.org/worldcat/ddc/E3F9hRv97HYyxWxcKvb6FFGm3y", "https://entities.oclc.org/worldcat/ddc/E3XcRgHB6R3J74DQRyxYVYXWxw",
    "https://entities.oclc.org/worldcat/ddc/E3GCD8WK4KcFRyfRFpb94w6yct", "https://entities.oclc.org/worldcat/ddc/E3PDD4QrDWRxg8RgMPm69gHYgY",
    "https://entities.oclc.org/worldcat/ddc/E3KpMY9kYqgqmMgRBwCCXMhkf7", "https://entities.oclc.org/worldcat/ddc/E3DQYC89PVXfMDGVqPCJhHcX8f",
    "https://entities.oclc.org/worldcat/ddc/E3XMCKd4QBDgfjyFKfMBRkVgfq", "https://entities.oclc.org/worldcat/ddc/E3t6XK9Pw3QCjjvkhfxPYTfBym",
    "https://entities.oclc.org/worldcat/ddc/E3yM8RgdPk6DCkvHd6CQGy8bbh", "https://entities.oclc.org/worldcat/ddc/E3x8vCCPTmRYHcgDDKHqfKDcfp",
    "https://entities.oclc.org/worldcat/ddc/E3gPHFk8bFm8tYFyqC6DDWkyYC", "https://entities.oclc.org/worldcat/ddc/E3YGK3VqR9ghCwg3kDwfrXDTJ9",
    "https://entities.oclc.org/worldcat/ddc/E3BcDhGtYGY9hMqgFYrXrVtXHv", "https://entities.oclc.org/worldcat/ddc/E36wJVYhXxFYxvDCTBQdqGgfjy",
    "https://entities.oclc.org/worldcat/ddc/E3HKkj79xG8d8fp4RTR49cqgWW", "https://entities.oclc.org/worldcat/ddc/E3qj43xgv6XRqGKmBQbg3GctbX",
    "https://entities.oclc.org/worldcat/ddc/E3hjRgRDJyKptrmrDvgxYd7pQC", "https://entities.oclc.org/worldcat/ddc/E3kyJfFJxYB8K9dfxP9V64ptk7",
    "https://entities.oclc.org/worldcat/ddc/E4cBVvCPkdcmCkrbv8WxDmQjJD", "https://entities.oclc.org/worldcat/ddc/E3hVQWDGkfFmQvYDhX8xXpTQVC",
    "https://entities.oclc.org/worldcat/ddc/E38dDG4gTWQ74FJYxxKXYy48mH", "https://entities.oclc.org/worldcat/ddc/E3QGtWm7RBHVmJyQgtqjCv8TXt",
    "https://entities.oclc.org/worldcat/ddc/E3pMv3rdwYgmBKTHmtH4PryBdM", "https://entities.oclc.org/worldcat/ddc/E3T8FjmbmgP9vw6fgggJVwjyQX",
    "https://entities.oclc.org/worldcat/ddc/E4bx3XpBC8c6mqRMJg6tvqj6Rf", "https://entities.oclc.org/worldcat/ddc/E33pB9TRT8wPbpdhyXTBjmXWY4",
    "https://entities.oclc.org/worldcat/ddc/E3fWrrTVQ7tqpKcpQ4QCyGKJJ4", "https://entities.oclc.org/worldcat/ddc/E3VCYqcy3CJcvhBjh8V4WwFTJf",
    "https://entities.oclc.org/worldcat/ddc/E46gGgKjx96p6BTwkwpPcBxH88", "https://entities.oclc.org/worldcat/ddc/E3jr8JXfYQrdPHKYR8bd4FH6vW",
    "https://entities.oclc.org/worldcat/ddc/E36rFpd6j6FkYh8qHHHBTmJbm4", "https://entities.oclc.org/worldcat/ddc/E3C3YG6rpp8PHYhthkRJ6pdCHd",
    "https://entities.oclc.org/worldcat/ddc/E34MbHd7YxgJMG3rT6dMKfX9J3", "https://entities.oclc.org/worldcat/ddc/E3xKH7c8d88d9rqWvg4hyHxgBV",
    "https://entities.oclc.org/worldcat/ddc/E3t93wfqhB4BwfQqQ63ch9YVD7", "https://entities.oclc.org/worldcat/ddc/E439MmWB9rxmcqBjf9wjK7TRry",
    "https://entities.oclc.org/worldcat/ddc/E3wxJ3BTJ68HcKRpy4MpH63b9J", "https://entities.oclc.org/worldcat/ddc/E3T3fjVhCXRjVmqhhY4MxKdqHM",
    "https://entities.oclc.org/worldcat/ddc/E3F8Bh6rc7rp3T93fHhDyJ4pQ3", "https://entities.oclc.org/worldcat/ddc/E3VhH73DvyhGqcKxHM7RqGkjmJ",
    "https://entities.oclc.org/worldcat/ddc/E43Gh6wpwVt8QhmBHgbxyfvpH8", "https://entities.oclc.org/worldcat/ddc/E499djpPht98Yy6KgYTDPKWKFK",
    "https://entities.oclc.org/worldcat/ddc/E3TxPx4G9RbWWmmKWPr7HdhfY3", "https://entities.oclc.org/worldcat/ddc/E3d9Cb8g3VYXGG8bg4gjbVgr3p",
    "https://entities.oclc.org/worldcat/ddc/E33vwXDq48F8qp4gWGfTY66yhv", "https://entities.oclc.org/worldcat/ddc/E3d4fdtMbRXJbwXFWcJ3X6r7rP",
    "https://entities.oclc.org/worldcat/ddc/E46ggD9YCP8xj9TYwQGMqjrBDV", "https://entities.oclc.org/worldcat/ddc/E3TWmb8CgMwft4mMtWrdWxXfFp",
    "https://entities.oclc.org/worldcat/ddc/E3KV8ycpCVYvD3h48hvvf494Xg", "https://entities.oclc.org/worldcat/ddc/E3vgmgRMWffYB3kftYW4MtRXkb",
    "https://entities.oclc.org/worldcat/ddc/E48vcjGQpp8fBXfwMggX3MFhyp", "https://entities.oclc.org/worldcat/ddc/E38kxrp6qgBrM4ccVMXvfxxgd8",
    "https://entities.oclc.org/worldcat/ddc/E3p36TyqKKkBBT7JQFVKdpP8F7", "https://entities.oclc.org/worldcat/ddc/E3BcdM4VtttvB9BMVt7jbFyqkT",
    "https://entities.oclc.org/worldcat/ddc/E3cTPWpVkY9GvtpdFWDdwxwXK9", "https://entities.oclc.org/worldcat/ddc/E3frMxXmrXk6rhk6gm43TXGK73",
    "https://entities.oclc.org/worldcat/ddc/E43Kj3G3gqBqRHtqyRP7QYYTym", "https://entities.oclc.org/worldcat/ddc/E3Y8bPTKWKbcTXGHvXRvyrTYW9",
    "https://entities.oclc.org/worldcat/ddc/E3QW7XC9gKJvf47FbFGBJ8XWGh", "https://entities.oclc.org/worldcat/ddc/E3BVhFwqM3CPGKKpHr7KjydvTj",
    "https://entities.oclc.org/worldcat/ddc/E3gCgKx6Mq78MHD6vtmQGtHp9r", "https://entities.oclc.org/worldcat/ddc/E3jVXD7f9YJFpxkXfyhXTQjQXV",
    "https://entities.oclc.org/worldcat/ddc/E3C4q6fDpdVfBVkwqPcmgJ8Y6G", "https://entities.oclc.org/worldcat/ddc/E3Hk8Hybm9gHCJBxYdfWRqrBbC",
    "https://entities.oclc.org/worldcat/ddc/E3Cm6Twb7HCRCP3HxytDrB8jQ9", "https://entities.oclc.org/worldcat/ddc/E3MwqmFCbPrRHjdTVvyVjHwgrx",
    "https://entities.oclc.org/worldcat/ddc/E3H4YFftgq9FK96wtTfFbdGBWT", "https://entities.oclc.org/worldcat/ddc/E36dJKkj94QmgDVpR4QY6RQRFG",
    "https://entities.oclc.org/worldcat/ddc/E33wrjJkxK6wCVGWwhQRWx9wM8", "https://entities.oclc.org/worldcat/ddc/E3y4d4gHktCbQH3fD6mmqxjxXF",
    "https://entities.oclc.org/worldcat/ddc/E3WHJrC7hmK6J6Ytq6PRCH3f7j", "https://entities.oclc.org/worldcat/ddc/E43tCxq3hT8H6gD4dVxRhjwCY9",
    "https://entities.oclc.org/worldcat/ddc/E3PK96PcYmPw6vwM4p8KxK4r3r", "https://entities.oclc.org/worldcat/ddc/E3DPJyHK66TRt3pMWHmdhCwrXK",
    "https://entities.oclc.org/worldcat/ddc/E3bkxKxQcMd8yRRFpkFMqWRkvw", "https://entities.oclc.org/worldcat/ddc/E3XJ693tPgQQM7bhtXhgWVTVbb",
    "https://entities.oclc.org/worldcat/ddc/E4cjj9FCCDTvRQhdVKmXkktBX3", "https://entities.oclc.org/worldcat/ddc/E3xyrDdqvYkypcHBGhvq7c9rDm",
    "https://entities.oclc.org/worldcat/ddc/E3mhVJmVwqGkh4TPqDyXBVX3qw", "https://entities.oclc.org/worldcat/ddc/E3jqfm7BRYBD983d9qRCJ6fDKF"
]
URL_INDEX_FILE = "oclc_concept_pages.txt"
OUTPUT_DIR = "Dewey_Concepts_JSON"
POLITE_DELAY_SECONDS = 1.0 # Shortened delay as we are more targeted

def main():
    urls_to_visit = SEED_URLS.copy()
    visited_urls = set()
    concept_page_urls = set()

    print(f"[Bulette]: Awakening. Beginning targeted crawl of {len(urls_to_visit)} seed URLs...")

    while urls_to_visit:
        current_url = urls_to_visit.pop(0)
        current_url = urljoin(current_url, urlparse(current_url).path) # Clean URL
        if current_url in visited_urls:
            continue

        print(f"[Bulette]: Burrowing into: {current_url}")
        visited_urls.add(current_url)

        try:
            response = requests.get(current_url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            for link in soup.find_all('a', href=True):
                absolute_url = urljoin(current_url, link['href'])
                
                if "oclc.org" not in urlparse(absolute_url).netloc or "login" in absolute_url or "#" in absolute_url:
                    continue
                
                clean_url = urljoin(absolute_url, urlparse(absolute_url).path)

                if "/worldcat/ddc/E" in clean_url and ".json" not in clean_url:
                    if clean_url not in concept_page_urls and clean_url not in visited_urls:
                        print(f"  [+] Adding to crawl queue: {clean_url}")
                        urls_to_visit.append(clean_url)
                        concept_page_urls.add(clean_url)
            
            time.sleep(POLITE_DELAY_SECONDS)

        except requests.RequestException as e:
            print(f"  [!] Bulette hit a rock at {current_url}: {e}")
            continue
            
    sorted_urls = sorted(list(concept_page_urls))
    with open(URL_INDEX_FILE, 'w', encoding='utf-8') as f:
        for url in sorted_urls:
            f.write(url + '\n')
            
    print(f"\n[Bulette]: Task complete. Found {len(sorted_urls)} unique concept pages.")
    print(f"Index of pages saved to '{URL_INDEX_FILE}'. Now proceeding to download.")
    
    # --- Stage 2: The Gatewarden ---
    download_concepts_from_index(sorted_urls, OUTPUT_DIR)
    
    print("\nGrubbing operation complete.")


def download_concepts_from_index(url_list, output_dir):
    """
    Stage 2: Reads the URL list, constructs the direct download link for each,
    and saves the JSON content.
    """
    print(f"\n[Gatewarden]: Beginning download of {len(url_list)} concepts...")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for url in url_list:
        try:
            print(f"[Gatewarden]: Processing page: {url}")
            # Construct the direct download URL
            json_url = url.strip() + ".jsonld?download=true"
            
            print(f"  [+] Requesting: {json_url}")
            json_response = requests.get(json_url, timeout=10)
            json_response.raise_for_status()
            json_data = json_response.json()
            
            filename = f"{json_data.get('notation', 'UNKNOWN').replace(' ', '_')}.json"
            filepath = os.path.join(output_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)
            print(f"  [+] Saved concept to '{filepath}'")

            time.sleep(POLITE_DELAY_SECONDS)
        except Exception as e:
            print(f"  [!] Gatewarden ERROR: Could not process {url}: {e}")
            continue

if __name__ == '__main__':
    main()