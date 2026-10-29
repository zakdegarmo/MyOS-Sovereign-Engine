import os
import sys
import argparse
from pathlib import Path

# Path configurations
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / ".cache" / "huggingface"
OUTPUT_DIR = BASE_DIR / "apps" / "web" / "public" / "assets" / "billboards" / "jit_assets"
os.environ["HF_HOME"] = str(MODELS_DIR)
os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "0"  # Disable rust backend to ensure resume works

MODEL_ID = "runwayml/stable-diffusion-v1-5"

def bootstrap():
    print("[BOOTSTRAP] Bootstrapping Sovereign Image Generator...")
    print(f"Downloading model '{MODEL_ID}' (FP16 variant) to {MODELS_DIR}")
    print("This will download in chunks and is fully resumable if your connection drops.")
    
    import torch
    from diffusers import StableDiffusionPipeline
    from huggingface_hub import snapshot_download
    
    # Download the pipeline with robust infinite retries, single-threaded so it saves chunks
    import time
    max_retries = 50
    for attempt in range(max_retries):
        try:
            # Pre-download the files sequentially (max_workers=1) so it doesn't drop chunks
            snapshot_download(
                repo_id=MODEL_ID,
                revision="fp16",
                resume_download=True,
                max_workers=1
            )
            break # Success!
        except Exception as e:
            print(f"[WARNING] Connection dropped (Attempt {attempt+1}/{max_retries}). Retrying in 5 seconds...")
            time.sleep(5)
            
    print("[SUCCESS] Bootstrap complete! Model is downloaded and ready for offline use.")

def generate_sprite(prompt, output_name):
    import torch
    from diffusers import StableDiffusionPipeline
    from rembg import remove
    from PIL import Image

    print(f"[GENERATE] Generating sprite for: {prompt}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Clean output name
    safe_name = output_name.lower().replace(" ", "_")
    if not safe_name.endswith(".png"):
        safe_name += ".png"
    out_path = OUTPUT_DIR / safe_name
    
    # Load pipeline (strictly offline)
    try:
        pipe = StableDiffusionPipeline.from_pretrained(
            MODEL_ID, 
            torch_dtype=torch.float16, 
            variant="fp16",
            local_files_only=True
        )
    except Exception as e:
        print("Model not found locally. Please run with --bootstrap first.", e)
        sys.exit(1)
        
    pipe = pipe.to("cuda")
    
    full_prompt = f"16-bit pixel art sprite of {prompt}, retro SNES RPG style, simple, 2d, flat, isolated on pure solid white background, centered, clean pixel art"
    neg_prompt = "realistic, 3d render, photograph, blurry, noisy, complex background, shadow, text, watermark, modern, highly detailed"
    
    print("[INFERENCE] Running inference on GPU...")
    image = pipe(
        prompt=full_prompt, 
        negative_prompt=neg_prompt,
        num_inference_steps=25,
        guidance_scale=7.5
    ).images[0]
    
    # Remove background
    print("[PROCESS] Removing background...")
    try:
        image = remove(image)
    except Exception as e:
        print(f"Warning: Failed to remove background: {e}")
    
    # Save
    image.save(out_path)
    print(f"[SUCCESS] Asset saved to: {out_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bootstrap", action="store_true", help="Download the models for offline use")
    parser.add_argument("prompt", nargs="?", type=str, help="What to generate")
    args = parser.parse_args()
    
    if args.bootstrap:
        bootstrap()
    elif args.prompt:
        generate_sprite(args.prompt, args.prompt)
    else:
        print("Please provide a prompt or use --bootstrap")
