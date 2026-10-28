import os
import sys
import json
import math
import cv2
import numpy as np
from PIL import Image

CUTOUT_PATH = os.path.abspath(r"apps/web/public/actions/lunaria_cutout.png")
CONTOUR_JSON = os.path.abspath(r"apps/web/public/actions/genx_test/lunaria_contour.json")
BLENDER_SCRIPT = os.path.abspath(r"scripts/blender_build_lunaria_3d.py")
OUTPUT_ACTIONS_DIR = os.path.abspath(r"apps/web/public/actions")
BLENDER_EXE = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"

def extract_contour(image_path, out_json_path):
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError(f"Could not load image at {image_path}")
    
    h, w = img.shape[:2]
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
    else:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, alpha = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

    # Clean alpha mask
    _, thresh = cv2.threshold(alpha, 30, 255, cv2.THRESH_BINARY)
    # Remove small specks
    kernel = np.ones((3, 3), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise ValueError("No contours found in alpha channel!")

    main_contour = max(contours, key=cv2.contourArea)
    # Simplify contour slightly for clean bezier curve in Blender
    epsilon = 0.0015 * cv2.arcLength(main_contour, True)
    approx = cv2.approxPolyDP(main_contour, epsilon, True)

    pts = [[int(pt[0][0]), int(pt[0][1])] for pt in approx]
    data = {
        "width": w,
        "height": h,
        "points": pts
    }
    with open(out_json_path, "w") as f:
        json.dump(data, f)
    print(f"Extracted {len(pts)} contour points to {out_json_path}")
    return w, h, pts

if __name__ == "__main__":
    w, h, pts = extract_contour(CUTOUT_PATH, CONTOUR_JSON)
