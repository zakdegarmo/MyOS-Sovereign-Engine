import os
from PIL import Image
import numpy as np

src_path = r"C:\Users\zakde\Pictures\stock-vector-the-illustration-and-vector-drawing-of-albert-einstein-s-caricature-style-full-body-portrait-with-2270265537.jpg"
out_dir = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\einstein"
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "einstein_base.png")

def remove_white_background(img_path, output_path):
    print(f"Loading {img_path}...")
    try:
        img = Image.open(img_path).convert("RGBA")
        data = np.array(img)
        
        # Extract RGB channels
        r, g, b, a = data.T
        
        # Define "white" threshold (e.g. anything above 240,240,240 is background)
        white_areas = (r > 240) & (g > 240) & (b > 240)
        
        # Turn white areas transparent
        data[..., 3][white_areas.T] = 0
        
        # Save the result
        result = Image.fromarray(data)
        result.save(output_path)
        print(f"Saved transparent Einstein base to {output_path}")
    except Exception as e:
        print(f"Failed to process image: {e}")

if __name__ == "__main__":
    if os.path.exists(src_path):
        remove_white_background(src_path, out_path)
    else:
        print(f"Source image not found at {src_path}")
