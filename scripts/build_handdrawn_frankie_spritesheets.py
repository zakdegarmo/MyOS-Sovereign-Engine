import os
import shutil
import cv2
import numpy as np
from PIL import Image

ARTIFACT_DIR = r"C:\Users\zakde\.gemini\antigravity\brain\5d778f69-db13-4232-9d87-80fc4f0ece4e"
BASE_DIR = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions\hemp_crew"
PUBLIC_ACTIONS_DIR = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\public\actions"
DIST_ACTIONS_DIR = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\dist\actions"

SPRITE_SIZE = 128
SHEET_WIDTH = SPRITE_SIZE * 8   # 1024 px
SHEET_HEIGHT = SPRITE_SIZE * 4  # 512 px
ATLAS_HEIGHT = SPRITE_SIZE * 8  # 1024 px

def safe_floodfill(img_bgr, tol=10, is_head=False, is_walk=False):
    """
    Cleanly converts solid white background to transparent alpha without bleeding into character.
    Seeds strictly from perimeter white pixels so it never breaches dark outlines.
    Safely clears enclosed pockets near ears without touching eyes, teeth, or facial highlights.
    """
    h, w = img_bgr.shape[:2]
    mask = np.zeros((h + 2, w + 2), np.uint8)
    
    def seed_if_white(sx, sy):
        val = img_bgr[sy, sx]
        if np.min(val) > 210:
            cv2.floodFill(img_bgr, mask, (sx, sy), (255, 255, 255), (tol, tol, tol), (tol, tol, tol),
                          flags=4 | (255 << 8) | cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE)

    # 1. Outer perimeter seeds
    for sx in range(w):
        seed_if_white(sx, 0)
        seed_if_white(sx, h - 1)
    for sy in range(h):
        seed_if_white(0, sy)
        seed_if_white(w - 1, sy)

    # 2. Ear pocket seeds
    if is_head:
        # Left ear pocket (under floppy ear)
        for py in range(35, min(h, 95)):
            for px in range(15, min(w, 70)):
                if np.min(img_bgr[py, px]) > 220:
                    seed_if_white(px, py)
        # Right ear notch
        for py in range(0, min(h, 60)):
            for px in range(max(0, int(w * 0.7)), w):
                if np.min(img_bgr[py, px]) > 220:
                    seed_if_white(px, py)

    if is_walk:
        # Pockets between ears and head top for walk frames
        for py in range(int(h * 0.05), int(h * 0.35)):
            for px in range(int(w * 0.1), int(w * 0.3)):
                if np.min(img_bgr[py, px]) > 220:
                    seed_if_white(px, py)
            for px in range(int(w * 0.65), int(w * 0.9)):
                if np.min(img_bgr[py, px]) > 220:
                    seed_if_white(px, py)

    bg = mask[1:h + 1, 1:w + 1] == 255
    rgba = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2BGRA)
    rgba[bg, 3] = 0
    return Image.fromarray(cv2.cvtColor(rgba, cv2.COLOR_BGRA2RGBA))

def fit_to_tile(im_rgba, target_size=128, pad_bottom=6):
    """Fits an RGBA sprite into a centered 128x128 tile with proper footing."""
    bbox = im_rgba.getbbox()
    if not bbox:
        return Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    
    cropped = im_rgba.crop(bbox)
    cw, ch = cropped.size
    
    max_h = target_size - pad_bottom - 6 # ~116px
    max_w = target_size - 8             # ~120px
    scale = min(max_w / cw, max_h / ch)
    
    nw = int(round(cw * scale))
    nh = int(round(ch * scale))
    scaled = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    
    tile = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    px = (target_size - nw) // 2
    py = target_size - pad_bottom - nh
    tile.paste(scaled, (px, py), scaled)
    return tile

print("=== 1. LOADING MASTER SOURCE ASSETS ===")
standing_path   = os.path.join(ARTIFACT_DIR, "frankie_handdrawn_standing_1788930929898.jpg")
viseme_path     = os.path.join(ARTIFACT_DIR, "frankie_viseme_sheet_1788930949054.jpg")
turn_path       = os.path.join(ARTIFACT_DIR, "frankie_turnaround_sheet_1788930966947.jpg")
walk_side_path  = os.path.join(ARTIFACT_DIR, "frankie_walk_sheet_1788930983409.jpg")
walk_front_path = os.path.join(ARTIFACT_DIR, "frankie_walk_front_sheet_1788931910428.jpg")
walk_back_path  = os.path.join(ARTIFACT_DIR, "frankie_walk_back_sheet_1788992847922.jpg")

# Master Standing Body with safe alpha
standing_bgr = cv2.imread(standing_path)
sh, sw = standing_bgr.shape[:2]
standing_rgba = safe_floodfill(standing_bgr, tol=10)
standing_arr = np.array(standing_rgba)

# Precise head polygon erasure on standing body so tail (x >= 530), hand/joint (x <= 210),
# and suit lapels (y >= 365) remain 100% intact with ZERO ghosting underneath new visemes.
face_poly = np.array([
    [215, 60],
    [240, 20],
    [520, 20],
    [525, 250],
    [520, 340],
    [450, 360],
    [370, 365],
    [290, 360],
    [220, 335],
    [210, 250],
    [210, 100]
], dtype=np.int32)
head_mask = np.zeros((sh, sw), dtype=np.uint8)
cv2.fillPoly(head_mask, [face_poly], 255)
standing_arr[head_mask == 255, 3] = 0
body_clean = Image.fromarray(standing_arr)

# Cardinal Turnaround Tiles
turn_bgr = cv2.imread(turn_path)
# Clean back view crop without edge artifacts
north_crop = turn_bgr[50:760, 730:985]
north_rgba = safe_floodfill(north_crop, tol=10, is_walk=True)

# Turnaround Column 1 is facing EAST (Right). Trim x to 715 to eliminate edge artifact sliver.
east_crop = turn_bgr[50:760, 450:715]
east_rgba = safe_floodfill(east_crop, tol=10, is_walk=True)
# Flip East to get West (Facing Left)
west_rgba = east_rgba.transpose(Image.FLIP_LEFT_RIGHT)

tile_north = fit_to_tile(north_rgba, SPRITE_SIZE, pad_bottom=8)
tile_west  = fit_to_tile(west_rgba,  SPRITE_SIZE, pad_bottom=8) # Faces West (Left)
tile_east  = fit_to_tile(east_rgba,  SPRITE_SIZE, pad_bottom=8) # Faces East (Right)

# ─────────────────────────────────────────────────────────────────────────────
# 2. EXTRACT 8 VISEME HEADS (CLEANED - NO EAR WHITE, NO GHOST OVERLAP)
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== 2. EXTRACTING VISEMES ===")
vis_bgr = cv2.imread(viseme_path)
vh, vw = vis_bgr.shape[:2]
vcw = vw // 4
vch = vh // 3
vis_cells = [(0, 0), (0, 1), (0, 2), (0, 3), (2, 0), (2, 1), (2, 2), (2, 3)]

viseme_frames_south = []
for i, (r, c) in enumerate(vis_cells):
    cell = vis_bgr[r*vch:(r+1)*vch, c*vcw:(c+1)*vcw].copy()
    cell[vch-65:vch, 0:50] = [255, 255, 255]
    
    head_crop = cell[5:vch-15, 30:vcw-10]
    head_rgba = safe_floodfill(head_crop, tol=10, is_head=True)
    
    # Scale accurately to match standing body dimensions (1.85x)
    hw, hh = head_rgba.size
    nw, nh = int(round(hw * 1.85)), int(round(hh * 1.85))
    head_scaled = head_rgba.resize((nw, nh), Image.Resampling.LANCZOS)
    
    # Paste onto body_clean at (213, -32) - perfectly aligned with nose, chin, ears
    full_frame = body_clean.copy()
    full_frame.paste(head_scaled, (213, -32), head_scaled)
    viseme_frames_south.append(fit_to_tile(full_frame, SPRITE_SIZE, pad_bottom=8))

# 4-Row Viseme Sheet
sheet_visemes = Image.new("RGBA", (SHEET_WIDTH, SHEET_HEIGHT), (0, 0, 0, 0))
preview_visemes = []

for col in range(8):
    s_tile = viseme_frames_south[col]
    sheet_visemes.paste(s_tile, (col * SPRITE_SIZE, 2 * SPRITE_SIZE), s_tile)
    preview_visemes.append(s_tile.resize((256, 256), Image.Resampling.NEAREST))
    
    bob_y = -1 if col in [1, 3, 6] else 0
    sheet_visemes.paste(tile_north, (col * SPRITE_SIZE, 0 * SPRITE_SIZE + bob_y), tile_north)
    sheet_visemes.paste(tile_west,  (col * SPRITE_SIZE, 1 * SPRITE_SIZE + bob_y), tile_west)
    sheet_visemes.paste(tile_east,  (col * SPRITE_SIZE, 3 * SPRITE_SIZE + bob_y), tile_east)

# ─────────────────────────────────────────────────────────────────────────────
# 3. EXTRACT DIRECTIONAL WALKING FRAMES (ZERO MOONWALKING)
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== 3. EXTRACTING DIRECTIONAL WALK CYCLES ===")
# A. Side Walk (West)
walk_side_bgr = cv2.imread(walk_side_path)
side_boxes = [
    (39, 39, 326, 334),
    (388, 39, 320, 337),
    (714, 39, 318, 335),
    (1041, 39, 319, 336),
    (28, 391, 332, 341),
    (375, 391, 320, 345),
    (704, 391, 321, 345),
    (1038, 391, 323, 343)
]

walk_frames_west = []
walk_frames_east = []
for i, (bx, by, bw, bh) in enumerate(side_boxes):
    crop = walk_side_bgr[by:by+bh, bx:bx+bw]
    w_rgba = safe_floodfill(crop, tol=10, is_walk=True)
    tile_w = fit_to_tile(w_rgba, SPRITE_SIZE, pad_bottom=6)
    walk_frames_west.append(tile_w)
    # Flip for East
    tile_e = tile_w.transpose(Image.FLIP_LEFT_RIGHT)
    walk_frames_east.append(tile_e)

# B. Front Walk (South - ZERO MOONWALKING)
walk_front_bgr = cv2.imread(walk_front_path)
front_boxes = [
    (37, 63, 316, 316),
    (396, 62, 280, 321),
    (703, 63, 315, 317),
    (1046, 63, 320, 323),
    (32, 394, 316, 334),
    (428, 394, 215, 337),
    (704, 394, 316, 339),
    (1051, 394, 312, 340)
]

walk_frames_south = []
for i, (bx, by, bw, bh) in enumerate(front_boxes):
    crop = walk_front_bgr[by:by+bh, bx:bx+bw]
    wf_rgba = safe_floodfill(crop, tol=10, is_walk=True)
    walk_frames_south.append(fit_to_tile(wf_rgba, SPRITE_SIZE, pad_bottom=6))

# C. Back Walk (North - Fully Animated Striding Legs)
walk_back_bgr = cv2.imread(walk_back_path)
back_boxes = [
    (25, 45, 258, 304),
    (383, 45, 234, 304),
    (711, 45, 251, 304),
    (1055, 45, 244, 304),
    (96, 410, 245, 314),
    (425, 410, 246, 316),
    (774, 410, 247, 315),
    (1102, 410, 246, 317)
]

walk_frames_north = []
for i, (bx, by, bw, bh) in enumerate(back_boxes):
    crop = walk_back_bgr[by:by+bh, bx:bx+bw]
    wb_rgba = safe_floodfill(crop, tol=10, is_walk=True)
    tile_b = fit_to_tile(wb_rgba, SPRITE_SIZE, pad_bottom=6)
    if i >= 4:
        # Flip horizontally for alternating leg strides while keeping tail alignment continuous
        tile_b = tile_b.transpose(Image.FLIP_LEFT_RIGHT)
    walk_frames_north.append(tile_b)

# Assemble Master 4-Row Walk Spritesheet:
# Row 0: North, Row 1: West, Row 2: South, Row 3: East
sheet_walk = Image.new("RGBA", (SHEET_WIDTH, SHEET_HEIGHT), (0, 0, 0, 0))
preview_walk = []

for col in range(8):
    sheet_walk.paste(walk_frames_north[col], (col * SPRITE_SIZE, 0 * SPRITE_SIZE), walk_frames_north[col])
    sheet_walk.paste(walk_frames_west[col],  (col * SPRITE_SIZE, 1 * SPRITE_SIZE), walk_frames_west[col])
    sheet_walk.paste(walk_frames_south[col], (col * SPRITE_SIZE, 2 * SPRITE_SIZE), walk_frames_south[col])
    sheet_walk.paste(walk_frames_east[col],  (col * SPRITE_SIZE, 3 * SPRITE_SIZE), walk_frames_east[col])
    preview_walk.append(walk_frames_south[col].resize((256, 256), Image.Resampling.NEAREST))

# ─────────────────────────────────────────────────────────────────────────────
# 4. BUILD IDLE RANT SPRITESHEET (8 Frames Loop)
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== 4. BUILDING IDLE RANT SPRITESHEET ===")
idle_frames_south = []
idle_seq = [0, 0, 7, 7, 3, 3, 0, 0]
for col, v_idx in enumerate(idle_seq):
    base_tile = viseme_frames_south[v_idx].copy()
    breath_y = -1 if col in [2, 3, 4] else 0
    idle_tile = Image.new("RGBA", (SPRITE_SIZE, SPRITE_SIZE), (0, 0, 0, 0))
    idle_tile.paste(base_tile, (0, breath_y), base_tile)
    idle_frames_south.append(idle_tile)

sheet_idle = Image.new("RGBA", (SHEET_WIDTH, SHEET_HEIGHT), (0, 0, 0, 0))
preview_idle = []

for col in range(8):
    sheet_idle.paste(tile_north, (col * SPRITE_SIZE, 0 * SPRITE_SIZE), tile_north)
    sheet_idle.paste(tile_west,  (col * SPRITE_SIZE, 1 * SPRITE_SIZE), tile_west)
    sheet_idle.paste(idle_frames_south[col], (col * SPRITE_SIZE, 2 * SPRITE_SIZE), idle_frames_south[col])
    sheet_idle.paste(tile_east,  (col * SPRITE_SIZE, 3 * SPRITE_SIZE), tile_east)
    preview_idle.append(idle_frames_south[col].resize((256, 256), Image.Resampling.NEAREST))

# ─────────────────────────────────────────────────────────────────────────────
# 5. BUILD 8-WAY ACTION ATLASES (8 Rows x 8 Cols = 1024x1024)
# ─────────────────────────────────────────────────────────────────────────────
# Standard MyOS 8-Way Matrix Rows (0:S, 1:SW, 2:W, 3:NW, 4:N, 5:NE, 6:E, 7:SE)
def make_8way_atlas(sheet_4row):
    w, h = sheet_4row.size # 1024, 512
    atlas = Image.new('RGBA', (SHEET_WIDTH, ATLAS_HEIGHT), (0, 0, 0, 0))
    tile_h = SPRITE_SIZE # 128
    
    row_north = sheet_4row.crop((0, 0 * tile_h, w, 1 * tile_h))
    row_west  = sheet_4row.crop((0, 1 * tile_h, w, 2 * tile_h))
    row_south = sheet_4row.crop((0, 2 * tile_h, w, 3 * tile_h))
    row_east  = sheet_4row.crop((0, 3 * tile_h, w, 4 * tile_h))
    
    # 0: D (South)
    atlas.paste(row_south, (0, 0 * tile_h))
    # 1: DL (South-West)
    atlas.paste(row_west,  (0, 1 * tile_h))
    # 2: L (West)
    atlas.paste(row_west,  (0, 2 * tile_h))
    # 3: UL (North-West)
    atlas.paste(row_west,  (0, 3 * tile_h))
    # 4: U (North)
    atlas.paste(row_north, (0, 4 * tile_h))
    # 5: UR (North-East)
    atlas.paste(row_east,  (0, 5 * tile_h))
    # 6: R (East)
    atlas.paste(row_east,  (0, 6 * tile_h))
    # 7: DR (South-East)
    atlas.paste(row_east,  (0, 7 * tile_h))
    
    return atlas

# ─────────────────────────────────────────────────────────────────────────────
# 6. SAVE ALL ASSETS TO DESTINATIONS
# ─────────────────────────────────────────────────────────────────────────────
print("\n=== 5. SAVING ASSETS ===")
dest_dirs = [BASE_DIR, PUBLIC_ACTIONS_DIR, ARTIFACT_DIR]
if os.path.exists(DIST_ACTIONS_DIR):
    dest_dirs.append(DIST_ACTIONS_DIR)

def save_output(sheet_4row, preview_frames, name):
    atlas_8way = make_8way_atlas(sheet_4row)
    atlas_name = name.replace("frankie_textured_", "frankie_8way_")
    
    for d in dest_dirs:
        os.makedirs(d, exist_ok=True)
        # Save 4-row version (e.g. frankie_textured_idle.png)
        p4 = os.path.join(d, f"{name}.png")
        sheet_4row.save(p4, "PNG")
        
        # Save 8-row action atlas (e.g. frankie_8way_idle.png)
        p8 = os.path.join(d, f"{atlas_name}.png")
        atlas_8way.save(p8, "PNG")
    
    print(f"Saved {name}.png (4-row 1024x512) and {atlas_name}.png (8-row 1024x1024)")
    
    if preview_frames:
        for d in [BASE_DIR, ARTIFACT_DIR]:
            gif_p = os.path.join(d, f"{name}.gif")
            preview_frames[0].save(
                gif_p, save_all=True, append_images=preview_frames[1:],
                duration=125, loop=0, disposal=2
            )
            print(f"Saved animated GIF: {gif_p}")

save_output(sheet_visemes, preview_visemes, "frankie_textured_visemes")
save_output(sheet_walk,    preview_walk,    "frankie_textured_walk")
save_output(sheet_idle,    preview_idle,    "frankie_textured_idle")

print("\n=== ALL SPRITESHEETS AND 8-WAY ACTION ATLASES SUCCESSFULLY GENERATED! ===")
