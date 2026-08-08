import os
import sys
import numpy as np
from PIL import Image
from rembg import remove

def convert_to_pixel_art(image_input_path, output_path, target_size=(64, 64), palette_colors=16):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    print(f"Pixel-Art-inating: {image_input_path} -> {output_path}")
    
    try:
        raw_img = Image.open(image_input_path)
        transparent_img = remove(raw_img)
        small_img = transparent_img.resize(target_size, resample=Image.NEAREST)
        
        alpha = small_img.getchannel('A')
        rgb_img = small_img.convert('RGB').quantize(colors=palette_colors).convert('RGB')
        rgb_img.putalpha(alpha)
        
        final_pixel_art = rgb_img.resize((512, 512), resample=Image.NEAREST)
        final_pixel_art.save(output_path, "PNG")
        
        print(f"Success! Pixel-Art-inated sprite saved to: {output_path}")
        return output_path

    except Exception as e:
        print(f"Error in Pixel Art -inator: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) > 2:
        convert_to_pixel_art(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python pixel_art_inator.py <input_image_path> <output_png_path>")
