import json
import base64
import urllib.request
import os
from PIL import Image
from rembg import remove

URL = "http://127.0.0.1:8000/api/generate"
out_dir = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\gritty_crew"
os.makedirs(out_dir, exist_ok=True)

characters = [
    {
        "id": "doob_bee_gritty",
        "title": "Gritty Doob-bee (Underground Comix / Adult Swim)",
        "prompt": (
            "gritty adult cartoon character design of Doob-bee, an exhausted scruffy anthropomorphic bumblebee, "
            "underground comix art style, Ralph Bakshi, Adult Swim smiling friends aesthetic, "
            "bloodshot red veined sleepy eyes with heavy dark bags, crooked bent antennae, "
            "frayed tattered translucent wings with vein lines, scruffy matted yellow and black striped fur with cigarette ash, "
            "smoking a thick crinkled hand-rolled blunt with glowing fiery cherry ember and ash flakes, "
            "scuffed worn work boots, crooked smirk, standing full body front view, "
            "clean solid white background, bold jagged ink lines, high contrast"
        ),
        "negative": "cute, chibi, baby, toddler, disney, smooth 3d, clean, pastel, innocent, photorealistic, noise, dark background, blurry",
        "lora_scale": 0.65
    },
    {
        "id": "frank_squirrel",
        "title": "Frank Gallagher Squirrel (Shameless / Scummy Kingpin)",
        "prompt": (
            "gritty adult cartoon character design of Frank Gallagher as a dirty scruffy red squirrel, "
            "underground comix art style, smiling friends, Robert Crumb, adult animated sitcom, "
            "wearing stained ratty green army jacket with torn collar and patches, "
            "bloodshot yellowed tired eyes with heavy purple bags, scruffy 5 o'clock shadow stubble, crooked snaggletooth grin, "
            "ragged messy bushy tail, clutching a crushed beer can and smoking a roach joint, "
            "scruffy unwashed fur, standing full body front view, "
            "clean solid white background, bold jagged ink comic lines"
        ),
        "negative": "cute, chibi, baby, toddler, disney, clean, polished, 3d render, smooth, innocent, dark background, blurry",
        "lora_scale": 0.65
    }
]

print("Starting Gritty Adult Swim Generation on GenX...")

for char in characters:
    cid = char["id"]
    print(f"\n--- Generating {char['title']} ---")
    payload = {
        "prompt": char["prompt"],
        "negative_prompt": char["negative"],
        "guidance_scale": 7.8,
        "inference_steps": 30,
        "width": 512,
        "height": 512,
        "use_gemma": False,
        "use_lora": True,
        "lora_scale": char["lora_scale"]
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
        
        im = Image.open(raw_path)
        im_clean = remove(im)
        clean_path = os.path.join(out_dir, f"{cid}_clean.png")
        im_clean.save(clean_path)
        print(f"Clean alpha saved: {clean_path}")

print("Both gritty adult characters generated successfully!")
