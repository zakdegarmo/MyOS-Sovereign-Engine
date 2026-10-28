import os
import sys
import json
from collections import deque
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

def remove_background(img: Image.Image, color_threshold=15, min_brightness=120) -> Image.Image:
    """Flood-fills painted background grids to transparent PNG alpha."""
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()

    visited = set()
    # Start flood fill from the four corners
    queue = deque([(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)])

    def is_bg(color):
        r, g, b, a = color
        if a == 0:
            return True
        diff = max(abs(r - g), abs(g - b), abs(r - b))
        return diff <= color_threshold and r >= min_brightness and g >= min_brightness and b >= min_brightness

    while queue:
        x, y = queue.popleft()
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

def extract_islands(clean_img: Image.Image, output_dir: str, base_name: str, min_pixels=10):
    """Finds contiguous non-transparent pixel islands and extracts each to its own PNG."""
    width, height = clean_img.size
    pixels = clean_img.load()
    
    visited = set()
    islands = []
    
    for y in range(height):
        for x in range(width):
            if (x, y) not in visited and pixels[x, y][3] > 0:
                # Found a new island, run BFS
                queue = deque([(x, y)])
                island_pixels = []
                while queue:
                    cx, cy = queue.popleft()
                    if (cx, cy) in visited:
                        continue
                    visited.add((cx, cy))
                    island_pixels.append((cx, cy))
                    
                    # 8-way connectivity for safety on diagonal sprites
                    for dx in [-1, 0, 1]:
                        for dy in [-1, 0, 1]:
                            if dx == 0 and dy == 0: continue
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                                if pixels[nx, ny][3] > 0:
                                    queue.append((nx, ny))
                
                if len(island_pixels) >= min_pixels:
                    islands.append(island_pixels)
                    
    extracted_paths = []
    for i, island in enumerate(islands):
        min_x = min(p[0] for p in island)
        max_x = max(p[0] for p in island)
        min_y = min(p[1] for p in island)
        max_y = max(p[1] for p in island)
        
        # Crop to bounding box of the island
        box = (min_x, min_y, max_x + 1, max_y + 1)
        cropped = clean_img.crop(box)
        w, h = cropped.size
        
        dest_filename = f"{base_name}_obj{i+1}_{w}x{h}.png"
        dest_path = os.path.join(output_dir, dest_filename)
        cropped.save(dest_path, "PNG")
        extracted_paths.append(dest_path)
        
    return extracted_paths

def process_asset(input_filepath, output_dir):
    """
    Converts a demo sheet into perfectly cropped individual assets.
    """
    os.makedirs(output_dir, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(input_filepath))[0]

    try:
        raw_img = Image.open(input_filepath)
        print(f"Processing: {input_filepath}")
        
        clean_img = remove_background(raw_img)
        print("Background stripped. Extracting islands...")
        
        extracted_files = extract_islands(clean_img, output_dir, base_name)
        
        if not extracted_files:
            print(f"Warning: No valid objects found in {input_filepath}")
        else:
            print(f"✅ Extracted {len(extracted_files)} distinct objects to {output_dir}")
            
    except Exception as e:
        print(f"Error converting {input_filepath}: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 2:
        process_asset(sys.argv[1], sys.argv[2])
    else:
        print("LPC Island Extractor Utility")
        print("Usage: python lpc_object_extractor.py <input_file.png> <output_directory>")
