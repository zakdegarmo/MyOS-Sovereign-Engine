import os
import base64
import requests
import json
import time

OLLAMA_URL = "http://localhost:11434/api/generate"
DATASET_DIR = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\custom\training_set"

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def call_llava(image_b64):
    prompt = """Describe this 2D pixel art character sprite sheet in detail. 
Focus strictly on the visual appearance of the character. 
Describe their gender, species (if apparent), hair style and color, clothing (shirts, pants, armor), shoes, and any weapons or accessories they are holding.
Be concise but highly descriptive. Format it as a single paragraph suitable for a Stable Diffusion prompt.
Start your description with: "A pixel art sprite sheet of a..."
"""
    payload = {
        "model": "llava:latest",
        "prompt": prompt,
        "images": [image_b64],
        "stream": False
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        response.raise_for_status()
        return response.json().get("response", "").strip()
    except Exception as e:
        print(f"Error calling LLaVA: {e}")
        return None

def main():
    if not os.path.exists(DATASET_DIR):
        print(f"Dataset dir not found: {DATASET_DIR}")
        return
        
    pngs = [f for f in os.listdir(DATASET_DIR) if f.endswith(".png")]
    print(f"Found {len(pngs)} sprites to caption.")
    
    for i, png_file in enumerate(pngs):
        png_path = os.path.join(DATASET_DIR, png_file)
        txt_path = os.path.join(DATASET_DIR, png_file.replace(".png", ".txt"))
        
        if os.path.exists(txt_path):
            print(f"[{i+1}/{len(pngs)}] Skipping {png_file} - already captioned.")
            continue
            
        print(f"[{i+1}/{len(pngs)}] Captioning {png_file}...")
        img_b64 = encode_image(png_path)
        caption = call_llava(img_b64)
        
        if caption:
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(caption)
            print(f"   Saved caption: {caption[:60]}...")
        else:
            print(f"   Failed to caption {png_file}")
            
        # Small delay to let VRAM cool
        time.sleep(1)

if __name__ == "__main__":
    main()
