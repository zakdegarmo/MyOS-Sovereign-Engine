"""
LPC Master Spritesheet Compiler & Perceptual Shading Engine
Downsamples 512px super-sampled multi-action cardinal renders into 128x128 True HD LPC Master Spritesheets (1664x2688).
Applies Lanczos downsampling, 3-pixel crevice miniature wash shading, edge despill, and anchor locking.
"""

import cv2
import numpy as np
from PIL import Image, ImageChops
import os
import sys
import json
import argparse

SPRITE_SIZE = 128            # True HD LPC Standard Tile
GRID_COLS = 13               # 13 columns = 1664 px
GRID_ROWS = 21               # 21 rows = 2688 px
LPC_WIDTH = GRID_COLS * SPRITE_SIZE   # 1664
LPC_HEIGHT = GRID_ROWS * SPRITE_SIZE  # 2688

# Standard LPC Row Offsets: Direction offsets are +0: North (Up), +1: West (Left), +2: South (Down), +3: East (Right)
LPC_ACTION_LAYOUT = {
    "spellcast": {"base_row": 0, "max_frames": 7},
    "thrust":    {"base_row": 4, "max_frames": 8},
    "walk":      {"base_row": 8, "max_frames": 9},
    "run":       {"base_row": 8, "max_frames": 9}, # fallback if walk not present
    "slash":     {"base_row": 12, "max_frames": 6},
    "shoot":     {"base_row": 16, "max_frames": 13},
    "hurt_dead": {"base_row": 20, "max_frames": 6} # Single row or mapped to row 20
}

DIRECTION_OFFSETS = {
    "North": 0,
    "West": 1,
    "South": 2,
    "East": 3
}

def apply_miniature_wash(pil_img, wash_radius=2, wash_strength=0.6, cel_bands=5):
    """
    Applies Cartoon Cel-Shading & Bold Ink Outlining:
    1. Extracts interior crevice edges and outer contours for dark ink lines.
    2. Quantizes color channels into discrete cel-shading bands.
    3. Boosts saturation for a vibrant, classic 16-bit cartoon look.
    """
    img = np.array(pil_img)
    if img.shape[2] < 4:
        return pil_img
        
    rgb = img[:, :, :3]
    alpha = img[:, :, 3]
    if not np.any(alpha > 10):
        return pil_img
        
    # 1. Color Enhancement & Saturation Boost
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.22, 0, 255) # +22% saturation
    
    # 2. Cel-Shading Quantization (Step quantization on Value channel)
    v = hsv[:, :, 2]
    bucket = 255.0 / max(2, cel_bands)
    v_cel = np.floor((v + bucket * 0.4) / bucket) * bucket
    hsv[:, :, 2] = np.clip(v_cel, 0, 255)
    
    cel_rgb = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
    
    # 3. Bold Ink Outline Detection (Luminance Sobel + Alpha Edge)
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    lum = lab[:, :, 0]
    
    grad_x = cv2.Sobel(lum, cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(lum, cv2.CV_64F, 0, 1, ksize=3)
    edge_mag = np.sqrt(grad_x**2 + grad_y**2)
    edge_mag = cv2.normalize(edge_mag, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    
    # Alpha silhouette contour edges
    alpha_edges = cv2.Canny(alpha, 50, 150)
    
    # Combine crevice edges + silhouette contours
    combined_edges = cv2.bitwise_or(edge_mag, alpha_edges)
    _, ink_mask = cv2.threshold(combined_edges, 40, 255, cv2.THRESH_BINARY)
    
    if wash_radius > 0:
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (wash_radius, wash_radius))
        ink_mask = cv2.dilate(ink_mask, kernel, iterations=1)
        
    ink_mask_float = (ink_mask.astype(np.float32) / 255.0)[:, :, np.newaxis]
    
    # Apply Ink: Darken crevice & outline pixels towards ink tone (RGB: 25, 20, 35)
    ink_color = np.array([25, 20, 35], dtype=np.float32)
    cel_rgb_float = cel_rgb.astype(np.float32)
    final_rgb = (cel_rgb_float * (1.0 - ink_mask_float * wash_strength) + ink_color * (ink_mask_float * wash_strength)).clip(0, 255).astype(np.uint8)
    
    return Image.fromarray(np.dstack((final_rgb, alpha)))

def despill_frame(pil_img):
    """
    Desaturates and cleans slight fringe edge halos along alpha boundary.
    """
    arr = np.array(pil_img)
    if arr.shape[2] < 4:
        return pil_img
        
    alpha = arr[:, :, 3]
    fringe = (alpha > 0) & (alpha < 240)
    
    hsv = cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2HSV).astype(np.float32)
    hsv[:, :, 1] = np.where(fringe, hsv[:, :, 1] * 0.7, hsv[:, :, 1])
    despilled = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
    
    return Image.fromarray(np.dstack((despilled, alpha)))

def compile_lpc_master_sheet(filming_dir, output_sheet_path, wash=True):
    """
    Reads 512x512 renders from filming_dir and compiles the True HD 1664x2688 Master LPC Spritesheet.
    """
    manifest_path = next((os.path.join(filming_dir, f) for f in os.listdir(filming_dir) if f.endswith("_filming_manifest.json")), None)
    
    if manifest_path and os.path.exists(manifest_path):
        with open(manifest_path, 'r') as f:
            filming_data = json.load(f)
    else:
        # Scan folder directly for rendered PNGs
        filming_data = {}
        for f in os.listdir(filming_dir):
            if f.endswith(".png"):
                parts = f.replace(".png", "").split("_")
                if len(parts) >= 4:
                    # char_action_dir_step.png
                    step = parts[-1]
                    d = parts[-2]
                    action = parts[-3]
                    if action not in filming_data: filming_data[action] = {}
                    if d not in filming_data[action]: filming_data[action][d] = []
                    filming_data[action][d].append(os.path.join(filming_dir, f))
                    
    master = Image.new("RGBA", (LPC_WIDTH, LPC_HEIGHT), (0, 0, 0, 0))
    
    # 1. Compute global bounding box across all frames to preserve anchor & prevent jitter
    all_files = []
    for act_key, dirs in filming_data.items():
        for d_key, file_list in dirs.items():
            all_files.extend(file_list)
            
    global_xmin, global_ymin = float('inf'), float('inf')
    global_xmax, global_ymax = 0, 0
    
    for fpath in all_files:
        if os.path.exists(fpath):
            img = Image.open(fpath).convert("RGBA")
            bbox = img.getbbox()
            if bbox:
                global_xmin = min(global_xmin, bbox[0])
                global_ymin = min(global_ymin, bbox[1])
                global_xmax = max(global_xmax, bbox[2])
                global_ymax = max(global_ymax, bbox[3])
                
    if global_xmin >= global_xmax or global_ymin >= global_ymax:
        global_bbox = (0, 0, 512, 512)
    else:
        # Add a 6px safety padding
        global_bbox = (
            max(0, global_xmin - 6),
            max(0, global_ymin - 6),
            min(512, global_xmax + 6),
            min(512, global_ymax + 6)
        )
        
    bbox_w = global_bbox[2] - global_bbox[0]
    bbox_h = global_bbox[3] - global_bbox[1]
    
    target_max_size = SPRITE_SIZE - 20 # 108px max character height in 128px tile
    scale = min(target_max_size / float(bbox_w), target_max_size / float(bbox_h))
    
    print(f"LPC Compiling: BBox {global_bbox} ({bbox_w}x{bbox_h}) -> Scale {scale:.4f}")

    # Process and place actions
    for action_key, layout in LPC_ACTION_LAYOUT.items():
        if action_key not in filming_data:
            continue
            
        base_row = layout["base_row"]
        max_f = layout["max_frames"]
        action_dirs = filming_data[action_key]
        
        for dir_name, dir_offset in DIRECTION_OFFSETS.items():
            if dir_name not in action_dirs:
                if action_key == "hurt_dead" and "South" in action_dirs:
                    frames_list = action_dirs["South"]
                else:
                    continue
            else:
                frames_list = action_dirs[dir_name]
                
            target_row = base_row if action_key == "hurt_dead" else base_row + dir_offset
            
            # Sort frames
            frames_list = sorted(frames_list)
            
            for col_idx, frame_path in enumerate(frames_list[:max_f]):
                if not os.path.exists(frame_path):
                    continue
                    
                frame_img = Image.open(frame_path).convert("RGBA")
                frame_img = despill_frame(frame_img)
                
                # Crop to action bounding box
                cropped = frame_img.crop(global_bbox)
                new_w = max(1, int(cropped.width * scale))
                new_h = max(1, int(cropped.height * scale))
                
                resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
                
                if wash:
                    resized = apply_miniature_wash(resized, wash_radius=3, wash_strength=0.45)
                    
                tile_canvas = Image.new("RGBA", (SPRITE_SIZE, SPRITE_SIZE), (0, 0, 0, 0))
                # Centered horizontally, anchored to floor with 4px margin
                paste_x = (SPRITE_SIZE - new_w) // 2
                paste_y = SPRITE_SIZE - new_h - 4
                tile_canvas.paste(resized, (paste_x, paste_y), resized)
                
                # Place tile onto Master Sheet
                master_x = col_idx * SPRITE_SIZE
                master_y = target_row * SPRITE_SIZE
                master.paste(tile_canvas, (master_x, master_y), tile_canvas)

    os.makedirs(os.path.dirname(os.path.abspath(output_sheet_path)), exist_ok=True)
    master.save(output_sheet_path)
    print(f"SUCCESS: True HD LPC Master Spritesheet generated -> {output_sheet_path} ({master.width}x{master.height})")
    return output_sheet_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Compile 512px renders into True HD LPC Spritesheets.")
    parser.add_argument("--filming_dir", required=True, help="Directory with rendered frame PNGs")
    parser.add_argument("--out", required=True, help="Path to save output master spritesheet PNG")
    parser.add_argument("--no_wash", action="store_true", help="Disable miniature crevice wash shading")
    args = parser.parse_args()
    
    compile_lpc_master_sheet(args.filming_dir, args.out, wash=not args.no_wash)
