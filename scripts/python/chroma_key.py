import sys
from PIL import Image
import os
import math
import argparse

def remove_background(input_path, output_path, target_color=(255, 0, 255), threshold=120):
    """
    Removes background using a color distance threshold.
    """
    if not os.path.exists(input_path):
        print(f"Error: {input_path} does not exist.")
        return

    print(f"Processing {input_path} -> {output_path}")
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    def distance(c1, c2):
        return math.sqrt(sum((a - b)**2 for a, b in zip(c1, c2)))

    newData = []
    for item in datas:
        # Calculate distance to target color
        if distance(item[:3], target_color) < threshold:
            # Match! Make it transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Chroma Key Background Removal')
    parser.add_argument('--input', type=str, help='Input file path')
    parser.add_argument('--output', type=str, help='Output file path')
    parser.add_argument('--threshold', type=int, default=180, help='Color distance threshold')
    parser.add_argument('--color', type=int, nargs=3, default=[255, 0, 255], help='RGB target color')

    args = parser.parse_args()

    # Default logic if no args for backward compat/direct run
    if not args.input:
        input_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\moon_face_magenta.png"
        output_file = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\textures\moon_face.png"
        remove_background(input_file, output_file, target_color=(255, 0, 255), threshold=180)
    else:
        remove_background(args.input, args.output, target_color=tuple(args.color), threshold=args.threshold)
