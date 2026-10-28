
from PIL import Image
import os

def process_door_sheet(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # 1. Background transparency
    # The background is white (255, 255, 255).
    datas = img.getdata()
    new_data = []
    for item in datas:
        # If it's pure white or very close to it, make it transparent
        if item[0] > 250 and item[1] > 250 and item[2] > 250:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    # 2. Crop the bottom text
    # In 32191.png (314x92 approx), the door is in the top section.
    # Looking at the proportions, the door is about 64 pixels tall.
    # Let's crop to the top 64 pixels.
    # Actually, let's be safe and crop to where the text starts.
    # We'll just take the top 70% of the height.
    crop_height = int(height * 0.7)
    img = img.crop((0, 0, width, crop_height))
    
    img.save(output_path, "PNG")
    print(f"Processed image saved to {output_path}. New size: {width}x{crop_height}")

input_file = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\ZAMN_Assets\32191.png"
output_file = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\ZAMN_Assets\door_exit_clean.png"

process_door_sheet(input_file, output_file)
