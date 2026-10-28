import cv2
import numpy as np
from PIL import Image
import os
import argparse

SPRITE_SIZE = 128  # True HD LPC Standard
LPC_WIDTH = 13 * SPRITE_SIZE  # 1664
LPC_HEIGHT = 21 * SPRITE_SIZE # 2688

def p(msg):
    print(msg, flush=True)

def get_mse(img1, img2):
    err = np.sum((img1.astype("float") - img2.astype("float")) ** 2)
    err /= float(img1.shape[0] * img1.shape[1])
    return err

def apply_miniature_wash_to_frame(pil_img, wash_radius=3, wash_strength=0.5):
    img = np.array(pil_img)
    rgb = img[:, :, :3]
    alpha = img[:, :, 3]
    if not np.any(alpha): return pil_img
    
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    grad_x = cv2.Sobel(lab[:, :, 0], cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(lab[:, :, 0], cv2.CV_64F, 0, 1, ksize=3)
    magnitude = np.sqrt(grad_x**2 + grad_y**2)
    magnitude = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    
    _, edges = cv2.threshold(magnitude, 35, 255, cv2.THRESH_BINARY)
    k_size = wash_radius * 2 + 1
    wash_mask = cv2.GaussianBlur(edges.astype(np.float32), (k_size, k_size), wash_radius)
    wash_mask = cv2.normalize(wash_mask, None, 0.0, 1.0, cv2.NORM_MINMAX)
    
    rgb_float = rgb.astype(np.float32) / 255.0
    darken = 1.0 - (wash_mask[:, :, np.newaxis] * wash_strength)
    washed_rgb = (rgb_float * darken * 255.0).clip(0, 255).astype(np.uint8)
    
    return Image.fromarray(np.dstack((washed_rgb, alpha)))

def extract_perfect_loop(video_path, target_frames, apply_wash=True):
    if not os.path.exists(video_path):
        p(f"Warning: {video_path} not found.")
        return None
        
    p(f"Processing {os.path.basename(video_path)}...")
    cap = cv2.VideoCapture(video_path)
    ret, first_frame = cap.read()
    if not ret: return None
        
    # Sample from top-center to avoid black vignette corners
    bg_color = first_frame[10, first_frame.shape[1] // 2]
    lower = np.clip(bg_color - 25, 0, 255)
    upper = np.clip(bg_color + 25, 0, 255)
    
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    raw_frames = []
    tiny_frames = []
    
    while True:
        ret, frame = cap.read()
        if not ret: break
        
        mask = cv2.inRange(frame, lower, upper)
        mask_inv = cv2.bitwise_not(mask)
        
        bgra = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
        
        # Despill: Desaturate & trim radioactive background color fringe along alpha edges
        fringe_mask = (mask > 0) & (mask < 250)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:, :, 1] = np.where(fringe_mask, hsv[:, :, 1] * 0.2, hsv[:, :, 1])
        hsv[:, :, 2] = np.where(fringe_mask, hsv[:, :, 2] * 0.7, hsv[:, :, 2])
        despilled_bgr = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
        
        bgra[:, :, :3] = despilled_bgr
        bgra[:, :, 3] = mask_inv 
        raw_frames.append(bgra)
        
        tiny = cv2.resize(bgra, (64, 64), interpolation=cv2.INTER_AREA)
        tiny_frames.append(tiny)
        
    cap.release()

    if len(raw_frames) < 10: return None

    min_mse = float('inf')
    best_pair = (0, 0)
    
    for i in range(len(tiny_frames) - 10):
        search_limit = min(i + 45, len(tiny_frames))
        for j in range(i + 10, search_limit):
            mse = get_mse(tiny_frames[i], tiny_frames[j])
            if mse < min_mse:
                min_mse = mse
                best_pair = (i, j)

    start_idx, end_idx = best_pair
    loop_frames = raw_frames[start_idx:end_idx]
    
    indices = np.linspace(0, len(loop_frames)-1, target_frames, dtype=int)
    sampled = [loop_frames[idx] for idx in indices]
    
    pil_frames = [Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGRA2RGBA)) for f in sampled]
    
    # 1. CALCULATE GLOBAL BBOX ACROSS ALL SAMPLED LOOP FRAMES (TO LOCK SCALE & PREVENT HEIGHT JITTER)
    global_xmin, global_ymin = float('inf'), float('inf')
    global_xmax, global_ymax = 0, 0
    
    for f in pil_frames:
        bbox = f.getbbox()
        if bbox:
            global_xmin = min(global_xmin, bbox[0])
            global_ymin = min(global_ymin, bbox[1])
            global_xmax = max(global_xmax, bbox[2])
            global_ymax = max(global_ymax, bbox[3])
            
    if global_xmin >= global_xmax or global_ymin >= global_ymax:
        global_bbox = (0, 0, pil_frames[0].width, pil_frames[0].height)
    else:
        global_bbox = (global_xmin, global_ymin, global_xmax, global_ymax)
        
    max_w = global_bbox[2] - global_bbox[0]
    max_h = global_bbox[3] - global_bbox[1]
    
    target_max_size = SPRITE_SIZE - 24
    scale = min(target_max_size / float(max_w), target_max_size / float(max_h))
    
    processed = []
    for f in pil_frames:
        # Crop using unified global bbox so anchor & scale stay locked across all frames
        cf = f.crop(global_bbox)
        new_w = max(1, int(cf.width * scale))
        new_h = max(1, int(cf.height * scale))
        cf = cf.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Apply 3-pixel miniature wash gradient if enabled
        if apply_wash:
            cf = apply_miniature_wash_to_frame(cf, wash_radius=3, wash_strength=0.5)
            
        canvas = Image.new("RGBA", (SPRITE_SIZE, SPRITE_SIZE), (0, 0, 0, 0))
        # Center horizontally, align to bottom to lock feet
        canvas.paste(cf, ((SPRITE_SIZE - new_w) // 2, SPRITE_SIZE - new_h - 4)) 
        processed.append(canvas)
        
    return processed

def main():
    parser = argparse.ArgumentParser(description="Compile 3D Meshy videos into a Universal LPC spritesheet.")
    parser.add_argument("--name", required=True, help="Base name of the character (e.g. meshy_knight)")
    parser.add_argument("--input_dir", required=True, help="Directory containing the mp4s")
    parser.add_argument("--out_dir", required=True, help="Output directory in the engine")
    parser.add_argument("--wash", action="store_true", default=True, help="Apply 3-pixel miniature wash crevice shading")
    args = parser.parse_args()

    OUTPUT_IMG = os.path.join(args.out_dir, f"{args.name}.png")
    
    p(f"--- BUILDING TRUE LPC MASTER SHEET FOR: {args.name} ---")
    master = Image.new("RGBA", (LPC_WIDTH, LPC_HEIGHT), (0, 0, 0, 0))
    
    # Define LPC Standard Offsets: Up(0), Left(1), Down(2), Right(3)
    actions = {
        "walk": {
            "row_offset": 8, "frames": 9,
            "paths": {
                0: os.path.join(args.input_dir, f"{args.name}_walkNorth.mp4"),
                1: os.path.join(args.input_dir, f"{args.name}_walkWest.mp4"),
                2: os.path.join(args.input_dir, f"{args.name}_walkSouth.mp4"),
                3: os.path.join(args.input_dir, f"{args.name}_walkEast.mp4")
            }
        },
        "swing": {
            "row_offset": 12, "frames": 6,
            "paths": {
                0: os.path.join(args.input_dir, f"{args.name}_swingNorth.mp4"),
                1: os.path.join(args.input_dir, f"{args.name}_swingWest.mp4"),
                2: os.path.join(args.input_dir, f"{args.name}_swingSouth.mp4"),
                3: os.path.join(args.input_dir, f"{args.name}_swingEast.mp4")
            }
        }
    }
    
    for action_name, config in actions.items():
        offset = config["row_offset"]
        frame_count = config["frames"]
        for direction, path in config["paths"].items():
            if os.path.exists(path):
                frames = extract_perfect_loop(path, frame_count, apply_wash=args.wash)
                if frames:
                    target_row = offset + direction
                    for col, f in enumerate(frames):
                        master.paste(f, (col * SPRITE_SIZE, target_row * SPRITE_SIZE))
            else:
                p(f"Skipping {path} (not found)")
            
    os.makedirs(os.path.dirname(OUTPUT_IMG), exist_ok=True)
    master.save(OUTPUT_IMG)
    p(f"SUCCESS! Master LPC archetype saved natively to Engine: {OUTPUT_IMG}")

if __name__ == "__main__":
    main()
