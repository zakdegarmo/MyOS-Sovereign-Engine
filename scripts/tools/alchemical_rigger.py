import os
from PIL import Image, ImageDraw

# Use the exact user-uploaded image as the base matter
INPUT_IMAGE = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\.user_uploaded\media_1787116769617.png"
OUTPUT_IMAGE = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\master_rig_sheet.png"

def process_cell(cell_img):
    """
    Nigredo: Strip away the dead matter of the pixels.
    Albedo: Draw the purified white lines of the skeleton.
    """
    pixels = cell_img.load()
    w, h = cell_img.size
    
    # Identify non-transparent matter
    active_pixels = []
    for y in range(h):
        for x in range(w):
            if pixels[x, y][3] > 0:
                active_pixels.append((x, y))
                
    # If the cell is empty void, return void
    rig_canvas = Image.new("RGB", (w, h), (0, 0, 0))
    if not active_pixels:
        return rig_canvas
        
    draw = ImageDraw.Draw(rig_canvas)
    
    # Establish bounding box of the physical form
    min_x = min(p[0] for p in active_pixels)
    max_x = max(p[0] for p in active_pixels)
    min_y = min(p[1] for p in active_pixels)
    max_y = max(p[1] for p in active_pixels)
    
    # Center of mass approximation for the Head
    top_pixels = [p for p in active_pixels if p[1] < min_y + 14]
    if not top_pixels: top_pixels = active_pixels
    head_x = sum(p[0] for p in top_pixels) // len(top_pixels)
    head_y = min_y + 11
    
    # 1. Head (The Crown)
    draw.ellipse([head_x-9, head_y-9, head_x+9, head_y+9], outline=(255, 255, 255), width=1)
    
    # 2. Spine (The Pillar)
    neck = (head_x, head_y + 9)
    pelvis = (head_x, max_y - 12)
    draw.line([neck, pelvis], fill=(255, 255, 255), width=1)
    
    # 3. Feet (The Foundation)
    bottom_pixels = [p for p in active_pixels if p[1] > max_y - 10]
    left_foot_pixels = [p for p in bottom_pixels if p[0] < head_x]
    right_foot_pixels = [p for p in bottom_pixels if p[0] >= head_x]
    
    # Anchor to the lowest points
    l_foot = (sum(p[0] for p in left_foot_pixels)//len(left_foot_pixels), max_y-2) if left_foot_pixels else (head_x-6, max_y-2)
    r_foot = (sum(p[0] for p in right_foot_pixels)//len(right_foot_pixels), max_y-2) if right_foot_pixels else (head_x+6, max_y-2)
    
    draw.line([pelvis, l_foot], fill=(255, 255, 255), width=1)
    draw.line([pelvis, r_foot], fill=(255, 255, 255), width=1)
    
    # 4. Arms (The Branches) - Find the furthest extents between neck and pelvis
    mid_pixels = [p for p in active_pixels if neck[1] < p[1] < pelvis[1] + 5]
    if mid_pixels:
        l_hand = min(mid_pixels, key=lambda p: p[0])
        r_hand = max(mid_pixels, key=lambda p: p[0])
        
        # Shoulders
        l_sho = (head_x - 7, neck[1] + 2)
        r_sho = (head_x + 7, neck[1] + 2)
        
        draw.line([neck, l_sho], fill=(255, 255, 255), width=1)
        draw.line([neck, r_sho], fill=(255, 255, 255), width=1)
        
        draw.line([l_sho, l_hand], fill=(255, 255, 255), width=1)
        draw.line([r_sho, r_hand], fill=(255, 255, 255), width=1)
        
        # Hand markers
        draw.ellipse([l_hand[0]-2, l_hand[1]-2, l_hand[0]+2, l_hand[1]+2], outline=(255, 255, 255), width=1)
        draw.ellipse([r_hand[0]-2, r_hand[1]-2, r_hand[0]+2, r_hand[1]+2], outline=(255, 255, 255), width=1)
        
    # Foot markers
    draw.ellipse([l_foot[0]-3, l_foot[1]-1, l_foot[0]+3, l_foot[1]+1], outline=(255, 255, 255), width=1)
    draw.ellipse([r_foot[0]-3, r_foot[1]-1, r_foot[0]+3, r_foot[1]+1], outline=(255, 255, 255), width=1)
    
    return rig_canvas

def synthesize():
    print("Initiating Alchemical Synthesis (Master Rig Sheet)...")
    img = Image.open(INPUT_IMAGE).convert("RGBA")
    w, h = img.size
    
    # The Rubedo: The final Master Rig Canvas
    master_rig = Image.new("RGB", (w, h), (0, 0, 0))
    
    # LPC grid is 64x64
    cols = w // 64
    rows = h // 64
    
    print(f"Processing Grid: {cols}x{rows}...")
    
    for r in range(rows):
        for c in range(cols):
            box = (c * 64, r * 64, (c + 1) * 64, (r + 1) * 64)
            cell = img.crop(box)
            
            rigged_cell = process_cell(cell)
            master_rig.paste(rigged_cell, box)
            
    master_rig.save(OUTPUT_IMAGE)
    print(f"Rubedo Complete. Philosopher's Stone saved to {OUTPUT_IMAGE}")

if __name__ == "__main__":
    synthesize()
