import requests
import base64
from io import BytesIO
from PIL import Image

GENX_URL = "http://127.0.0.1:8000/api/generate"
RIG_IMAGE = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\master_rig_sheet.png"

def main():
    print("Loading Master Rig Sheet...")
    rig_img = Image.open(RIG_IMAGE).convert("RGB")
    w, h = rig_img.size
    
    # Stable Diffusion requires dimensions to be multiples of 8
    w = (w // 8) * 8
    h = (h // 8) * 8
    rig_img = rig_img.resize((w, h))

    buffered = BytesIO()
    rig_img.save(buffered, format="PNG")
    c_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    prompt = "A master character spritesheet of a female Elf Druid wearing a green cloak, brown leather boots, holding a wooden staff. Pixel art game asset, pure white background."
    
    print(f"Sending Master Rig ({w}x{h}) to GenX API... This might take 30-60 seconds due to the large image resolution!")
    
    res = requests.post(GENX_URL, json={
        "prompt": prompt,
        "width": w,
        "height": h,
        "inference_steps": 25,
        "use_gemma": False,
        "controlnet_image_b64": c_b64
    })
    
    if res.status_code == 200:
        img_data = base64.b64decode(res.json()["image_base64"])
        out_img = Image.open(BytesIO(img_data)).convert("RGB")
        out_path = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\master_rig_generation_test.png"
        out_img.save(out_path)
        print(f"Success! Saved to {out_path}")
    else:
        print(f"Error: {res.text}")

if __name__ == "__main__":
    main()
