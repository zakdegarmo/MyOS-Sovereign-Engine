import base64
import json
import urllib.request
import urllib.error
import argparse
import sys

def caption_image_with_llava(img_path):
    print(f"Loading image: {img_path}")
    try:
        with open(img_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode('utf-8')
    except Exception as e:
        print(f"Failed to read image: {e}")
        return

    url = "http://localhost:11434/api/generate"
    
    prompt = "This is a tiny piece of 2D pixel art extracted from a video game. What is it? Reply with ONLY the name of the object in 1 to 3 words. (e.g. 'tree', 'stone wall', 'wooden table')."
    
    data = {
        "model": "llava:latest",
        "prompt": prompt,
        "images": [img_b64],
        "stream": False
    }

    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    
    print("Sending to local LLaVA vision model...")
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            caption = result.get("response", "").strip()
            print(f"\n[LLaVA Response]: {caption}")
    except urllib.error.URLError as e:
        print(f"Failed to connect to Ollama. Is it running? Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test LLaVA captioning on a single pixel art image.")
    parser.add_argument("--input", required=True, help="Path to the PNG to caption")
    args = parser.parse_args()
    
    caption_image_with_llava(args.input)
