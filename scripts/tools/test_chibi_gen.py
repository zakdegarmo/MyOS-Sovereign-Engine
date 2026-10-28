import requests
import base64
from io import BytesIO
from PIL import Image

GENX_URL = "http://127.0.0.1:8000/api/generate"
RIG_DIR = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\custom"

def generate_frame(prompt, control_img):
    buffered = BytesIO()
    control_img.save(buffered, format="PNG")
    c_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    res = requests.post(GENX_URL, json={
        "prompt": prompt,
        "width": 512,
        "height": 512,
        "inference_steps": 25,
        "use_gemma": False,
        "controlnet_image_b64": c_b64
    })
    
    if res.status_code == 200:
        img_data = base64.b64decode(res.json()["image_base64"])
        return Image.open(BytesIO(img_data)).convert("RGB")
    else:
        print(f"Error: {res.text}")
        return None

def main():
    print("Testing the Chibi Canny Rigs through the GenX API...")
    # Notice we use the word 'chibi' in the prompt now to help the AI understand the anatomy!
    prompt = "A high quality character concept art of a chibi female Elf Druid wearing a green cloak, brown leather boots, holding a staff. Clear white background. Full body shot, pixel art style, character sheet."
    
    # 3x2 grid. Top row = our rigs. Bottom row = AI generations.
    output_grid = Image.new("RGB", (512 * 3, 512 * 2), (0,0,0))
    
    for i in range(3):
        rig_path = f"{RIG_DIR}\\canny_rig_full_frame_{i}.png"
        print(f"Loading {rig_path}...")
        rig_img = Image.open(rig_path).convert("RGB")
        
        # Paste the rig on the top row
        output_grid.paste(rig_img, (i * 512, 0))
        
        print(f"Generating AI Character for Frame {i}...")
        ai_img = generate_frame(prompt, rig_img)
        
        if ai_img:
            # Paste the generated image on the bottom row
            output_grid.paste(ai_img, (i * 512, 512))
            
    out_path = f"{RIG_DIR}\\chibi_generation_test.png"
    output_grid.save(out_path)
    print(f"\nSuccess! Saved generative test to {out_path}")

if __name__ == "__main__":
    main()
