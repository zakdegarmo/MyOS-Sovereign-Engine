import os
import glob
from PIL import Image

def process_stone(filepath):
    img = Image.open(filepath).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Flood fill background from 4 corners using BFS
    visited = set()
    queue = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)]

    def is_bg(color):
        r, g, b, a = color
        # Checkerboard colors are typically pure grays (r ~= g ~= b) with high brightness (> 170)
        # or dark gray checker squares (> 120 and abs(r-g)<15 and abs(g-b)<15)
        diff = max(abs(r - g), abs(g - b), abs(r - b))
        is_gray = diff < 15
        bright_enough = r > 120 and g > 120 and b > 120
        return is_gray and bright_enough

    while queue:
        x, y = queue.pop(0)
        if (x, y) in visited:
            continue
        visited.add((x, y))

        if x < 0 or x >= width or y < 0 or y >= height:
            continue

        current_color = pixels[x, y]
        if is_bg(current_color):
            pixels[x, y] = (0, 0, 0, 0)
            # Add 4-directional neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                    queue.append((nx, ny))

    img.save(filepath, "PNG")
    print(f"[OK] Background removed from {os.path.basename(filepath)}")

stone_files = glob.glob("apps/web/src/assets/lpc/stones*.png")
for sf in sorted(stone_files):
    process_stone(sf)
