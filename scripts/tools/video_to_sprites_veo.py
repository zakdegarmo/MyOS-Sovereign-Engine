import cv2
import numpy as np
from PIL import Image
import math
import sys
import os

input_vid = r"C:\Users\zakde\Downloads\Animate_this_D_pixel_art_char.mp4"
output_img = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\veo_druid_spritesheet.png"

def main():
    if not os.path.exists(input_vid):
        print(f"Error: Could not find video at {input_vid}")
        sys.exit(1)

    print(f"Opening video: {input_vid}")
    cap = cv2.VideoCapture(input_vid)
    frames = []
    
    # The user requested to keep ALL frames for that buttery smooth animation!
    frame_skip = 1 
    count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        if count % frame_skip == 0:
            # Convert BGR to BGRA
            bgra = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
            
            # Simple threshold for white background removal
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
            
            # Invert mask (255 where character is, 0 for background)
            mask_inv = cv2.bitwise_not(mask)
            
            # Set alpha channel to 0 where background is white
            bgra[:, :, 3] = mask_inv
            
            # Convert to PIL Image for easier cropping and stitching
            img = Image.fromarray(cv2.cvtColor(bgra, cv2.COLOR_BGRA2RGBA))
            frames.append(img)
            
        count += 1
        
    cap.release()
    
    if not frames:
        print("No frames extracted.")
        sys.exit(1)

    print(f"Extracted {len(frames)} total frames from Veo!")
    
    # Find the global bounding box so the character doesn't jitter
    max_box = [9999, 9999, 0, 0]
    for f in frames:
        bbox = f.getbbox()
        if bbox:
            max_box[0] = min(max_box[0], bbox[0])
            max_box[1] = min(max_box[1], bbox[1])
            max_box[2] = max(max_box[2], bbox[2])
            max_box[3] = max(max_box[3], bbox[3])

    if max_box == [9999, 9999, 0, 0]:
        max_box = (0, 0, frames[0].width, frames[0].height)
        
    padding = 15
    crop_box = (
        max(0, max_box[0] - padding),
        max(0, max_box[1] - padding),
        min(frames[0].width, max_box[2] + padding),
        min(frames[0].height, max_box[3] + padding)
    )
    
    print("Cropping, resizing, and centering frames...")
    # Upgrading to 256x256 sprite size to preserve the high-res details Veo likely generated
    SPRITE_SIZE = 256
    cropped_frames = []
    
    for f in frames:
        cf = f.crop(crop_box)
        cf.thumbnail((SPRITE_SIZE, SPRITE_SIZE), Image.Resampling.LANCZOS)
        
        canvas = Image.new("RGBA", (SPRITE_SIZE, SPRITE_SIZE), (0, 0, 0, 0))
        offset_x = (SPRITE_SIZE - cf.width) // 2
        offset_y = (SPRITE_SIZE - cf.height) // 2
        canvas.paste(cf, (offset_x, offset_y))
        cropped_frames.append(canvas)

    print("Stitching into sprite sheet...")
    n = len(cropped_frames)
    cols = math.ceil(math.sqrt(n))
    rows = math.ceil(n / cols)
    
    spritesheet = Image.new("RGBA", (cols * SPRITE_SIZE, rows * SPRITE_SIZE), (0, 0, 0, 0))
    
    for i, frame in enumerate(cropped_frames):
        r = i // cols
        c = i % cols
        spritesheet.paste(frame, (c * SPRITE_SIZE, r * SPRITE_SIZE))
        
    spritesheet.save(output_img)
    print(f"SUCCESS! Saved HD spritesheet to {output_img} with {n} frames.")

if __name__ == "__main__":
    main()
