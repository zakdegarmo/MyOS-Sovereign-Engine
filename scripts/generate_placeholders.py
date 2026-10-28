import os
from PIL import Image, ImageDraw

# Create directories
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apps", "web", "public", "assets", "lpc")
categories = ["body", "headgear", "hair", "torso", "legs", "weapon"]

for cat in categories:
    os.makedirs(os.path.join(OUTPUT_DIR, cat), exist_ok=True)

def create_sprite(filename, category, color, shape_coords):
    """Creates a 64x64 transparent image with a shape drawn on it."""
    filepath = os.path.join(OUTPUT_DIR, category, filename)
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle(shape_coords, fill=color)
    img.save(filepath)
    print(f"Created {filepath}")

if __name__ == "__main__":
    print("Generating Placeholder Accessories...")
    # Base Body (Skin)
    create_sprite("base_human.png", "body", (255, 220, 177, 255), [20, 16, 44, 56])  # Head and body
    
    # Hair / Beards
    create_sprite("hair_brown.png", "hair", (101, 67, 33, 255), [18, 12, 46, 24]) # Hair
    create_sprite("beard_white.png", "hair", (220, 220, 220, 255), [20, 28, 44, 38]) # Beard
    create_sprite("hair_blonde.png", "hair", (250, 214, 165, 255), [18, 12, 46, 28]) # Long Hair
    
    # Torso (Shirts/Robes)
    create_sprite("shirt_red.png", "torso", (200, 30, 30, 255), [20, 26, 44, 40])
    create_sprite("robe_blue.png", "torso", (30, 30, 200, 255), [18, 26, 46, 56])
    create_sprite("suit_black.png", "torso", (40, 40, 40, 255), [18, 26, 46, 42])
    
    # Legs (Pants)
    create_sprite("pants_blue.png", "legs", (50, 50, 150, 255), [22, 40, 42, 56])
    create_sprite("skirt_red.png", "legs", (200, 30, 30, 255), [18, 40, 46, 50])
    
    # Headgear
    create_sprite("hat_wizard.png", "headgear", (100, 50, 150, 255), [16, 2, 48, 12])
    create_sprite("glasses_nerd.png", "headgear", (0, 0, 0, 255), [20, 20, 44, 24])
    create_sprite("crown_gold.png", "headgear", (255, 215, 0, 255), [18, 8, 46, 16])
    
    # Weapon
    create_sprite("sword_iron.png", "weapon", (180, 180, 180, 255), [42, 28, 50, 48])
    create_sprite("staff_wood.png", "weapon", (139, 69, 19, 255), [44, 16, 48, 56])
    create_sprite("book_magic.png", "weapon", (80, 20, 20, 255), [40, 30, 50, 40])

    print("Done!")
