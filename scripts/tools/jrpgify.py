import os
import argparse
from PIL import Image, ImageChops, ImageEnhance

# --- LPC Spritesheet Specs ---
# LPC Grid is 13 columns by 21 rows. Each cell is 64x64. Total size 832x1344.
# Row 8: Walk Up
# Row 9: Walk Left
# Row 10: Walk Down (Front)
# Row 11: Walk Right

def autocrop(img):
    """Crop away transparent edges."""
    bg = Image.new("RGBA", img.size, (0,0,0,0))
    diff = ImageChops.difference(img, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return img.crop(bbox)
    return img

def create_lpc_spritesheet(input_path, output_path):
    print(f"Loading {input_path}...")
    try:
        base_img = Image.open(input_path).convert("RGBA")
    except Exception as e:
        print(f"Failed to load image: {e}")
        return
    
    # 1. Autocrop the transparent background
    base_img = autocrop(base_img)
    
    # 2. Resize to fit within a 64x64 cell. 
    base_img.thumbnail((64, 60), Image.Resampling.LANCZOS)
    
    # Center it in a 64x64 canvas
    cell = Image.new("RGBA", (64, 64), (0,0,0,0))
    x_offset = (64 - base_img.width) // 2
    y_offset = (64 - base_img.height) // 2
    cell.paste(base_img, (x_offset, y_offset), base_img)

    # Flip for left/right
    cell_flipped = cell.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    
    # Create the massive blank 832x1344 canvas
    sheet = Image.new("RGBA", (832, 1344), (0,0,0,0))
    
    def paste_frame(frame_img, col, row):
        sheet.paste(frame_img, (col * 64, row * 64), frame_img)
        
    def bob_frame(img, amount_y):
        b = Image.new("RGBA", (64, 64), (0,0,0,0))
        b.paste(img, (0, amount_y), img)
        return b
        
    def tilt_frame(img, angle):
        return img.rotate(angle, resample=Image.Resampling.BICUBIC, expand=False)
        
    def squish_frame(img, scale_y):
        new_h = int(64 * scale_y)
        sq = img.resize((64, new_h), Image.Resampling.LANCZOS)
        b = Image.new("RGBA", (64, 64), (0,0,0,0))
        b.paste(sq, (0, 64 - new_h), sq)
        return b

    print("Generating programmatic frames...")

    # --- WALKING ANIMATIONS (Rows 8 to 11) ---
    bob_pattern = [0, -2, -4, -2, 0, 2, 4, 2, 0]
    tilt_pattern = [0, 5, 10, 5, 0, -5, -10, -5, 0]

    for col in range(9):
        # Walk Down (Row 10)
        paste_frame(bob_frame(cell, bob_pattern[col]), col, 10)
        
        # Walk Up (Row 8) - Darken front face to fake a back face
        darkener = ImageEnhance.Brightness(cell)
        back_cell = darkener.enhance(0.4)
        paste_frame(bob_frame(back_cell, bob_pattern[col]), col, 8)
        
        # Walk Left (Row 9)
        paste_frame(tilt_frame(cell_flipped, tilt_pattern[col]), col, 9)
        
        # Walk Right (Row 11)
        paste_frame(tilt_frame(cell, tilt_pattern[col]), col, 11)
        
    # --- SPELLCAST ANIMATIONS (Rows 0 to 3) ---
    for col in range(7):
        stretch = 1.0 + (col * 0.05) 
        frame_cast = squish_frame(cell, stretch)
        paste_frame(frame_cast, col, 2)  # Cast Down
        
        darkener = ImageEnhance.Brightness(frame_cast)
        paste_frame(darkener.enhance(0.4), col, 0) # Cast Up
        paste_frame(tilt_frame(frame_cast.transpose(Image.Transpose.FLIP_LEFT_RIGHT), 10), col, 1) # Cast Left
        paste_frame(tilt_frame(frame_cast, -10), col, 3) # Cast Right

    # --- SLASH ANIMATIONS (Rows 12 to 15) ---
    lunge_pattern = [0, 5, 10, 15, 10, 0]
    for col in range(6):
        # Slash Down
        paste_frame(bob_frame(cell, lunge_pattern[col]), col, 14)
        
        # Slash Up
        darkener = ImageEnhance.Brightness(cell)
        back_cell = darkener.enhance(0.4)
        paste_frame(bob_frame(back_cell, -lunge_pattern[col]), col, 12)
        
        # Slash Right
        lunge_img = Image.new("RGBA", (64, 64), (0,0,0,0))
        lunge_img.paste(cell, (lunge_pattern[col], 0), cell)
        paste_frame(lunge_img, col, 15)
        
        # Slash Left
        lunge_img_left = Image.new("RGBA", (64, 64), (0,0,0,0))
        lunge_img_left.paste(cell_flipped, (-lunge_pattern[col], 0), cell_flipped)
        paste_frame(lunge_img_left, col, 13)

    sheet.save(output_path)
    print(f"Success! LPC Spritesheet saved to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input", help="Path to single static PNG image")
    parser.add_argument("output", help="Path to output spritesheet PNG")
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print("Input file not found.")
    else:
        create_lpc_spritesheet(args.input, args.output)
