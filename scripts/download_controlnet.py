import os
import time
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

files = [
    "config.json",
    "diffusion_pytorch_model.safetensors"
]

base_url = "https://hf-mirror.com/lllyasviel/sd-controlnet-canny/resolve/main/"
# Instead of hardcoding the cache dir hash, we can just save it to a local folder
# and point the pipeline there.
cache_dir = os.path.join(".cache", "huggingface", "hub", "models--lllyasviel--sd-controlnet-canny", "snapshots", "main")

def download_file(filename):
    url = base_url + filename
    target_path = os.path.join(cache_dir, filename)
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    
    # Check if fully downloaded
    try:
        head = requests.head(url, allow_redirects=True, timeout=30)
        expected_size = int(head.headers.get('Content-Length', 0))
        if os.path.exists(target_path) and os.path.getsize(target_path) == expected_size and expected_size > 0:
            print(f"Skipping {filename}, completely downloaded.")
            return
    except Exception as e:
        print(f"Could not fetch size for {filename}: {e}")
        
    print(f"Downloading {filename}...")
    
    retries = 50
    for attempt in range(retries):
        try:
            # First, get the redirect URL manually so we can intercept it
            r_head = requests.head(url, allow_redirects=False, timeout=10)
            target_url = url
            if r_head.status_code in (301, 302, 303, 307, 308):
                target_url = r_head.headers['Location']
                
            # If the CDN redirects us to a us.aws.cdn.hf.co URL, we force a specific IP
            # because 100.x IPs overlap with Tailscale VPNs
            headers = {}
            if "us.aws.cdn.hf.co" in target_url:
                target_url = target_url.replace("us.aws.cdn.hf.co", "34.230.200.86")
                headers['Host'] = "us.aws.cdn.hf.co"
                
            if os.path.exists(target_path):
                current_size = os.path.getsize(target_path)
                headers['Range'] = f'bytes={current_size}-'
            
            with requests.get(target_url, headers=headers, stream=True, timeout=30, verify=False) as r:
                r.raise_for_status()
                mode = 'ab' if 'Range' in headers and r.status_code == 206 else 'wb'
                with open(target_path, mode) as f:
                    for chunk in r.iter_content(chunk_size=1024*1024):
                        if chunk: 
                            f.write(chunk)
                            print(".", end="", flush=True)
            print(f"\nSuccessfully downloaded {filename}")
            return
        except Exception as e:
            print(f"\nAttempt {attempt+1} failed: {str(e)[:100]}")
            time.sleep(2)
            
    print(f"Failed to download {filename}")

for f in files:
    download_file(f)

print(f"\nDownload complete. Models are in {cache_dir}")
