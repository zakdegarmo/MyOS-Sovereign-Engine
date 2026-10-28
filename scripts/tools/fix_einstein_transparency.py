import os
from PIL import Image
import numpy as np

src_path = r"C:\Users\zakde\Pictures\stock-vector-the-illustration-and-vector-drawing-of-albert-einstein-s-caricature-style-full-body-portrait-with-2270265537.jpg"
out_dir = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\einstein"
out_path = os.path.join(out_dir, "einstein_base.png")

def fix_transparency(img_path, output_path):
    print(f"Fixing transparency for {img_path}...")
    try:
        img = Image.open(img_path).convert("RGBA")
        data = np.array(img)
        
        # Correctly index the RGB channels (Height, Width, 4)
        r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
        
        # More aggressive threshold for JPG artifacting
        white_mask = (r > 200) & (g > 200) & (b > 200)
        
        # Set alpha channel to 0 where mask is true
        data[:,:,3][white_mask] = 0
        
        result = Image.fromarray(data)
        result.save(output_path)
        print("Transparency fixed and saved!")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    fix_transparency(src_path, out_path)
