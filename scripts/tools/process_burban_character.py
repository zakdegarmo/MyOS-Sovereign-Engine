import cv2
import numpy as np
from PIL import Image
import os
import math

video_path = r"C:\Users\zakde\Downloads\x_a_pixelart_character.mp4"
scratch_dir = r"C:\Users\zakde\.gemini\antigravity\brain\8e999d73-4ff3-40b5-a910-b6f0476803c6\scratch"
os.makedirs(scratch_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = cap.get(cv2.CAP_PROP_FPS)

print(f"Total frames: {total_frames}, FPS: {fps}")

# Sample a few frames to inspect
sample_indices = [0, 30, 60, 90, 120, 150, 180, 210]
for idx in sample_indices:
    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(os.path.join(scratch_dir, f"sample_frame_{idx}.png"), frame)

# Check corner & edge background color
cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
ret, first_frame = cap.read()
if ret:
    top_left = first_frame[10, 10]
    top_right = first_frame[10, first_frame.shape[1] - 10]
    center_top = first_frame[10, first_frame.shape[1] // 2]
    print(f"Top-Left BGR: {top_left}, Top-Right BGR: {top_right}, Center-Top BGR: {center_top}")

cap.release()
print("Sample frames saved to scratch directory.")
