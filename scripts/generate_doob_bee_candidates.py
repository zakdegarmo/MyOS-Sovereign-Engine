import json
import base64
import urllib.request
import os
import sys
from PIL import Image
from rembg import remove

URL = "http://127.0.0.1:8000/api/generate"
out_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\doob_bee"
os.makedirs(out_dir, exist_ok=True)

candidates = [
    {
        "id": "candidate_a",
        "title": "Candidate A: The Classic Aviator Doob-bee",
        "prompt": (
            "chibi anthropomorphic cute fuzzy bumblebee called Doob-bee, yellow and black striped fuzzy body, "
            "wearing tiny brass aviator goggles pushed up on forehead, big cute cartoon eyes, smiling mouth with tongue out, "
            "smoking a fat joint with gentle glowing ember and tiny spiral smoke trail, "
            "translucent buzzing bee wings, tiny fuzzy arms and legs, standing full body front view, "
            "clean solid white background, vibrant miniature figurine concept art, sharp focus"
        ),
        "negative": "cropped, out of frame, cut off, partial body, zoomed in, close up, blurry, watermark, text, low quality, photorealistic, noise, dark background",
        "lora_scale": 0.75
    },
    {
        "id": "candidate_b",
        "title": "Candidate B: The Rasta Chill Doob-bee",
        "prompt": (
            "chibi anthropomorphic fuzzy honey bee, wearing tiny knit striped rasta beanie hat, relaxed red sleepy eyes, "
            "smoking a herbal rolled joint with sweet wispy smoke, big translucent wings, round chubby striped abdomen, "
            "peace sign hand gesture, standing hovering full body front view, "
            "clean solid white background, stylized cartoon character design, high detail"
        ),
        "negative": "cropped, out of frame, cut off, partial body, zoomed in, close up, blurry, watermark, text, low quality, realism, dark background",
        "lora_scale": 0.70
    },
    {
        "id": "candidate_c",
        "title": "Candidate C: The Botanist Honey-Dripper Doob-bee",
        "prompt": (
            "chibi anthropomorphic honey bee with honey dipped antennae, wearing little green canvas botanical vest, "
            "big expressive anime eyes, holding a smoking herbal joint in one hand and honey wand in other, "
            "iridescent shimmering fairy wings, black and golden yellow stripes, full body character concept, "
            "clean solid white background, collectible tabletop miniature style, vibrant lighting"
        ),
        "negative": "cropped, out of frame, cut off, partial body, zoomed in, close up, blurry, watermark, text, low quality, realism, dark background",
        "lora_scale": 0.75
    }
]

print("Starting A/B/C Generation on local GenX backend...")

for cand in candidates:
    cid = cand["id"]
    print(f"\n--- Generating {cand['title']} ---")
    payload = {
        "prompt": cand["prompt"],
        "negative_prompt": cand["negative"],
        "guidance_scale": 7.5,
        "inference_steps": 28,
        "width": 512,
        "height": 512,
        "use_gemma": False,
        "use_lora": True,
        "lora_scale": cand["lora_scale"]
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
        
        raw_path = os.path.join(out_dir, f"{cid}_raw.png")
        with open(raw_path, "wb") as f:
            f.write(raw_bytes)
        print(f"Raw image saved: {raw_path}")
        
        # Strip background with rembg
        im = Image.open(raw_path)
        im_clean = remove(im)
        clean_path = os.path.join(out_dir, f"{cid}_clean.png")
        im_clean.save(clean_path)
        print(f"Clean alpha saved: {clean_path}")

print("\nAll 3 candidates generated and alpha-isolated successfully!")
