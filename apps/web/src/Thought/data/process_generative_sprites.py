import os
from PIL import Image

def process_sprites():
    brain_dir = r"C:\Users\zakde\.gemini\antigravity\brain\d3f47d63-e91a-418e-922d-9e794c94ebcb"
    output_dir = r"c:\Users\zakde\.gemini\antigravity\scratch\MyOS\apps\web\public\textures\avatars"
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Pillar Names
    pillars = [
        "omnipotence", "self", "thought", "logic", "unity", 
        "existence", "improvement", "mastery", "resonance", "transcendence"
    ]

    # Map Pillar Index to Filename patterns in brain dir
    # Using the IDs from the generate_image tool calls
    files = {
        0: "pillar_0_omnipotence_spritesheet_png_1772172978051.png",
        1: "pillar_1_self_spritesheet_png_1772172926039.png",
        2: "pillar_2_thought_spritesheet_png_1772172989939.png",
        3: "pillar_3_logic_spritesheet_png_1772173023389.png",
        4: "pillar_4_unity_spritesheet_png_1772173036153.png",
        5: "pillar_5_existence_spritesheet_png_1772173047717.png",
        6: "pillar_6_improvement_spritesheet_png_1772173080332.png",
        7: "pillar_7_mastery_spritesheet_png_1772173089894.png",
        8: "pillar_8_resonance_spritesheet_png_1772173102256.png",
        9: "pillar_9_transcendence_spritesheet_png_1772173114139.png"
    }

    green_bg = (0, 255, 0)
    
    # AI generated images are usually 1024x1024 or similar.
    # We want to ensure each frame in the 3x4 grid is perfectly aligned.
    # We'll repack them into a strict grid.
    
    target_frame_size = 256 # High resolution frames
    final_sheet_w = target_frame_size * 3
    final_sheet_h = target_frame_size * 4

    for idx, filename in files.items():
        pillar_name = pillars[idx]
        src_path = os.path.join(brain_dir, filename)
        
        if not os.path.exists(src_path):
            print(f"Skipping {pillar_name}: {src_path} not found.")
            continue

        print(f"Processing {pillar_name}...")
        img = Image.open(src_path).convert("RGBA")
        w, h = img.size
        
        # Slicing logic for 3x4 grid
        col_w = w / 3
        row_h = h / 4
        
        final_sheet = Image.new("RGBA", (final_sheet_w, final_sheet_h), (0, 0, 0, 0))
        
        for r in range(4):
            for c in range(3):
                # Crop source frame
                left = c * col_w
                top = r * row_h
                right = (c + 1) * col_w
                bottom = (r + 1) * row_h
                
                frame = img.crop((left, top, right, bottom))
                
                # 10% Safe-Zone Crop to eliminate neighbor bleed
                sw, sh = frame.size
                margin_w = sw * 0.1
                margin_h = sh * 0.1
                frame = frame.crop((margin_w, margin_h, sw - margin_w, sh - margin_h))
                
                # Resize to target
                frame = frame.resize((target_frame_size, target_frame_size), Image.Resampling.LANCZOS)
                
                # Agressive Chroma Keying
                data = frame.getdata()
                new_data = []
                for item in data:
                    r_val, g_val, b_val, a_val = item
                    # distance to pure green OR just "is very green"
                    is_green = g_val > 100 and g_val > r_val * 1.2 and g_val > b_val * 1.2
                    if is_green:
                        new_data.append((0, 0, 0, 0))
                    else:
                        new_data.append(item)
                frame.putdata(new_data)
                
                # Paste into final sheet
                final_sheet.paste(frame, (c * target_frame_size, r * target_frame_size), frame)
        
        dest_path = os.path.join(output_dir, f"{pillar_name}.png")
        final_sheet.save(dest_path, "PNG")
        print(f"Saved {dest_path}")

if __name__ == "__main__":
    process_sprites()
