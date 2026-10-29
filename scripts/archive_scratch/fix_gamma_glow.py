import cv2
import numpy as np
from PIL import Image
import argparse

def fix_gamma_glow(img_path, output_path, bg_sample_pos=(10, 10), despill_factor=0.8):
    print(f"Fixing background spill and edge gamma glow on: {img_path}")
    
    pil_img = Image.open(img_path).convert("RGBA")
    img = np.array(pil_img)
    
    rgb = img[:, :, :3].astype(np.float32)
    alpha = img[:, :, 3].astype(np.float32) / 255.0
    
    # Identify semi-transparent edge pixels (the fringe zone)
    fringe_mask = (alpha > 0.05) & (alpha < 0.95)
    
    # 1. Edge Color Desaturation / Despill
    # Convert edge pixels from RGB to HSV to desaturate bright glowing fringe halos
    hsv = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    
    # Reduce saturation along semi-transparent fringe edges
    hsv[:, :, 1] = np.where(fringe_mask, hsv[:, :, 1] * (1.0 - despill_factor), hsv[:, :, 1])
    
    # Darken edge luminance slightly to blend smoothly with character outlines
    hsv[:, :, 2] = np.where(fringe_mask, hsv[:, :, 2] * 0.7, hsv[:, :, 2])
    
    fixed_rgb = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
    
    # 2. Sharpen Alpha Threshold to trim outer 1px halo fuzzy pixels
    kernel = np.ones((3, 3), np.uint8)
    alpha_uint8 = (alpha * 255.0).astype(np.uint8)
    
    # Erode alpha slightly to clip the 1px radioactive rim
    alpha_trimmed = cv2.erode(alpha_uint8, kernel, iterations=1)
    
    # Blend trimmed alpha with original soft alpha
    alpha_final = np.minimum(alpha_uint8, cv2.GaussianBlur(alpha_trimmed, (3, 3), 0))
    
    result = np.dstack((fixed_rgb, alpha_final))
    Image.fromarray(result).save(output_path)
    print(f"Successfully saved despilled sprite to: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Remove radioactive background color halos and edge spill from sprites.")
    parser.add_argument("--input", required=True, help="Input PNG path")
    parser.add_argument("--output", required=True, help="Output PNG path")
    args = parser.parse_args()
    
    fix_gamma_glow(args.input, args.output)
