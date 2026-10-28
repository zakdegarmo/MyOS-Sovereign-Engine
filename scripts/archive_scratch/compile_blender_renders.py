import os
import glob
import numpy as np
from PIL import Image
import cv2

SPRITE_SIZE = 128
LPC_WIDTH = 13 * SPRITE_SIZE  # 1664
LPC_HEIGHT = 21 * SPRITE_SIZE # 2688

def apply_miniature_wash(pil_img, wash_radius=2, wash_strength=0.25):
    img = np.array(pil_img)
    rgb = img[:, :, :3]
    alpha = img[:, :, 3]
    if not np.any(alpha): return pil_img
    
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    grad_x = cv2.Sobel(lab[:, :, 0], cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(lab[:, :, 0], cv2.CV_64F, 0, 1, ksize=3)
    magnitude = np.sqrt(grad_x**2 + grad_y**2)
    magnitude = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    
    _, edges = cv2.threshold(magnitude, 45, 255, cv2.THRESH_BINARY)
    k_size = wash_radius * 2 + 1
    wash_mask = cv2.GaussianBlur(edges.astype(np.float32), (k_size, k_size), wash_radius)
    wash_mask = cv2.normalize(wash_mask, None, 0.0, 1.0, cv2.NORM_MINMAX)
    
    rgb_float = rgb.astype(np.float32) / 255.0
    darken = 1.0 - (wash_mask[:, :, np.newaxis] * wash_strength)
    washed_rgb = (rgb_float * darken * 255.0).clip(0, 255).astype(np.uint8)
    
    return Image.fromarray(np.dstack((washed_rgb, alpha)))

def compile_blender_renders(input_dir, output_path, char_name):
    print(f"--- COMPILING BLENDER RENDERS FOR: {char_name} ---")
    master = Image.new("RGBA", (LPC_WIDTH, LPC_HEIGHT), (0, 0, 0, 0))
    
    # 8-Directional Row Offsets:
    # Standard LPC Rows:
    # Row 8: North (Facing Up)
    # Row 9: West (Facing Left)
    # Row 10: South (Facing Down / Camera)
    # Row 11: East (Facing Right)
    # Extended 8-Way Rows for True HD 3D synthesis:
    # Row 4: NorthWest
    # Row 5: SouthWest
    # Row 6: SouthEast
    # Row 7: NorthEast
    directions = [
        ("North", 8, "North"),
        ("West",  9, "West"),
        ("South", 10, "South"),
        ("East",  11, "East"),
        ("NorthWest", 4, "NorthWest"),
        ("SouthWest", 5, "SouthWest"),
        ("SouthEast", 6, "SouthEast"),
        ("NorthEast", 7, "NorthEast")
    ]
    
    # 1. Calculate global bounding box across ALL 32 frames for rock-solid scale anchor
    all_files = glob.glob(os.path.join(input_dir, f"{char_name}_walk*.png"))
    if not all_files:
        print(f"Error: No render files found in {input_dir}")
        return

    global_xmin, global_ymin = 512, 512
    global_xmax, global_ymax = 0, 0
    
    loaded_frames = {}
    for fpath in all_files:
        img = Image.open(fpath).convert("RGBA")
        loaded_frames[fpath] = img
        bbox = img.getbbox()
        if bbox:
            global_xmin = min(global_xmin, bbox[0])
            global_ymin = min(global_ymin, bbox[1])
            global_xmax = max(global_xmax, bbox[2])
            global_ymax = max(global_ymax, bbox[3])
            
    if global_xmax <= global_xmin or global_ymax <= global_ymin:
        global_bbox = (0, 0, 512, 512)
    else:
        global_bbox = (global_xmin, global_ymin, global_xmax, global_ymax)
        
    max_w = max(1, global_bbox[2] - global_bbox[0])
    max_h = max(1, global_bbox[3] - global_bbox[1])
    
    target_max_size = SPRITE_SIZE - 20
    scale = min(target_max_size / float(max_w), target_max_size / float(max_h))
    
    for dir_label, row_idx, render_suffix in directions:
        dir_files = sorted(glob.glob(os.path.join(input_dir, f"{char_name}_walk{render_suffix}_*.png")))
        if not dir_files:
            continue
            
        processed_frames = []
        for fpath in dir_files:
            img = loaded_frames[fpath]
            cf = img.crop(global_bbox)
            new_w = max(1, int(cf.width * scale))
            new_h = max(1, int(cf.height * scale))
            cf = cf.resize((new_w, new_h), Image.Resampling.LANCZOS)
            cf = apply_miniature_wash(cf, wash_radius=2, wash_strength=0.25)
            
            canvas = Image.new("RGBA", (SPRITE_SIZE, SPRITE_SIZE), (0, 0, 0, 0))
            canvas.paste(cf, ((SPRITE_SIZE - new_w) // 2, SPRITE_SIZE - new_h - 4))
            processed_frames.append(canvas)
            
        # Standard LPC walk row format (9 columns total):
        # Col 0: Idle frame (Frame 1)
        # Cols 1 to 8: Walk cycle (Frames 1 to 8)
        # Total = 9 columns (matches actionFrames['walk'] = 9)
        master.paste(processed_frames[0], (0, row_idx * SPRITE_SIZE))
        for step_idx, frame_canvas in enumerate(processed_frames):
            master.paste(frame_canvas, ((step_idx + 1) * SPRITE_SIZE, row_idx * SPRITE_SIZE))
            
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    master.save(output_path)
    print(f"SUCCESS! Master LPC Spritesheet compiled to: {output_path}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) >= 4:
        input_dir = sys.argv[1]
        output_path = sys.argv[2]
        char_name = sys.argv[3]
    else:
        input_dir = "C:/assets/billboards/sir_valor_blender"
        output_path = "apps/web/public/assets/lpc/body/bodies/sir_valor.png"
        char_name = "sir_valor"
        
    compile_blender_renders(input_dir, output_path, char_name)
