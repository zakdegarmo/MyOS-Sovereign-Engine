import os
import json
import argparse
from PIL import Image, ImageOps

# Path to the unpacked CharGen textures INSIDE MyOS
TEXTURES_DIR = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\assets\chargen_data\textures"

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def apply_tint(img, hex_color):
    """Tint a greyscale sprite using a hex color while preserving alpha."""
    if not hex_color:
        return img
        
    img = img.convert("RGBA")
    r, g, b, a = img.split()
    
    # Convert image to greyscale to use as luminance
    lum = img.convert("L")
    
    # Colorize: map black to black, and white to the target hex color
    rgb_tint = hex_to_rgb(hex_color)
    colorized = ImageOps.colorize(lum, black="black", white=rgb_tint)
    
    # Re-apply the original alpha mask
    colorized = colorized.convert("RGBA")
    colorized.putalpha(a)
    return colorized

def create_character(layers, output_path):
    print("Initializing Headless Compositor...")
    canvas = Image.new("RGBA", (832, 1344), (0, 0, 0, 0))
    
    for layer in layers:
        # Check if layer is an object (with tint) or just a string
        if isinstance(layer, dict):
            layer_path_rel = layer.get("path")
            hex_color = layer.get("color")
        else:
            layer_path_rel = layer
            hex_color = None
            
        layer_path = os.path.join(TEXTURES_DIR, layer_path_rel)
        if not os.path.exists(layer_path):
            print(f"  [WARN] Layer not found, skipping: {layer_path_rel}")
            continue
            
        print(f"  + Compositing layer: {layer_path_rel} (Tint: {hex_color})")
        try:
            img = Image.open(layer_path).convert("RGBA")
            img = apply_tint(img, hex_color)
            canvas = Image.alpha_composite(canvas, img)
        except Exception as e:
            print(f"  [ERROR] Failed to load {layer_path_rel}: {e}")
            
    print(f"Saving final spritesheet to: {output_path}")
    canvas.save(output_path)
    print("Done!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("config", help="JSON string or file path containing layer configs")
    parser.add_argument("output", help="Path to save the output PNG")
    args = parser.parse_args()
    
    try:
        if os.path.exists(args.config):
            with open(args.config, 'r') as f:
                layers = json.load(f)
        else:
            layers = json.loads(args.config)
            
        create_character(layers, args.output)
    except Exception as e:
        print(f"Failed to parse config: {e}")
