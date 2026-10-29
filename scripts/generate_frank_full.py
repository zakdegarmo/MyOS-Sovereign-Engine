import json, base64, urllib.request, os
from PIL import Image
from rembg import remove

URL = "http://127.0.0.1:8000/api/generate"
out_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\gritty_crew"

payload = {
    "prompt": (
        "full body shot head to toe, Frank Gallagher as a scruffy dirty anthropomorphic red squirrel, "
        "Robert Crumb underground comix art style, Ralph Bakshi, adult cartoon, "
        "wearing oversized ratty stained green army field jacket, dirty jeans, scuffed boots, "
        "scruffy unkempt hair, bloodshot eyes with purple bags, crooked cigarette in mouth with smoke, "
        "ragged bushy squirrel tail, standing full body front view, centered, "
        "clean solid white background, bold graphic ink comic art"
    ),
    "negative_prompt": "cropped, out of frame, headshot, bust, close up, partial body, cute, baby, 3d render, photorealistic, noise, dark background",
    "guidance_scale": 8.0,
    "inference_steps": 30,
    "width": 512,
    "height": 512,
    "use_gemma": False,
    "use_lora": True,
    "lora_scale": 0.65
}

req = urllib.request.Request(URL, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req, timeout=120) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    raw_b64 = res['image_base64']
    raw_path = os.path.join(out_dir, "frank_full_raw.png")
    with open(raw_path, "wb") as f:
        f.write(base64.b64decode(raw_b64))
    
    clean = remove(Image.open(raw_path))
    clean_path = os.path.join(out_dir, "frank_full_clean.png")
    clean.save(clean_path)
    print("Full body Frank saved successfully!")
