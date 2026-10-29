import cv2
import numpy as np
from PIL import Image
import argparse

def apply_miniature_wash(img_path, output_path, wash_radius=3, wash_strength=0.6):
    print(f"Applying {wash_radius}-pixel Miniature Crevice Wash to: {img_path}")
    
    # Load RGBA image
    pil_img = Image.open(img_path).convert("RGBA")
    img = np.array(pil_img)
    
    rgb = img[:, :, :3]
    alpha = img[:, :, 3]
    
    # Convert RGB to Lab color space for perceptual color difference edge detection
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    
    # Compute Sobel gradients on L, a, b channels
    grad_x = cv2.Sobel(lab[:, :, 0], cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(lab[:, :, 0], cv2.CV_64F, 0, 1, ksize=3)
    magnitude = np.sqrt(grad_x**2 + grad_y**2)
    
    # Normalize magnitude
    magnitude = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    
    # Threshold to isolate distinct color field boundaries & deep crevices
    _, edges = cv2.threshold(magnitude, 40, 255, cv2.THRESH_BINARY)
    
    # Dilate/blur to create a smooth 3-pixel gradient wash out from the crevices
    kernel_size = wash_radius * 2 + 1
    wash_mask = cv2.GaussianBlur(edges.astype(np.float32), (kernel_size, kernel_size), wash_radius)
    
    # Normalize wash mask between 0.0 and 1.0
    wash_mask = cv2.normalize(wash_mask, None, 0.0, 1.0, cv2.NORM_MINMAX)
    
    # Apply Multiply blend mode: darken the RGB values where wash_mask is active
    rgb_float = rgb.astype(np.float32) / 255.0
    
    # Darken factor decreases color towards dark crevice shade
    darken = 1.0 - (wash_mask[:, :, np.newaxis] * wash_strength)
    washed_rgb = (rgb_float * darken * 255.0).clip(0, 255).astype(np.uint8)
    
    # Reassemble RGBA
    result_img = np.dstack((washed_rgb, alpha))
    
    Image.fromarray(result_img).save(output_path)
    print(f"Successfully saved miniature-washed sprite to: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Apply a 3-pixel miniature wash gradient to sprite sheets.")
    parser.add_argument("--input", required=True, help="Path to input PNG")
    parser.add_argument("--output", required=True, help="Path to output PNG")
    parser.add_argument("--radius", type=int, default=3, help="Wash gradient pixel radius (default: 3)")
    parser.add_argument("--strength", type=float, default=0.5, help="Wash intensity from 0.0 to 1.0 (default: 0.5)")
    args = parser.parse_args()
    
    apply_miniature_wash(args.input, args.output, args.radius, args.strength)
