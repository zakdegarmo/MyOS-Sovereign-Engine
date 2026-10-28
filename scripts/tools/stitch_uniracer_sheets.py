"""
stitch_uniracer_sheets.py
-------------------------
Stitches the rendered animation keyframe renders into 4 beautiful visual contact sheets
and saves them directly into the brain directory for user inspection.
"""

import os
import math
from PIL import Image

brain_dir = os.path.abspath(r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e")
temp_dir = os.path.join(brain_dir, "temp_anim_renders")

def stitch_contact_sheet(image_paths, output_path, cols=None, padding=12, bg_color=(15, 15, 20, 255)):
    images = []
    for p in image_paths:
        if os.path.exists(p):
            images.append(Image.open(p).convert("RGBA"))
        else:
            print(f"Warning: File missing: {p}")
    if not images:
        print(f"No images found for {output_path}")
        return

    n = len(images)
    if cols is None:
        cols = n
    rows = math.ceil(n / cols)
    w, h = images[0].size

    total_w = cols * w + (cols + 1) * padding
    total_h = rows * h + (rows + 1) * padding
    sheet = Image.new("RGBA", (total_w, total_h), bg_color)

    for idx, img in enumerate(images):
        r = idx // cols
        c = idx % cols
        x = padding + c * (w + padding)
        y = padding + r * (h + padding)
        sheet.paste(img, (x, y), img)

    sheet.save(output_path)
    print(f"Contact sheet created: {output_path} ({total_w}x{total_h})")

def main():
    print("=== Stitching Uniracer Animation Contact Sheets ===")
    
    # 1. Rival Glance Comparison
    glance_files = [
        os.path.join(temp_dir, "glance_left.png"),
        os.path.join(temp_dir, "glance_neutral.png"),
        os.path.join(temp_dir, "glance_right.png")
    ]
    stitch_contact_sheet(glance_files, os.path.join(brain_dir, "uniracer_anim_look_rival.png"), cols=3)

    # 2. Jump Cycle Progression
    jump_files = [
        os.path.join(temp_dir, "jump_neutral.png"),
        os.path.join(temp_dir, "jump_charge.png"),
        os.path.join(temp_dir, "jump_launch.png"),
        os.path.join(temp_dir, "jump_flight.png")
    ]
    stitch_contact_sheet(jump_files, os.path.join(brain_dir, "uniracer_anim_jump_cycle.png"), cols=4)

    # 3. Wipeout Dizzy Knockout Progression
    dizzy_files = [
        os.path.join(temp_dir, "dizzy_f5.png"),
        os.path.join(temp_dir, "dizzy_f18.png"),
        os.path.join(temp_dir, "dizzy_f28.png"),
        os.path.join(temp_dir, "dizzy_f48.png")
    ]
    stitch_contact_sheet(dizzy_files, os.path.join(brain_dir, "uniracer_anim_wipeout_dizzy.png"), cols=4)

    # 4. Stunts Progression
    stunt_files = [
        os.path.join(temp_dir, "stunt_twist_180.png"),
        os.path.join(temp_dir, "stunt_flip_180.png"),
        os.path.join(temp_dir, "stunt_sprint.png")
    ]
    stitch_contact_sheet(stunt_files, os.path.join(brain_dir, "uniracer_anim_tricks.png"), cols=3)
    
    print("=== All 4 Contact Sheets Successfully Stitched! ===")

if __name__ == '__main__':
    main()
