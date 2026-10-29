import requests
import base64
from io import BytesIO
from PIL import Image

# 1. Load the LPC Base Sprite Sheet
lpc_path = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\assets\chargen_data\textures\character\body\humanoid_f1.png"
with open(lpc_path, "rb") as f:
    lpc_b64 = base64.b64encode(f.read()).decode("utf-8")

print("Sending request to GenX API with Canny ControlNet...")

# 2. Call the Local API
payload = {
    "prompt": "A highly detailed 16-bit pixel art sprite sheet of a female Elf Druid wearing a green cloak and brown leather boots, holding a staff. White background. Perfect pixel art, lpc spritesheet, 832x1344 grid, multiple animation frames, pixel art",
    "negative_prompt": "blurry, out of focus, low quality, non-pixel art, 3d, realistic",
    "width": 832,
    "height": 1344,
    "inference_steps": 25,
    "use_gemma": False, # bypass gemma for direct prompt control
    "controlnet_image_b64": lpc_b64
}

res = requests.post("http://127.0.0.1:8000/api/generate", json=payload)

if res.status_code == 200:
    print("Success! Saving generated spritesheet...")
    img_data = base64.b64decode(res.json()["image_base64"])
    img = Image.open(BytesIO(img_data))
    img.save(r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\custom\controlnet_elf_test.png")
    print("Saved to: controlnet_elf_test.png")
else:
    print(f"Error {res.status_code}: {res.text}")
