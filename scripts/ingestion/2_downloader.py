import requests
import os
import urllib.parse

def download_assets():
    print("--- ZAMN Downloader (Monorepo Builder) ---")
    repo_name = input("Enter name for local monorepo folder: ")
    os.makedirs(repo_name, exist_ok=True)
    
    try:
        with open("manifest.txt", "r") as f:
            urls = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print("[!] Error: manifest.txt not found. Run Script 1 first.")
        return

    total = len(urls)
    print(f"[*] Found {total} assets to download.")

    for i, url in enumerate(urls):
        try:
            # 1. Parse URL to get clean filename
            parsed_url = urllib.parse.urlparse(url)
            filename = os.path.basename(parsed_url.path)
            
            # 2. Decode URL encoded chars (e.g. %20 -> space)
            filename = urllib.parse.unquote(filename)
            
            # 3. Sanitize filename (remove potentially dangerous chars)
            # Replacing spaces with underscores is often safer for web assets
            filename = "".join([c for c in filename if c.isalpha() or c.isdigit() or c in (' ', '.', '_', '-')]).rstrip()
            filename = filename.replace(' ', '_')

            if not filename:
                filename = f"asset_{i}.png"

            dest_path = os.path.join(repo_name, filename)

            # 4. Skip if already exists (Resumable download)
            if os.path.exists(dest_path):
                print(f"[{i+1}/{total}] Skipping {filename} (Exists)")
                continue

            print(f"[{i+1}/{total}] Downloading {filename}...")
            
            response = requests.get(url, stream=True, timeout=10)
            response.raise_for_status()

            with open(dest_path, 'wb') as img:
                for chunk in response.iter_content(chunk_size=8192):
                    img.write(chunk)
                    
        except Exception as e:
            print(f"[!] Failed to download {url}: {e}")

    print(f"\n[!] Job Complete. Assets secured in /{repo_name}")

if __name__ == "__main__":
    download_assets()
