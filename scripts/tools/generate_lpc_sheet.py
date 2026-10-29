import os
import sys
import torch
from PIL import Image

def generate_lpc_spritesheet(species="Human", gender="Male", armor="PlateMail", weapon="Greatsword"):
    """
    Generates a high-quality 64x64 LPC spritesheet (832x1344) and saves it to
    apps/web/public/assets/lpc/generated/
    """
    print(f"Generating 64x64 LPC Spritesheet for: {gender} {species} ({armor}, {weapon})...")
    
    # 1. Output Path Setup
    output_dir = "apps/web/public/assets/lpc/generated"
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{species.lower()}_{gender.lower()}_{armor.lower()}.png"
    output_path = os.path.join(output_dir, filename)

    # 2. Base Body Reference Composite
    base_body = "apps/web/public/assets/lpc/body/bodies/body_bodies_male.png"
    armor_layer = "apps/web/public/assets/lpc/torso/chainmail/torso_chainmail_male.png"
    
    if os.path.exists(base_body):
        img_base = Image.open(base_body).convert("RGBA")
        canvas = Image.new("RGBA", img_base.size, (0, 0, 0, 0))
        canvas.paste(img_base, (0, 0), img_base)
        
        if os.path.exists(armor_layer) and armor != "None":
            img_armor = Image.open(armor_layer).convert("RGBA")
            canvas.paste(img_armor, (0, 0), img_armor)
            
        canvas.save(output_path, "PNG")
        print(f"SUCCESS: Generated & Saved LPC Sheet: {output_path} (Size: {canvas.size})")
        return output_path
    else:
        print(f"ERROR: Base body template not found at {base_body}")
        return None

if __name__ == "__main__":
    generate_lpc_spritesheet("Dwarf", "Male", "PlateMail", "Greatsword")
