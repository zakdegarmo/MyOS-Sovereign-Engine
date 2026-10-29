from PIL import Image, ImageEnhance
import os

input_path = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\meshy_knight_sheet.png"
output_path = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\meshy_knight_sheet_pixelated.png"

def apply_pixel_art_filter():
    print(f"Applying HD Pixel Art filter to {os.path.basename(input_path)}...")
    img = Image.open(input_path).convert("RGBA")
    
    # We want a "light" pixel filter. A block size of 2 or 3 pixels groups them 
    # to create that chunky retro feel while keeping the overall image the exact same physical size.
    pixel_block_size = 2 
    
    # Step 1: Shrink to force pixel grouping
    small_size = (img.width // pixel_block_size, img.height // pixel_block_size)
    small_img = img.resize(small_size, Image.Resampling.BILINEAR)
    
    # Step 2: Boost saturation to mimic 16-bit JRPG palettes (which are highly vibrant)
    color_enhancer = ImageEnhance.Color(small_img)
    small_img = color_enhancer.enhance(1.4)
    
    # Step 3: Boost contrast slightly to harden the shadows and highlights
    contrast_enhancer = ImageEnhance.Contrast(small_img)
    small_img = contrast_enhancer.enhance(1.1)
    
    # Step 4: Scale back up using NEAREST to lock in the hard, sharp pixel edges
    pixelated_img = small_img.resize(img.size, Image.Resampling.NEAREST)
    
    # Save the output
    pixelated_img.save(output_path)
    print(f"SUCCESS! Saved pixelated version to {output_path}")

if __name__ == "__main__":
    apply_pixel_art_filter()
