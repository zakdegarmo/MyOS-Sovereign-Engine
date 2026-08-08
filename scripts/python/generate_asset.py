import os
import sys
import json
import time
import requests
from io import BytesIO
from PIL import Image
from rembg import remove

COMFYUI_URL = "http://127.0.0.1:8188"
OUTPUT_DIR = "./assets/billboards"

def generate_pixel_art_asset(noun_input):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    structured_prompt = (
        f"Isolated pixel art sprite of a {noun_input}, 16-bit style, "
        f"vibrant colors, clean crisp outlines, flat solid pure white background, "
        f"no shadows, no dithering, game asset"
    )
    
    workflow_api = {
        "3": {
            "inputs": {
                "seed": int(time.time()),
                "steps": 20,
                "cfg": 7.0,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1.0,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler"
        },
        "4": {
            "inputs": {
                "model_name": "flux1-schnell.safetensors"
            },
            "class_type": "CheckpointLoaderSimple"
        },
        "5": {
            "inputs": {
                "width": 512,
                "height": 512,
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage"
        },
        "6": {
            "inputs": {
                "text": structured_prompt,
                "clip": ["4", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "7": {
            "inputs": {
                "text": "photo, realistic, 3d render, blurry, smooth, gradient background, shadows",
                "clip": ["4", 1]
            },
            "class_type": "CLIPTextEncode"
        },
        "8": {
            "inputs": {
                "samples": ["3", 0],
                "vae": ["4", 2]
            },
            "class_type": "VAEDecode"
        },
        "9": {
            "inputs": {
                "filename_prefix": f"temp_{noun_input}",
                "images": ["8", 0]
            },
            "class_type": "SaveImage"
        }
    }

    print(f"🎨 Sending prompt to local ComfyUI for noun: '{noun_input}'...")
    
    try:
        response = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow_api})
        response.raise_for_status()
        prompt_id = response.json().get("prompt_id")
        print(f"⏳ Prompt queued (ID: {prompt_id}). Polling local ComfyUI for output...")

        filename = None
        for _ in range(60):
            try:
                hist_resp = requests.get(f"{COMFYUI_URL}/history/{prompt_id}").json()
                if prompt_id in hist_resp:
                    outputs = hist_resp[prompt_id].get("outputs", {})
                    if "9" in outputs and "images" in outputs["9"]:
                        filename = outputs["9"]["images"][0]["filename"]
                        break
            except Exception:
                pass
            time.sleep(1.0)

        if not filename:
            print("⚠️ Generation timed out or image output not found in ComfyUI history.")
            return None

        img_resp = requests.get(f"{COMFYUI_URL}/view", params={"filename": filename})
        raw_image = Image.open(BytesIO(img_resp.content))
        
        print("✂️ Extracting asset boundaries and applying transparent alpha mask...")
        transparent_image = remove(raw_image)
        
        safe_filename = f"{noun_input.lower().replace(' ', '_')}.png"
        final_path = os.path.join(OUTPUT_DIR, safe_filename)
        transparent_image.save(final_path, "PNG")
        
        print(f"✅ Success! Asset saved to: {final_path}")
        return final_path

    except Exception as e:
        print(f"❌ Error communicating with local ComfyUI server: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_word = " ".join(sys.argv[1:])
    else:
        test_word = input("Enter an object, entity, or location noun: ")
    
    generate_pixel_art_asset(test_word)
