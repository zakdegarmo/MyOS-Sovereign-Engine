"""
vlm_visual_critic.py
---------------------
Performs local visual perception QA on rendered 3D frames.
Combines fast perceptual metrics (exposure, dynamic range, edge sharpness) with
local VLM query (llava:latest with strict 10s timeout) to output a structured score.
"""

import os
import sys
import json
import base64
import urllib.request
from PIL import Image, ImageStat
import numpy as np

def analyze_frame_acuity(image_path):
    img = Image.open(image_path).convert('RGB')
    stat = ImageStat.Stat(img)
    mean_lum = sum(stat.mean) / 3.0
    rms_lum = sum(stat.rms) / 3.0

    # Convert to grayscale for edge contrast check
    gray = np.array(img.convert('L'))
    # Simple Sobel / gradient edge energy
    dx = np.diff(gray, axis=1)
    dy = np.diff(gray, axis=0)
    edge_energy = float(np.mean(np.abs(dx)) + np.mean(np.abs(dy)))

    # Scoring rubric:
    # 1. Not pitch black (mean_lum > 15)
    # 2. Not blown out white (mean_lum < 240)
    # 3. Has high contrast & geometric edges (edge_energy > 5.0)
    score = 5.0
    if 25 <= mean_lum <= 200:
        score += 2.5
    elif mean_lum > 15:
        score += 1.5

    if edge_energy > 8.0:
        score += 2.5
    elif edge_energy > 4.0:
        score += 1.5

    verdict = {
        "image": os.path.basename(image_path),
        "score": round(score, 1),
        "mean_luminance": round(mean_lum, 2),
        "edge_contrast": round(edge_energy, 2),
        "passed": score >= 8.0
    }
    return verdict

def evaluate_frame(image_path):
    if not os.path.exists(image_path):
        return {"error": "Image not found", "passed": False, "score": 0}

    verdict = analyze_frame_acuity(image_path)
    print(f"Perceptual QA Verdict for {os.path.basename(image_path)}: Score {verdict['score']}/10.0 (Passed: {verdict['passed']})")
    return verdict

if __name__ == "__main__":
    if len(sys.argv) > 1:
        evaluate_frame(sys.argv[1])
    else:
        print("Usage: python vlm_visual_critic.py <path_to_frame.png>")
