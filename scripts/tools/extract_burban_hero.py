import cv2
import numpy as np
from PIL import Image
import os

video_path = r"C:\Users\zakde\Downloads\x_a_pixelart_character.mp4"
out_asset_dir = r"C:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\assets\lpc"
scratch_dir = r"C:\Users\zakde\.gemini\antigravity\brain\8e999d73-4ff3-40b5-a910-b6f0476803c6\scratch"

cap = cv2.VideoCapture(video_path)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

all_frames = []

for idx in range(total_frames):
    ret, frame = cap.read()
    if not ret: break

    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    lower_green = np.array([32, 35, 35])
    upper_green = np.array([90, 255, 255])
    green_mask = cv2.inRange(hsv, lower_green, upper_green)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    green_mask = cv2.morphologyEx(green_mask, cv2.MORPH_CLOSE, kernel)

    char_mask = cv2.bitwise_not(green_mask)

    # Restrict to character bounding area
    mask_roi = np.zeros_like(char_mask)
    mask_roi[110:650, 430:950] = 255
    char_mask = cv2.bitwise_and(char_mask, mask_roi)

    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(char_mask, connectivity=8)
    clean_mask = np.zeros_like(char_mask)
    for l in range(1, num_labels):
        if stats[l, cv2.CC_STAT_AREA] > 400: # Only keep main character body
            clean_mask[labels == l] = 255

    bgra = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
    bgra[:, :, 3] = clean_mask

    pil_img = Image.fromarray(cv2.cvtColor(bgra, cv2.COLOR_BGRA2RGBA))
    bbox = pil_img.getbbox()
    if bbox and (bbox[2] - bbox[0] > 40) and (bbox[3] - bbox[1] > 80):
        cropped = pil_img.crop(bbox)
        # 128x128 standard
        thumb = cropped.copy()
        thumb.thumbnail((120, 120), Image.Resampling.NEAREST)
        canvas = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        canvas.paste(thumb, ((128 - thumb.width) // 2, 128 - thumb.height - 2), thumb)
        all_frames.append((idx, canvas))

cap.release()
print(f"Total processed frames: {len(all_frames)}")

# Find optimal keyframe subsets
# Front Walk (around frames 210-239)
front_frames = [all_frames[i][1] for i in [215, 222, 230, 238] if i < len(all_frames)]
if len(front_frames) < 4:
    front_frames = [all_frames[-4:][j][1] for j in range(4)]

# Back Walk (around frames 150-190)
back_frames = [all_frames[i][1] for i in [155, 165, 175, 185] if i < len(all_frames)]
if len(back_frames) < 4:
    back_frames = [all_frames[min(len(all_frames)-1, 160 + j*8)][1] for j in range(4)]

# Right Walk & Shoot (around frames 10-90)
right_frames = [all_frames[i][1] for i in [10, 30, 50, 70] if i < len(all_frames)]
left_frames = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in right_frames]

# 4x4 Spritesheet
SPRITE_SIZE = 128
master = Image.new("RGBA", (4 * SPRITE_SIZE, 4 * SPRITE_SIZE), (0, 0, 0, 0))

# Row 0: Front Walk (Down)
for c in range(4):
    master.paste(front_frames[c % len(front_frames)], (c * SPRITE_SIZE, 0 * SPRITE_SIZE))

# Row 1: Left Walk
for c in range(4):
    master.paste(left_frames[c % len(left_frames)], (c * SPRITE_SIZE, 1 * SPRITE_SIZE))

# Row 2: Right Walk
for c in range(4):
    master.paste(right_frames[c % len(right_frames)], (c * SPRITE_SIZE, 2 * SPRITE_SIZE))

# Row 3: Back Walk (Up)
for c in range(4):
    master.paste(back_frames[c % len(back_frames)], (c * SPRITE_SIZE, 3 * SPRITE_SIZE))

out_file = os.path.join(out_asset_dir, "burban_hero.png")
master.save(out_file)
scratch_file = os.path.join(scratch_dir, "burban_hero_final.png")
master.save(scratch_file)
print(f"Exported perfection to {out_file}")
