import os
import glob
import json
from PIL import Image

def composite_lpc_character(base_body_path, armor_path=None, hair_path=None, weapon_path=None, output_path="output.png"):
    """
    Composites LPC 64x64 layers (832x1344) into a single unified character spritesheet.
    """
    if not os.path.exists(base_body_path):
        raise FileNotFoundError(f"Base body not found: {base_body_path}")

    base = Image.open(base_body_path).convert("RGBA")
    w, h = base.size

    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.paste(base, (0, 0), base)

    # 1. Layer Armor
    if armor_path and os.path.exists(armor_path):
        armor = Image.open(armor_path).convert("RGBA")
        if armor.size == (w, h):
            canvas.paste(armor, (0, 0), armor)

    # 2. Layer Hair
    if hair_path and os.path.exists(hair_path):
        hair = Image.open(hair_path).convert("RGBA")
        if hair.size == (w, h):
            canvas.paste(hair, (0, 0), hair)

    # 3. Layer Weapon
    if weapon_path and os.path.exists(weapon_path):
        weapon = Image.open(weapon_path).convert("RGBA")
        if weapon.size == (w, h):
            canvas.paste(weapon, (0, 0), weapon)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    canvas.save(output_path, "PNG")
    print(f"Composited LPC Character Spritesheet saved to: {output_path}")

if __name__ == "__main__":
    base = "apps/web/public/assets/lpc/body/bodies/body_bodies_male.png"
    armor = "apps/web/public/assets/lpc/torso/chainmail/torso_chainmail_male.png"
    out = "apps/web/public/assets/lpc/generated/test_composite.png"
    if os.path.exists(base):
        composite_lpc_character(base, armor, output_path=out)
