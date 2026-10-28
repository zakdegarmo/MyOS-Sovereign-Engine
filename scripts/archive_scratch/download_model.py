import os
import sys
import requests
import time

MODEL_URL = "https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors"
DEST_PATH = r"C:\Users\zakde\ComfyUI\models\checkpoints\v1-5-pruned-emaonly.safetensors"

def download_model():
    os.makedirs(os.path.dirname(DEST_PATH), exist_ok=True)
    
    file_mode = 'ab'
    existing_bytes = 0
    if os.path.exists(DEST_PATH):
        existing_bytes = os.path.getsize(DEST_PATH)

    headers = {}
    if existing_bytes > 0:
        headers['Range'] = f"bytes={existing_bytes}-"
        print(f"Resuming download from byte {existing_bytes} ({existing_bytes / (1024*1024):.1f} MB)...")
    else:
        print(f"Starting fresh download of SD 1.5 checkpoint model...")

    print(f"URL: {MODEL_URL}")
    print(f"Destination: {DEST_PATH}\n")

    try:
        r = requests.get(MODEL_URL, headers=headers, stream=True, timeout=30)
        r.raise_for_status()

        total_bytes = existing_bytes
        if 'content-length' in r.headers:
            total_bytes += int(r.headers['content-length'])

        downloaded = existing_bytes
        chunk_size = 1024 * 1024 # 1 MB chunks

        with open(DEST_PATH, file_mode) as f:
            for chunk in r.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_bytes > 0:
                        pct = (downloaded / total_bytes) * 100
                        mb_done = downloaded / (1024 * 1024)
                        mb_tot = total_bytes / (1024 * 1024)
                        sys.stdout.write(f"\rProgress: {pct:.1f}% ({mb_done:.1f}/{mb_tot:.1f} MB)")
                        sys.stdout.flush()

        print("\n✅ SD 1.5 Checkpoint Model Download Complete!")
        return True

    except Exception as e:
        print(f"\n⚠️ Download encountered an error: {e}")
        print("Re-run the script to resume from where it left off.")
        return False

if __name__ == "__main__":
    download_model()
