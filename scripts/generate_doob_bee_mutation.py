import json
import base64
import urllib.request
import os
from PIL import Image
from rembg import remove

URL = "http://127.0.0.1:8000/api/generate"
out_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee"
os.makedirs(out_dir, exist_ok=True)

mutations = [
    {
        "id": "mutation_v1",
        "title": "Mutation 1: Faithful Fusion",
        "prompt": (
            "chibi anthropomorphic honey bee called Doob-bee, upright fuzzy capsule body standing on cute white boots, "
            "bold thick black and vibrant golden-yellow horizontal bumblebee stripes, "
            "cute chibi anime face with large expressive violet anime eyes, shiny black cowl with bee antennae, "
            "smoking a lit joint with glowing red cherry and swirling aromatic smoke, "
            "two large beautiful golden translucent iridescent bee wings on back, standing full body front view, "
            "clean solid white background, vibrant miniature collectible concept, high detail"
        ),
        "negative": "cropped, out of frame, cut off, partial body, zoomed in, close up, blurry, watermark, text, low quality, photorealistic, noise, dark background",
        "lora_scale": 0.72
    },
    {
        "id": "mutation_v2",
        "title": "Mutation 2: Hovering Flight & Smoke",
        "prompt": (
            "chibi anthropomorphic bumblebee called Doob-bee, upright fuzzy standing body with boots and bold yellow and black tiger bee stripes, "
            "expressive cute anime face with big violet purple eyes, smoking a fat joint, "
            "two oversized translucent golden wings spread wide on back buzzing, wisps of sweet smoke, "
            "standing hovering full body front view, clean solid white background, tabletop miniature cel shaded art"
        ),
        "negative": "cropped, out of frame, cut off, partial body, zoomed in, close up, blurry, watermark, text, low quality, photorealistic, noise, dark background",
        "lora_scale": 0.75
    }
]

print("Generating mutated Doob-bee hybrids on GenX backend...")

for mut in mutations:
    mid = mut["id"]
    print(f"\n--- Generating {mut['title']} ---")
    payload = {
        "prompt": mut["prompt"],
        "negative_prompt": mut["negative"],
        "guidance_scale": 7.5,
        "inference_steps": 28,
        "width": 512,
        "height": 512,
        "use_gemma": False,
        "use_lora": True,
        "lora_scale": mut["lora_scale"]
    }
    
    req = urllib.request.Request(
        URL, 
        data=json.dumps(payload).encode('utf-8'), 
        headers={'Content-Type': 'application/json'}
    )
    
    with urllib.request.urlopen(req, timeout=120) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        raw_b64 = res['image_base64']
        raw_bytes = base64.b64decode(raw_b64)
        
        raw_path = os.path.join(out_dir, f"{mid}_raw.png")
        with open(raw_path, "wb") as f:
            f.write(raw_bytes)
        print(f"Raw image saved: {raw_path}")
        
        im = Image.open(raw_path)
        im_clean = remove(im)
        clean_path = os.path.join(out_dir, f"{mid}_clean.png")
        im_clean.save(clean_path)
        print(f"Clean alpha saved: {clean_path}")

print("Mutations generated successfully!")
