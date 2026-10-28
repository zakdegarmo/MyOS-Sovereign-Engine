
from PIL import Image
import os

def clean_checkerboard(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    # Identify the colors to remove. 
    # Checkerboards in rips are often exact grays like (204, 204, 204) or similar.
    # We can also just remove anything that isn't the door colors (orange, black, wood brown).
    # But a safer way is to pick the color at (0,0) which is usually the background.
    
    bg_color = datas[0] # Take the top-left pixel color
    
    for item in datas:
        # If it matches the background color or the alternate checker color
        # In 32191.png, the checker colors seem to be fixed.
        # Let's check for common gray/white checker patterns.
        if (item[0] > 180 and item[1] > 180 and item[2] > 180) or \
           (item[0] == item[1] == item[2] and item[0] in [153, 192, 204]): # Common rip grays
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved cleaned image to {output_path}")

input_file = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\ZAMN_Assets\32191.png"
output_file = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\ZAMN_Assets\32191_clean.png"

clean_checkerboard(input_file, output_file)
