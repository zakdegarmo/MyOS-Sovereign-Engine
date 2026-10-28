import requests
import base64
import os
import argparse
from io import BytesIO
from PIL import Image, ImageChops

GENX_URL = "http://127.0.0.1:8000/api/generate"
LPC_BASE_PATH = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\assets\chargen_data\textures\character\body\humanoid_f1.png"

# Define the LPC grid layout mapping. 
# Row Index : (Direction, Action)
LPC_ROWS = {
    8: ("facing up (view from behind)", "walking, right foot forward"),
    9: ("facing left profile view", "walking, right foot forward"),
    10: ("facing front", "walking, right foot forward"),
    11: ("facing right profile view", "walking, right foot forward")
}

def strip_white_bg(img, tolerance=40):
    img = img.convert("RGBA")
    pixels = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            if r > 255-tolerance and g > 255-tolerance and b > 255-tolerance:
                pixels[x, y] = (255, 255, 255, 0)
    return img

def autocrop(img):
    bg = Image.new("RGBA", img.size, (0,0,0,0))
    diff = ImageChops.difference(img, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return img.crop(bbox)
    return img

def generate_frame(direction, character_desc, control_img):
    """Call GenX API to generate the single frame with ControlNet."""
    prompt = f"A classic 16-bit JRPG fantasy character, {direction}. {character_desc}. Pixel art style, full body shot, centered, clear details. No background, solid white background."
    print(f"  -> Prompting: {prompt[:80]}...")
    
    # Convert control image to base64
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
        return Image.open(BytesIO(img_data)).convert("RGBA")
    else:
        print(f"  -> Error: {res.text}")
        return None

def process_frame(img):
    """Strip background and shrink to 64x64."""
    img = strip_white_bg(img)
    img = autocrop(img)
    img.thumbnail((64, 64), Image.Resampling.LANCZOS)
    
    alpha = img.split()[3]
    rgb_img = img.convert("RGB")
    quantized = rgb_img.quantize(colors=16, method=Image.Quantize.MEDIANCUT).convert("RGBA")
    quantized.putalpha(alpha)
    
    cell = Image.new("RGBA", (64, 64), (0,0,0,0))
    x_off = (64 - quantized.width) // 2
    y_off = (64 - quantized.height) // 2
    cell.paste(quantized, (x_off, y_off), quantized)
    return cell

def main(character_desc, output_path):
    print(f"Starting LPC ControlNet Forgeworks for: '{character_desc}'")
    sheet = Image.new("RGBA", (832, 1344), (0,0,0,0))
    
    lpc_base = Image.open(LPC_BASE_PATH).convert("RGBA")
    
    # Walk Down is Row 10
    target_row = 10
    direction, _ = LPC_ROWS[target_row]
    
    for col in range(9):
        print(f"\nGenerating Row {target_row}, Col {col}...")
        
        # Crop the exact 64x64 LPC frame
        crop_box = (col * 64, target_row * 64, (col + 1) * 64, (target_row + 1) * 64)
        lpc_frame = lpc_base.crop(crop_box)
        
        # Scale up to 512x512 using Nearest Neighbor to keep blocky pixel skeleton
        control_skeleton = lpc_frame.resize((512, 512), Image.Resampling.NEAREST)
        
        raw_img = generate_frame(direction, character_desc, control_skeleton)
        
        if raw_img:
            processed_sprite = process_frame(raw_img)
            sheet.paste(processed_sprite, (col * 64, target_row * 64), processed_sprite)
            print(f"  -> Stitched to ({col*64}, {target_row*64})")
    
    sheet.save(output_path)
    print(f"\nForgeworks complete! Saved walking animation strip to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("description", help="Character description")
    parser.add_argument("output", help="Path to output spritesheet PNG")
    args = parser.parse_args()
    main(args.description, args.output)
