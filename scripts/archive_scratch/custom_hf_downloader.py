import os
import time
import requests

files = [
    "model_index.json",
    "scheduler/scheduler_config.json",
    "text_encoder/config.json",
    "text_encoder/model.fp16.safetensors",
    "tokenizer/merges.txt",
    "tokenizer/special_tokens_map.json",
    "tokenizer/tokenizer_config.json",
    "tokenizer/vocab.json",
    "unet/config.json",
    "unet/diffusion_pytorch_model.fp16.safetensors",
    "vae/config.json",
    "vae/diffusion_pytorch_model.fp16.safetensors"
]

base_url = "https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/"
cache_dir = os.path.join(".cache", "huggingface", "hub", "models--runwayml--stable-diffusion-v1-5", "snapshots", "451f4fe16113bff5a5d2269ed5ad43b0592e9a14")

def download_file(filename):
    url = base_url + filename
    target_path = os.path.join(cache_dir, filename)
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    
    # Check if fully downloaded
    try:
        head = requests.head(url, allow_redirects=True, timeout=10)
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
            resume_header = {}
            if os.path.exists(target_path):
                current_size = os.path.getsize(target_path)
                resume_header = {'Range': f'bytes={current_size}-'}
            
            with requests.get(url, headers=resume_header, stream=True, timeout=10) as r:
                r.raise_for_status()
                mode = 'ab' if resume_header and r.status_code == 206 else 'wb'
                with open(target_path, mode) as f:
                    for chunk in r.iter_content(chunk_size=1024*1024):
                        if chunk: f.write(chunk)
            print(f"Successfully downloaded {filename}")
            return
        except Exception as e:
            print(f"Attempt {attempt+1} failed: {str(e)[:50]}")
            time.sleep(2)
            
    print(f"Failed to download {filename}")

for f in files:
    download_file(f)
