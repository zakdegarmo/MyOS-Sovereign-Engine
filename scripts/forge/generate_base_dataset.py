import os
import random
from PIL import Image
import uuid

LPC_ROOT = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\lpc"
OUT_DIR = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\avatars\custom\training_set"

# Standard LPC Z-index layering order
LAYERS = [
    "body",
    "eyes",
    "facial",
    "hair",
    "legs",
    "feet",
    "torso",
    "arms",
    "shoulders",
    "head",
    "weapon"
]

def get_random_png(folder_path):
    if not os.path.exists(folder_path):
        return None
    pngs = []
    for root, _, files in os.walk(folder_path):
        for f in files:
            if f.endswith(".png"):
                pngs.append(os.path.join(root, f))
    if not pngs:
        return None
    return random.choice(pngs)

def generate_sprite():
    base_img = Image.new("RGBA", (832, 1344), (0, 0, 0, 0))
    components_used = []
    
    for layer in LAYERS:
        if layer == "body":
            # Force the base body to be an actual body, not a tail or wing
            folder = os.path.join(LPC_ROOT, "body", "bodies")
        else:
            folder = os.path.join(LPC_ROOT, layer)
            
        # Skip optional layers 50% of the time, but always include body
        if layer != "body" and random.random() < 0.5:
            continue
            
        png_path = get_random_png(folder)
        if png_path:
            try:
                layer_img = Image.open(png_path).convert("RGBA")
                if layer_img.size != (832, 1344):
                    layer_img = layer_img.resize((832, 1344), Image.NEAREST)
                base_img.alpha_composite(layer_img)
                components_used.append(os.path.basename(png_path))
            except Exception as e:
                print(f"Error composing {png_path}: {e}")
                
    return base_img, components_used

def main():
    print(f"Synthesizing 100 random base sprites into {OUT_DIR}...")
    for i in range(100):
        img, comps = generate_sprite()
        sprite_id = str(uuid.uuid4())[:8]
        out_path = os.path.join(OUT_DIR, f"sprite_{sprite_id}.png")
        img.save(out_path)
        print(f"Saved {sprite_id}.png with {len(comps)} components.")

if __name__ == "__main__":
    main()
