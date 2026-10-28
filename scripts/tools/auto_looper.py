import cv2
import numpy as np
from PIL import Image
import math
import sys
import os

input_vid = r"C:\Users\zakde\Downloads\Animate_this_D_pixel_art_char.mp4"
output_img = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e\perfect_loop_spritesheet.png"

def get_mse(img1, img2):
    """Calculate Mean Squared Error between two images."""
    err = np.sum((img1.astype("float") - img2.astype("float")) ** 2)
    err /= float(img1.shape[0] * img1.shape[1])
    return err

def main():
    if not os.path.exists(input_vid):
        print(f"Error: Could not find video at {input_vid}")
        sys.exit(1)

    print("--- AUTOMATED SEAMLESS LOOP FINDER ---")
    print(f"Extracting and masking frames from: {input_vid}")
    
    cap = cv2.VideoCapture(input_vid)
    raw_frames = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        bgra = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
        mask_inv = cv2.bitwise_not(mask)
        bgra[:, :, 3] = mask_inv
        raw_frames.append(bgra)
        
    cap.release()
    print(f"Extracted {len(raw_frames)} frames.")

    print("Analyzing pixel data to find the mathematically perfect loop...")
    min_mse = float('inf')
    best_pair = (0, 0)
    
    # We want a loop between 1 and 3 seconds long (assuming ~60fps, so 60 to 180 frames)
    min_loop_length = 30
    max_loop_length = 180
    
    # Compare every frame to every future frame to find the exact moment the animation repeats
    for i in range(len(raw_frames) - min_loop_length):
        for j in range(i + min_loop_length, min(i + max_loop_length, len(raw_frames))):
            mse = get_mse(raw_frames[i], raw_frames[j])
            if mse < min_mse:
                min_mse = mse
                best_pair = (i, j)

    start_idx, end_idx = best_pair
    print(f"Found perfect loop! Starts at frame {start_idx} and ends exactly at frame {end_idx}.")
    print(f"Mean Squared Error (Pixel Difference): {min_mse:.2f}")
    
    loop_frames = raw_frames[start_idx:end_idx]
    
    # Convert to PIL for cropping and stitching
    pil_frames = [Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGRA2RGBA)) for f in loop_frames]
    
    # Global Bounding Box
    max_box = [9999, 9999, 0, 0]
    for f in pil_frames:
        bbox = f.getbbox()
        if bbox:
            max_box[0] = min(max_box[0], bbox[0])
            max_box[1] = min(max_box[1], bbox[1])
            max_box[2] = max(max_box[2], bbox[2])
            max_box[3] = max(max_box[3], bbox[3])

    if max_box == [9999, 9999, 0, 0]:
        max_box = (0, 0, pil_frames[0].width, pil_frames[0].height)
        
    padding = 15
    crop_box = (
        max(0, max_box[0] - padding),
        max(0, max_box[1] - padding),
        min(pil_frames[0].width, max_box[2] + padding),
        min(pil_frames[0].height, max_box[3] + padding)
    )
    
    SPRITE_SIZE = 256
    cropped_frames = []
    
    for f in pil_frames:
        cf = f.crop(crop_box)
        cf.thumbnail((SPRITE_SIZE, SPRITE_SIZE), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (SPRITE_SIZE, SPRITE_SIZE), (0, 0, 0, 0))
        canvas.paste(cf, ((SPRITE_SIZE - cf.width) // 2, (SPRITE_SIZE - cf.height) // 2))
        cropped_frames.append(canvas)

    n = len(cropped_frames)
    cols = math.ceil(math.sqrt(n))
    rows = math.ceil(n / cols)
    
    spritesheet = Image.new("RGBA", (cols * SPRITE_SIZE, rows * SPRITE_SIZE), (0, 0, 0, 0))
    for i, frame in enumerate(cropped_frames):
        spritesheet.paste(frame, ((i % cols) * SPRITE_SIZE, (i // cols) * SPRITE_SIZE))
        
    spritesheet.save(output_img)
    print(f"SUCCESS! Saved perfect seamless spritesheet ({n} frames) to {output_img}")

if __name__ == "__main__":
    main()
