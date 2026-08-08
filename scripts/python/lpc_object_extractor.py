import os
import sys
import json
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

def remove_background(img: Image.Image, color_threshold=15, min_brightness=120) -> Image.Image:
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()

    visited = set()
    queue = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]

    def is_bg(color):
        r, g, b, a = color
        if a == 0:
            return True
        diff = max(abs(r - g), abs(g - b), abs(r - b))
        return diff <= color_threshold and r >= min_brightness and g >= min_brightness and b >= min_brightness

    while queue:
        x, y = queue.pop(0)
        if (x, y) in visited or x < 0 or x >= width or y < 0 or y >= height:
            continue
        visited.add((x, y))

        if is_bg(pixels[x, y]):
            pixels[x, y] = (0, 0, 0, 0)
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    queue.append((nx, ny))

    return img

def convert_single_asset(input_filepath, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(input_filepath))[0]

    try:
        raw_img = Image.open(input_filepath)
        clean_img = remove_background(raw_img)
        bbox = clean_img.getbbox()
        if not bbox:
            print(f"Skipping {input_filepath}: Empty image.")
            return None

        cropped = clean_img.crop(bbox)
        w, h = cropped.size

        dest_filename = f"{base_name}_clean_{w}x{h}.png"
        dest_path = os.path.join(output_dir, dest_filename)
        cropped.save(dest_path, "PNG")

        print(f"Extracted clean asset: {dest_path}")
        return dest_path
    except Exception as e:
        print(f"Error converting {input_filepath}: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) > 2:
        convert_single_asset(sys.argv[1], sys.argv[2])
    else:
        print("Selective Asset Extractor Utility")
        print("Usage: python lpc_object_extractor.py <input_file.png> <output_directory>")
