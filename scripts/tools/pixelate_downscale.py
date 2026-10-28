import os
import argparse
from PIL import Image, ImageChops

def strip_white_bg(img, tolerance=30):
    img = img.convert("RGBA")
    pixels = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            if r > 255-tolerance and g > 255-tolerance and b > 255-tolerance:
                pixels[x, y] = (255, 255, 255, 0)
    return img

def autocrop(img):
    bg = Image.new("RGBA", img.size, (0,0,0,0))
    diff = ImageChops.difference(img, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return img.crop(bbox)
    return img

def pixelate_and_downscale(input_path, output_path):
    print(f"Processing {input_path}...")
    img = Image.open(input_path).convert("RGBA")
    
    # 1. Strip white background
    img = strip_white_bg(img, tolerance=40)
    
    # 2. Autocrop the character
    img = autocrop(img)
    
    # 3. Downscale to fit within 64x64 (LPC sprite cell size)
    # Using Nearest Neighbor interpolation preserves the harsh pixel edges.
    # To avoid aliasing artifacts from high res -> low res with NEAREST,
    # we first downscale with LANCZOS to a slightly larger size, then NEAREST to final.
    img.thumbnail((64, 64), Image.Resampling.LANCZOS)
    
    # 4. Quantize to a strict 16-color palette to enforce true pixel art look
    # Convert to RGB to quantize, then back to RGBA to restore transparency mask
    alpha = img.split()[3]
    rgb_img = img.convert("RGB")
    quantized = rgb_img.quantize(colors=16, method=Image.Quantize.MEDIANCUT).convert("RGBA")
    
    # Restore alpha channel
    quantized.putalpha(alpha)
    
    # Center in a 64x64 transparent canvas
    final_cell = Image.new("RGBA", (64, 64), (0,0,0,0))
    x_off = (64 - quantized.width) // 2
    y_off = (64 - quantized.height) // 2
    final_cell.paste(quantized, (x_off, y_off), quantized)
    
    final_cell.save(output_path)
    print(f"Saved downscaled pixel sprite to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input", help="Input image")
    parser.add_argument("output", help="Output 64x64 image")
    args = parser.parse_args()
    
    pixelate_and_downscale(args.input, args.output)
