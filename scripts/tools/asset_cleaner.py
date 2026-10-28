import os
from PIL import Image
import shutil

def is_garbage(img_path):
    try:
        with Image.open(img_path) as img:
            w, h = img.size
            
            # Rule 1: Too small (junk fragments)
            if w < 16 or h < 16:
                return True, f"Too small ({w}x{h})"
            
            # Rule 2: Extreme aspect ratios (e.g. 200x5 severed shadows or weapon tips)
            if w > h * 4 or h > w * 4:
                return True, f"Extreme aspect ratio ({w}x{h})"
                
            # Rule 3: Check pixel density (if it's almost entirely transparent, it's a ghost artifact)
            # Only do this for relatively small images to save compute, or skip to save time.
            # Convert to RGBA and check alpha channel
            img_rgba = img.convert("RGBA")
            alpha = img_rgba.getchannel("A")
            # Get bounding box of non-zero alpha
            bbox = alpha.getbbox()
            if not bbox:
                return True, "Completely transparent"
                
            # If the actual content is tiny despite the image size
            content_w = bbox[2] - bbox[0]
            content_h = bbox[3] - bbox[1]
            if content_w < 12 or content_h < 12:
                return True, f"Content too small ({content_w}x{content_h})"
                
            return False, "Valid"
    except Exception as e:
        return True, f"Corrupted or unreadable: {e}"

def clean_garbage_assets(base_dir):
    print(f"Scanning {base_dir} for garbage assets...")
    deleted_count = 0
    kept_count = 0
    
    # Optional: Backup the bad ones instead of deleting permanently?
    # No, user has the original source LPC folders anyway. We can just delete the sliced ones.
    
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if not file.endswith(".png"):
                continue
                
            file_path = os.path.join(root, file)
            is_trash, reason = is_garbage(file_path)
            
            if is_trash:
                # print(f"Deleting {file}: {reason}")
                os.remove(file_path)
                deleted_count += 1
            else:
                kept_count += 1
                
    print(f"\n--- CLEANUP COMPLETE ---")
    print(f"Deleted Garbage: {deleted_count}")
    print(f"Kept Valid Assets: {kept_count}")

if __name__ == "__main__":
    base_dir = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\billboards"
    clean_garbage_assets(base_dir)
