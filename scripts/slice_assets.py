import os
from PIL import Image

# Output dirs
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apps", "web", "public", "assets", "lpc")

# Row mapping to categories
row_categories = [
    "aura",       # Row 1: halos/auras
    "cloaks",     # Row 2: cloaks
    "wings",      # Row 3: wings
    "legs",       # Row 4: pants/legs
    "torso",      # Row 5: light shirts
    "torso_dark", # Row 6: dark shirts
    "armor",      # Row 7: vests/armor
    "arms",       # Row 8: arms/cybernetics
    "head",       # Row 9: heads/faces
    "headgear"    # Row 10: helmets/hats
]

for cat in row_categories:
    os.makedirs(os.path.join(OUTPUT_DIR, cat), exist_ok=True)

def process_image(filepath, grid_start_x, grid_start_y, cell_w, cell_h, prefix):
    img = Image.open(filepath).convert("RGBA")
    data = img.getdata()
    
    # Replace magenta / hot pink with transparent
    new_data = []
    for item in data:
        # Check if color is close to pure magenta (255, 0, 255)
        if item[0] > 200 and item[1] < 100 and item[2] > 200:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    for row in range(10):
        for col in range(10):
            left = grid_start_x + col * cell_w
            upper = grid_start_y + row * cell_h
            right = left + cell_w
            lower = upper + cell_h
            
            cropped = img.crop((left, upper, right, lower))
            
            # Find the actual bounding box of non-transparent pixels to center it
            bbox = cropped.getbbox()
            if bbox:
                content = cropped.crop(bbox)
                # Resize keeping aspect ratio to fit inside 64x64
                content.thumbnail((64, 64), Image.Resampling.NEAREST)
                
                final_img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
                # Paste centered
                x_offset = (64 - content.width) // 2
                y_offset = (64 - content.height) // 2
                final_img.paste(content, (x_offset, y_offset))
                
                cat = row_categories[row]
                filename = f"{prefix}_{cat}_{col}.png"
                out_path = os.path.join(OUTPUT_DIR, cat, filename)
                final_img.save(out_path)
                print(f"Saved {filename}")

if __name__ == "__main__":
    # Image 1 (With labels) (1024x575)
    # Grid seems to start around x=155, y=55
    # Cell size approx (1024-155)/10 = 86.9 -> 87
    # Cell height approx (575-55)/10 = 52
    process_image(r"C:\Users\zakde\.gemini\antigravity\brain\ef1d561d-b360-401b-9ecd-82467d82bfff\media__1772336034037.png", 155, 55, 87, 52, "ai1")

    # Image 2 (No labels) (528x270)
    # Grid seems to start right at 0, 0 or close to it.
    process_image(r"C:\Users\zakde\.gemini\antigravity\brain\ef1d561d-b360-401b-9ecd-82467d82bfff\media__1772368409735.png", 0, 0, 52.8, 27, "ai2")
