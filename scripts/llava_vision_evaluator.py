import os
import json
import base64
from io import BytesIO
from PIL import Image
import requests

OLLAMA_API_URL = "http://localhost:11434/api/generate"

def get_llava_classification(image_b64):
    prompt = """Analyze this pixel art character asset. It is a single layer of a character sprite.
Look at what the item physically is.
Is this a:
- Hat
- Hair
- Torso (Shirt, Armor, Robes)
- Legs (Pants, Skirt)
- Feet (Shoes, Boots)
- Weapon
- Face (Eyes, Nose, Ears)
- Body (Naked base body)

Reply with ONLY ONE word from this list: Hat, Hair, Torso, Legs, Feet, Weapon, Face, Body.
Do not include any other text."""

    payload = {
        "model": "llava",
        "prompt": prompt,
        "images": [image_b64],
        "stream": False
    }

    try:
        response = requests.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()
    except Exception as e:
        print(f"LLaVA Error: {e}")
        return "Unknown"

def crop_idle_frame(image_path):
    """
    LPC spritesheets are typically 832x1344. 
    The Idle/Walk Down frame is usually row 10 (index 10, y=640), column 0 (x=0).
    Frame size is 64x64.
    """
    try:
        with Image.open(image_path) as img:
            # Crop a 64x64 square (Left, Top, Right, Bottom)
            # The standard front-facing idle frame is usually x:0, y:640
            frame = img.crop((0, 640, 64, 704))
            
            # Convert to base64
            buffered = BytesIO()
            frame.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            return img_str
    except Exception as e:
        print(f"Error cropping {image_path}: {e}")
        return None

def evaluate_assets():
    base_dir = os.path.join("apps", "web", "public", "textures", "avatars", "lpc")
    out_file = os.path.join(base_dir, "ontology_manifest.json")
    
    # We will test on just 5 random files first to verify LLaVA works properly
    test_files = []
    for root, _, files in os.walk(base_dir):
        for f in files:
            if f.endswith(".png"):
                test_files.append(os.path.join(root, f))
                if len(test_files) >= 5:
                    break
        if len(test_files) >= 5:
            break
            
    print(f"Testing LLaVA visual evaluation on {len(test_files)} files...")
    
    results = {}
    for file_path in test_files:
        print(f"\nProcessing: {os.path.basename(file_path)}")
        b64_img = crop_idle_frame(file_path)
        if b64_img:
            classification = get_llava_classification(b64_img)
            print(f"-> LLaVA classified as: {classification}")
            results[file_path] = classification

if __name__ == "__main__":
    evaluate_assets()
