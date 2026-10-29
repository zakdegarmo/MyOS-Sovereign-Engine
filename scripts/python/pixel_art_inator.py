import os
import sys
import glob
from PIL import Image
from rembg import remove

def convert_to_pixel_art(image_input_path, output_path, target_size=(64, 64), palette_colors=16):
    """
    Converts a single image into clean 16-bit palette-matched pixel art with transparent alpha background.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    try:
        raw_img = Image.open(image_input_path)
        transparent_img = remove(raw_img)
        small_img = transparent_img.resize(target_size, resample=Image.BILINEAR)
        
        alpha = small_img.getchannel('A')
        # Hard threshold alpha to remove fuzzy edges
        alpha = alpha.point(lambda p: 255 if p > 128 else 0)
        # Quantize with NO dithering for clean, flat cartoon colors
        rgb_img = small_img.convert('RGB').quantize(colors=palette_colors, dither=0).convert('RGB')
        rgb_img.putalpha(alpha)
        
        final_pixel_art = rgb_img.resize((512, 512), resample=Image.NEAREST)
        final_pixel_art.save(output_path, "PNG")
        return output_path
    except Exception as e:
        print(f"❌ Error processing {image_input_path}: {e}")
        return None

def batch_process_folder(input_folder, output_folder, target_size=(64, 64), palette_colors=16):
    """
    Batch processes an entire directory of images into transparent pixel art sprites.
    """
    os.makedirs(output_folder, exist_ok=True)
    valid_extensions = ('*.png', '*.jpg', '*.jpeg', '*.webp', '*.bmp')
    image_files = []
    for ext in valid_extensions:
        image_files.extend(glob.glob(os.path.join(input_folder, ext)))
        image_files.extend(glob.glob(os.path.join(input_folder, ext.upper())))

    if not image_files:
        print(f"⚠️ No image files found in input folder: {input_folder}")
        return

    print(f"🚀 Batch processing {len(image_files)} images from '{input_folder}' to '{output_folder}'...")

    successful = 0
    for idx, filepath in enumerate(image_files, 1):
        filename = os.path.splitext(os.path.basename(filepath))[0]
        out_path = os.path.join(output_folder, f"{filename}_pixelart.png")
        print(f"[{idx}/{len(image_files)}] Processing: {os.path.basename(filepath)} -> {os.path.basename(out_path)}")
        res = convert_to_pixel_art(filepath, out_path, target_size, palette_colors)
        if res:
            successful += 1

    print(f"✅ Batch complete! Successfully processed {successful}/{len(image_files)} sprites saved to '{output_folder}'.")

if __name__ == "__main__":
    if len(sys.argv) > 2:
        in_path = sys.argv[1]
        out_path = sys.argv[2]
        if os.path.isdir(in_path):
            batch_process_folder(in_path, out_path)
        else:
            convert_to_pixel_art(in_path, out_path)
    else:
        print("Usage:")
        print(" Single File: python pixel_art_inator.py <input_file.jpg> <output_file.png>")
        print(" Batch Folder: python pixel_art_inator.py <input_folder_path> <output_folder_path>")
