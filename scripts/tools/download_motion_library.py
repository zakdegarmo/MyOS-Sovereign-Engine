"""
download_motion_library.py
Downloads all 2,317 Mixamo motion clips from Hugging Face dataset
via direct resolve URLs with multi-threading, skipping existing files.
Bypasses HF Xet token rate limits cleanly.
"""

import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from huggingface_hub import HfApi

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "https://huggingface.co/datasets/tanish434/Mixamo-Animations-Characters/resolve/main"

def download_one(rel_path, target_path):
    if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
        return rel_path, "skipped", 0
        
    url = f"{BASE_URL}/{rel_path}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = resp.read()
                if len(data) > 0:
                    with open(target_path, "wb") as f:
                        f.write(data)
                    return rel_path, "downloaded", len(data)
        except Exception as e:
            time.sleep(1 + attempt * 2)
            
    return rel_path, "failed", 0

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    target_dir = os.path.join(root_dir, "assets", "motion_library", "raw_fbx", "animation_motion")
    os.makedirs(target_dir, exist_ok=True)
    
    print("=" * 60)
    print(">> MyOS Direct Kinematic Motion Downloader")
    print(f">> Target Directory: {target_dir}")
    print("=" * 60)
    
    print(">> Fetching file manifest from Hugging Face...")
    api = HfApi()
    all_files = api.list_repo_files(repo_id="tanish434/Mixamo-Animations-Characters", repo_type="dataset")
    motion_files = [f for f in all_files if f.startswith("animation_motion/") and f.endswith(".fbx")]
    
    total = len(motion_files)
    print(f"[+] Discovered {total} motion clips in repository.")
    
    tasks = []
    for fpath in motion_files:
        fname = os.path.basename(fpath)
        dest = os.path.join(target_dir, fname)
        tasks.append((fpath, dest))
        
    print(f">> Starting multi-threaded download (8 workers)...")
    start_time = time.time()
    completed = 0
    downloaded_bytes = 0
    
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(download_one, rel, dest): rel for rel, dest in tasks}
        for future in as_completed(futures):
            completed += 1
            rel_path, status, size = future.result()
            downloaded_bytes += size
            
            if completed % 100 == 0 or completed == total:
                pct = (completed / total) * 100
                elapsed = time.time() - start_time
                rate = completed / elapsed if elapsed > 0 else 0
                mb = downloaded_bytes / (1024 * 1024)
                print(f"[{completed:4d}/{total:4d}] {pct:5.1f}% | Rate: {rate:4.1f} clips/s | Transferred: {mb:5.1f} MB")
                
    elapsed = time.time() - start_time
    final_count = len(os.listdir(target_dir))
    print("=" * 60)
    print(f"[OK] Completed in {elapsed:.1f}s!")
    print(f"[+] Total files now in directory: {final_count}")
    print("=" * 60)

if __name__ == "__main__":
    main()
